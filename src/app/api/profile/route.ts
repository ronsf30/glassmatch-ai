import { NextRequest, NextResponse } from "next/server";
import { getProfileFromDb, saveProfileToDb } from "@/lib/db";
import { UserProfile } from "@/types";

export async function GET() {
  try {
    const profile = getProfileFromDb();
    if (!profile) {
      return NextResponse.json({ success: false, message: "Perfil no inicializado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error en GET /api/profile:", error);
    return NextResponse.json(
      { error: "Error al recuperar el perfil de la base de datos." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body as { profile: UserProfile };

    if (!profile || !profile.id || !profile.fullName) {
      return NextResponse.json(
        { error: "Datos de perfil incompletos." },
        { status: 400 }
      );
    }

    saveProfileToDb(profile);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error en PUT /api/profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil en SQLite." },
      { status: 500 }
    );
  }
}
