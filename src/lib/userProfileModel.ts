// src/lib/userProfileModel.ts
// Unified summary of user preferences, emotional patterns, topics, trajectories, and stability metrics
// Production-ready, normalized to 0..1 intensity values

import { EmotionState } from "./emotionDetector";
import { TrajectoryMetrics, getLongTermProfile, computeTrajectoryMetrics } from "./emotionTrajectory";
import { contextStore } from "./contextStore";
import { topicStore } from "./topicStore";
import { getPreferences } from "./preferenceEngine";
import { computeCredibilityFactor } from "./preferenceRecalibrator";

export interface UserProfile {
  userId?: string;
  emotionalBaseline: { dominantEmotion: EmotionState | null; intensityBaseline: number }; // intensity 0..1
  primaryTriggers: string[];
  primaryComforts: string[];
  topTopics: { topic: string; occurrences: number; severity?: number }[];
  topicEmotionFingerprint: Record<string, { dominantEmotion?: EmotionState; intensityAvg?: number }>;
  preferenceSummary: { activity: string; weight: number }[];
  trajectory: {
    last1Day: TrajectoryMetrics;
    last7Days: TrajectoryMetrics;
    last14Days: TrajectoryMetrics;
    last30Days: TrajectoryMetrics;
  };
  stabilityMetrics: {
    preferenceStability: number; // 0..1
    emotionStability: number; // 0..1
  };
  generatedAt: string;
}

export const PROFILE_LOCAL_KEY = "ai-companion-profile-v1";

// Cache
let cachedProfile: UserProfile | null = null;

// Mock injection for testing
let mockStores: {
  emotionStore?: any;
  contextStore?: any;
  topicStore?: any;
  preferenceEngine?: any;
  preferenceRecalibrator?: any;
  emotionTrajectory?: any;
} = {};

function getContextStore() {
  return mockStores.contextStore || contextStore;
}

function getTopicStore() {
  return mockStores.topicStore || topicStore;
}

function getPreferenceEngine() {
  return mockStores.preferenceEngine || { getPreferences };
}

function getPreferenceRecalibrator() {
  return mockStores.preferenceRecalibrator || { computeCredibilityFactor };
}

function getEmotionTrajectory() {
  return mockStores.emotionTrajectory || { getLongTermProfile, computeTrajectoryMetrics };
}

function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, typeof v === "number" ? v : 0));
}

function validateStoredProfile(data: any): data is UserProfile {
  if (!data || typeof data !== "object") return false;

  if (!data.emotionalBaseline || typeof data.emotionalBaseline !== "object") return false;
  if (data.emotionalBaseline.dominantEmotion !== null && typeof data.emotionalBaseline.dominantEmotion !== "string") return false;
  if (typeof data.emotionalBaseline.intensityBaseline !== "number") return false;
  if (data.emotionalBaseline.intensityBaseline < 0 || data.emotionalBaseline.intensityBaseline > 1) return false;

  if (!Array.isArray(data.primaryTriggers) || !data.primaryTriggers.every((x: any) => typeof x === "string")) return false;
  if (!Array.isArray(data.primaryComforts) || !data.primaryComforts.every((x: any) => typeof x === "string")) return false;

  if (!Array.isArray(data.topTopics) || !data.topTopics.every((item: any) =>
    typeof item.topic === "string" && typeof item.occurrences === "number" && (item.severity === undefined || typeof item.severity === "number")
  )) return false;

  if (!data.topicEmotionFingerprint || typeof data.topicEmotionFingerprint !== "object") return false;

  if (!Array.isArray(data.preferenceSummary) || !data.preferenceSummary.every((p: any) => typeof p.activity === "string" && typeof p.weight === "number")) return false;

  if (!data.trajectory || typeof data.trajectory !== "object") return false;
  const keys = ["last1Day", "last7Days", "last14Days", "last30Days"];
  for (const k of keys) {
    if (!data.trajectory[k] || typeof data.trajectory[k] !== "object") return false;
  }

  if (!data.stabilityMetrics || typeof data.stabilityMetrics !== "object") return false;
  if (typeof data.stabilityMetrics.preferenceStability !== "number") return false;
  if (typeof data.stabilityMetrics.emotionStability !== "number") return false;

  if (typeof data.generatedAt !== "string") return false;

  return true;
}

function loadFromCache(): UserProfile | null {
  if (cachedProfile) return JSON.parse(JSON.stringify(cachedProfile));

  try {
    const raw = safeParseJSON<any>(localStorage.getItem(PROFILE_LOCAL_KEY));
    if (raw && validateStoredProfile(raw)) {
      cachedProfile = raw;
      return JSON.parse(JSON.stringify(raw));
    }
    return null;
  } catch (e) {
    console.error("userProfileModel.loadFromCache error:", e);
    return null;
  }
}

function saveToCache(profile: UserProfile): void {
  cachedProfile = profile;
  try {
    localStorage.setItem(PROFILE_LOCAL_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("userProfileModel.saveToCache error:", e);
  }
}

/**
 * buildUserProfile
 * - forceRefresh: bypasses cache
 */
export async function buildUserProfile(options?: { forceRefresh?: boolean }): Promise<UserProfile> {
  if (!options?.forceRefresh) {
    const cached = getCachedProfile();
    if (cached) return cached;
  }

  try {
    const ctx = getContextStore();
    const tStore = getTopicStore();
    const prefEngine = getPreferenceEngine();
    const prefRecal = getPreferenceRecalibrator();
    const trajectoryModule = getEmotionTrajectory();

    // Trajectory baseline (last 14 days)
    const baselineMetrics = (typeof trajectoryModule.computeTrajectoryMetrics === "function")
      ? trajectoryModule.computeTrajectoryMetrics(14)
      : (typeof trajectoryModule.getLongTermProfile === "function" ? trajectoryModule.getLongTermProfile().last14Days : getLongTermProfile().last14Days);

    // Normalize averageIntensity to 0..1 if needed (trajectory may return 0..1 or 1..10)
    const normalizeTrajectoryIntensity = (v: number) => (v > 1 ? Math.max(0, Math.min(1, v / 10)) : Math.max(0, Math.min(1, v)));

    const emotionalBaseline = {
      dominantEmotion: baselineMetrics.dominantEmotion,
      intensityBaseline: normalizeTrajectoryIntensity(baselineMetrics.averageIntensity),
    };

    // Context store
    const personalContext = ctx.getPersonalContext ? ctx.getPersonalContext() : { triggers: [], comforts: [], entities: [], topTopics: [] };
    const primaryTriggers = (personalContext.triggers || []).slice(0, 10);
    const primaryComforts = (personalContext.comforts || []).slice(0, 10);

    // Topics: fallback safe handling
    const allTopicsRaw = (tStore && typeof tStore.getAllTopics === "function") ? tStore.getAllTopics() : [];
    const allTopics = Array.isArray(allTopicsRaw) ? allTopicsRaw : [];

    const topTopics = allTopics.slice(0, 10).map((t: any) => ({
      topic: t.topic || String(t.name || "").toLowerCase(),
      occurrences: typeof t.count === "number" ? t.count : (t.occurrences || 0),
      severity: typeof t.intensityAvg === "number" ? clamp01(t.intensityAvg > 1 ? t.intensityAvg / 10 : t.intensityAvg) : undefined,
    }));

    // topicEmotionFingerprint (best-effort)
    const topicEmotionFingerprint: Record<string, { dominantEmotion?: EmotionState; intensityAvg?: number }> = {};
    for (const t of allTopics.slice(0, 15)) {
      const topicKey = t.topic || String(t.name || "").toLowerCase();
      const emotionCounts = t.emotionCounts || t.emotions || {};
      const entries = Object.entries(emotionCounts || {});
      if (entries.length === 0) continue;
      entries.sort(([, a]: any, [, b]: any) => b - a);
      const dominant = entries[0][0] as EmotionState;
      const intensityAvgRaw = typeof t.intensityAvg === "number" ? t.intensityAvg : (t.avgIntensity || 0);
      const intensityAvg = clamp01(intensityAvgRaw > 1 ? intensityAvgRaw / 10 : intensityAvgRaw);
      topicEmotionFingerprint[topicKey] = { dominantEmotion: dominant, intensityAvg };
    }

    // Preferences summary (best-effort)
    const prefs = prefEngine && typeof prefEngine.getPreferences === "function" ? prefEngine.getPreferences() : { preferredActivities: {} };
    const preferenceSummary = Object.entries(prefs.preferredActivities || {})
      .map(([activity, weight]: any) => ({ activity, weight: typeof weight === "number" ? weight : 0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

    // Trajectory snapshots (normalize values)
    const longProfile = (typeof trajectoryModule.getLongTermProfile === "function") ? trajectoryModule.getLongTermProfile() : getLongTermProfile();
    const normalizeTrajectory = (m: TrajectoryMetrics) => ({
      ...m,
      averageIntensity: normalizeTrajectoryIntensity(m.averageIntensity),
      volatilityIndex: clamp01(m.volatilityIndex > 1 ? m.volatilityIndex / 100 : m.volatilityIndex),
      recoveryRate: clamp01(m.recoveryRate > 1 ? m.recoveryRate / 100 : m.recoveryRate),
    });

    const trajectory = {
      last1Day: normalizeTrajectory(longProfile.last1Day),
      last7Days: normalizeTrajectory(longProfile.last7Days),
      last14Days: normalizeTrajectory(longProfile.last14Days),
      last30Days: normalizeTrajectory(longProfile.last30Days),
    };

    // Stability metrics
    const preferenceStability = (typeof prefRecal.computeCredibilityFactor === "function") ? clamp01(prefRecal.computeCredibilityFactor()) : 0.5;
    const emotionStability = clamp01(1 - (trajectory.last30Days.volatilityIndex || 0)); // 0..1

    const profile: UserProfile = {
      emotionalBaseline,
      primaryTriggers,
      primaryComforts,
      topTopics,
      topicEmotionFingerprint,
      preferenceSummary,
      trajectory,
      stabilityMetrics: {
        preferenceStability: Math.round(preferenceStability * 100) / 100,
        emotionStability: Math.round(emotionStability * 100) / 100,
      },
      generatedAt: new Date().toISOString(),
    };

    saveToCache(profile);
    return profile;
  } catch (err) {
    console.error("userProfileModel.buildUserProfile error:", err);

    const fallbackTrajectory = getLongTermProfile();
    const fallback: UserProfile = {
      emotionalBaseline: { dominantEmotion: null, intensityBaseline: 0.5 },
      primaryTriggers: [],
      primaryComforts: [],
      topTopics: [],
      topicEmotionFingerprint: {},
      preferenceSummary: [],
      trajectory: {
        last1Day: fallbackTrajectory.last1Day,
        last7Days: fallbackTrajectory.last7Days,
        last14Days: fallbackTrajectory.last14Days,
        last30Days: fallbackTrajectory.last30Days,
      },
      stabilityMetrics: {
        preferenceStability: 0.5,
        emotionStability: 0.5,
      },
      generatedAt: new Date().toISOString(),
    };

    return fallback;
  }
}

export function getCachedProfile(): UserProfile | null {
  return loadFromCache();
}

export function invalidateCache(): void {
  cachedProfile = null;
  try {
    localStorage.removeItem(PROFILE_LOCAL_KEY);
  } catch (e) {
    console.error("userProfileModel.invalidateCache error:", e);
  }
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectStores(mocks: { emotionStore?: any; contextStore?: any; topicStore?: any; preferenceEngine?: any; preferenceRecalibrator?: any; emotionTrajectory?: any }): void {
    mockStores = { ...mockStores, ...mocks };
  },
  reset(): void {
    mockStores = {};
    cachedProfile = null;
  },
  getCacheState() {
    return { cachedProfile };
  },
};
