// src/lib/emotionConflictResolver.ts
// Detect emotional conflict clusters from recent emotion data and shared topics
// Revised to use 0..1 intensity and safer clustering heuristics

import { EmotionState, EmotionResult } from './emotionDetector';
import { useEmotionStore } from '../store/emotionStore';
import { contextStore } from './contextStore';

export interface ConflictCluster {
  id: string;
  emotions: EmotionState[];
  conflictValue: number; // 0..1
  supportingTopics: string[];
  firstSeen: string;
  lastSeen: string;
  recommendedResolutionApproach?: 'symbolic-processing' | 'narrative-rewrite' | 'exposure' | 'soothing';
}

/* ---------------------- Test injection / mocks ---------------------- */
let mockEmotionStore: any = null;
let mockContextStore: any = null;

function getEmotionStore() {
  return mockEmotionStore || useEmotionStore();
}
function getContextStore() {
  return mockContextStore || contextStore;
}

/* ---------------------- Utilities ---------------------- */
function generateClusterId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** keep items within lookbackDays */
function filterByDays(data: EmotionResult[], lookbackDays: number): EmotionResult[] {
  if (!lookbackDays || lookbackDays <= 0) return data;
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  return data.filter(item => {
    try {
      return new Date(item.detectedAt).getTime() >= cutoff;
    } catch {
      return false;
    }
  });
}

/** collect topics that appear in multiple emotion events (normalized) */
function findSharedTopics(emotionResults: EmotionResult[], ctxTopics: string[] = []): string[] {
  const all = emotionResults.flatMap(r => (r.themes || []).map(t => String(t).toLowerCase().trim()))
    .concat((ctxTopics || []).map(t => String(t).toLowerCase().trim()));

  const counts: Record<string, number> = {};
  for (const t of all) {
    if (!t) continue;
    counts[t] = (counts[t] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, c]) => c >= 2) // must appear at least twice across events/context
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, 10);
}

/** intensity opposition normalized for 0..1 intensity values */
function calculateIntensityOpposition(emotionResults: EmotionResult[]): number {
  if (emotionResults.length < 2) return 0;
  const intensities = emotionResults.map(r => {
    // Expect 0..1; if a stored value is 1..10, attempt safe fallback mapping
    const v = typeof r.intensity === 'number' ? r.intensity : 0.5;
    return v > 1 ? Math.min(1, v / 10) : Math.max(0, Math.min(1, v));
  });

  const mean = intensities.reduce((s, x) => s + x, 0) / intensities.length;
  const variance = intensities.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / intensities.length;

  // Max variance in [0,1] for bimodal [0,1] is 0.25 — normalize to 0..1
  return Math.min(1, variance / 0.25);
}

/** emotional distance using a proximity matrix (0 = same/close, 1 = far/opposite)
 * We convert to a 0..1 disagreement metric by averaging pairwise distances.
 */
function calculateEmotionalDistance(emotions: EmotionState[]): number {
  if (emotions.length < 2) return 0;

  const proximity: Record<EmotionState, Record<EmotionState, number>> = {
    sad: { sad: 0, angry: 0.7, anxious: 0.4, stressed: 0.3, lonely: 0.2, excited: 1.0, neutral: 0.3, confused: 0.4, overwhelmed: 0.4 },
    angry: { sad: 0.7, angry: 0, anxious: 0.6, stressed: 0.5, lonely: 0.6, excited: 0.9, neutral: 0.5, confused: 0.6, overwhelmed: 0.6 },
    anxious: { sad: 0.4, angry: 0.6, anxious: 0, stressed: 0.3, lonely: 0.5, excited: 0.9, neutral: 0.4, confused: 0.3, overwhelmed: 0.3 },
    stressed: { sad: 0.3, angry: 0.5, anxious: 0.3, stressed: 0, lonely: 0.4, excited: 0.8, neutral: 0.35, confused: 0.4, overwhelmed: 0.25 },
    lonely: { sad: 0.2, angry: 0.6, anxious: 0.5, stressed: 0.4, lonely: 0, excited: 0.9, neutral: 0.35, confused: 0.45, overwhelmed: 0.4 },
    excited: { sad: 1.0, angry: 0.9, anxious: 0.9, stressed: 0.8, lonely: 0.9, excited: 0, neutral: 0.6, confused: 0.7, overwhelmed: 0.8 },
    neutral: { sad: 0.3, angry: 0.5, anxious: 0.4, stressed: 0.35, lonely: 0.35, excited: 0.6, neutral: 0, confused: 0.3, overwhelmed: 0.35 },
    confused: { sad: 0.4, angry: 0.6, anxious: 0.3, stressed: 0.4, lonely: 0.45, excited: 0.7, neutral: 0.3, confused: 0, overwhelmed: 0.35 },
    overwhelmed: { sad: 0.4, angry: 0.6, anxious: 0.3, stressed: 0.25, lonely: 0.4, excited: 0.8, neutral: 0.35, confused: 0.35, overwhelmed: 0 }
  };

  let total = 0;
  let pairs = 0;
  for (let i = 0; i < emotions.length; i++) {
    for (let j = i + 1; j < emotions.length; j++) {
      const a = emotions[i];
      const b = emotions[j];
      if (!proximity[a] || typeof proximity[a][b] !== 'number') continue;
      total += proximity[a][b];
      pairs++;
    }
  }
  return pairs > 0 ? Math.min(1, total / pairs) : 0;
}

/** recurrence: simplified - fraction of repeated emotion occurrences across window */
function calculateUnresolvedRecurrence(emotionResults: EmotionResult[]): number {
  if (emotionResults.length < 3) return 0;
  // Count how many times the same emotion appears >1 times
  const counts: Record<string, number> = {};
  for (const r of emotionResults) counts[r.emotion] = (counts[r.emotion] || 0) + 1;
  const repeated = Object.values(counts).filter(c => c > 1).reduce((s, c) => s + (c - 1), 0);
  // Normalize by number of events
  return Math.min(1, repeated / Math.max(1, emotionResults.length));
}

/** determine resolution approach based on signal */
function determineResolutionApproach(conflictValue: number, recurrence: number, emotions: EmotionState[]): 'symbolic-processing' | 'narrative-rewrite' | 'exposure' | 'soothing' {
  if (conflictValue >= 0.75 && recurrence >= 0.5) return 'symbolic-processing';
  if (emotions.includes('anxious') || emotions.includes('overwhelmed')) return 'soothing';
  if (emotions.includes('angry') && emotions.includes('sad')) return 'narrative-rewrite';
  if (conflictValue >= 0.45) return 'exposure';
  return 'symbolic-processing';
}

/* ---------------------- Main cluster detection ---------------------- */
/**
 * Options:
 *  - lookbackDays: how far back to search
 *  - minCooccurrences: min events in a time window
 *  - windowHours: time window for grouping co-occurrence (default 3 hours)
 */
export function detectConflictClusters(options?: { lookbackDays?: number; minCooccurrences?: number; windowHours?: number }): ConflictCluster[] {
  const lookbackDays = options?.lookbackDays ?? 14;
  const minCooccurrences = options?.minCooccurrences ?? 2;
  const windowHours = options?.windowHours ?? 3;

  try {
    const emotionStore = getEmotionStore();
    let recent = emotionStore.getRecent ? emotionStore.getRecent(200) : []; // getRecent should return recent list
    recent = filterByDays(recent, lookbackDays);
    if (recent.length < minCooccurrences) return [];

    const ctx = getContextStore();
    const userCtx = ctx.getPersonalContext ? ctx.getPersonalContext() : { triggers: [], comforts: [], entities: [], topTopics: [] };
    const ctxTopics = [...(userCtx.triggers || []), ...(userCtx.comforts || []), ...(userCtx.entities || [])].map(t => String(t).toLowerCase().trim());

    // Build time windows keyed by floor(hour / windowHours) so each window spans windowHours
    const windows: Map<string, EmotionResult[]> = new Map();
    for (const ev of recent) {
      try {
        const t = new Date(ev.detectedAt).getTime();
        const hour = Math.floor(t / (1000 * 60 * 60));
        const windowKey = `${Math.floor(hour / windowHours)}-${new Date(t).getUTCFullYear()}-${new Date(t).getUTCMonth()}-${new Date(t).getUTCDate()}`;
        if (!windows.has(windowKey)) windows.set(windowKey, []);
        windows.get(windowKey)!.push(ev);
      } catch {
        // skip bad date
      }
    }

    const clusters: ConflictCluster[] = [];

    for (const [key, windowResults] of windows.entries()) {
      if (windowResults.length < minCooccurrences) continue;

      const uniqueEmotions = Array.from(new Set(windowResults.map(r => r.emotion)));
      if (uniqueEmotions.length < 2) continue;

      const sharedTopics = findSharedTopics(windowResults, ctxTopics);
      // allow clusters even without shared topics if conflict is strong, but prefer topics
      const intensityOpposition = calculateIntensityOpposition(windowResults);
      const emotionalDistance = calculateEmotionalDistance(uniqueEmotions);
      const recurrence = calculateUnresolvedRecurrence(windowResults);

      // Combine with conservative weights
      // All inputs already normalized 0..1
      const conflictValue = Math.min(1, (intensityOpposition * 0.35) + (emotionalDistance * 0.45) + (recurrence * 0.2));

      // Apply thresholds: require minimum conflictValue OR sharedTopics presence
      if (conflictValue < 0.35 && sharedTopics.length === 0) continue;

      const timestamps = windowResults.map(r => r.detectedAt).sort();
      const cluster: ConflictCluster = {
        id: generateClusterId(),
        emotions: uniqueEmotions,
        conflictValue: Math.round(conflictValue * 100) / 100,
        supportingTopics: sharedTopics,
        firstSeen: timestamps[0],
        lastSeen: timestamps[timestamps.length - 1],
        recommendedResolutionApproach: determineResolutionApproach(conflictValue, recurrence, uniqueEmotions)
      };

      clusters.push(cluster);
    }

    // Sort highest conflict first
    return clusters.sort((a, b) => b.conflictValue - a.conflictValue);
  } catch (err) {
    console.error('emotionConflictResolver.detectConflictClusters error:', err);
    return [];
  }
}

/* ---------------------- Scoring & Summaries ---------------------- */
export function scoreConflictCluster(cluster: ConflictCluster): number {
  let score = cluster.conflictValue * 0.6;

  // time span factor: longer unresolved spans increase score (normalized over 14 days)
  try {
    const first = new Date(cluster.firstSeen).getTime();
    const last = new Date(cluster.lastSeen).getTime();
    const days = Math.max(0, (last - first) / (1000 * 60 * 60 * 24));
    const timeFactor = Math.min(1, days / 14);
    score += timeFactor * 0.2;
  } catch {
    // ignore
  }

  // topic richness
  const topicFactor = Math.min(1, (cluster.supportingTopics?.length || 0) / 5);
  score += topicFactor * 0.15;

  // emotion diversity
  const diversityFactor = Math.min(1, (cluster.emotions.length - 1) / 4);
  score += diversityFactor * 0.05;

  return Math.max(0, Math.min(1, score));
}

export function summarizeConflict(cluster: ConflictCluster): string {
  const emotions = cluster.emotions.join(', ');
  const topics = (cluster.supportingTopics || []).slice(0, 3).join(', ') || 'unspecified topics';
  if (cluster.conflictValue >= 0.75) return `Strong conflict between ${emotions} focused on ${topics}.`;
  if (cluster.conflictValue >= 0.5) return `Moderate tension between ${emotions} around ${topics}.`;
  return `Mixed signals (${emotions}) emerging around ${topics}.`;
}

/* ---------------------- Test utilities ---------------------- */
export const __TEST_ONLY__ = {
  injectEmotionStore(es: any) { mockEmotionStore = es; },
  injectContextStore(cs: any) { mockContextStore = cs; },
  reset() { mockEmotionStore = null; mockContextStore = null; }
};
