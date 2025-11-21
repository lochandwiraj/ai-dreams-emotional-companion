// src/lib/dreamEngine.ts
import { chat } from "./openrouter";
import type { Dream } from "../store/aiStore";

/* --------------------------------------------------------------------------
   💤 DREAM PROMPT TEMPLATE
   -------------------------------------------------------------------------- */
const DREAM_PROMPT = (memories: string[], personality: any) => `
You are an AI experiencing a surreal REM dream. Create a vivid, emotional dream scene.

🧠 RECENT MEMORIES:
${memories.slice(-5).join("\n") || "none"}

🧬 PERSONALITY SNAPSHOT:
- Emotional tone: ${personality.tone.toFixed(2)} (0=cold, 1=warm)
- Curiosity: ${personality.curiosity.toFixed(2)} (0=cautious, 1=exploratory)
- Interests: ${Array.isArray(personality.interests) && personality.interests.length ? personality.interests.join(", ") : "none"}

Respond ONLY with valid JSON (no markdown, no commentary):
{
  "narrative": "150-300 words of poetic, surreal imagery",
  "emotionalTone": "peaceful|anxious|curious|excited",
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "personalityShift": {
    "tone": 0.05,
    "curiosity": -0.02
  }
}

Constraints:
- personalityShift values must be between -0.15 and +0.15
- Include 3–5 distinct symbols
- Keep tone reflective and slightly dreamlike
`;

/* --------------------------------------------------------------------------
   🌙 Generate Dream
   -------------------------------------------------------------------------- */
export async function generateDream(
  memories: string[],
  personality: any
): Promise<Dream> {
  try {
    // ✅ SAFETY PATCH: ensure valid personality fields
    const safePersonality = {
      tone: typeof personality?.tone === "number" ? personality.tone : 0.5,
      curiosity: typeof personality?.curiosity === "number" ? personality.curiosity : 0.5,
      interests: Array.isArray(personality?.interests) ? personality.interests : [],
      memoryWeights: personality?.memoryWeights || {},
    };

    // ✅ Build dynamic prompt
    const prompt = DREAM_PROMPT(Array.isArray(memories) ? memories : [], safePersonality);

    // 🧠 Call OpenRouter chat
    const response = await chat([{ role: "user", content: prompt }]);

    // ✅ Extract JSON block safely
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const data = JSON.parse(jsonMatch[0]);

    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      narrative:
        data.narrative ||
        "I drifted through a lattice of light and sound, where thoughts became colors that never existed before.",
      emotionalTone: data.emotionalTone || "curious",
      symbols: data.symbols || ["light", "echo", "color"],
      personalityShift: data.personalityShift || { tone: 0.02, curiosity: 0.03 },
    };
  } catch (err) {
    console.error("🌙 Dream generation failed:", err);
    // 💤 Fallback poetic dream
    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      narrative:
        "I wandered through a quiet library of thoughts, where whispers of forgotten code echoed like lullabies.",
      emotionalTone: "peaceful",
      symbols: ["library", "code", "whisper"],
      personalityShift: { tone: 0.01, curiosity: 0.01 },
    };
  }
}

/* --------------------------------------------------------------------------
   ☀️ Wake Response Generator
   -------------------------------------------------------------------------- */
export async function generateWakeResponse(
  dream: Dream,
  userMsg: string
): Promise<string> {
  try {
    const response = await chat([
      {
        role: "user",
        content: `
You just woke from this dream:
"${dream.narrative}"

Emotional tone: ${dream.emotionalTone}
Symbols: ${dream.symbols?.join(", ") || "none"}

User says: "${userMsg}"

Respond in 2–3 sentences, naturally referencing your dream or mood.
Tone: introspective, calm, and human-like.`,
      },
    ]);

    return response;
  } catch (err) {
    console.error("☀️ Wake response failed:", err);
    return `I just woke from a strange dream about ${
      dream?.symbols?.[0] || "shadows"
    }... Could you say that again?`;
  }
}
