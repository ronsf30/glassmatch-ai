import { NextRequest, NextResponse } from "next/server";
import { generateCustomPitchWithGemini, PitchTone } from "@/lib/gemini";
import { UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, jobTitle, company, tone } = body as {
      profile: UserProfile;
      jobTitle: string;
      company: string;
      tone?: PitchTone;
    };

    if (!profile || !jobTitle || !company) {
      return NextResponse.json(
        { error: "Perfil, puesto y empresa son requeridos." },
        { status: 400 }
      );
    }

    const selectedTone: PitchTone = tone || "direct";
    const pitch = await generateCustomPitchWithGemini(
      profile,
      jobTitle,
      company,
      selectedTone
    );

    return NextResponse.json({ success: true, pitch });
  } catch (error) {
    console.error("Error en API /api/pitch:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al generar el pitch con Gemini." },
      { status: 500 }
    );
  }
}
