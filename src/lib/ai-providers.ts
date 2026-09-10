import { db } from "@/lib/db";

export interface BackupAiConfig {
  provider: "groq" | "openai";
  apiKey: string;
  model: string;
}

export function getBackupAiConfig(): BackupAiConfig | null {
  try {
    const providerRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'BACKUP_AI_PROVIDER'")
      .get() as { value: string } | undefined;
    const keyRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'BACKUP_AI_API_KEY'")
      .get() as { value: string } | undefined;
    const modelRow = db
      .prepare("SELECT value FROM AppConfig WHERE key = 'BACKUP_AI_MODEL'")
      .get() as { value: string } | undefined;

    const rawKey = keyRow?.value || process.env.GROQ_API_KEY || process.env.BACKUP_AI_API_KEY || "";
    if (!rawKey || rawKey.trim().length < 8) {
      return null;
    }

    const provider = (providerRow?.value as "groq" | "openai") || "groq";
    const defaultModel = provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
    const model = modelRow?.value || defaultModel;

    return {
      provider,
      apiKey: rawKey.trim(),
      model,
    };
  } catch {
    return null;
  }
}

export interface CallBackupAiOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface BackupAiResult {
  text: string;
  modelUsed: string;
  modelId: string;
  provider: string;
}

/**
 * Executes a call to the secondary AI provider (Groq Cloud / OpenAI)
 */
export async function callBackupAiProvider(
  options: CallBackupAiOptions
): Promise<BackupAiResult | null> {
  const config = getBackupAiConfig();
  if (!config) return null;

  const { provider, apiKey, model } = config;
  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  try {
    const payload: any = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.1,
    };

    if (options.jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    if (options.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && typeof text === "string" && text.trim().length > 0) {
        const friendlyModel =
          provider === "groq"
            ? model.includes("70b")
              ? "Groq Llama 3.3 70B"
              : "Groq Llama 3.1"
            : `OpenAI ${model}`;

        return {
          text,
          modelUsed: friendlyModel,
          modelId: model,
          provider,
        };
      }
    }

    console.warn(`[Backup AI] ${provider} devolvio codigo HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[Backup AI] Error al consultar ${provider}:`, err);
  }

  return null;
}

/**
 * Health probe for Groq Cloud / OpenAI backup provider
 */
export async function probeBackupAiHealth(
  provider: "groq" | "openai",
  apiKey: string,
  model?: string
): Promise<{
  healthStatus: "operational" | "rate_limited" | "invalid_key" | "error";
  statusMessage: string;
  httpCode: number;
}> {
  if (!apiKey || apiKey.trim().length < 8) {
    return {
      healthStatus: "invalid_key",
      statusMessage: "Clave ausente o demasiado corta",
      httpCode: 400,
    };
  }

  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const targetModel =
    model || (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });

    if (res.ok) {
      const providerLabel = provider === "groq" ? "Groq Cloud (Llama 3.3 70B)" : "OpenAI";
      return {
        healthStatus: "operational",
        statusMessage: `${providerLabel} Operativo (Listo para respaldo)`,
        httpCode: 200,
      };
    }

    if (res.status === 429) {
      return {
        healthStatus: "rate_limited",
        statusMessage: "Límite de cuota alcanzado en el proveedor de respaldo (HTTP 429)",
        httpCode: 429,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        healthStatus: "invalid_key",
        statusMessage: "Clave de API inválida o sin autorización",
        httpCode: res.status,
      };
    }

    return {
      healthStatus: "error",
      statusMessage: `Error del proveedor: HTTP ${res.status}`,
      httpCode: res.status,
    };
  } catch (err: any) {
    return {
      healthStatus: "error",
      statusMessage: "Error de conexión con el proveedor de respaldo",
      httpCode: 500,
    };
  }
}
