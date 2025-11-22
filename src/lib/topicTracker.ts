// Track topic-level metadata from user context and emotional analysis

import { EmotionState } from './emotionDetector';
import { ExtractedContext } from './contextExtractor';

export interface TopicStats {
  topic: string;
  count: number;
  lastSeen: string;
  emotionCounts: Record<EmotionState, number>;
  intensityAvg: number;
  severityScore: number;
  recurrenceScore: number;
}

// Internal topic storage
interface InternalTopicData {
  count: number;
  lastSeen: string;
  emotionCounts: Record<EmotionState, number>;
  intensitySum: number;
  intensityCount: number;
}

// In-memory topic store
let topicStore: Record<string, InternalTopicData> = {};

// Mock injection for testing
let mockTopicStore: Record<string, InternalTopicData> | null = null;

function getTopicStore(): Record<string, InternalTopicData> {
  return mockTopicStore || topicStore;
}

function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, '-'); // Replace spaces with hyphens for consistency
}

function getAllTopicsFromContext(ctx: ExtractedContext): string[] {
  const topics: string[] = [];
  
  // Extract and normalize all topics from context
  if (Array.isArray(ctx.activities)) {
    topics.push(...ctx.activities);
  }
  if (Array.isArray(ctx.places)) {
    topics.push(...ctx.places);
  }
  if (Array.isArray(ctx.triggers)) {
    topics.push(...ctx.triggers);
  }
  if (Array.isArray(ctx.comforts)) {
    topics.push(...ctx.comforts);
  }
  if (Array.isArray(ctx.people)) {
    topics.push(...ctx.people);
  }
  
  // Normalize and deduplicate
  return [...new Set(topics.map(normalizeTopic))].filter(topic => topic.length > 0);
}

function initializeEmotionCounts(): Record<EmotionState, number> {
  return {
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
}

function computeSeverityScore(intensityAvg: number, count: number): number {
  // severityScore = weighted combination of intensity and frequency
  // intensity contributes 70%, frequency contributes 30%
  const intensityComponent = (intensityAvg / 10) * 0.7; // intensity is 1-10, normalize to 0-1
  const frequencyComponent = Math.min(count / 10, 1) * 0.3; // cap frequency at 10 occurrences
  
  return Math.min(1, intensityComponent + frequencyComponent);
}

function computeRecurrenceScore(count: number, lastSeen: string): number {
  const now = Date.now();
  let lastSeenTime: number;
  
  try {
    lastSeenTime = new Date(lastSeen).getTime();
  } catch {
    lastSeenTime = now;
  }
  
  const daysSinceLastSeen = (now - lastSeenTime) / (1000 * 60 * 60 * 24);
  
  // recurrenceScore = frequency component - recency penalty
  const frequencyComponent = Math.min(count / 5, 1); // cap frequency at 5 for scoring
  const recencyPenalty = Math.min(daysSinceLastSeen / 30, 0.5); // max 50% penalty after 30 days
  
  return Math.max(0, frequencyComponent - recencyPenalty);
}

export function updateTopicFromContext(ctx: ExtractedContext, emotion?: EmotionState, intensity?: number): void {
  const topics = getAllTopicsFromContext(ctx);
  const store = getTopicStore();
  const now = new Date().toISOString();
  const defaultEmotion: EmotionState = 'neutral';
  const defaultIntensity = 5;
  
  const currentEmotion = emotion || defaultEmotion;
  const currentIntensity = intensity !== undefined ? intensity : defaultIntensity;
  
  for (const topic of topics) {
    if (!store[topic]) {
      store[topic] = {
        count: 0,
        lastSeen: now,
        emotionCounts: initializeEmotionCounts(),
        intensitySum: 0,
        intensityCount: 0
      };
    }
    
    // Update topic statistics
    store[topic].count += 1;
    store[topic].lastSeen = now;
    store[topic].emotionCounts[currentEmotion] += 1;
    store[topic].intensitySum += currentIntensity;
    store[topic].intensityCount += 1;
  }
}

export function getTopTopics(limit: number = 10): TopicStats[] {
  const store = getTopicStore();
  const allTopics: TopicStats[] = [];
  
  for (const [topic, data] of Object.entries(store)) {
    const intensityAvg = data.intensityCount > 0 ? data.intensitySum / data.intensityCount : 0;
    const severityScore = computeSeverityScore(intensityAvg, data.count);
    const recurrenceScore = computeRecurrenceScore(data.count, data.lastSeen);
    
    allTopics.push({
      topic,
      count: data.count,
      lastSeen: data.lastSeen,
      emotionCounts: { ...data.emotionCounts },
      intensityAvg: Math.round(intensityAvg * 10) / 10, // Round to 1 decimal
      severityScore: Math.round(severityScore * 100) / 100, // Round to 2 decimals
      recurrenceScore: Math.round(recurrenceScore * 100) / 100 // Round to 2 decimals
    });
  }
  
  // Sort by count descending, then by recency
  allTopics.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
  
  return allTopics.slice(0, limit);
}

export function getTopicsForEmotion(emotion: EmotionState, limit: number = 10): TopicStats[] {
  const store = getTopicStore();
  const emotionTopics: TopicStats[] = [];
  
  for (const [topic, data] of Object.entries(store)) {
    if (data.emotionCounts[emotion] > 0) {
      const intensityAvg = data.intensityCount > 0 ? data.intensitySum / data.intensityCount : 0;
      const severityScore = computeSeverityScore(intensityAvg, data.count);
      const recurrenceScore = computeRecurrenceScore(data.count, data.lastSeen);
      
      emotionTopics.push({
        topic,
        count: data.count,
        lastSeen: data.lastSeen,
        emotionCounts: { ...data.emotionCounts },
        intensityAvg: Math.round(intensityAvg * 10) / 10,
        severityScore: Math.round(severityScore * 100) / 100,
        recurrenceScore: Math.round(recurrenceScore * 100) / 100
      });
    }
  }
  
  // Sort by emotion count for this specific emotion descending
  emotionTopics.sort((a, b) => b.emotionCounts[emotion] - a.emotionCounts[emotion]);
  
  return emotionTopics.slice(0, limit);
}

export function computeTopicSeverity(topic: string): number {
  const store = getTopicStore();
  const data = store[topic];
  
  if (!data) {
    return 0;
  }
  
  const intensityAvg = data.intensityCount > 0 ? data.intensitySum / data.intensityCount : 0;
  return computeSeverityScore(intensityAvg, data.count);
}

export function resetTopicTracking(): void {
  if (mockTopicStore) {
    mockTopicStore = {};
  } else {
    topicStore = {};
  }
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectTopicStore(t: Record<string, InternalTopicData> | null): void {
    mockTopicStore = t;
  },
  
  reset(): void {
    mockTopicStore = null;
    topicStore = {};
  },
  
  getInternalStore(): Record<string, InternalTopicData> {
    return { ...getTopicStore() };
  }
};