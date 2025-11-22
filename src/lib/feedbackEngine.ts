// Central feedback processing logic

import { EmotionState } from './emotionDetector';
import { recordFeedback as recordPreferenceFeedback, getPreferences, resetPreferences } from './preferenceEngine';
import { useEmotionStore } from '../store/emotionStore';

export interface FeedbackRecord {
  id: string;
  messageId?: string;
  responseType: string;
  emotion: EmotionState;
  helpful: boolean;
  optionalNote?: string;
  detectedAt: string;
  source?: 'ui' | 'system' | 'import';
}

export interface FeedbackSummary {
  latestEmotion: EmotionState;
  dominantPreferences: { activity: string; score: number }[];
  lastHelpfulAction?: { responseType: string; when: string };
  stabilityScore: number;
}

// In-memory storage
const feedbackStore: FeedbackRecord[] = [];
const MAX_STORE_SIZE = 500;

// Mock injection for testing
let mockPreferenceEngine: any = null;

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function extractHintsFromNote(optionalNote?: string): string[] {
  if (!optionalNote) return [];
  
  // Extract simple keywords (nouns and adjectives) for context hints
  const words = optionalNote.toLowerCase().split(/\s+/);
  const hints: string[] = [];
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those']);
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length > 3 && !commonWords.has(cleanWord) && hints.length < 5) {
      hints.push(cleanWord);
    }
  }
  
  return hints;
}

function getPreferenceEngine() {
  return mockPreferenceEngine || {
    recordFeedback: recordPreferenceFeedback,
    getPreferences,
    resetPreferences
  };
}

export async function recordFeedback(record: Omit<FeedbackRecord, 'id' | 'detectedAt'>): Promise<FeedbackSummary> {
  // Get last detected emotion from store with fallback
  const store = useEmotionStore();
  const lastEmotion = store.lastDetectedEmotion?.emotion || 'neutral';
  
  // Construct complete feedback record
  const fullRecord: FeedbackRecord = {
    ...record,
    id: generateId(),
    detectedAt: new Date().toISOString(),
    emotion: record.emotion || lastEmotion
  };
  
  // Add to in-memory store (prepend)
  feedbackStore.unshift(fullRecord);
  
  // Enforce size limit
  if (feedbackStore.length > MAX_STORE_SIZE) {
    feedbackStore.splice(MAX_STORE_SIZE);
  }
  
  // Extract hints from optional note
  const hints = extractHintsFromNote(record.optionalNote);
  
  // Call preference engine
  const preferenceEngine = getPreferenceEngine();
  preferenceEngine.recordFeedback({
    messageId: record.messageId,
    responseType: record.responseType,
    emotion: fullRecord.emotion,
    helpful: record.helpful,
    optionalNote: hints.join(', ') // Pass only extracted hints, not raw text
  });
  
  // Generate summary
  const summary = await generateFeedbackSummary();
  return summary;
}

export function computeStabilityScore(windowDays: number = 30): number {
  if (feedbackStore.length < 3) {
    return 0.5; // Default score for insufficient data
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  
  // Filter feedback within time window
  const recentFeedback = feedbackStore.filter(record => {
    try {
      const recordDate = new Date(record.detectedAt);
      return recordDate >= cutoffDate;
    } catch {
      return false;
    }
  });
  
  if (recentFeedback.length < 3) {
    return 0.5;
  }
  
  // Calculate consistency based on helpful/unhelpful ratio stability
  const helpfulCount = recentFeedback.filter(f => f.helpful).length;
  const totalCount = recentFeedback.length;
  const helpfulRatio = helpfulCount / totalCount;
  
  // Calculate variance in helpfulness over time (simple moving average)
  const batches: boolean[][] = [];
  const batchSize = Math.max(3, Math.floor(recentFeedback.length / 3));
  
  for (let i = 0; i < recentFeedback.length; i += batchSize) {
    batches.push(recentFeedback.slice(i, i + batchSize).map(f => f.helpful));
  }
  
  if (batches.length < 2) {
    return helpfulRatio; // Use ratio as stability score if not enough batches
  }
  
  const batchRatios = batches.map(batch => {
    const helpfulInBatch = batch.filter(Boolean).length;
    return helpfulInBatch / batch.length;
  });
  
  // Calculate coefficient of variation (lower = more stable)
  const mean = batchRatios.reduce((sum, ratio) => sum + ratio, 0) / batchRatios.length;
  const variance = batchRatios.reduce((sum, ratio) => sum + Math.pow(ratio - mean, 2), 0) / batchRatios.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
  
  // Convert to stability score (0-1, where 1 is most stable)
  const stabilityScore = Math.max(0, 1 - coefficientOfVariation);
  
  return Math.round(stabilityScore * 100) / 100;
}

export function getRecentFeedback(n: number = 50): FeedbackRecord[] {
  return feedbackStore.slice(0, n);
}

export function resetFeedbackStore(full: boolean = false): void {
  // Clear in-memory store
  feedbackStore.length = 0;
  
  if (full) {
    // Reset preference engine completely
    const preferenceEngine = getPreferenceEngine();
    preferenceEngine.resetPreferences(true);
  }
}

async function generateFeedbackSummary(): Promise<FeedbackSummary> {
  const preferenceEngine = getPreferenceEngine();
  const preferences = preferenceEngine.getPreferences();
  
  // Get dominant preferences
  const dominantPreferences = Object.entries(preferences.preferredActivities)
    .map(([activity, score]) => ({ activity, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  // Find last helpful action
  const lastHelpful = feedbackStore.find(record => record.helpful);
  const lastHelpfulAction = lastHelpful ? {
    responseType: lastHelpful.responseType,
    when: lastHelpful.detectedAt
  } : undefined;
  
  // Get latest emotion from recent feedback or fallback
  const latestEmotion = feedbackStore.length > 0 
    ? feedbackStore[0].emotion 
    : 'neutral';
  
  // Compute stability score
  const stabilityScore = computeStabilityScore();
  
  return {
    latestEmotion,
    dominantPreferences,
    lastHelpfulAction,
    stabilityScore
  };
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectPreferenceEngine(pe: any): void {
    mockPreferenceEngine = pe;
  },
  
  reset(): void {
    mockPreferenceEngine = null;
    feedbackStore.length = 0;
  },
  
  getInternalStore(): FeedbackRecord[] {
    return [...feedbackStore];
  }
};