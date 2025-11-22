// src/lib/emotionContract.ts
// Cross-module emotional schema, sanitizer and validator.
// Provides a stable contract used across the emotional pipeline.

import { EmotionState } from "./emotionDetector";

/* ---------------------------- TYPES / CONSTANTS ---------------------------- */

export interface EmotionContractPayload {
  emotion: EmotionState;
  confidence: number; // 0..1
  intensity: number; // 0..1
  themes?: string[]; // de-identified tokens (<=20, each <=80 chars)
  detectedAt: string; // ISO timestamp
  trajectory?: { slope?: number; volatility?: number }; // volatility 0..1
  modifiers?: string[]; // optional tags (<=200 chars each)
  symbolLinks?: { id: string; relevance: number }[]; // relevance 0..1
}

export const EMOTION_CONTRACT_SCHEMA_VERSION = "1.0";

const VALID_EMOTIONS: EmotionState[] = [
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

const MAX_THEMES = 20;
const MAX_THEME_LENGTH = 80;
const MAX_MODIFIER_LENGTH = 200;
const MAX_SYMBOL_LINKS = 50;

/* ---------------------------- UTIL HELPERS ---------------------------- */

function clamp(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Accept a string that is a valid date representation.
 * Be permissive: accept anything Date can parse and return canonical ISO string when needed.
 */
function isParsableDateString(s: any): boolean {
  if (typeof s !== "string") return false;
  const ts = Date.parse(s);
  return !Number.isNaN(ts);
}

function toISOTimestamp(s?: any): string {
  if (s && isParsableDateString(s)) {
    return new Date(s).toISOString();
  }
  return new Date().toISOString();
}

function isValidToken(token: any, maxLen = MAX_MODIFIER_LENGTH): boolean {
  return typeof token === "string" && token.length > 0 && token.length <= maxLen;
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

/* ---------------------------- VALIDATOR ---------------------------- */

/**
 * Validates a raw object against the EmotionContractPayload shape.
 * Returns { ok: boolean, errors?: string[] }.
 */
export function validateEmotionPayload(payload: any): { ok: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["payload_must_be_object"] };
  }

  // emotion
  if (!VALID_EMOTIONS.includes(payload.emotion)) {
    errors.push(`invalid_emotion: ${String(payload.emotion)}`);
  }

  // confidence
  if (typeof payload.confidence !== "number" || payload.confidence < 0 || payload.confidence > 1) {
    errors.push("confidence_must_be_number_between_0_and_1");
  }

  // intensity
  if (typeof payload.intensity !== "number" || payload.intensity < 0 || payload.intensity > 1) {
    errors.push("intensity_must_be_number_between_0_and_1");
  }

  // detectedAt
  if (!payload.detectedAt || !isParsableDateString(payload.detectedAt)) {
    errors.push("detectedAt_must_be_valid_date_string");
  }

  // themes
  if (payload.themes !== undefined) {
    if (!Array.isArray(payload.themes)) {
      errors.push("themes_must_be_array");
    } else {
      if (payload.themes.length > MAX_THEMES) {
        errors.push(`themes_too_large: ${payload.themes.length} (max ${MAX_THEMES})`);
      }
      payload.themes.forEach((t: any, i: number) => {
        if (typeof t !== "string") errors.push(`theme_${i}_must_be_string`);
        else if (t.length > MAX_THEME_LENGTH) errors.push(`theme_${i}_too_long`);
      });
    }
  }

  // trajectory
  if (payload.trajectory !== undefined) {
    if (typeof payload.trajectory !== "object" || payload.trajectory === null) {
      errors.push("trajectory_must_be_object");
    } else {
      if (payload.trajectory.slope !== undefined && typeof payload.trajectory.slope !== "number") {
        errors.push("trajectory.slope_must_be_number");
      }
      if (
        payload.trajectory.volatility !== undefined &&
        (typeof payload.trajectory.volatility !== "number" ||
          payload.trajectory.volatility < 0 ||
          payload.trajectory.volatility > 1)
      ) {
        errors.push("trajectory.volatility_must_be_number_between_0_and_1");
      }
    }
  }

  // modifiers
  if (payload.modifiers !== undefined) {
    if (!Array.isArray(payload.modifiers)) {
      errors.push("modifiers_must_be_array");
    } else {
      payload.modifiers.forEach((m: any, i: number) => {
        if (!isValidToken(m, MAX_MODIFIER_LENGTH)) errors.push(`modifier_${i}_invalid_or_too_long`);
      });
    }
  }

  // symbolLinks
  if (payload.symbolLinks !== undefined) {
    if (!Array.isArray(payload.symbolLinks)) {
      errors.push("symbolLinks_must_be_array");
    } else {
      if (payload.symbolLinks.length > MAX_SYMBOL_LINKS) {
        errors.push(`symbolLinks_too_many: ${payload.symbolLinks.length} (max ${MAX_SYMBOL_LINKS})`);
      }
      payload.symbolLinks.forEach((link: any, i: number) => {
        if (!link || typeof link !== "object") {
          errors.push(`symbolLink_${i}_must_be_object`);
        } else {
          if (!isValidToken(link.id)) errors.push(`symbolLink_${i}_invalid_id`);
          if (typeof link.relevance !== "number" || link.relevance < 0 || link.relevance > 1) {
            errors.push(`symbolLink_${i}_relevance_must_be_0_to_1`);
          }
        }
      });
    }
  }

  return { ok: errors.length === 0, errors: errors.length ? errors : undefined };
}

/* ---------------------------- SANITIZER ---------------------------- */

/**
 * Produce a sanitized EmotionContractPayload from arbitrary input.
 * This is defensive: it never throws and returns a valid payload.
 */
export function sanitizeEmotionPayload(raw: any): EmotionContractPayload {
  const sanitized: Partial<EmotionContractPayload> = {};

  // emotion — fallback to neutral
  sanitized.emotion = VALID_EMOTIONS.includes(raw?.emotion) ? raw!.emotion : "neutral";

  // confidence & intensity (clamped to 0..1)
  sanitized.confidence = clamp(typeof raw?.confidence === "number" ? raw.confidence : 0.5, 0, 1);
  sanitized.intensity = clamp(typeof raw?.intensity === "number" ? raw.intensity : 0.5, 0, 1);

  // detectedAt — produce canonical ISO string
  sanitized.detectedAt = toISOTimestamp(raw?.detectedAt);

  // themes
  if (Array.isArray(raw?.themes)) {
    sanitized.themes = raw.themes
      .filter((t: any) => typeof t === "string")
      .slice(0, MAX_THEMES)
      .map((t: string) => normalizeToken(t).slice(0, MAX_THEME_LENGTH))
      .filter((t: string) => t.length > 0);
  }

  // trajectory
  if (raw?.trajectory && typeof raw.trajectory === "object") {
    const traj: { slope?: number; volatility?: number } = {};
    if (typeof raw.trajectory.slope === "number") traj.slope = raw.trajectory.slope;
    if (typeof raw.trajectory.volatility === "number") traj.volatility = clamp(raw.trajectory.volatility, 0, 1);
    if (Object.keys(traj).length) sanitized.trajectory = traj;
  }

  // modifiers
  if (Array.isArray(raw?.modifiers)) {
    sanitized.modifiers = raw.modifiers
      .filter((m: any) => typeof m === "string")
      .map((m: string) => normalizeToken(m).slice(0, MAX_MODIFIER_LENGTH))
      .filter((m: string) => m.length > 0);
  }

  // symbolLinks
  if (Array.isArray(raw?.symbolLinks)) {
    sanitized.symbolLinks = raw.symbolLinks
      .filter((l: any) => l && typeof l === "object" && typeof l.id === "string" && typeof l.relevance === "number")
      .slice(0, MAX_SYMBOL_LINKS)
      .map((l: any) => ({ id: normalizeToken(l.id), relevance: clamp(l.relevance, 0, 1) }));
  }

  // At this point sanitized has required fields
  const result: EmotionContractPayload = {
    emotion: sanitized.emotion!,
    confidence: sanitized.confidence!,
    intensity: sanitized.intensity!,
    detectedAt: sanitized.detectedAt!,
    themes: sanitized.themes,
    trajectory: sanitized.trajectory,
    modifiers: sanitized.modifiers,
    symbolLinks: sanitized.symbolLinks,
  };

  return result;
}

/* ---------------------------- NORMALIZER (convenience) ---------------------------- */

/**
 * Normalize a partial payload into a complete EmotionContractPayload,
 * filling defaults and clamping values.
 */
export function normalizeToContract(payload: Partial<EmotionContractPayload>): EmotionContractPayload {
  const base: EmotionContractPayload = {
    emotion: "neutral",
    confidence: 0.5,
    intensity: 0.5,
    detectedAt: new Date().toISOString(),
  };

  if (!payload || typeof payload !== "object") return base;

  const merged: Partial<EmotionContractPayload> = {
    emotion: payload.emotion && VALID_EMOTIONS.includes(payload.emotion) ? payload.emotion : base.emotion,
    confidence: clamp(typeof payload.confidence === "number" ? payload.confidence : base.confidence, 0, 1),
    intensity: clamp(typeof payload.intensity === "number" ? payload.intensity : base.intensity, 0, 1),
    detectedAt: payload.detectedAt && isParsableDateString(payload.detectedAt) ? new Date(payload.detectedAt).toISOString() : base.detectedAt,
  };

  // Optional arrays — reuse the sanitizer mapping rules
  const sanitized = sanitizeEmotionPayload({
    ...merged,
    themes: payload.themes,
    trajectory: payload.trajectory,
    modifiers: payload.modifiers,
    symbolLinks: payload.symbolLinks,
  });

  return sanitized;
}

/* ---------------------------- TEST HELPERS ---------------------------- */

export const __TEST_ONLY__ = {
  getSchema(): any {
    return { VALID_EMOTIONS, EMOTION_CONTRACT_SCHEMA_VERSION, limits: { MAX_THEMES, MAX_THEME_LENGTH, MAX_MODIFIER_LENGTH, MAX_SYMBOL_LINKS } };
  },
  reset(): void {
    // pure module — nothing to reset
  },
};
