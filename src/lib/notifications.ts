import { JobOffer } from "@/types";

export interface WebhookDispatchResult {
  success: boolean;
  status: number;
  message: string;
}

/**
 * Detecta el tipo de webhook segun el formato de la URL
 */
export function detectWebhookType(url: string): "discord" | "telegram" | "slack_or_generic" {
  const clean = url.trim().toLowerCase();
  if (clean.includes("discord.com/api/webhooks")) {
    return "discord";
  }
  if (clean.includes("api.telegram.org/bot")) {
    return "telegram";
  }
  return "slack_or_generic";
}

/**
 * Envia un mensaje de prueba al webhook configurado
 */
export async function sendTestWebhook(webhookUrl: string): Promise<WebhookDispatchResult> {
  const url = webhookUrl.trim();
  if (!url) {
    return { success: false, status: 400, message: "URL de webhook no proporcionada" };
  }

  const type = detectWebhookType(url);

  try {
    if (type === "discord") {
      const payload = {
        content: "GlassMatch AI Centinela: Prueba de conexion de alertas",
        embeds: [
          {
            title: "Canal de Notificaciones Verificado",
            description:
              "El Centinela autonomo de GlassMatch AI esta conectado correctamente. Recibiras alertas inmediatas cuando se detecten vacantes con alta afinidad ATS.",
            color: 0x0d9488, // Teal Caribeño
            fields: [
              { name: "Motor", value: "Zero-Trust ATS Engine", inline: true },
              { name: "Estado", value: "Activo y Vigilando", inline: true },
            ],
            footer: {
              text: "GlassMatch AI • Caribbean Sea Glass Edition",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      return {
        success: res.ok,
        status: res.status,
        message: res.ok ? "Prueba enviada a Discord exitosamente." : `Error Discord HTTP ${res.status}`,
      };
    }

    if (type === "telegram") {
      const urlObj = new URL(url);
      const chatId = urlObj.searchParams.get("chat_id");
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

      const text =
        "*GlassMatch AI Centinela: Prueba de Conexion*\n\n" +
        "El canal de alertas ha sido configurado con exito. Recibiras notificaciones prioritarias de oportunidades laborales compatibles.";

      const res = await fetch(cleanUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        }),
        signal: AbortSignal.timeout(6000),
      });

      return {
        success: res.ok,
        status: res.status,
        message: res.ok ? "Prueba enviada a Telegram exitosamente." : `Error Telegram HTTP ${res.status}`,
      };
    }

    // Slack o Webhook generico
    const payload = {
      text: "GlassMatch AI Centinela: Conexion de Webhook verificada exitosamente. Las alertas de vacantes compatibles seran entregadas a traves de este canal.",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    return {
      success: res.ok,
      status: res.status,
      message: res.ok ? "Prueba enviada al Webhook exitosamente." : `Error Webhook HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err?.message || "Fallo de red al conectar con el Webhook",
    };
  }
}

/**
 * Despacha una alerta de vacante compatible al Webhook configurado
 */
export async function dispatchJobAlertWebhook(
  webhookUrl: string,
  job: JobOffer,
  thresholdScore: number = 85
): Promise<WebhookDispatchResult> {
  const url = webhookUrl.trim();
  if (!url) {
    return { success: false, status: 400, message: "URL de webhook no configurada" };
  }

  const score = job.match?.matchScore || 0;
  const isElite = score >= thresholdScore;
  const type = detectWebhookType(url);

  try {
    if (type === "discord") {
      const payload = {
        content: isElite
          ? `ALERTA CENTINELA: Vacante Élite Detectada (${score}% Afinidad ATS)`
          : `Centinela: Nueva Vacante Compatible (${score}% Afinidad ATS)`,
        embeds: [
          {
            title: `${job.title} — ${job.company}`,
            url: job.url,
            color: isElite ? 0x10b981 : 0x0ea5e9, // Esmeralda si es elite, azul cian si es standard
            description:
              job.match?.executiveSummary ||
              "Vacante aprobada por el motor Zero-Trust ATS tras superar todos los Kill Switches.",
            fields: [
              { name: "Afinidad ATS", value: `${score}% Match`, inline: true },
              { name: "Modalidad", value: job.workMode.toUpperCase(), inline: true },
              { name: "Ubicacion", value: job.location || "Remoto", inline: true },
              ...(job.salaryText ? [{ name: "Salario Declarado", value: job.salaryText, inline: true }] : []),
              { name: "Portal de Origen", value: job.source, inline: true },
              ...(job.match?.strengths && job.match.strengths.length > 0
                ? [{ name: "Fortalezas Clave", value: job.match.strengths.slice(0, 3).join(", "), inline: false }]
                : []),
            ],
            footer: {
              text: "GlassMatch AI Centinela Autónomo • Trazabilidad SQLite",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      return {
        success: res.ok,
        status: res.status,
        message: res.ok ? "Alerta despachada a Discord" : `Discord HTTP ${res.status}`,
      };
    }

    if (type === "telegram") {
      const urlObj = new URL(url);
      const chatId = urlObj.searchParams.get("chat_id");
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

      const text =
        `*GlassMatch AI Centinela: Vacante Compatible*\n\n` +
        `*Puesto:* ${job.title}\n` +
        `*Empresa:* ${job.company}\n` +
        `*Afinidad ATS:* ${score}% Match\n` +
        `*Modalidad:* ${job.workMode.toUpperCase()} (${job.location})\n` +
        (job.salaryText ? `*Salario:* ${job.salaryText}\n` : "") +
        `\n*Diagnostico:*\n${job.match?.executiveSummary || "Supero todos los Kill Switches"}\n\n` +
        `[Postular Directamente](${job.url})`;

      const res = await fetch(cleanUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        }),
        signal: AbortSignal.timeout(6000),
      });

      return {
        success: res.ok,
        status: res.status,
        message: res.ok ? "Alerta despachada a Telegram" : `Telegram HTTP ${res.status}`,
      };
    }

    // Slack o Webhook generico
    const payload = {
      text:
        `GlassMatch AI Centinela: ${job.title} en ${job.company} (${score}% Match)\n` +
        `Ubicacion: ${job.location} | Modalidad: ${job.workMode}\n` +
        (job.salaryText ? `Salario: ${job.salaryText}\n` : "") +
        `Postular: ${job.url}`,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    return {
      success: res.ok,
      status: res.status,
      message: res.ok ? "Alerta despachada a Webhook" : `Webhook HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err?.message || "Fallo de red al despachar alerta al Webhook",
    };
  }
}
