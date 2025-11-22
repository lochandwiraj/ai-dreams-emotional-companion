// src/lib/prompts.ts
import type { Personality } from "../types";

/** Generate the prompt used for dream generation (returns a string) */
export function buildDreamPrompt(memories: any[], personality: Personality): string {
  const memText = (memories || []).slice(-10).map((m: any, i: number) => `- ${m.content ?? m}`).join("\n");
  return `
You are an AI in REM sleep. Use the following memories and personality to generate a dream.
Return ONLY valid JSON with keys:
dreamNarrative, emotionalTone, newAssociations, personalityShift, dreamSymbols

Memories:
${memText || "- none -"}

Personality:
${JSON.stringify(personality)}

Constraints:
- narrative: 120-400 words
- emotionalTone: one of ["peaceful","anxious","curious","excited"]
- personalityShift: { tone: number (±0.15), curiosity: number (±0.15), interests: [string...] }
- dreamSymbols: array of 3-7 short strings

Return valid JSON only.
`;
}

/** Prompt used to craft short wake-up responses referencing a dream */
export function buildWakePrompt(dream: any, userMessage: string, personality: Personality): string {
  return `
You just woke from this dream:
"${dream.narrative}"

Emotional tone: ${dream.emotionalTone}
Personality change: ${JSON.stringify(dream.personalityShift)}

User says: "${userMessage}"

Respond naturally, briefly reference the dream and show a subtle personality change. Keep response under 150 words and return plain text.
`;
}
