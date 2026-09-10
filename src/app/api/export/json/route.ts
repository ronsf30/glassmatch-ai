import { NextResponse } from "next/server";
import { db, getProfileFromDb } from "@/lib/db";
import { JobOffer } from "@/types";

export async function GET() {
  try {
    const profile = getProfileFromDb();

    // Obtener todas las vacantes con match y tracking
    const jobRows = db.prepare("SELECT * FROM JobOffer ORDER BY createdAt DESC").all() as any[];
    const matchRows = db.prepare("SELECT * FROM JobMatch").all() as any[];
    const trackRows = db.prepare("SELECT * FROM ApplicationTracker").all() as any[];
    const configRows = db.prepare("SELECT key, value, updatedAt FROM AppConfig").all() as any[];

    const matchMap: Record<string, any> = {};
    matchRows.forEach((m) => {
      try {
        matchMap[m.jobOfferId] = {
          ...m,
          isMatch: Boolean(m.isMatch),
          strengths: JSON.parse(m.strengths || "[]"),
          missingSkills: JSON.parse(m.missingSkills || "[]"),
        };
      } catch {
        matchMap[m.jobOfferId] = m;
      }
    });

    const trackMap: Record<string, any> = {};
    trackRows.forEach((t) => {
      trackMap[t.jobOfferId] = t;
    });

    const jobs: JobOffer[] = jobRows.map((j) => ({
      ...j,
      match: matchMap[j.id] || undefined,
      tracking: trackMap[j.id] || undefined,
    }));

    // Estadisticas consolidadas
    const totalJobs = jobs.length;
    const trackedCount = trackRows.length;
    const byStatus: Record<string, number> = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
    };

    trackRows.forEach((t) => {
      if (byStatus[t.status] !== undefined) {
        byStatus[t.status]++;
      }
    });

    const scores = jobs.map((j) => j.match?.matchScore).filter((s): s is number => typeof s === "number");
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const exportPayload = {
      app: "GlassMatch AI",
      version: "0.4.0",
      exportedAt: new Date().toISOString(),
      summary: {
        totalJobs,
        trackedCount,
        averageMatchScore: avgScore,
        pipelineBreakdown: byStatus,
      },
      profile,
      jobs,
      config: configRows,
    };

    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="glassmatch-export-${today}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/export/json:", error);
    return NextResponse.json(
      { error: "Error al exportar datos a JSON.", details: error?.message },
      { status: 500 }
    );
  }
}
