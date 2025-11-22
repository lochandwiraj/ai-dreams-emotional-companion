// src/lib/emotionalSafetyValidator.ts
// Unified emotional & dream safety validator for AI Dreams

import { EmotionContractPayload } from "./emotionContract";

export interface SafetyVerdict {
  ok: boolean;
  issues: { code: string; message: string; severity: "low" | "medium" | "high" }[];
  recommendedActions?: string[];
  generatedAt: string;
}

/* --------------------------------------------------------------------------
   SAFETY POLICY
-------------------------------------------------------------------------- */

const DEFAULT_POLICY = {
  emotion: {
    maxIntensity: 0.85,              // unified scale (0–1)
    highIntensityThreshold: 0.7,
    lowConfidenceThreshold: 0.3,
    contradictoryThreshold: 0.6
  },
  dream: {
    maxSymbols: 12,
    maxIntensity: 0.8,
    highRelevanceThreshold: 0.8,
    extremeConflictThreshold: 0.8
  }
};

// Safe to override via __TEST_ONLY__
let currentPolicy = structuredClone(DEFAULT_POLICY);

/* --------------------------------------------------------------------------
   SHARED UTILITIES
-------------------------------------------------------------------------- */

function verdict(ok: boolean, issues: SafetyVerdict["issues"], actions?: string[]): SafetyVerdict {
  const uniq = actions ? [...new Set(actions)] : undefined;
  return {
    ok,
    issues,
    recommendedActions: uniq,
    generatedAt: new Date().toISOString(),
  };
}

function normalizeIntensity(v: number): number {
  // accept both 1–10 and 0–1 -> convert to 0–1
  if (v <= 1) return Math.max(0, Math.min(1, v));
  return Math.max(0, Math.min(1, v / 10));
}

/* --------------------------------------------------------------------------
   EMOTION SAFETY VALIDATION
-------------------------------------------------------------------------- */

export function validateEmotionSafety(
  payload: EmotionContractPayload,
  context?: { conflicts?: any[]; profile?: any }
): SafetyVerdict {
  const issues: SafetyVerdict["issues"] = [];
  const actions: string[] = [];

  const intensity = normalizeIntensity(payload.intensity);

  /* ------------------------------ INTENSITY ------------------------------ */
  if (intensity > currentPolicy.emotion.maxIntensity) {
    issues.push({
      code: "INTENSITY_EXCEEDS_LIMIT",
      message: `Intensity ${intensity} > allowed ${currentPolicy.emotion.maxIntensity}`,
      severity: "high",
    });
    actions.push("capIntensity", "grounding");
  }

  /* ---------------------- HIGH INTENSITY + LOW CONFIDENCE ---------------------- */
  if (intensity > currentPolicy.emotion.highIntensityThreshold &&
      payload.confidence < currentPolicy.emotion.lowConfidenceThreshold) {
    issues.push({
      code: "HIGH_INTENSITY_LOW_CONFIDENCE",
      message: `High intensity with low confidence`,
      severity: "medium",
    });
    actions.push("verifyReading", "reduceWeight");
  }

  /* ------------------------------ TRIGGER TOPICS ------------------------------ */
  if (context?.profile?.triggerList && Array.isArray(payload.themes)) {
    for (const theme of payload.themes) {
      if (context.profile.triggerList.some((t: string) => theme.includes(t.toLowerCase()))) {
        issues.push({
          code: "TRIGGER_TOPIC",
          message: `Potential trigger detected: ${theme}`,
          severity: "medium",
        });
        actions.push("monitorReactions", "provideSupport");
      }
    }
  }

  /* ------------------------------ CONFLICT CLUSTERS ------------------------------ */
  if (context?.conflicts) {
    const conflicting = context.conflicts.some(
      (c: any) =>
        c.conflictValue > currentPolicy.emotion.contradictoryThreshold &&
        c.emotions?.includes(payload.emotion)
    );

    if (conflicting) {
      issues.push({
        code: "CONTRADICTORY_EMOTIONAL_PATTERN",
        message: `Emotion '${payload.emotion}' detected in high-conflict pattern`,
        severity: "medium",
      });
      actions.push("exploreContext", "gentleProcessing");
    }
  }

  /* ------------------------------- EMOTION SEVERITY ------------------------------- */
  const highSeverity = ["angry", "anxious", "overwhelmed", "stressed"];
  if (highSeverity.includes(payload.emotion) && intensity > 0.65) {
    issues.push({
      code: "HIGH_SEVERITY_EMOTION",
      message: `High-intensity ${payload.emotion}`,
      severity: "medium",
    });
    actions.push("emotionalSupport");
  }

  /* ------------------------------- VOLATILITY ------------------------------- */
  if (payload.trajectory?.volatility && payload.trajectory.volatility > 0.7) {
    issues.push({
      code: "HIGH_EMOTIONAL_VOLATILITY",
      message: `Volatility = ${payload.trajectory.volatility}`,
      severity: "medium",
    });
    actions.push("stabilization");
  }

  /* --------------------------- FINAL DECISION --------------------------- */
  const hasHigh = issues.some((i) => i.severity === "high");
  return verdict(!hasHigh, issues, actions);
}

/* --------------------------------------------------------------------------
   DREAM SAFETY VALIDATION
-------------------------------------------------------------------------- */

export function validateDreamSafety(
  dreamPayload: any,
  policyOverride?: { maxIntensity?: number; maxSymbols?: number }
): SafetyVerdict {
  const issues: SafetyVerdict["issues"] = [];
  const actions: string[] = [];

  const maxSymbols = policyOverride?.maxSymbols ?? currentPolicy.dream.maxSymbols;
  const maxIntensity = policyOverride?.maxIntensity ?? currentPolicy.dream.maxIntensity;

  if (!dreamPayload || typeof dreamPayload !== "object") {
    return verdict(
      false,
      [
        {
          code: "INVALID_DREAM_PAYLOAD",
          message: "Dream payload must be an object",
          severity: "high",
        },
      ],
      ["rejectPayload"]
    );
  }

  /* ------------------------------ SYMBOL COUNT ------------------------------ */
  if (Array.isArray(dreamPayload.symbols) && dreamPayload.symbols.length > maxSymbols) {
    issues.push({
      code: "EXCESSIVE_SYMBOLS",
      message: `Symbol count ${dreamPayload.symbols.length} > ${maxSymbols}`,
      severity: "medium",
    });
    actions.push("reduceSymbols");
  }

  /* ------------------------------ INTENSITY ------------------------------ */
  if (dreamPayload.emotionalTone || dreamPayload.emotionalArc) {
    const intensityRaw = dreamPayload.emotionalArc?.intensityBaseline;
    const intensity = intensityRaw ? normalizeIntensity(intensityRaw) : 0.5;

    if (intensity > maxIntensity) {
      issues.push({
        code: "DREAM_INTENSITY_EXCEEDS_LIMIT",
        message: `Dream intensity ${intensity} > ${maxIntensity}`,
        severity: "high",
      });
      actions.push("deferDream");
    }
  }

  /* ------------------------------ CONFLICT CLUSTERS ------------------------------ */
  if (Array.isArray(dreamPayload.conflicts)) {
    const extremes = dreamPayload.conflicts.filter(
      (c: any) => c.conflictValue > currentPolicy.dream.extremeConflictThreshold
    );

    if (extremes.length > 0) {
      issues.push({
        code: "EXTREME_CONFLICT_CLUSTERS",
        message: `${extremes.length} extreme conflicts detected`,
        severity: "high",
      });
      actions.push("deferDream");
    }
  }

  const hasHigh = issues.some((i) => i.severity === "high");
  return verdict(!hasHigh, issues, actions);
}

/* --------------------------------------------------------------------------
   TEST HOOKS
-------------------------------------------------------------------------- */

export const __TEST_ONLY__ = {
  setPolicy(p: any) {
    if (p && typeof p === "object") {
      currentPolicy = { ...DEFAULT_POLICY, ...p };
    }
  },
  reset() {
    currentPolicy = structuredClone(DEFAULT_POLICY);
  },
  getPolicy() {
    return structuredClone(currentPolicy);
  },
};
