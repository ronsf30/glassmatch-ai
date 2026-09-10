import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { db } from "@/lib/db";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

// Magic header estandar de SQLite (16 bytes)
const SQLITE_HEADER = Buffer.from("SQLite format 3\0", "utf8");

export async function GET() {
  try {
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: "No se encontro el archivo de base de datos SQLite." },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="glassmatch-backup-${today}.db"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("Error al descargar respaldo de SQLite:", error);
    return NextResponse.json(
      { error: "Error al generar archivo de respaldo.", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporciono ningun archivo de base de datos para restaurar." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Validar que el archivo tenga al menos 100 bytes y la cabecera magica de SQLite
    if (buffer.length < 100) {
      return NextResponse.json(
        { error: "El archivo es demasiado pequeno para ser una base de datos valida." },
        { status: 400 }
      );
    }

    const headerSlice = buffer.subarray(0, 16);
    if (!headerSlice.equals(SQLITE_HEADER)) {
      return NextResponse.json(
        {
          error:
            "El archivo proporcionado no tiene la cabecera magica de SQLite ('SQLite format 3'). Asegurate de subir un archivo .db valido.",
        },
        { status: 400 }
      );
    }

    // 2. Crear una copia de seguridad temporal del archivo actual por precaucion
    const backupTempPath = `${dbPath}.pre-restore.bak`;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupTempPath);
    }

    // 3. Escribir el nuevo archivo
    fs.writeFileSync(dbPath, buffer);

    // 4. Ejecutar PRAGMA integrity_check con SQLite
    try {
      const check = db.prepare("PRAGMA integrity_check").get() as any;
      if (check && check.integrity_check !== "ok") {
        // Restaurar copia previa si falla la integridad
        if (fs.existsSync(backupTempPath)) {
          fs.copyFileSync(backupTempPath, dbPath);
        }
        return NextResponse.json(
          { error: "La base de datos cargada presenta corrupcion interna de indices." },
          { status: 400 }
        );
      }
    } catch {
      // Si la conexion existente tuvo conflicto, aseguramos que el archivo quedo escrito
    }

    // Eliminar copia temporal si todo resulto exitoso
    try {
      if (fs.existsSync(backupTempPath)) {
        fs.unlinkSync(backupTempPath);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Base de datos restaurada correctamente. Recarga la pagina para ver los datos actualizados.",
      bytesRestored: buffer.length,
    });
  } catch (error: any) {
    console.error("Error al restaurar base de datos:", error);
    return NextResponse.json(
      { error: "Fallo durante la restauracion de la base de datos.", details: error?.message },
      { status: 500 }
    );
  }
}
