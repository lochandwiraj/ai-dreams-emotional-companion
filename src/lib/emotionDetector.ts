// src/lib/emotionDetector.ts
// Primary emotion detection module for AI Dreams
// Supports:
// - LLM-based detection
// - Keyword fallback
// - EmotionContract compatibility
// - Stable & deterministic output
// - Cache + testing overrides

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

export type EmotionState =
  | "sad"
  | "angry"
  | "anxious"
  | "stressed"
  | "lonely"
  | "excited"
  | "neutral"
  | "confused"
  | "overwhelmed";

export interface EmotionResult {
  emotion: EmotionState;
  confidence: number; // 0..1
  intensity: number; // 1..10
  themes: string[];
  needsSupport: boolean;
  detectedAt: string; // ISO timestamp
}

/* -------------------------------------------------------------
   CACHE
------------------------------------------------------------- */

export const EMOTION_CACHE_LIMIT = 10;
const emotionCache: EmotionResult[] = [];

function addToCache(result: EmotionResult) {
  emotionCache.unshift(result);
  if (emotionCache.length > EMOTION_CACHE_LIMIT) {
    emotionCache.splice(EMOTION_CACHE_LIMIT);
  }
}

export function getCachedEmotionHistory(): EmotionResult[] {
  return [...emotionCache];
}

export function clearEmotionCache() {
  emotionCache.length = 0;
}

/* -------------------------------------------------------------
   LLM STUB (mockable)
------------------------------------------------------------- */

// DO NOT import sendLLMRequest from somewhere else.
// This local stub is overridden below.
async function _realSendLLMRequest(prompt: string): Promise<string> {
  throw new Error(
    "sendLLMRequest not implemented — integrate OpenRouter or custom LLM client"
  );
}

let sendLLMRequest = _realSendLLMRequest;

/* -------------------------------------------------------------
   ERROR TYPES
------------------------------------------------------------- */

export class EmotionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmotionParseError";
  }
}

export class LLMRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMRequestError";
  }
}

/* -------------------------------------------------------------
   KEYWORD FALLBACK CLASSIFIER
------------------------------------------------------------- */

const keywordMap: Record<EmotionState, string[]> = {
  sad: [
    "sad",
    "depressed",
    "unhappy",
    "miserable",
    "heartbroken",
    "grief",
    "tearful",
    "down",
    "blue",
    "hopeless"
  ],
  angry: [
    "angry",
    "mad",
    "furious",
    "rage",
    "annoyed",
    "irritated",
    "frustrated",
    "outraged",
    "livid",
    "pissed"
  ],
  anxious: [
    "anxious",
    "nervous",
    "worried",
    "scared",
    "fearful",
    "panic",
    "uneasy",
    "apprehensive",
    "tense",
    "restless"
  ],
  stressed: [
    "stressed",
    "overwhelmed",
    "burnt out",
    "pressure",
    "tension",
    "strained",
    "swamped",
    "snowed under"
  ],
  lonely: [
    "lonely",
    "alone",
    "isolated",
    "abandoned",
    "forsaken",
    "empty",
    "detached",
    "solitary",
    "lonesome"
  ],
  excited: [
    "excited",
    "thrilled",
    "energetic",
    "enthusiastic",
    "pumped",
    "eager",
    "joyful",
    "happy",
    "elated",
    "ecstatic"
  ],
  neutral: [
    "neutral",
    "fine",
    "okay",
    "alright",
    "normal",
    "average",
    "ordinary",
    "regular",
    "moderate"
  ],
  confused: [
    "confused",
    "uncertain",
    "unsure",
    "perplexed",
    "bewildered",
    "puzzled",
    "disoriented",
    "lost",
    "mixed up"
  ],
  overwhelmed: [
    "overwhelmed",
    "swamped",
    "flooded",
    "inundated",
    "snowed under",
    "buried",
    "crushed",
    "drowning"
  ]
};

/* -------------------------------------------------------------
   LLM PROMPT BUILDER
------------------------------------------------------------- */

export function buildEmotionPrompt(message: string): string {
  return `Analyze this message and return ONLY a JSON object:

{
  "emotion": "sad|angry|anxious|stressed|lonely|excited|neutral|confused|overwhelmed",
  "confidence": 0.0-1.0,
  "intensity": 1-10,
  "themes": ["array","of","key","themes"],
  "needsSupport": true/false
}

Message: "${message}"

Rules:
- Choose ONE dominant emotion.
- confidence = 0..1
- intensity = 1..10 (integer)
- themes = 3–5 tokens
- needsSupport = true if emotion indicates distress
Return ONLY JSON.`;
}

/* -------------------------------------------------------------
   FALLBACK KEYWORD CLASSIFIER
------------------------------------------------------------- */

export function fallbackKeywordClassifier(message: string): EmotionResult {
  const lower = message.toLowerCase();
  const scores: Partial<Record<EmotionState, number>> = {};
  let highestScore = 0;
  let detected: EmotionState = "neutral";

  for (const [emotion, keywords] of Object.entries(keywordMap)) {
    let score = 0;
    for (const k of keywords) {
      if (lower.includes(k)) {
        score += 1;

        // exact match boost
        const exact = new RegExp(`\\b${k}\\b`, "gi");
        score += (message.match(exact) || []).length * 0.5;
      }
    }
    scores[emotion as EmotionState] = score;
    if (score > highestScore) {
      highestScore = score;
      detected = emotion as EmotionState;
    }
  }

  // intensity: punctuation + caps
  let intensity = 5;
  intensity += Math.min((message.match(/!/g) || []).length * 0.5, 3);
  intensity += Math.min((message.match(/\b[A-Z]{3,}\b/g) || []).length * 0.3, 2);
  intensity = Math.max(1, Math.min(10, Math.round(intensity)));

  // themes: simple filtering
  const themes = Array.from(
    new Set(
      lower
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z]/g, ""))
        .filter((w) => w.length > 3)
    )
  ).slice(0, 3);

  const needsSupport = ["sad", "angry", "anxious", "stressed", "lonely", "overwhelmed"].includes(
    detected
  );

  return {
    emotion: detected,
    confidence: highestScore > 0 ? 0.5 : 0.3,
    intensity,
    themes,
    needsSupport,
    detectedAt: new Date().toISOString()
  };
}

/* -------------------------------------------------------------
   NORMALIZER
------------------------------------------------------------- */

export function normalizeEmotionResult(raw: any): EmotionResult {
  const valid: EmotionState[] = [
    "sad",
    "angry",
    "anxious",
    "stressed",
    "lonely",
    "excited",
    "neutral",
    "confused",
    "overwhelmed"
  ];

  if (!raw.emotion || !valid.includes(raw.emotion)) {
    throw new EmotionParseError(`Invalid emotion: ${raw.emotion}`);
  }

  const confidence =
    typeof raw.confidence === "number"
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0.5;

  const intensity =
    typeof raw.intensity === "number"
      ? Math.max(1, Math.min(10, Math.round(raw.intensity)))
      : 5;

  const themes = Array.isArray(raw.themes)
    ? raw.themes.filter((t: any) => typeof t === "string").slice(0, 5)
    : [];

  const needsSupport = typeof raw.needsSupport === "boolean" ? raw.needsSupport : false;

  return {
    emotion: raw.emotion,
    confidence,
    intensity,
    themes,
    needsSupport,
    detectedAt: new Date().toISOString()
  };
}

/* -------------------------------------------------------------
   MAIN DETECTOR
------------------------------------------------------------- */

export async function detectEmotion(
  message: string,
  opts?: { forceFallback?: boolean }
): Promise<EmotionResult> {
  const force = opts?.forceFallback ?? false;

  if (force) {
    const fallback = fallbackKeywordClassifier(message);
    addToCache(fallback);
    return fallback;
  }

  try {
    const prompt = buildEmotionPrompt(message);
    const raw = await sendLLMRequest(prompt);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : raw;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      console.warn("[EmotionDetector] invalid LLM JSON, fallback used.");
      const fb = fallbackKeywordClassifier(message);
      addToCache(fb);
      return fb;
    }

    const normalized = normalizeEmotionResult(parsed);
    addToCache(normalized);
    return normalized;
  } catch (err) {
    console.warn("[EmotionDetector] LLM request failed:", err);
    const fb = fallbackKeywordClassifier(message);
    addToCache(fb);
    return fb;
  }
}

/* -------------------------------------------------------------
   TESTING OVERRIDES
------------------------------------------------------------- */

export const __TEST_ONLY__ = {
  mockSendLLMRequest: null as null | ((p: string) => Promise<string>),
  resetMocks() {
    this.mockSendLLMRequest = null;
  },
  override(fn: (prompt: string) => Promise<string>) {
    this.mockSendLLMRequest = fn;
  }
};

// override wrapper
async function sendLLMRequestWrapper(prompt: string) {
  if (__TEST_ONLY__.mockSendLLMRequest) {
    return __TEST_ONLY__.mockSendLLMRequest(prompt);
  }
  return _realSendLLMRequest(prompt);
}

// replace internal LLM call
sendLLMRequest = sendLLMRequestWrapper;
