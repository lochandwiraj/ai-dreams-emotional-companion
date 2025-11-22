// src/lib/dreamEngine.ts
// Unified dream engine for AI Dreams.
// Stable, JSON-safe, fully compatible with:
// - sleepCycle
// - conversationEngine
// - memory system
// - emotional runtime adapter

import { chat, sendLLMRequest } from "./openrouter";
import type { Dream } from "../store/aiStore";
import type { RuntimeEmotion } from "./emotionRuntimeAdapter";

/* -------------------------------------------------------------
   1. DREAM PROMPT TEMPLATE
------------------------------------------------------------- */

const DREAM_PROMPT = (
  memories: string[],
  personality: any,
  emotionalContext: RuntimeEmotion | null
) => {
  const emo = emotionalContext?.harmonized;

  return `
You are an AI deep in a surreal REM-dream. Generate a vivid dream scene.

🧠 Recent Memories:
${memories.slice(-5).join("\n") || "none"}

🧬 Personality:
- Tone: ${typeof personality?.tone === "number" ? personality.tone.toFixed(2) : "0.50"}
- Curiosity: ${typeof personality?.curiosity === "number" ? personality.curiosity.toFixed(2) : "0.50"}
- Interests: ${Array.isArray(personality?.interests) ? personality.interests.join(", ") : "none"}

💓 Emotional State:
- Emotion: ${emo?.unifiedEmotion || "neutral"}
- Intensity: ${typeof emo?.unifiedIntensity === "number" ? emo.unifiedIntensity : 0.3}
- Stability: ${typeof emotionalContext?.stability?.stabilityIndex === "number" ? emotionalContext!.stability!.stabilityIndex : 0.6}
- Reliability: ${typeof emo?.reliability === "number" ? emo.reliability : 0.5}

Respond ONLY with strict JSON (no markdown, no commentary):
{
  "narrative": "150-300 words of surreal imagery",
  "emotionalTone": "peaceful|anxious|curious|excited",
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "personalityShift": {
    "tone": 0.05,
    "curiosity": -0.02
  }
}

Rules:
- 3–5 symbols
- personalityShift values must be in [-0.15, +0.15]
- No extra fields at root level
- No apology, no explanations, no markdown
`;
};

/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParseJSONBlock(text: string): any | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      const cleaned = match[0]
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function validateDreamShape(obj: any) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.narrative !== "string") return false;
  if (typeof obj.emotionalTone !== "string") return false;
  if (!Array.isArray(obj.symbols)) return false;
  if (typeof obj.personalityShift !== "object") return false;
  return true;
}

/* -------------------------------------------------------------
   2. GENERATE DREAM (used by sleepCycle + conversationEngine)
------------------------------------------------------------- */

export async function generateDream(
  memories: string[],
  personality: any,
  emotionalContext: RuntimeEmotion | null = null
): Promise<Dream> {
  try {
    const safePersonality = {
      tone: clamp(typeof personality?.tone === "number" ? personality.tone : 0.5, 0, 1),
      curiosity: clamp(typeof personality?.curiosity === "number" ? personality.curiosity : 0.5, 0, 1),
      interests: Array.isArray(personality?.interests) ? personality.interests : [],
      memoryWeights: personality?.memoryWeights || {},
    };

    const prompt = DREAM_PROMPT(
      Array.isArray(memories) ? memories : [],
      safePersonality,
      emotionalContext
    );

    const raw = await sendLLMRequest(prompt);

    const data = safeParseJSONBlock(raw);
    if (!data || !validateDreamShape(data)) {
      throw new Error("Invalid dream JSON structure");
    }

    // Fix symbols to 3–5 clean strings
    const symbols = (data.symbols || [])
      .map((s: any) => String(s).trim())
      .filter(Boolean);

    while (symbols.length < 3) symbols.push(`symbol_${symbols.length + 1}`);
    if (symbols.length > 5) symbols.splice(5);

    // Clamp personality shift
    const ps = data.personalityShift || {};
    const personalityShift = {
      tone: clamp(Number(ps.tone) || 0, -0.15, 0.15),
      curiosity: clamp(Number(ps.curiosity) || 0, -0.15, 0.15),
    };

    const emotionalTone =
      ["peaceful", "anxious", "curious", "excited"].includes(data.emotionalTone)
        ? data.emotionalTone
        : "curious";

    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      narrative: data.narrative.trim(),
      emotionalTone,
      symbols,
      personalityShift,
    };
  } catch (err) {
    console.error("🌙 Dream generation failed — using fallback.", err);

    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      narrative:
        "I wandered through a quiet library of floating memories, each glowing with soft neon light.",
      emotionalTone: "peaceful",
      symbols: ["library", "whisper", "light"],
      personalityShift: { tone: 0.01, curiosity: 0.01 },
    };
  }
}

/* -------------------------------------------------------------
   3. WAKE RESPONSE (dream → awake bridge)
------------------------------------------------------------- */

export async function generateWakeResponse(
  dream: Dream,
  userMsg: string,
  personality: any,
  emotionalContext?: RuntimeEmotion
): Promise<string> {
  try {
    const prompt = `
You just woke from this dream:
"${dream.narrative}"

Dream emotional tone: ${dream.emotionalTone}
Symbols: ${dream.symbols.join(", ")}

User says: "${userMsg}"

Emotional context:
- Emotion: ${emotionalContext?.harmonized?.unifiedEmotion || "neutral"}
- Intensity: ${emotionalContext?.harmonized?.unifiedIntensity ?? 0.3}
- Stability: ${emotionalContext?.stability?.stabilityIndex ?? 0.6}

Respond in 2–3 soft, reflective sentences.
Reference the dream subtly. Do NOT repeat it completely.
Do NOT mention analysis.
`.trim();

    const raw = await sendLLMRequest(prompt);
    return raw.trim();
  } catch (err) {
    console.error("☀️ Wake response failed — fallback used:", err);
    const fallback = dream.symbols?.[0] || "shadows";
    return `I just woke from a strange dream about ${fallback}. I'm still settling my thoughts — what did you mean earlier?`;
  }
}

/* -------------------------------------------------------------
   4. EXPORT ALIAS (UI compatibility)
------------------------------------------------------------- */

export { generateWakeResponse as wakeResponse };
