import { NextRequest, NextResponse } from "next/server";
import { updateTrackerInDb } from "@/lib/db";
import { ApplicationStatus } from "@/types";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, notes, appliedDate } = body as {
      status?: ApplicationStatus;
      notes?: string;
      appliedDate?: string;
    };

    if (!status && notes === undefined) {
      return NextResponse.json(
        { error: "Se requiere un estado o nota para actualizar." },
        { status: 400 }
      );
    }

    const newStatus: ApplicationStatus = status || "applied";
    updateTrackerInDb(id, newStatus, appliedDate, notes);

    return NextResponse.json({
      success: true,
      jobId: id,
      status: newStatus,
      notes,
    });
  } catch (error) {
    console.error("Error en PATCH /api/jobs/[id]/status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la postulación." },
      { status: 500 }
    );
  }
}
