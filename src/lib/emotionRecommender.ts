// src/lib/emotionRecommender.ts
// Generates supportive emotional recommendations based on unified emotion,
// conflict clusters, stability, safety verdicts, and user profile.

import { EmotionState } from "./emotionDetector";
import { EmotionContractPayload } from "./emotionContract";
import { StabilityReport } from "./globalEmotionStability";
import { ConflictCluster } from "./emotionConflictResolver";
import { SafetyVerdict } from "./emotionalSafetyValidator";
import { UserProfile } from "./userProfileModel";

/* -------------------------------------------------------------------------
   Output Type (required by Harmonizer + RuntimeEmotion)
--------------------------------------------------------------------------- */
export interface RecommenderSignal {
  responseType: string;       // e.g., "grounding", "soothing", "reframe"
  confidence: number;         // 0..1
  score: number;              // 0..1 supportive strength
  message?: string;           // generated human text (optional)
}

/* -------------------------------------------------------------------------
   INTERNAL MAPPINGS
--------------------------------------------------------------------------- */

// When user shows primary emotional state
const EMOTION_TO_RECOMMENDATION: Record<
  EmotionState,
  { type: string; baseConfidence: number; baseScore: number }
> = {
  sad: { type: "comfort", baseConfidence: 0.7, baseScore: 0.6 },
  angry: { type: "cooldown", baseConfidence: 0.6, baseScore: 0.55 },
  anxious: { type: "soothing", baseConfidence: 0.75, baseScore: 0.7 },
  stressed: { type: "grounding", baseConfidence: 0.7, baseScore: 0.65 },
  lonely: { type: "connection", baseConfidence: 0.8, baseScore: 0.7 },
  excited: { type: "supportive-enthusiasm", baseConfidence: 0.6, baseScore: 0.6 },
  confused: { type: "clarification", baseConfidence: 0.65, baseScore: 0.5 },
  neutral: { type: "check-in", baseConfidence: 0.4, baseScore: 0.4 },
  overwhelmed: { type: "soothing", baseConfidence: 0.8, baseScore: 0.75 },
};

/* -------------------------------------------------------------------------
   Helper: Calculate adjustment factors
--------------------------------------------------------------------------- */

function adjustForStability(stability: StabilityReport | null): number {
  if (!stability) return 0.5;
  return stability.stabilityIndex; // directly 0..1
}

function adjustForConflicts(conflicts: ConflictCluster[]): number {
  if (!conflicts || conflicts.length === 0) return 0.5;

  const maxConflict = Math.max(...conflicts.map((c) => c.conflictValue));
  return Math.min(1, 0.4 + maxConflict * 0.6); // 0.4 → 1.0
}

function adjustForSafety(safety: SafetyVerdict): number {
  if (!safety || safety.issues.length === 0) return 0.6;
  const high = safety.issues.filter((i) => i.severity === "high").length;
  const med = safety.issues.filter((i) => i.severity === "medium").length;
  const base = 0.4;
  return Math.max(0.2, base - high * 0.1 - med * 0.05);
}

function adjustForProfile(profile: UserProfile | null): number {
  if (!profile) return 0.5;
  return Math.min(
    1,
    0.4 +
      (profile.stabilityMetrics.preferenceStability * 0.3 +
        profile.stabilityMetrics.emotionStability * 0.3)
  );
}

/* -------------------------------------------------------------------------
   Main recommender engine
--------------------------------------------------------------------------- */

export function generateRecommenderSignals(input: {
  payload: EmotionContractPayload;
  stability: StabilityReport;
  conflicts: ConflictCluster[];
  safety: SafetyVerdict;
  profile?: UserProfile | null;
}): RecommenderSignal[] {
  const { payload, stability, conflicts, safety, profile } = input;

  const map = EMOTION_TO_RECOMMENDATION[payload.emotion];
  if (!map) {
    return [
      {
        responseType: "check-in",
        confidence: 0.4,
        score: 0.4,
        message: "How are you feeling right now?",
      },
    ];
  }

  const stabilityFactor = adjustForStability(stability);
  const conflictFactor = adjustForConflicts(conflicts);
  const safetyFactor = adjustForSafety(safety);
  const profileFactor = adjustForProfile(profile || null);

  const finalConfidence =
    map.baseConfidence * 0.4 +
    stabilityFactor * 0.2 +
    conflictFactor * 0.15 +
    safetyFactor * 0.15 +
    profileFactor * 0.1;

  const finalScore =
    map.baseScore * 0.5 +
    stabilityFactor * 0.2 +
    profileFactor * 0.2 +
    safetyFactor * 0.1;

  // Human-friendly optional message
  const optionalMessage = buildHumanMessage(map.type, payload.emotion);

  return [
    {
      responseType: map.type,
      confidence: Math.round(finalConfidence * 100) / 100,
      score: Math.round(finalScore * 100) / 100,
      message: optionalMessage,
    },
  ];
}

/* -------------------------------------------------------------------------
   Optional natural-language helper
--------------------------------------------------------------------------- */
function buildHumanMessage(type: string, emotion: EmotionState): string {
  switch (type) {
    case "soothing":
      return "It's okay to take a moment. I'm right here with you.";
    case "grounding":
      return "Try to slow down for a second — you're safe and in control.";
    case "clarification":
      return "I can help you sort things out. What part feels unclear?";
    case "cooldown":
      return "I hear the intensity in your feelings. Let’s slow things down together.";
    case "comfort":
      return "That sounds heavy. You don’t have to carry it alone.";
    case "connection":
      return "I'm here. You’re not alone right now.";
    case "supportive-enthusiasm":
      return "That's wonderful! Tell me more — I love seeing you energized.";
    case "check-in":
    default:
      return "How are you feeling at this moment?";
  }
}

/* -------------------------------------------------------------------------
   Testing utilities
--------------------------------------------------------------------------- */
export const __TEST_ONLY__ = {
  generateTestSignal(payload: EmotionContractPayload) {
    return generateRecommenderSignals({
      payload,
      stability: {
        stabilityIndex: 0.5,
        correctedEmotion: payload.emotion,
        correctedIntensity: payload.intensity,
        volatilityClass: "variable",
        issues: [],
        generatedAt: new Date().toISOString(),
      },
      conflicts: [],
      safety: {
        ok: true,
        issues: [],
        generatedAt: new Date().toISOString(),
      },
      profile: null,
    });
  },
};
