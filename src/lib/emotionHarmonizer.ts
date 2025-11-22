// src/lib/emotionHarmonizer.ts
// Clean, deterministic emotional harmonizer for AI Dreams
// Fully compatible with emotionContract, stability engine, runtime adapter

import { EmotionState } from "./emotionDetector";
import { EmotionContractPayload } from "./emotionContract";
import { StabilityReport } from "./globalEmotionStability";

export interface HarmonizedEmotion {
  unifiedEmotion: EmotionState;     // final emotion
  unifiedIntensity: number;         // 0..1
  contributingSignals: {
    source: string;
    weight: number;
    note?: string;
  }[];
  reliability: number;              // 0..1
  generatedAt: string;
}

/* -------------------------------------------------------------------------
   UTILITIES
--------------------------------------------------------------------------- */

const ALL_EMOTIONS: EmotionState[] = [
  "sad",
  "angry",
  "anxious",
  "stressed",
  "lonely",
  "excited",
  "neutral",
  "confused",
  "overwhelmed",
];

function normalizeIntensity(v: number): number {
  if (v <= 1) return Math.max(0, Math.min(1, v));
  return Math.max(0, Math.min(1, v / 10));
}

function recencyBoost(iso: string): number {
  try {
    const t = Date.parse(iso);
    const hours = (Date.now() - t) / 3_600_000;
    return Math.exp(-hours / 24); // 24-hour half-life
  } catch {
    return 0.3;
  }
}

/* -------------------------------------------------------------------------
   MAIN — harmonize()
--------------------------------------------------------------------------- */

export function harmonize(input: {
  contractPayloads?: EmotionContractPayload[];
  stabilityReport?: StabilityReport;
  conflictClusters?: any[];
}): HarmonizedEmotion {
  const { contractPayloads = [], stabilityReport } = input;

  /* ---------------------------------------------------------
     If no payloads → return neutral baseline
  --------------------------------------------------------- */
  if (contractPayloads.length === 0) {
    return {
      unifiedEmotion: "neutral",
      unifiedIntensity: 0.3,
      contributingSignals: [
        { source: "baseline", weight: 0.3 }
      ],
      reliability: 0.4,
      generatedAt: new Date().toISOString(),
    };
  }

  /* ---------------------------------------------------------
     STEP 1 → Build weighted signals
  --------------------------------------------------------- */
  const weighted = contractPayloads.map((p) => {
    const intensity = normalizeIntensity(p.intensity);
    const recency = recencyBoost(p.detectedAt);

    /*
     Weight formula:
     - 60% confidence
     - 20% recency
     - 20% intensity proximity to midrange (0.4–0.6)
    */
    const intensityFactor = 1 - Math.abs(intensity - 0.5) * 2;
    let w =
      p.confidence * 0.6 +
      recency * 0.2 +
      intensityFactor * 0.2;

    // scale with system stability
    if (stabilityReport) {
      w *= 0.5 + stabilityReport.stabilityIndex * 0.5;
    }

    return {
      payload: p,
      weight: Math.max(0, Math.min(1, w)),
    };
  });

  /* ---------------------------------------------------------
     STEP 2 → Emotion Voting
  --------------------------------------------------------- */
  const emotionScores: Record<EmotionState, number> = {
    sad: 0,
    angry: 0,
    anxious: 0,
    stressed: 0,
    lonely: 0,
    excited: 0,
    neutral: 0,
    confused: 0,
    overwhelmed: 0,
  };

  for (const w of weighted) {
    emotionScores[w.payload.emotion] += w.weight;
  }

  const sorted = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);
  const unifiedEmotion = sorted[0][0] as EmotionState;

  /* ---------------------------------------------------------
     STEP 3 → Weighted Intensity (0..1)
  --------------------------------------------------------- */
  let totalW = 0;
  let totalIntensity = 0;

  for (const w of weighted) {
    const intensity = normalizeIntensity(w.payload.intensity);
    totalIntensity += intensity * w.weight;
    totalW += w.weight;
  }

  const unifiedIntensity = totalW > 0 ? totalIntensity / totalW : 0.4;

  /* ---------------------------------------------------------
     STEP 4 → Reliability Score
  --------------------------------------------------------- */
  let reliability = 0.4;

  // signal agreement
  const topScore = sorted[0][1];
  const totalScore = Object.values(emotionScores).reduce((a, b) => a + b, 0);
  const agreement = totalScore > 0 ? topScore / totalScore : 0.5;
  reliability += agreement * 0.3;

  // stability
  if (stabilityReport) {
    reliability += stabilityReport.stabilityIndex * 0.3;
  }

  reliability = Math.max(0, Math.min(1, reliability));

  /* ---------------------------------------------------------
     STEP 5 → Contributing Signals (debug / explainability)
  --------------------------------------------------------- */
  const contributingSignals = [
    ...weighted.map((w) => ({
      source: `emotion-contract:${w.payload.emotion}`,
      weight: Math.round(w.weight * 100) / 100,
      note:
        w.payload.confidence < 0.4
          ? "low confidence"
          : w.weight < 0.3
          ? "low-weight"
          : undefined,
    })),
  ];

  if (stabilityReport) {
    contributingSignals.push({
      source: "stability",
      weight: stabilityReport.stabilityIndex,
      note: `volatility=${stabilityReport.volatilityClass}`,
    });
  }

  /* ---------------------------------------------------------
     RETURN FINAL OBJECT
  --------------------------------------------------------- */
  return {
    unifiedEmotion,
    unifiedIntensity: Math.round(unifiedIntensity * 100) / 100,
    contributingSignals: contributingSignals.sort((a, b) => b.weight - a.weight),
    reliability: Math.round(reliability * 100) / 100,
    generatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------
   Simple Contradiction Resolver (required by runtime adapter)
--------------------------------------------------------------------------- */

export function resolveContradictions(
  signals: EmotionContractPayload[]
): { emotion: EmotionState; rationale: string } {
  if (signals.length === 0) return { emotion: "neutral", rationale: "no signals" };
  if (signals.length === 1) return { emotion: signals[0].emotion, rationale: "single signal" };

  const buckets: Record<EmotionState, number> = {} as any;
  signals.forEach((s) => {
    buckets[s.emotion] = (buckets[s.emotion] ?? 0) + s.confidence;
  });

  const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  return {
    emotion: sorted[0][0] as EmotionState,
    rationale: "confidence-weighted"  
  };
}
