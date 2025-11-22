// src/lib/globalEmotionStability.ts
// Master emotional stability engine (corrected + unified for Runtime Adapter pipeline)

import { EmotionState, EmotionResult } from "./emotionDetector";
import { useEmotionStore } from "../store/emotionStore";

/* --------------------------------------------------------------------------
   TYPES
-------------------------------------------------------------------------- */

export interface StabilityReport {
  stabilityIndex: number;              // 0..1
  correctedEmotion: EmotionState;      // final emotion
  correctedIntensity: number;          // 0..1 normalized intensity
  volatilityClass: "stable" | "variable" | "erratic";
  issues: string[];
  generatedAt: string;
}

/* --------------------------------------------------------------------------
   OPTIONAL TEST INJECTION
-------------------------------------------------------------------------- */

let mockEmotionStore: any = null;

export const __TEST_ONLY__ = {
  injectEmotionStore(store: any) {
    mockEmotionStore = store;
  },
  reset() {
    mockEmotionStore = null;
  }
};

function getEmotionStore() {
  return mockEmotionStore || useEmotionStore();
}

/* --------------------------------------------------------------------------
   INTERNAL UTILS
-------------------------------------------------------------------------- */

// Accept both 1–10 and 0–1 input -> normalize to 0–1
function normalizeIntensity(v: number): number {
  if (v <= 1) return Math.max(0, Math.min(1, v));
  return Math.max(0, Math.min(1, v / 10));
}

function filterRecent(emotions: EmotionResult[], seconds = 7200) {
  const cutoff = Date.now() - seconds * 1000;
  return emotions.filter((e) => {
    const t = Date.parse(e.detectedAt);
    return !Number.isNaN(t) && t >= cutoff;
  });
}

function stddev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function dominantEmotion(list: EmotionResult[]): {
  emotion: EmotionState;
  confidence: number;
} {
  if (list.length === 0) return { emotion: "neutral", confidence: 0 };

  const counts: Record<EmotionState, number> = {
    sad: 0,
    angry: 0,
    anxious: 0,
    stressed: 0,
    lonely: 0,
    excited: 0,
    neutral: 0,
    confused: 0,
    overwhelmed: 0
  };

  list.forEach((e) => counts[e.emotion]++);

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0] as [EmotionState, number];

  return {
    emotion: top[0],
    confidence: top[1] / list.length
  };
}

function recencyWeight(emotions: EmotionResult[]): EmotionResult[] {
  const now = Date.now();
  return emotions.map((e) => {
    const t = Date.parse(e.detectedAt);
    const hours = (now - t) / 3_600_000;
    const weight = Math.exp(-hours / 24);
    return {
      ...e,
      intensity: normalizeIntensity(e.intensity) * weight
    };
  });
}

function determineVolatility(stability: number): "stable" | "variable" | "erratic" {
  if (stability >= 0.7) return "stable";
  if (stability >= 0.4) return "variable";
  return "erratic";
}

/* --------------------------------------------------------------------------
   CORE STABILITY INDEX
-------------------------------------------------------------------------- */

export function computeStabilityIndex(
  provided?: EmotionResult[],
  windowSeconds = 7200
): number {
  let emotions = provided;

  if (!emotions) {
    const store = getEmotionStore();
    emotions = store.getRecent(50);
  }

  emotions = filterRecent(emotions, windowSeconds);

  if (emotions.length < 3) return 0.5;

  // --- Volatility: std deviation of normalized intensity ---
  const normInts = emotions.map((e) => normalizeIntensity(e.intensity));
  const s = stddev(normInts);
  const volatilityComponent = Math.max(0, 1 - s / 0.3);

  // --- Agreement: fraction of dominant emotion ---
  const dom = dominantEmotion(emotions);
  const agreementComponent = dom.confidence;

  // --- Recency stability ---
  const recentWeighted = recencyWeight(emotions);
  const recentInts = recentWeighted.map((e) => normalizeIntensity(e.intensity));
  const recencyStd = stddev(recentInts);
  const recencyComponent = Math.max(0, 1 - recencyStd / 0.3);

  // Final weighted blend
  const finalIndex =
    volatilityComponent * 0.4 +
    agreementComponent * 0.4 +
    recencyComponent * 0.2;

  return Math.max(0, Math.min(1, finalIndex));
}

/* --------------------------------------------------------------------------
   CORRECTION LOGIC
-------------------------------------------------------------------------- */

function correctedEmotionValue(current: EmotionState, recent: EmotionResult[]): EmotionState {
  if (recent.length < 5) return current;

  const dom = dominantEmotion(recent);
  if (dom.confidence > 0.6) return dom.emotion;

  return current;
}

function correctedIntensityValue(current: number, recent: EmotionResult[]): number {
  if (recent.length === 0) return normalizeIntensity(current);

  const vals = recent.map((e) => normalizeIntensity(e.intensity));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  const delta = avg - normalizeIntensity(current);
  const maxDelta = 0.15;

  const limited = normalizeIntensity(current) + Math.max(-maxDelta, Math.min(maxDelta, delta));
  return Math.max(0, Math.min(1, limited));
}

function listIssues(
  stability: number,
  volatility: string,
  intensityBefore: number,
  intensityAfter: number
): string[] {
  const out: string[] = [];

  if (stability < 0.4) out.push("high_variability");
  if (volatility === "erratic") out.push("erratic_pattern");

  if (Math.abs(intensityAfter - intensityBefore) > 0.3) {
    out.push("large_intensity_adjustment");
  }

  return out;
}

/* --------------------------------------------------------------------------
   PUBLIC API — evaluateStability
-------------------------------------------------------------------------- */

export function evaluateStability(input: {
  emotionResult: EmotionResult;
  recentEmotions?: EmotionResult[];
}): StabilityReport {
  const { emotionResult } = input;

  const store = getEmotionStore();
  const recents = input.recentEmotions ?? store.getRecent(50);

  const filtered = filterRecent(recents, 7200);

  const stability = computeStabilityIndex(filtered);
  const volatility = determineVolatility(stability);

  const correctedIntensity = correctedIntensityValue(emotionResult.intensity, filtered);
  const correctedEmotion = correctedEmotionValue(emotionResult.emotion, filtered);

  const issues = listIssues(
    stability,
    volatility,
    normalizeIntensity(emotionResult.intensity),
    correctedIntensityValue(emotionResult.intensity, filtered)
  );

  const report: StabilityReport = {
    stabilityIndex: Math.round(stability * 100) / 100,
    correctedEmotion,
    correctedIntensity: Math.round(correctedIntensity * 100) / 100,
    volatilityClass: volatility,
    issues,
    generatedAt: new Date().toISOString()
  };

  return report;
}
