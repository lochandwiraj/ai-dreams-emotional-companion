// src/lib/emotionRuntimeAdapter.ts
// Unified emotional brain for AI Dreams
// Produces final runtime emotion used by:
// - conversationEngine
// - dreamEngine
// - memoryEngine
// - recommenderEngine
// - UI emotional state

import { EmotionContractPayload, normalizeToContract } from "./emotionContract";
import { StabilityReport, evaluateStability } from "./globalEmotionStability";
import { HarmonizedEmotion, harmonize } from "./emotionHarmonizer";
import { SafetyVerdict, validateEmotionSafety } from "./emotionalSafetyValidator";
import { useEmotionStore } from "../store/emotionStore";
import { detectConflictClusters } from "./emotionConflictResolver";
import { getCachedProfile } from "./userProfileModel";

export interface RuntimeEmotion {
  payload: EmotionContractPayload;
  stability: StabilityReport;
  harmonized: HarmonizedEmotion;
  safety: SafetyVerdict;
  emittedAt: string;
}

/* --------------------------------------------------------------------------
   Test mocks
-------------------------------------------------------------------------- */

let mock = {
  harmonizer: null as any,
  stability: null as any,
  safety: null as any,
  emotionStore: null as any,
  conflict: null as any,
  profile: null as any,
};

let lastStabilityReport: StabilityReport | null = null;

/* --------------------------------------------------------------------------
   Accessors with mocks
-------------------------------------------------------------------------- */

const getHarmonizer = () => mock.harmonizer || { harmonize };
const getStabilityEngine = () => mock.stability || { evaluateStability };
const getSafetyValidator = () => mock.safety || { validateEmotionSafety };
const getEmotionStore = () => mock.emotionStore || useEmotionStore();
const getConflictResolver = () => mock.conflict || { detectConflictClusters };
const getProfileModel = () => mock.profile || { getCachedProfile };

/* --------------------------------------------------------------------------
   Core utility: buildContractFromHarmonized
-------------------------------------------------------------------------- */

function buildContractFromHarmonized(h: HarmonizedEmotion): EmotionContractPayload {
  return normalizeToContract({
    emotion: h.unifiedEmotion,
    intensity: h.unifiedIntensity,   // already 0–1
    confidence: h.reliability,       // 0–1
    detectedAt: h.generatedAt,
    themes: [],                      // themes not inferred here
    modifiers: [
      h.reliability > 0.8 ? "high-reliability"
      : h.reliability < 0.4 ? "low-reliability"
      : "moderate-reliability"
    ]
  });
}

/* --------------------------------------------------------------------------
   Safety correction
-------------------------------------------------------------------------- */

function applySafetyCorrections(
  p: EmotionContractPayload,
  s: SafetyVerdict
): EmotionContractPayload {
  const out = { ...p };

  // Cap intensity
  if (s.recommendedActions?.includes("capIntensity")) {
    out.intensity = Math.min(out.intensity, 0.85);
  }

  // Confidence softening
  if (s.issues.some((i) => i.code === "HIGH_INTENSITY_LOW_CONFIDENCE")) {
    out.confidence = Math.max(0.3, out.confidence * 0.8);
  }

  // Add modifiers
  out.modifiers = out.modifiers || [];
  if (s.issues.some((i) => i.severity === "high")) out.modifiers.push("safety-corrected");
  if (s.issues.some((i) => i.severity === "medium")) out.modifiers.push("safety-monitored");

  return out;
}

/* --------------------------------------------------------------------------
   Main API: getUnifiedEmotion()
-------------------------------------------------------------------------- */

export async function getUnifiedEmotion(
  options?: { forceRecompute?: boolean; allowUnsafe?: boolean }
): Promise<RuntimeEmotion> {
  const allowUnsafe = options?.allowUnsafe ?? false;

  try {
    const emotionStore = getEmotionStore();
    const stabilityEngine = getStabilityEngine();
    const harmonizer = getHarmonizer();
    const safetyValidator = getSafetyValidator();
    const conflictResolver = getConflictResolver();
    const profileModel = getProfileModel();

    const last = emotionStore.lastDetectedEmotion;
    const recent = emotionStore.getRecent(20);

    /* ----------------------------------------------------------------------
       BASELINE if no emotion data
    ---------------------------------------------------------------------- */
    if (!last && recent.length === 0) {
      const payload = normalizeToContract({
        emotion: "neutral",
        intensity: 0.4,
        confidence: 0.3,
        detectedAt: new Date().toISOString(),
      });

      const stability: StabilityReport = {
        stabilityIndex: 0.5,
        correctedEmotion: "neutral",
        correctedIntensity: 0.4,
        volatilityClass: "stable",
        issues: ["no_emotion_data"],
        generatedAt: new Date().toISOString(),
      };

      const harm: HarmonizedEmotion = {
        unifiedEmotion: "neutral",
        unifiedIntensity: 0.4,
        reliability: 0.3,
        contributingSignals: [{ source: "baseline", weight: 1 }],
        generatedAt: new Date().toISOString(),
      };

      const safety = safetyValidator.validateEmotionSafety(payload);
      return { payload, stability, harmonized: harm, safety, emittedAt: new Date().toISOString() };
    }

    /* ----------------------------------------------------------------------
       Gather context
    ---------------------------------------------------------------------- */
    const conflictClusters = conflictResolver.detectConflictClusters({ lookbackDays: 7 });
    const profile = profileModel.getCachedProfile();

    /* ----------------------------------------------------------------------
       Stability Report
    ---------------------------------------------------------------------- */
    const stability = stabilityEngine.evaluateStability({
      emotionResult: last || recent[0],
      recentEmotions: recent,
      profileSnapshot: profile,
    });

    lastStabilityReport = stability;

    /* ----------------------------------------------------------------------
       Harmonization
    ---------------------------------------------------------------------- */
    const contractSignals: EmotionContractPayload[] = recent.slice(0, 10).map((e) =>
      normalizeToContract({
        emotion: e.emotion,
        intensity: e.intensity, // already 1–10 in store, normalized in stability
        confidence: e.confidence,
        detectedAt: e.detectedAt,
      })
    );

    const harmonized = harmonizer.harmonize({
      contractPayloads: contractSignals,
      stabilityReport: stability,
      conflictClusters,
      profileSnapshot: profile,
    });

    /* ----------------------------------------------------------------------
       Build Contract Payload
    ---------------------------------------------------------------------- */
    let payload = buildContractFromHarmonized(harmonized);

    /* ----------------------------------------------------------------------
       Safety Validation
    ---------------------------------------------------------------------- */
    let safety = safetyValidator.validateEmotionSafety(payload, {
      conflicts: conflictClusters,
      profile,
      source: "runtime",
    });

    if (!safety.ok && !allowUnsafe) {
      payload = applySafetyCorrections(payload, safety);

      // revalidate
      safety = safetyValidator.validateEmotionSafety(payload, {
        conflicts: conflictClusters,
        profile,
        source: "runtime-corrected",
      });
    }

    return {
      payload,
      stability,
      harmonized,
      safety,
      emittedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[EmotionRuntimeAdapter] Fatal error:", err);

    // last-resort fallback
    const fallback = normalizeToContract({
      emotion: "neutral",
      intensity: 0.3,
      confidence: 0.2,
      detectedAt: new Date().toISOString(),
      modifiers: ["fallback", "error"],
    });

    const stability: StabilityReport = {
      stabilityIndex: 0.5,
      correctedEmotion: "neutral",
      correctedIntensity: 0.3,
      volatilityClass: "stable",
      issues: ["runtime_error"],
      generatedAt: new Date().toISOString(),
    };

    const harm: HarmonizedEmotion = {
      unifiedEmotion: "neutral",
      unifiedIntensity: 0.3,
      reliability: 0.2,
      contributingSignals: [{ source: "fallback", weight: 1 }],
      generatedAt: new Date().toISOString(),
    };

    const safety: SafetyVerdict = { ok: true, issues: [], generatedAt: new Date().toISOString() };

    return {
      payload: fallback,
      stability,
      harmonized: harm,
      safety,
      emittedAt: new Date().toISOString(),
    };
  }
}

/* --------------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------------- */

export function getStabilityReportSnapshot(): StabilityReport | null {
  return lastStabilityReport ? { ...lastStabilityReport } : null;
}

/* --------------------------------------------------------------------------
   TEST HELPERS
-------------------------------------------------------------------------- */

export const __TEST_ONLY__ = {
  inject: (type: string, module: any) => {
    if (type === "harmonizer") mock.harmonizer = module;
    if (type === "stability") mock.stability = module;
    if (type === "safety") mock.safety = module;
    if (type === "emotionStore") mock.emotionStore = module;
    if (type === "conflict") mock.conflict = module;
    if (type === "profile") mock.profile = module;
  },
  reset: () => {
    mock = { harmonizer: null, stability: null, safety: null, emotionStore: null, conflict: null, profile: null };
    lastStabilityReport = null;
  },
};
