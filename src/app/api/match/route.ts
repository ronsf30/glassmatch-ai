import { NextRequest, NextResponse } from "next/server";
import { analyzeJobMatchWithGemini } from "@/lib/gemini";
import { UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, jobDescription, jobTitle, company } = body as {
      profile: UserProfile;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    };

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "La descripción de la vacante es requerida." },
        { status: 400 }
      );
    }

    if (!profile || !profile.extractedSkills) {
      return NextResponse.json(
        { error: "El perfil del candidato es requerido." },
        { status: 400 }
      );
    }

    const result = await analyzeJobMatchWithGemini(
      profile,
      jobDescription,
      jobTitle,
      company
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error en API /api/match:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar el match con Gemini." },
      { status: 500 }
    );
  }
}
