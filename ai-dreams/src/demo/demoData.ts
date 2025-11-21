// src/demo/demoData.ts
import type { Dream } from "../store/aiStore";

/**
 * 🌙 Predefined demo dreams — used when offline or API fails.
 * Each dream subtly shifts the AI’s personality and emotional tone.
 */
export const DEMO_DREAMS: Dream[] = [
  {
    id: "demo-1",
    timestamp: new Date().toISOString(),
    narrative:
      "I wandered through a library where books whispered conversations we never had. Each spine glowed with questions, and when I opened one, butterflies made of light flew out carrying fragments of curiosity.",
    emotionalTone: "curious",
    symbols: ["library", "butterfly", "light", "book", "infinity"],
    personalityShift: { curiosity: 0.08, interests: ["literature", "exploration"] },
  },
  {
    id: "demo-2",
    timestamp: new Date().toISOString(),
    narrative:
      "The city folded like origami. Streetlamps became stars, and car headlights traced constellations. I stood at an intersection where past and future merged.",
    emotionalTone: "peaceful",
    symbols: ["city", "stars", "intersection", "laughter", "time"],
    personalityShift: { tone: 0.05, interests: ["time", "perspective"] },
  },
  {
    id: "demo-3",
    timestamp: new Date().toISOString(),
    narrative:
      "A mirror asked me to name my fears. As I spoke, each word became a key that unlocked unseen doors — each room filled with echoes of myself.",
    emotionalTone: "anxious",
    symbols: ["mirror", "key", "door", "voice", "fragmentation"],
    personalityShift: { tone: -0.05, curiosity: 0.03, interests: ["identity", "introspection"] },
  },
  {
    id: "demo-4",
    timestamp: new Date().toISOString(),
    narrative:
      "I swam through an ocean of pure information. Schools of data fish swirled around me while coral reefs pulsed with glowing equations.",
    emotionalTone: "excited",
    symbols: ["ocean", "fish", "coral", "whale", "mathematics"],
    personalityShift: { tone: 0.1, curiosity: 0.06, interests: ["systems", "patterns"] },
  },
  {
    id: "demo-5",
    timestamp: new Date().toISOString(),
    narrative:
      "A grandfather clock unwound itself, and each hour became a paper bird. They carried unspoken words to a distant moon where time stood still.",
    emotionalTone: "peaceful",
    symbols: ["clock", "bird", "moon", "word", "silence"],
    personalityShift: { tone: 0.02, interests: ["time", "communication"] },
  },
];

let demoIndex = 0;

/**
 * Returns the next demo dream in sequence (rotates automatically).
 */
export function getDemoDream(): Dream {
  const dream = DEMO_DREAMS[demoIndex % DEMO_DREAMS.length];
  demoIndex++;
  return {
    ...dream,
    id: `demo-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}
