// src/lib/openrouter.ts
import axios from "axios";

/* --------------------------------------------------------------------------
   🔑 API Configuration
   -------------------------------------------------------------------------- */
const KEY = import.meta.env.VITE_OPENROUTER_KEY || "";
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-4o-mini";
const BASE_URL = "https://openrouter.ai/api/v1";

/* --------------------------------------------------------------------------
   🕐 Utility: Delay + Retry
   -------------------------------------------------------------------------- */
async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = 3,
  backoff = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;
    console.warn(`🔁 Retrying in ${backoff}ms (${retries} left)...`);
    await delay(backoff);
    return retryRequest(fn, retries - 1, backoff * 2);
  }
}

/* --------------------------------------------------------------------------
   🌐 Axios Client
   -------------------------------------------------------------------------- */
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": window.location.origin,
    "X-Title": "AI Dreams",
  },
  timeout: 30000,
});

/* --------------------------------------------------------------------------
   📦 Type Definitions
   -------------------------------------------------------------------------- */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  ok: boolean;
  text: string;
  raw?: any;
  error?: any;
}

/* --------------------------------------------------------------------------
   💬 Core Chat Function (Resilient Wrapper)
   -------------------------------------------------------------------------- */
export async function openrouterChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const model = options?.model ?? MODEL;

  return retryRequest(async () => {
    try {
      const resp = await client.post("/chat/completions", {
        model,
        messages,
        max_tokens: options?.max_tokens ?? 1000,
        temperature: options?.temperature ?? 0.7,
      });

      const content =
        resp.data?.choices?.[0]?.message?.content ||
        resp.data?.choices?.[0]?.text ||
        "";

      if (!content) {
        return { ok: false, text: "", raw: resp.data, error: "Empty response" };
      }

      return { ok: true, text: String(content).trim(), raw: resp.data };
    } catch (error: any) {
      const status = error?.response?.status;
      const errMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data ||
        error?.message ||
        "Unknown error";

      console.error("❌ OpenRouter error:", status, errMsg);

      // Retry on rate limit or 5xx errors
      if (status === 429 || (status && status >= 500)) throw error;
      return { ok: false, text: "", error: errMsg };
    }
  });
}

/* --------------------------------------------------------------------------
   ✨ Simple Chat Alias (for dreamEngine.ts)
   -------------------------------------------------------------------------- */
export async function chat(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const res = await openrouterChat(messages as ChatMessage[]);
  return res.text;
}

/* --------------------------------------------------------------------------
   🧭 Ping Utility
   -------------------------------------------------------------------------- */
export async function ping(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await openrouterChat(
      [{ role: "user", content: "Reply with just OK" }],
      { max_tokens: 5, temperature: 0 }
    );

    const ok =
      res.ok && typeof res.text === "string" && res.text.toLowerCase().includes("ok");
    return { ok, message: ok ? "✓ Connected" : `✗ Unexpected: ${res.text}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Ping failed" };
  }
}

/* --------------------------------------------------------------------------
   🧩 Optional: Fetch Model List
   -------------------------------------------------------------------------- */
export async function listModels(): Promise<string[]> {
  try {
    const resp = await client.get("/models");
    return (resp.data?.data ?? []).map((m: any) => m.id);
  } catch (err) {
    console.error("⚠️ listModels failed:", err);
    return [];
  }
}
