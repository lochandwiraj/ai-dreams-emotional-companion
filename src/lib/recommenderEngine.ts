// Rank response strategies using preference signals, context, and exploration policy

import { EmotionState } from './emotionDetector';
import { getPreferences } from './preferenceEngine';
import { contextStore } from './contextStore';
import { useEmotionStore } from '../store/emotionStore';
import { getTopicEmotionCorrelations } from './contextAdapter';

export type ResponseRecommendation = {
  responseType: string;
  score: number;
  normalizedScore: number;
  confidence: number;
  rationale: string;
};

// Response types and their base mappings
const RESPONSE_TYPES = [
  'meditation', 'breathing', 'mindfulness',
  'music', 'song', 'playlist',
  'conversation', 'reflection', 'validation',
  'visualization', 'imagery', 'guided-imagery',
  'exercise', 'movement', 'stretch',
  'journaling', 'writing', 'prompt',
  'gratitude', 'appreciation', 'positive-focus'
];

// Base scores for each emotion-response combination
const BASE_SCORES: Record<EmotionState, Record<string, number>> = {
  sad: { meditation: 0.6, music: 0.8, conversation: 0.9, visualization: 0.5, exercise: 0.4, journaling: 0.7, gratitude: 0.6 },
  angry: { meditation: 0.8, breathing: 0.9, exercise: 0.7, music: 0.6, visualization: 0.5, journaling: 0.6 },
  anxious: { meditation: 0.9, breathing: 0.9, mindfulness: 0.8, music: 0.7, visualization: 0.6, exercise: 0.5 },
  stressed: { meditation: 0.8, breathing: 0.8, music: 0.7, exercise: 0.6, visualization: 0.5, journaling: 0.6 },
  lonely: { conversation: 0.9, music: 0.7, journaling: 0.6, gratitude: 0.5, meditation: 0.4 },
  excited: { music: 0.8, conversation: 0.7, exercise: 0.7, journaling: 0.6, gratitude: 0.8 },
  neutral: { conversation: 0.7, music: 0.6, meditation: 0.5, journaling: 0.5, gratitude: 0.6 },
  confused: { conversation: 0.8, reflection: 0.9, journaling: 0.7, meditation: 0.6 },
  overwhelmed: { meditation: 0.9, breathing: 0.8, mindfulness: 0.7, visualization: 0.6, journaling: 0.5 }
};

// Internal state
let explorationMode = false;
let outcomeCounts: Record<string, { successes: number; attempts: number }> = {};
let recentSuccesses: Array<{ responseType: string; timestamp: number }> = [];

// Mock injection for testing
let mockPreferenceEngine: any = null;
let mockContextStores: any = null;
let mockRNG = Math.random;

function getPreferenceEngine() {
  return mockPreferenceEngine || { getPreferences };
}

function getContextStores() {
  return mockContextStores || { contextStore, getTopicEmotionCorrelations };
}

function getEmotionStore() {
  return useEmotionStore();
}

function calculateBaseScore(responseType: string, emotion: EmotionState, preferences: any): number {
  const baseScore = BASE_SCORES[emotion]?.[responseType] || 0.3;
  const preferenceWeight = getPreferenceWeight(responseType, preferences);
  
  return baseScore * preferenceWeight;
}

function getPreferenceWeight(responseType: string, preferences: any): number {
  const activityMap: Record<string, keyof typeof preferences.preferredActivities> = {
    'meditation': 'meditation',
    'breathing': 'meditation',
    'mindfulness': 'meditation',
    'music': 'music',
    'song': 'music',
    'playlist': 'music',
    'conversation': 'conversation',
    'reflection': 'conversation',
    'validation': 'conversation',
    'visualization': 'visualization',
    'imagery': 'visualization',
    'guided-imagery': 'visualization'
  };
  
  const activity = activityMap[responseType];
  if (activity && preferences.preferredActivities[activity]) {
    return 0.5 + (preferences.preferredActivities[activity] * 0.5); // Map 0-1 to 0.5-1.0
  }
  
  return 0.7; // Default weight for unmapped types
}

function calculateTopicBoost(responseType: string, emotion: EmotionState): number {
  try {
    const correlations = getContextStores().getTopicEmotionCorrelations(5);
    const relevantTopics = correlations.filter(corr => 
      corr.correlations.some(c => c.emotion === emotion && c.score > 0.3)
    );
    
    if (relevantTopics.length > 0) {
      return 1.0 + (relevantTopics.length * 0.1); // 10% boost per relevant topic
    }
  } catch (error) {
    console.warn('Failed to calculate topic boost:', error);
  }
  
  return 1.0;
}

function calculateRecencyBoost(responseType: string): number {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  const recentSuccess = recentSuccesses.find(success => 
    success.responseType === responseType && 
    (now - success.timestamp) < oneDayMs
  );
  
  if (recentSuccess) {
    const hoursAgo = (now - recentSuccess.timestamp) / (60 * 60 * 1000);
    const decay = Math.exp(-hoursAgo / 6); // Half-life of 6 hours
    return 1.0 + (decay * 0.3); // Up to 30% boost
  }
  
  return 1.0;
}

function calculateExplorationNoise(responseType: string): number {
  if (!explorationMode && mockRNG() > 0.12) {
    return 1.0; // No exploration noise
  }
  
  // Add exploration noise: -20% to +50% variation
  return 0.8 + (mockRNG() * 0.7);
}

function generateRationale(responseType: string, emotion: EmotionState, score: number): string {
  const rationales: Record<string, string> = {
    meditation: `Meditation can help calm ${emotion} feelings and provide mental space.`,
    breathing: `Breathing exercises are effective for managing ${emotion} states.`,
    music: `Music often helps shift ${emotion} moods and improve emotional state.`,
    conversation: `Talking through ${emotion} feelings can provide perspective and support.`,
    visualization: `Visualization techniques can help reframe ${emotion} experiences.`,
    exercise: `Physical activity can help release ${emotion} energy and tension.`,
    journaling: `Writing about ${emotion} feelings can provide clarity and insight.`,
    gratitude: `Focusing on gratitude can help counterbalance ${emotion} emotions.`
  };
  
  return rationales[responseType] || `This approach may help with ${emotion} feelings based on your preferences.`;
}

function calculateConfidence(scores: number[], topCandidates: ResponseRecommendation[]): number {
  if (scores.length === 0) return 0.1;
  
  // Calculate variance between top candidates
  const topScores = topCandidates.slice(0, 3).map(c => c.score);
  const mean = topScores.reduce((sum, s) => sum + s, 0) / topScores.length;
  const variance = topScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / topScores.length;
  
  // Lower variance = higher confidence
  const varianceConfidence = Math.max(0, 1 - (variance * 2));
  
  // Consider evidence count from outcome tracking
  const totalAttempts = Object.values(outcomeCounts).reduce((sum, count) => sum + count.attempts, 0);
  const evidenceConfidence = Math.min(1, totalAttempts / 10);
  
  // Combine confidence factors
  return (varianceConfidence * 0.6) + (evidenceConfidence * 0.4);
}

export async function getRecommendationsForEmotion(emotion: EmotionState, opts?: { max?: number }): Promise<ResponseRecommendation[]> {
  const max = opts?.max || 5;
  const preferences = getPreferenceEngine().getPreferences();
  
  const recommendations: ResponseRecommendation[] = [];
  
  for (const responseType of RESPONSE_TYPES) {
    let score = calculateBaseScore(responseType, emotion, preferences);
    score *= calculateTopicBoost(responseType, emotion);
    score *= calculateRecencyBoost(responseType);
    score *= calculateExplorationNoise(responseType);
    
    // Apply outcome-based adjustments
    const outcome = outcomeCounts[responseType];
    if (outcome && outcome.attempts > 0) {
      const successRate = outcome.successes / outcome.attempts;
      score *= 0.5 + (successRate * 0.5); // Adjust based on historical success
    }
    
    recommendations.push({
      responseType,
      score,
      normalizedScore: 0, // Will be normalized later
      confidence: 0, // Will be calculated after all scores
      rationale: generateRationale(responseType, emotion, score)
    });
  }
  
  // Normalize scores to 0-1 range
  const maxScore = Math.max(...recommendations.map(r => r.score));
  const minScore = Math.min(...recommendations.map(r => r.score));
  const range = maxScore - minScore || 1;
  
  recommendations.forEach(rec => {
    rec.normalizedScore = (rec.score - minScore) / range;
  });
  
  // Sort by normalized score descending
  recommendations.sort((a, b) => b.normalizedScore - a.normalizedScore);
  
  // Calculate confidence for top recommendations
  const topCandidates = recommendations.slice(0, max);
  const confidence = calculateConfidence(
    recommendations.map(r => r.normalizedScore),
    topCandidates
  );
  
  // Apply confidence to top candidates
  topCandidates.forEach(rec => {
    rec.confidence = Math.round(confidence * 100) / 100;
  });
  
  return topCandidates.slice(0, max);
}

export async function getConfidenceForRecommendation(responseType: string, emotion: EmotionState): Promise<number> {
  const recommendations = await getRecommendationsForEmotion(emotion, { max: 10 });
  const recommendation = recommendations.find(rec => rec.responseType === responseType);
  
  if (recommendation) {
    return recommendation.confidence;
  }
  
  // Fallback confidence calculation
  const outcome = outcomeCounts[responseType];
  if (outcome && outcome.attempts > 0) {
    return outcome.successes / outcome.attempts;
  }
  
  return 0.3; // Default low confidence for unknown recommendations
}

export function recordABTestOutcome(chosenResponseType: string, succeeded: boolean): void {
  if (!outcomeCounts[chosenResponseType]) {
    outcomeCounts[chosenResponseType] = { successes: 0, attempts: 0 };
  }
  
  outcomeCounts[chosenResponseType].attempts++;
  if (succeeded) {
    outcomeCounts[chosenResponseType].successes++;
    
    // Record recent success for recency boost
    recentSuccesses.unshift({
      responseType: chosenResponseType,
      timestamp: Date.now()
    });
    
    // Keep only last 20 successes
    if (recentSuccesses.length > 20) {
      recentSuccesses = recentSuccesses.slice(0, 20);
    }
  }
}

export function forceExplorationMode(enable: boolean): void {
  explorationMode = enable;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectPreferenceEngine(pe: any): void {
    mockPreferenceEngine = pe;
  },
  
  injectContextStores(mocks: any): void {
    mockContextStores = mocks;
  },
  
  setRNG(fn: () => number): void {
    mockRNG = fn;
  },
  
  getInternalState() {
    return {
      explorationMode,
      outcomeCounts: { ...outcomeCounts },
      recentSuccesses: [...recentSuccesses]
    };
  },
  
  reset(): void {
    mockPreferenceEngine = null;
    mockContextStores = null;
    mockRNG = Math.random;
    explorationMode = false;
    outcomeCounts = {};
    recentSuccesses = [];
  }
};