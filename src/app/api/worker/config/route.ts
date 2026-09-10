import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTestWebhook } from "@/lib/notifications";

export async function GET() {
  try {
    const rows = db.prepare("SELECT key, value FROM AppConfig WHERE key LIKE 'worker_%'").all() as {
      key: string;
      value: string;
    }[];

    const configMap: Record<string, string> = {};
    rows.forEach((r) => {
      configMap[r.key] = r.value;
    });

    return NextResponse.json({
      enabled: configMap["worker_enabled"] === "true",
      intervalHours: parseInt(configMap["worker_interval_hours"] || "6", 10),
      threshold: parseInt(configMap["worker_threshold"] || "85", 10),
      webhookUrl: configMap["worker_webhook_url"] || "",
      lastRun: configMap["worker_last_run"] || null,
      lastStatus: configMap["worker_last_status"] ? JSON.parse(configMap["worker_last_status"]) : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al leer configuracion del centinela", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accion especial: Probar webhook
    if (body.action === "test_webhook") {
      const webhookUrl = body.webhookUrl;
      if (!webhookUrl) {
        return NextResponse.json(
          { error: "Debes proporcionar una URL de webhook valida." },
          { status: 400 }
        );
      }
      const testResult = await sendTestWebhook(webhookUrl);
      return NextResponse.json(testResult);
    }

    // Guardar configuracion
    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO AppConfig (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `);

    if (body.enabled !== undefined) {
      upsertStmt.run("worker_enabled", body.enabled ? "true" : "false", now);
    }
    if (body.intervalHours !== undefined) {
      upsertStmt.run("worker_interval_hours", String(body.intervalHours), now);
    }
    if (body.threshold !== undefined) {
      upsertStmt.run("worker_threshold", String(body.threshold), now);
    }
    if (body.webhookUrl !== undefined) {
      upsertStmt.run("worker_webhook_url", String(body.webhookUrl).trim(), now);
    }

    return NextResponse.json({
      success: true,
      message: "Configuracion del Centinela guardada en SQLite.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al guardar configuracion del centinela", details: error?.message },
      { status: 500 }
    );
  }
}
