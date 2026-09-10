import { NextRequest, NextResponse } from "next/server";
import { db, getProfileFromDb } from "@/lib/db";
import { executeSync } from "@/app/api/sync/route";
import { dispatchJobAlertWebhook } from "@/lib/notifications";
import { JobOffer, UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener perfil de candidato desde SQLite
    const profile = getProfileFromDb();
    if (!profile) {
      return NextResponse.json(
        { error: "No se encontro un perfil de usuario registrado en SQLite." },
        { status: 400 }
      );
    }

    // 2. Leer configuracion del centinela desde AppConfig
    const rows = db.prepare("SELECT key, value FROM AppConfig WHERE key LIKE 'worker_%'").all() as {
      key: string;
      value: string;
    }[];

    const configMap: Record<string, string> = {};
    rows.forEach((r) => {
      configMap[r.key] = r.value;
    });

    const threshold = parseInt(configMap["worker_threshold"] || "85", 10);
    const webhookUrl = (configMap["worker_webhook_url"] || "").trim();

    // 3. Ejecutar sincronizacion autonoma multi-portal
    const searchTerm = profile.targetRoles[0] || "Frontend Developer";
    const evaluatedJobs = await executeSync({
      profile,
      searchTerm,
      location: "Remoto (Global)",
      resultsWanted: 6,
    });

    // 4. Identificar vacantes que superan el umbral de alerta
    const eliteJobs = evaluatedJobs.filter((job) => (job.match?.matchScore || 0) >= threshold);
    let alertedCount = 0;

    if (webhookUrl && eliteJobs.length > 0) {
      for (const job of eliteJobs) {
        try {
          const res = await dispatchJobAlertWebhook(webhookUrl, job, threshold);
          if (res.success) {
            alertedCount++;
          }
        } catch (webhookErr) {
          console.warn("Aviso al despachar webhook para vacante:", job.title, webhookErr);
        }
      }
    }

    // 5. Registrar marca temporal y estado de ejecucion en SQLite
    const now = new Date().toISOString();
    const statusPayload = JSON.stringify({
      success: true,
      evaluatedCount: evaluatedJobs.length,
      eliteCount: eliteJobs.length,
      alertedCount,
      timestamp: now,
    });

    const upsertStmt = db.prepare(`
      INSERT INTO AppConfig (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `);

    upsertStmt.run("worker_last_run", now, now);
    upsertStmt.run("worker_last_status", statusPayload, now);

    return NextResponse.json({
      success: true,
      message: `Centinela ejecutado. ${evaluatedJobs.length} vacantes analizadas, ${eliteJobs.length} compatibles, ${alertedCount} alertas despachadas.`,
      evaluatedCount: evaluatedJobs.length,
      eliteCount: eliteJobs.length,
      alertedCount,
      timestamp: now,
      jobs: evaluatedJobs,
    });
  } catch (error: any) {
    console.error("Error en ejecucion del Centinela (POST /api/worker/run):", error);
    const now = new Date().toISOString();
    try {
      const errPayload = JSON.stringify({
        success: false,
        error: error?.message || "Error interno",
        timestamp: now,
      });
      db.prepare(`
        INSERT INTO AppConfig (key, value, updatedAt)
        VALUES ('worker_last_status', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(errPayload, now);
    } catch {}

    return NextResponse.json(
      { error: "Fallo durante la ejecucion del Centinela.", details: error?.message },
      { status: 500 }
    );
  }
}
