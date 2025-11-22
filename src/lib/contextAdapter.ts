// Thin read-only API for querying personal context and correlations

import { EmotionState } from './emotionDetector';
import { contextStore } from './contextStore';
import { getTriggerEmotionCorrelations } from './patternAnalyzer';
import { analyzePreferences } from './preferenceEngine';
import { useEmotionStore } from '../store/emotionStore';

// Mock injection for testing
let mockPatternAnalyzer: { getTriggerEmotionCorrelations?: typeof getTriggerEmotionCorrelations } | null = null;
let mockPreferenceEngine: { analyzePreferences?: typeof analyzePreferences } | null = null;
let mockEmotionStore: typeof useEmotionStore | null = null;
let mockContextStore: typeof contextStore | null = null;

function getPatternAnalyzer() {
  return mockPatternAnalyzer || { getTriggerEmotionCorrelations };
}

function getPreferenceEngine() {
  return mockPreferenceEngine || { analyzePreferences };
}

function getEmotionStore() {
  return mockEmotionStore ? mockEmotionStore() : useEmotionStore();
}

function getContextStore() {
  return mockContextStore || contextStore;
}

export function getPersonalContext(): {
  triggers: string[];
  comforts: string[];
  entities: string[];
  topTopics: { topic: string; occurrences: number }[];
} {
  try {
    const context = getContextStore().getPersonalContext();
    
    // Trim to top 10 entries per list
    return {
      triggers: context.triggers.slice(0, 10),
      comforts: context.comforts.slice(0, 10),
      entities: context.entities.slice(0, 10),
      topTopics: context.topTopics.slice(0, 10)
    };
  } catch (error) {
    console.error('Failed to get personal context:', error);
    return {
      triggers: [],
      comforts: [],
      entities: [],
      topTopics: []
    };
  }
}

export function getTriggers(): string[] {
  try {
    const context = getPersonalContext();
    return context.triggers;
  } catch (error) {
    console.error('Failed to get triggers:', error);
    return [];
  }
}

export function getComfortSources(): string[] {
  try {
    const context = getPersonalContext();
    return context.comforts;
  } catch (error) {
    console.error('Failed to get comfort sources:', error);
    return [];
  }
}

export function getTopicEmotionCorrelations(limit: number = 10): { 
  topic: string; 
  correlations: { emotion: EmotionState; score: number }[] 
}[] {
  try {
    const correlations = getPatternAnalyzer().getTriggerEmotionCorrelations(limit * 3); // Get more to group by topic
    
    // Group correlations by topic
    const topicMap: Record<string, { emotion: EmotionState; score: number }[]> = {};
    
    correlations.forEach(correlation => {
      if (!topicMap[correlation.topic]) {
        topicMap[correlation.topic] = [];
      }
      
      topicMap[correlation.topic].push({
        emotion: correlation.emotion,
        score: correlation.correlationScore
      });
    });
    
    // Convert to array and sort by highest correlation score per topic
    const result = Object.entries(topicMap)
      .map(([topic, correlations]) => ({
        topic,
        correlations: correlations
          .sort((a, b) => b.score - a.score)
          .slice(0, 3) // Top 3 emotions per topic
      }))
      .sort((a, b) => {
        // Sort by highest correlation score in the topic
        const maxScoreA = Math.max(...a.correlations.map(c => c.score));
        const maxScoreB = Math.max(...b.correlations.map(c => c.score));
        return maxScoreB - maxScoreA;
      })
      .slice(0, limit);
    
    return result;
  } catch (error) {
    console.error('Failed to get topic emotion correlations:', error);
    return [];
  }
}

export function getContextForResponseGenerator(): {
  triggers: string[];
  comforts: string[];
  recommendedQuickActions: string[];
} {
  try {
    const personalContext = getPersonalContext();
    const emotionStore = getEmotionStore();
    const preferenceEngine = getPreferenceEngine();
    
    // Get latest emotion for recommendation context
    const latestEmotion = emotionStore.lastDetectedEmotion?.emotion || 'neutral';
    
    // Get recommended activities based on current emotion
    const preferences = preferenceEngine.analyzePreferences(latestEmotion);
    const recommendedQuickActions = preferences.recommendedActivities.slice(0, 5);
    
    return {
      triggers: personalContext.triggers,
      comforts: personalContext.comforts,
      recommendedQuickActions
    };
  } catch (error) {
    console.error('Failed to get context for response generator:', error);
    return {
      triggers: [],
      comforts: [],
      recommendedQuickActions: ['meditation', 'music', 'conversation']
    };
  }
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectPatternAnalyzer(pa: { getTriggerEmotionCorrelations?: typeof getTriggerEmotionCorrelations } | null): void {
    mockPatternAnalyzer = pa;
  },
  
  injectPreferenceEngine(pe: { analyzePreferences?: typeof analyzePreferences } | null): void {
    mockPreferenceEngine = pe;
  },
  
  injectEmotionStore(es: typeof useEmotionStore | null): void {
    mockEmotionStore = es;
  },
  
  injectContextStore(cs: typeof contextStore | null): void {
    mockContextStore = cs;
  },
  
  reset(): void {
    mockPatternAnalyzer = null;
    mockPreferenceEngine = null;
    mockEmotionStore = null;
    mockContextStore = null;
  }
};