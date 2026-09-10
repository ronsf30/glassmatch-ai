import { NextRequest, NextResponse } from "next/server";
import { parseCvWithGemini } from "@/lib/gemini";
import { getProfileFromDb, saveProfileToDb } from "@/lib/db";
import { UserProfile } from "@/types";
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

async function extractTextFromPdfBase64(base64: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "extract_cv_pdf.py");
      const tempPath = path.join(os.tmpdir(), `cv_upload_${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, Buffer.from(base64, "base64"));

      execFile(
        "python",
        [scriptPath, tempPath],
        { maxBuffer: 10 * 1024 * 1024, encoding: "utf8" },
        (error, stdout, stderr) => {
          try {
            fs.unlinkSync(tempPath);
          } catch {}
          if (error || !stdout) {
            console.warn("Python PDF extraction error/empty stdout:", error, stderr);
            resolve("");
            return;
          }
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed.text || "");
          } catch (jsonErr) {
            console.warn("JSON parse error from python stdout:", jsonErr, stdout.slice(0, 200));
            resolve("");
          }
        }
      );
    } catch {
      resolve("");
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cvText = "",
      fileBase64 = "",
      mimeType = "application/pdf",
      fileName = "CV_Candidato.pdf",
    } = body as {
      cvText?: string;
      fileBase64?: string;
      mimeType?: string;
      fileName?: string;
    };

    let textContent = cvText;
    if (fileBase64 && (!textContent || textContent.length < 30)) {
      const extracted = await extractTextFromPdfBase64(fileBase64);
      if (extracted && extracted.trim().length > 0) {
        textContent = extracted;
      }
    }

    if (!textContent && !fileBase64) {
      return NextResponse.json(
        { error: "No se proporcionó texto ni archivo de currículum." },
        { status: 400 }
      );
    }

    // Call Gemini with multimodal support
    const extractedData = await parseCvWithGemini({
      rawCvText: textContent,
      fileBase64,
      mimeType,
      fileName,
    });

    // Clean profile update from newly parsed CV
    const existingProfile = getProfileFromDb();
    const updatedProfile: UserProfile = {
      id: existingProfile?.id || "user-1",
      fullName: extractedData.fullName || existingProfile?.fullName || "Candidato",
      currentTitle:
        extractedData.currentTitle ||
        existingProfile?.currentTitle ||
        "Software Engineer",
      seniority: (extractedData.seniority as any) || existingProfile?.seniority || "Mid",
      rawCvText: textContent || existingProfile?.rawCvText || "",
      cvFileName: fileName || existingProfile?.cvFileName,
      extractedSkills:
        Array.isArray(extractedData.extractedSkills) && extractedData.extractedSkills.length > 0
          ? extractedData.extractedSkills
          : [],
      excludedSkills:
        Array.isArray(extractedData.excludedSkills)
          ? extractedData.excludedSkills
          : [],
      targetRoles:
        extractedData.targetRoles && extractedData.targetRoles.length > 0
          ? extractedData.targetRoles
          : existingProfile?.targetRoles || ["Software Engineer"],
      workModes: existingProfile?.workModes || ["remote", "hybrid"],
      minSalary: extractedData.minSalary || existingProfile?.minSalary || 45000,
      preferredLocs: existingProfile?.preferredLocs || ["Remoto (Global)", "LATAM", "España"],
      languages:
        extractedData.languages && extractedData.languages.length > 0
          ? (extractedData.languages as any)
          : existingProfile?.languages || [
              { language: "Español", level: "Native" },
              { language: "Inglés", level: "B2", preference: "async_preferred" },
            ],
      blacklistCompanies: existingProfile?.blacklistCompanies || [],
      engineUsed: extractedData.engineUsed || "local_autonomous",
      engineLabel: extractedData.engineLabel || "Motor Local Autónomo",
      updatedAt: new Date().toISOString(),
    };

    // Save into SQLite
    saveProfileToDb(updatedProfile);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      fileName,
      extractedChars: textContent.length,
      engineUsed: updatedProfile.engineUsed,
      engineLabel: updatedProfile.engineLabel,
    });
  } catch (error) {
    console.error("Error en POST /api/cv/parse:", error);
    return NextResponse.json(
      { error: "Error al analizar el currículum." },
      { status: 500 }
    );
  }
}

