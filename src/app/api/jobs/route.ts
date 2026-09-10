import { NextRequest, NextResponse } from "next/server";
import { getAllJobsFromDb, saveJobToDb } from "@/lib/db";
import { JobOffer } from "@/types";

export async function GET() {
  try {
    const jobs = getAllJobsFromDb();
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    console.error("Error en GET /api/jobs:", error);
    return NextResponse.json(
      { error: "Error al recuperar vacantes de la base de datos." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job } = body as { job: JobOffer };

    if (!job || !job.id || !job.title) {
      return NextResponse.json(
        { error: "Datos de vacante inválidos." },
        { status: 400 }
      );
    }

    saveJobToDb(job);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error en POST /api/jobs:", error);
    return NextResponse.json(
      { error: "Error al guardar la vacante en SQLite." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    const { deleteJobFromDb, clearAllJobsFromDb } = await import("@/lib/db");

    if (all) {
      clearAllJobsFromDb();
      return NextResponse.json({ success: true, message: "Todas las vacantes han sido eliminadas." });
    }

    if (id) {
      deleteJobFromDb(id);
      return NextResponse.json({ success: true, message: `Vacante ${id} eliminada.` });
    }

    return NextResponse.json(
      { error: "Se requiere parámetro 'id' o 'all=true'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en DELETE /api/jobs:", error);
    return NextResponse.json(
      { error: "Error al eliminar la vacante de SQLite." },
      { status: 500 }
    );
  }
}
