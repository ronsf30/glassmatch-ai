import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestionsWithGemini } from "@/lib/gemini";
import { UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, company, description, profile } = body as {
      jobTitle: string;
      company: string;
      description: string;
      profile: UserProfile;
    };

    if (!jobTitle || !company || !profile) {
      return NextResponse.json(
        { error: "Puesto, empresa y perfil son requeridos." },
        { status: 400 }
      );
    }

    const questions = await generateInterviewQuestionsWithGemini(
      jobTitle,
      company,
      description || `Vacante de ${jobTitle} en ${company}`,
      profile
    );

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Error en POST /api/interview:", error);
    return NextResponse.json(
      { error: "Error al generar preguntas de entrevista con Gemini." },
      { status: 500 }
    );
  }
}
