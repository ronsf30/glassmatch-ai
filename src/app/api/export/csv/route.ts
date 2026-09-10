import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/\r?\n|\r/g, " ");
  // Duplicar comillas dobles si existen
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const query = `
      SELECT 
        j.id,
        j.title,
        j.company,
        j.location,
        j.workMode,
        j.salaryText,
        j.source,
        j.url,
        m.matchScore,
        t.status,
        t.appliedDate,
        t.personalNotes
      FROM JobOffer j
      LEFT JOIN JobMatch m ON j.id = m.jobOfferId
      LEFT JOIN ApplicationTracker t ON j.id = t.jobOfferId
      ORDER BY 
        CASE 
          WHEN t.status = 'offered' THEN 1
          WHEN t.status = 'interviewing' THEN 2
          WHEN t.status = 'applied' THEN 3
          WHEN t.status = 'saved' THEN 4
          WHEN t.status = 'rejected' THEN 5
          ELSE 6
        END,
        m.matchScore DESC
    `;

    const rows = db.prepare(query).all() as {
      id: string;
      title: string;
      company: string;
      location: string;
      workMode: string;
      salaryText: string | null;
      source: string;
      url: string;
      matchScore: number | null;
      status: string | null;
      appliedDate: string | null;
      personalNotes: string | null;
    }[];

    const headers = [
      "ID",
      "Titulo",
      "Empresa",
      "Ubicacion",
      "Modalidad",
      "Salario_Declarado",
      "Afinidad_ATS",
      "Estado_Pipeline",
      "Fecha_Aplicacion",
      "Notas_Privadas",
      "Portal_Origen",
      "Enlace_Directo",
    ];

    const csvLines = [headers.join(",")];

    for (const r of rows) {
      const line = [
        escapeCsvField(r.id),
        escapeCsvField(r.title),
        escapeCsvField(r.company),
        escapeCsvField(r.location),
        escapeCsvField(r.workMode),
        escapeCsvField(r.salaryText || "A convenir"),
        escapeCsvField(r.matchScore !== null ? `${r.matchScore}%` : "No evaluado"),
        escapeCsvField(r.status || "En radar"),
        escapeCsvField(r.appliedDate || "Reciente"),
        escapeCsvField(r.personalNotes || ""),
        escapeCsvField(r.source),
        escapeCsvField(r.url),
      ];
      csvLines.push(line.join(","));
    }

    // Prefijo BOM UTF-8 (\uFEFF) para visualizacion perfecta en Microsoft Excel
    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="glassmatch-postulaciones-${today}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/export/csv:", error);
    return NextResponse.json(
      { error: "Error al exportar datos a CSV.", details: error?.message },
      { status: 500 }
    );
  }
}
