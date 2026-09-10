import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { probeBackupAiHealth, getBackupAiConfig } from "@/lib/ai-providers";

export async function GET(req: Request) {
  try {
    const config = getBackupAiConfig();
    const url = new URL(req.url);
    const checkHealth = url.searchParams.get("checkHealth") !== "false";

    if (!config || !config.apiKey) {
      return NextResponse.json({
        hasKey: false,
        isConfigured: false,
        maskedKey: null,
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        healthStatus: "no_key",
        statusMessage: "Sin clave de respaldo configurada",
      });
    }

    const { provider, apiKey, model } = config;
    const maskedKey =
      apiKey.length > 8
        ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
        : "Configurada";

    let healthStatus: "operational" | "rate_limited" | "invalid_key" | "error" | "untested" | "no_key" = "untested";
    let statusMessage = "Clave de respaldo configurada";
    let httpCode = 200;

    if (checkHealth) {
      const probe = await probeBackupAiHealth(provider, apiKey, model);
      healthStatus = probe.healthStatus;
      statusMessage = probe.statusMessage;
      httpCode = probe.httpCode;
    }

    return NextResponse.json({
      hasKey: true,
      isConfigured: true,
      maskedKey,
      provider,
      model,
      healthStatus,
      statusMessage,
      httpCode,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al consultar proveedor de respaldo" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, provider = "groq", model = "llama-3.3-70b-versatile" } = body as {
      apiKey?: string;
      provider?: "groq" | "openai";
      model?: string;
    };

    const now = new Date().toISOString();

    if (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0) {
      const cleanKey = apiKey.trim();
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('BACKUP_AI_API_KEY', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(cleanKey, now);

      if (provider === "groq") {
        process.env.GROQ_API_KEY = cleanKey;
      }
    }

    if (provider) {
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('BACKUP_AI_PROVIDER', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(provider, now);
    }

    if (model) {
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('BACKUP_AI_MODEL', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(model, now);
    }

    const keyRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'BACKUP_AI_API_KEY'")
      .get() as { value: string } | undefined;
    const currentKey = keyRow?.value || "";
    const maskedKey =
      currentKey.length > 8
        ? `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`
        : currentKey ? "Configurada" : null;

    return NextResponse.json({
      success: true,
      hasKey: Boolean(currentKey && currentKey.length > 8),
      maskedKey,
      provider,
      model,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar proveedor de respaldo" }, { status: 500 });
  }
}
