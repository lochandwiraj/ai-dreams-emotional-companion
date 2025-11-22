// src/lib/openrouter.ts
import axios from "axios";

/* -------------------------------------------------------------
   🔑 API CONFIG
------------------------------------------------------------- */

const KEY = import.meta.env.VITE_OPENROUTER_KEY || "";
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-4o-mini";

const REFERER =
  typeof window !== "undefined" ? window.location.origin : "https://localhost";

const BASE_URL = "https://openrouter.ai/api/v1";

/* -------------------------------------------------------------
   🕐 RETRY HELPERS
------------------------------------------------------------- */

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
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`🔁 Retrying in ${backoff}ms (${retries} left)…`);
    await delay(backoff);
    return retryRequest(fn, retries - 1, backoff * 2);
  }
}

/* -------------------------------------------------------------
   🌐 CLIENT
------------------------------------------------------------- */

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": REFERER,
    "X-Title": "AI Dreams",
  },
  timeout: 30000,
});

/* -------------------------------------------------------------
   📦 TYPES
------------------------------------------------------------- */

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

/* -------------------------------------------------------------
   💬 MAIN CHAT WRAPPER
------------------------------------------------------------- */

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
        max_tokens: options?.max_tokens ?? 2000, // 🔥 upgraded default
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
    } catch (err: any) {
      const status = err?.response?.status;
      const errorText =
        err?.response?.data?.error?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown error";

      console.error("❌ OpenRouter error:", status, errorText);

      if (errorText.includes("credits")) {
        console.error("⚠️ You are out of OpenRouter credits");
      }

      if (status === 429 || (status && status >= 500)) throw err;

      return { ok: false, text: "", error: errorText };
    }
  });
}

/* -------------------------------------------------------------
   ✨ SIMPLE CHAT ALIAS
------------------------------------------------------------- */

export async function chat(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const res = await openrouterChat(messages);
  return res.text;
}

/* -------------------------------------------------------------
   🌟 MAIN LLM ENTRY POINT
------------------------------------------------------------- */

export async function sendLLMRequest(
  prompt: string,
  opts?: { maxTokens?: number }
): Promise<string> {
  const res = await openrouterChat(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    { max_tokens: opts?.maxTokens ?? 2000 }
  );

  if (!res.ok) throw new Error(res.error || "LLM request failed");

  return res.text;
}

/* -------------------------------------------------------------
   🔔 PING UTILITY
------------------------------------------------------------- */

export async function ping(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await sendLLMRequest("Reply with just OK");
    const ok = res.toLowerCase().includes("ok");
    return { ok, message: ok ? "✓ Connected" : `Unexpected: ${res}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Ping failed" };
  }
}

/* -------------------------------------------------------------
   📃 FETCH MODEL LIST
------------------------------------------------------------- */

export async function listModels(): Promise<string[]> {
  try {
    const resp = await client.get("/models");
    return (resp.data?.data ?? []).map((m: any) => m.id);
  } catch (err) {
    console.error("⚠️ listModels failed:", err);
    return [];
  }
}
