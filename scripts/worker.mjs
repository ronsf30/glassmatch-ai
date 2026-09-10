/**
 * GlassMatch AI - Script Autonomo Centinela en Segundo Plano (Worker Daemon)
 * Ejecuta ciclos programados de sincronizacion y alertas sin requerir el navegador.
 *
 * Uso:
 *   node scripts/worker.mjs --once      (Ejecuta una unica ronda y termina)
 *   node scripts/worker.mjs             (Ejecuta en bucle respetando el intervalo de SQLite)
 */

const SERVER_URL = process.env.GLASSMATCH_URL || "http://127.0.0.1:3000";

function log(message) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${now}] [Centinela Daemon] ${message}`);
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function checkServerHealth() {
  try {
    const res = await fetch(`${SERVER_URL}/api/jobs`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function getWorkerConfig() {
  try {
    const res = await fetch(`${SERVER_URL}/api/worker/config`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function runWorkerCycle() {
  log("Iniciando ciclo de escaneo autonomo de vacantes...");
  try {
    const res = await fetch(`${SERVER_URL}/api/worker/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60000), // 60 segundos de timeout
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      log(`Error devuelto por el servidor (HTTP ${res.status}): ${errData.error || "Desconocido"}`);
      return false;
    }

    const data = await res.json();
    log(
      `Ciclo completado con exito. Vacantes analizadas: ${data.evaluatedCount || 0} | Compatibles: ${
        data.eliteCount || 0
      } | Alertas enviadas: ${data.alertedCount || 0}`
    );
    return true;
  } catch (err) {
    log(`Fallo de conexion durante el ciclo: ${err.message}`);
    return false;
  }
}

async function main() {
  const isOnce = process.argv.includes("--once");

  log("Arrancando GlassMatch AI Centinela Daemon...");
  log(`Servidor objetivo: ${SERVER_URL}`);

  // 1. Validar que el servidor este en ejecucion
  let isHealthy = await checkServerHealth();
  if (!isHealthy) {
    log("Aviso: El servidor GlassMatch AI en puerto 3000 no responde.");
    log("Asegurate de iniciar primero el servidor con 'npm run dev' o 'Iniciar-GlassMatch.bat'.");
    if (isOnce) process.exit(1);

    // En bucle, reintentar cada 15 segundos
    while (!isHealthy) {
      log("Reintentando conexion con el servidor en 15 segundos...");
      await sleep(15000);
      isHealthy = await checkServerHealth();
    }
  }

  log("Conexion con el servidor GlassMatch AI confirmada.");

  // 2. Modo de una sola pasada
  if (isOnce) {
    const success = await runWorkerCycle();
    process.exitCode = success ? 0 : 1;
    return;
  }

  // 3. Modo Bucle Continuo (Daemon)
  log("Centinela operando en modo bucle continuo.");

  while (true) {
    const config = await getWorkerConfig();
    const intervalHours = config?.intervalHours || 6;
    const isEnabled = config?.enabled !== false;

    if (isEnabled) {
      await runWorkerCycle();
    } else {
      log("Centinela pausado segun la configuracion en SQLite. En espera...");
    }

    const waitMs = Math.max(intervalHours * 3600 * 1000, 60000); // Al menos 1 minuto
    log(`Proxima revision programada en ${intervalHours} hora(s). Esperando...`);
    await sleep(waitMs);
  }
}

main().catch((err) => {
  log(`Error fatal en el Centinela: ${err.message}`);
  process.exitCode = 1;
});

