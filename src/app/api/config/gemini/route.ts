import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const stmt = db.prepare("SELECT value FROM AppConfig WHERE key = 'GEMINI_API_KEY'");
    const row = stmt.get() as { value: string } | undefined;
    const rawKey = row?.value || process.env.GEMINI_API_KEY || "";

    if (!rawKey || rawKey.trim().length < 10) {
      const modeRow = db
        .prepare("SELECT value FROM AppConfig WHERE key = 'AI_ENGINE_MODE'")
        .get() as { value: string } | undefined;
      const aiEngineMode = (modeRow?.value === "offline_deterministic" || modeRow?.value === "cloud")
        ? modeRow.value
        : "cloud";

      const providerRow = db
        .prepare("SELECT value FROM AppConfig WHERE key = 'ACTIVE_CLOUD_PROVIDER'")
        .get() as { value: string } | undefined;
      const activeCloudProvider = (providerRow?.value === "groq" || providerRow?.value === "gemini")
        ? providerRow.value
        : "gemini";

      return NextResponse.json({
        hasKey: false,
        isConfigured: false,
        maskedKey: null,
        healthStatus: "no_key",
        statusMessage: "Sin clave configurada • Operando con Motor Local Autónomo",
        aiEngineMode,
        activeCloudProvider,
      });
    }

    const cleanKey = rawKey.trim();
    const maskedKey =
      cleanKey.length > 8
        ? `${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}`
        : "Configurada";

    const url = new URL(req.url);
    const checkHealth = url.searchParams.get("checkHealth") !== "false";
    const paramStrategy = url.searchParams.get("strategy");

    const strategyRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'AI_STRATEGY'")
      .get() as { value: string } | undefined;
    const aiStrategy = (paramStrategy === "maximum_precision" || paramStrategy === "smart_saving")
      ? paramStrategy
      : (strategyRow?.value || "smart_saving");

    const modeRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'AI_ENGINE_MODE'")
      .get() as { value: string } | undefined;
    const aiEngineMode = (modeRow?.value === "offline_deterministic" || modeRow?.value === "cloud")
      ? modeRow.value
      : "cloud";

    const providerRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'ACTIVE_CLOUD_PROVIDER'")
      .get() as { value: string } | undefined;
    const activeCloudProvider = (providerRow?.value === "groq" || providerRow?.value === "gemini")
      ? providerRow.value
      : "gemini";

    let healthStatus:
      | "operational"
      | "operational_lite"
      | "rate_limited"
      | "invalid_key"
      | "untested" = "untested";
    let statusMessage = "Clave configurada";
    let activeModel = aiStrategy === "maximum_precision" ? "Gemini 3.8 Flash" : "Gemini 3.8 Flash-Lite";
    let httpCode = 200;

    let flashAvailable = false;
    let flashLiteAvailable = false;

    if (checkHealth) {
      try {
        if (aiStrategy === "maximum_precision") {
          // Probe Gemini 3.8 Flash for Máxima Precisión tab
          const flashEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${cleanKey}`;
          const flashRes = await fetch(flashEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "p" }] }],
              generationConfig: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
            }),
          });

          httpCode = flashRes.status;

          if (flashRes.ok) {
            flashAvailable = true;
            healthStatus = "operational";
            activeModel = "Gemini 3.8 Flash";
            statusMessage = "Gemini 3.8 Flash Operativo (Cuota disponible • Luz verde)";
          } else if (flashRes.status === 429) {
            healthStatus = "rate_limited";
            activeModel = "Gemini 3.8 Flash";
            statusMessage = "Cuota excedida en Gemini 3.8 Flash (HTTP 429). Cambia a Ahorro Inteligente para trabajar con Flash-Lite.";
          } else if (flashRes.status === 400 || flashRes.status === 403) {
            healthStatus = "invalid_key";
            statusMessage = "Clave de API inválida o sin permisos en Google AI Studio";
          } else {
            healthStatus = "rate_limited";
            statusMessage = `Estado API: ${flashRes.status} • Motor Local Autónomo Activo`;
          }
        } else {
          // Probe Gemini 3.8 Flash-Lite for Ahorro Inteligente tab
          const liteEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${cleanKey}`;
          const liteRes = await fetch(liteEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "p" }] }],
              generationConfig: { maxOutputTokens: 1 },
            }),
          });

          httpCode = liteRes.status;

          if (liteRes.ok) {
            flashLiteAvailable = true;
            healthStatus = "operational_lite";
            activeModel = "Gemini 3.8 Flash-Lite";
            statusMessage = "Gemini 3.8 Flash-Lite Operativo (Cuota disponible • Luz verde para trabajar)";
          } else if (liteRes.status === 429) {
            healthStatus = "rate_limited";
            activeModel = "Gemini 3.8 Flash-Lite";
            statusMessage = "Cuota excedida en Flash-Lite (HTTP 429) • Motor Local Autónomo Activo";
          } else if (liteRes.status === 400 || liteRes.status === 403) {
            healthStatus = "invalid_key";
            statusMessage = "Clave de API inválida o sin permisos en Google AI Studio";
          } else {
            healthStatus = "rate_limited";
            statusMessage = `Estado API: ${liteRes.status} • Motor Local Autónomo Activo`;
          }
        }
      } catch {
        healthStatus = "rate_limited";
        statusMessage = "Error de red al contactar Google API • Motor Local Autónomo Activo";
      }
    }

    return NextResponse.json({
      hasKey: true,
      isConfigured: true,
      maskedKey,
      healthStatus,
      statusMessage,
      activeModel,
      aiStrategy,
      aiEngineMode,
      activeCloudProvider,
      flashAvailable,
      flashLiteAvailable,
      httpCode,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al consultar configuración" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, aiStrategy, aiEngineMode, activeCloudProvider } = body as {
      apiKey?: string;
      aiStrategy?: string;
      aiEngineMode?: string;
      activeCloudProvider?: string;
    };

    const now = new Date().toISOString();

    if (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0) {
      const cleanKey = apiKey.trim();
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('GEMINI_API_KEY', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(cleanKey, now);

      process.env.GEMINI_API_KEY = cleanKey;
    }

    if (aiStrategy && (aiStrategy === "smart_saving" || aiStrategy === "maximum_precision")) {
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('AI_STRATEGY', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(aiStrategy, now);
    }

    if (aiEngineMode && (aiEngineMode === "cloud" || aiEngineMode === "offline_deterministic")) {
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('AI_ENGINE_MODE', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(aiEngineMode, now);
    }

    if (activeCloudProvider && (activeCloudProvider === "gemini" || activeCloudProvider === "groq")) {
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('ACTIVE_CLOUD_PROVIDER', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(activeCloudProvider, now);
    }

    const row = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'GEMINI_API_KEY'")
      .get() as { value: string } | undefined;
    const currentKey = row?.value || process.env.GEMINI_API_KEY || "";
    const maskedKey =
      currentKey.length > 8
        ? `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`
        : "Configurada";

    const currentModeRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'AI_ENGINE_MODE'")
      .get() as { value: string } | undefined;
    const resolvedMode = (currentModeRow?.value === "offline_deterministic" || currentModeRow?.value === "cloud")
      ? currentModeRow.value
      : "cloud";

    const currentProviderRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'ACTIVE_CLOUD_PROVIDER'")
      .get() as { value: string } | undefined;
    const resolvedProvider = (currentProviderRow?.value === "groq" || currentProviderRow?.value === "gemini")
      ? currentProviderRow.value
      : "gemini";

    return NextResponse.json({
      success: true,
      hasKey: currentKey.length > 10,
      isConfigured: currentKey.length > 10,
      maskedKey,
      aiStrategy: aiStrategy || "smart_saving",
      aiEngineMode: resolvedMode,
      activeCloudProvider: resolvedProvider,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar en AppConfig" }, { status: 500 });
  }
}

