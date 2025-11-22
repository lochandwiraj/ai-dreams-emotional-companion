// Thin read-only adapter for other teams to get snapshots and recommendations

import { EmotionState } from './emotionDetector';
import { getEmotionFrequency, getRecurringTopics } from './emotionAnalytics';
import { analyzePreferences } from './preferenceEngine';
import { useEmotionStore } from '../store/emotionStore';

// Mock injection for testing
let mockEmotionAnalytics: {
  getEmotionFrequency?: typeof getEmotionFrequency;
  getRecurringTopics?: typeof getRecurringTopics;
} | null = null;

let mockPreferenceEngine: {
  analyzePreferences?: typeof analyzePreferences;
} | null = null;

let mockEmotionStore: typeof useEmotionStore | null = null;

function getEmotionFrequencyWithMock(days?: number) {
  if (mockEmotionAnalytics?.getEmotionFrequency) {
    return mockEmotionAnalytics.getEmotionFrequency(days);
  }
  return getEmotionFrequency(days);
}

function getRecurringTopicsWithMock(limit?: number) {
  if (mockEmotionAnalytics?.getRecurringTopics) {
    return mockEmotionAnalytics.getRecurringTopics(limit);
  }
  return getRecurringTopics(limit);
}

function analyzePreferencesWithMock(emotion: EmotionState) {
  if (mockPreferenceEngine?.analyzePreferences) {
    return mockPreferenceEngine.analyzePreferences(emotion);
  }
  return analyzePreferences(emotion);
}

function getEmotionStoreWithMock() {
  return mockEmotionStore ? mockEmotionStore() : useEmotionStore();
}

export function getTopEmotionSummary(limit: number = 3): { 
  topEmotions: { emotion: EmotionState; count: number }[]; 
  recentSampleCount: number 
} {
  const emotionFrequency = getEmotionFrequencyWithMock(14);
  const store = getEmotionStoreWithMock();
  const recentData = store.getRecent();
  
  // Get top N emotions by frequency
  const topEmotions = emotionFrequency
    .slice(0, limit)
    .map(item => ({
      emotion: item.emotion,
      count: item.count
    }));
  
  // Ensure we always return the requested number of items, even with zero counts
  while (topEmotions.length < limit) {
    const defaultEmotions: EmotionState[] = ['neutral', 'excited', 'calm'];
    const nextEmotion = defaultEmotions[topEmotions.length];
    if (nextEmotion && !topEmotions.find(e => e.emotion === nextEmotion)) {
      topEmotions.push({ emotion: nextEmotion, count: 0 });
    } else {
      break;
    }
  }
  
  return {
    topEmotions,
    recentSampleCount: recentData.length
  };
}

export function getRecommendationsForUI(emotion: EmotionState): { 
  recommendedActivities: string[]; 
  confidence: number 
} {
  try {
    const analysis = analyzePreferencesWithMock(emotion);
    
    // Ensure we always return some activities, even with low confidence
    const defaultActivities = ['meditation', 'music', 'conversation'];
    const recommendedActivities = analysis.recommendedActivities.length > 0 
      ? analysis.recommendedActivities 
      : defaultActivities;
    
    return {
      recommendedActivities,
      confidence: analysis.confidence
    };
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return {
      recommendedActivities: ['meditation', 'music', 'conversation'],
      confidence: 0.1
    };
  }
}

export function getEmotionContextForMemory(limit: number = 5): { 
  emotionSummary: { emotion: EmotionState; intensityAvg: number }[]; 
  topTopics: { topic: string; occurrences: number }[] 
} {
  const emotionFrequency = getEmotionFrequencyWithMock(30); // 30 days for memory context
  const store = getEmotionStoreWithMock();
  const recentData = store.getRecent();
  
  // Calculate average intensity for each emotion
  const intensitySums: Record<EmotionState, { sum: number; count: number }> = {
    sad: { sum: 0, count: 0 },
    angry: { sum: 0, count: 0 },
    anxious: { sum: 0, count: 0 },
    stressed: { sum: 0, count: 0 },
    lonely: { sum: 0, count: 0 },
    excited: { sum: 0, count: 0 },
    neutral: { sum: 0, count: 0 },
    confused: { sum: 0, count: 0 },
    overwhelmed: { sum: 0, count: 0 }
  };
  
  recentData.forEach(item => {
    if (intensitySums[item.emotion]) {
      intensitySums[item.emotion].sum += item.intensity;
      intensitySums[item.emotion].count++;
    }
  });
  
  // Create emotion summary with average intensities
  const emotionSummary = emotionFrequency
    .slice(0, limit)
    .map(item => {
      const emotionData = intensitySums[item.emotion];
      const intensityAvg = emotionData.count > 0 
        ? Math.round((emotionData.sum / emotionData.count) * 10) / 10 // Round to 1 decimal
        : 5.0; // Default average
      
      return {
        emotion: item.emotion,
        intensityAvg
      };
    });
  
  // Get top topics
  const topTopics = getRecurringTopicsWithMock(limit);
  
  return {
    emotionSummary,
    topTopics
  };
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectMocks(
    emotionAnalytics: { getEmotionFrequency?: typeof getEmotionFrequency; getRecurringTopics?: typeof getRecurringTopics } | null,
    preferenceEngine: { analyzePreferences?: typeof analyzePreferences } | null,
    emotionStore: typeof useEmotionStore | null
  ): void {
    mockEmotionAnalytics = emotionAnalytics;
    mockPreferenceEngine = preferenceEngine;
    mockEmotionStore = emotionStore;
  },

  resetMocks(): void {
    mockEmotionAnalytics = null;
    mockPreferenceEngine = null;
    mockEmotionStore = null;
  },

  getMockState(): { 
    emotionAnalytics: typeof mockEmotionAnalytics; 
    preferenceEngine: typeof mockPreferenceEngine;
    emotionStore: typeof mockEmotionStore;
  } {
    return {
      emotionAnalytics: mockEmotionAnalytics,
      preferenceEngine: mockPreferenceEngine,
      emotionStore: mockEmotionStore
    };
  }
};