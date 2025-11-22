// Persistent user context store combining in-memory state and localStorage

import { EmotionState } from './emotionDetector';
import { ExtractedContext } from './contextExtractor';

export interface ContextStoreState {
  userTriggers: string[];
  comfortTopics: string[];
  namedEntities: string[];
  topicEmotionMap: Record<string, Record<EmotionState, number>>;
  timePatterns: Record<string, number>;
  addContext(ctx: ExtractedContext): void;
  addHints(hints: string[]): void;
  getPersonalContext(): {
    triggers: string[];
    comforts: string[];
    entities: string[];
    topTopics: { topic: string; occurrences: number }[];
  };
  reset(full?: boolean): void;
  hydrate(initial?: Partial<ContextStoreState>): void;
}

export const CONTEXT_LOCAL_KEY = 'ai-companion-context-v1';

// Default state
const DEFAULT_STATE: Omit<ContextStoreState, 'addContext' | 'addHints' | 'getPersonalContext' | 'reset' | 'hydrate'> = {
  userTriggers: [],
  comfortTopics: [],
  namedEntities: [],
  topicEmotionMap: {},
  timePatterns: {}
};

// In-memory state
let storeState: Omit<ContextStoreState, 'addContext' | 'addHints' | 'getPersonalContext' | 'reset' | 'hydrate'> = { ...DEFAULT_STATE };

// Mock injection for testing
let mockLocalStorage: Storage | null = null;

function getLocalStorage(): Storage {
  return mockLocalStorage || localStorage;
}

function normalizeToken(token: string): string {
  return token.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function validateStoredData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  if (!Array.isArray(data.userTriggers) || !data.userTriggers.every((item: any) => typeof item === 'string')) return false;
  if (!Array.isArray(data.comfortTopics) || !data.comfortTopics.every((item: any) => typeof item === 'string')) return false;
  if (!Array.isArray(data.namedEntities) || !data.namedEntities.every((item: any) => typeof item === 'string')) return false;
  
  if (data.topicEmotionMap && typeof data.topicEmotionMap === 'object') {
    for (const [topic, emotions] of Object.entries(data.topicEmotionMap)) {
      if (typeof topic !== 'string' || typeof emotions !== 'object') return false;
      for (const [emotion, count] of Object.entries(emotions as object)) {
        if (!['sad', 'angry', 'anxious', 'stressed', 'lonely', 'excited', 'neutral', 'confused', 'overwhelmed'].includes(emotion)) return false;
        if (typeof count !== 'number') return false;
      }
    }
  }
  
  if (data.timePatterns && typeof data.timePatterns === 'object') {
    for (const [pattern, count] of Object.entries(data.timePatterns)) {
      if (typeof pattern !== 'string' || typeof count !== 'number') return false;
    }
  }
  
  return true;
}

function loadFromStorage(): void {
  try {
    const stored = getLocalStorage().getItem(CONTEXT_LOCAL_KEY);
    if (!stored) {
      storeState = { ...DEFAULT_STATE };
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (validateStoredData(parsed)) {
      storeState = {
        userTriggers: [...(parsed.userTriggers || [])],
        comfortTopics: [...(parsed.comfortTopics || [])],
        namedEntities: [...(parsed.namedEntities || [])],
        topicEmotionMap: { ...(parsed.topicEmotionMap || {}) },
        timePatterns: { ...(parsed.timePatterns || {}) }
      };
    } else {
      console.warn('Invalid context data found, resetting to defaults');
      storeState = { ...DEFAULT_STATE };
    }
  } catch (error) {
    console.error('Failed to load context from storage:', error);
    storeState = { ...DEFAULT_STATE };
  }
}

function saveToStorage(): void {
  try {
    getLocalStorage().setItem(CONTEXT_LOCAL_KEY, JSON.stringify(storeState));
  } catch (error) {
    console.error('Failed to save context to storage:', error);
  }
}

function mergeUniqueArrays(target: string[], source: string[], limit: number = 50): string[] {
  const merged = [...new Set([...target, ...source.map(normalizeToken)])];
  return merged.slice(0, limit);
}

function updateTopicEmotionMap(topics: string[], emotion: EmotionState): void {
  for (const topic of topics) {
    const normalizedTopic = normalizeToken(topic);
    if (normalizedTopic.length < 2) continue;
    
    if (!storeState.topicEmotionMap[normalizedTopic]) {
      storeState.topicEmotionMap[normalizedTopic] = {
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
    
    storeState.topicEmotionMap[normalizedTopic][emotion] = (storeState.topicEmotionMap[normalizedTopic][emotion] || 0) + 1;
  }
}

// Initialize on module load
loadFromStorage();

export const contextStore: ContextStoreState = {
  get userTriggers() { return [...storeState.userTriggers]; },
  get comfortTopics() { return [...storeState.comfortTopics]; },
  get namedEntities() { return [...storeState.namedEntities]; },
  get topicEmotionMap() { return JSON.parse(JSON.stringify(storeState.topicEmotionMap)); },
  get timePatterns() { return { ...storeState.timePatterns }; },

  addContext(ctx: ExtractedContext): void {
    // Merge triggers and comforts
    storeState.userTriggers = mergeUniqueArrays(storeState.userTriggers, ctx.triggers);
    storeState.comfortTopics = mergeUniqueArrays(storeState.comfortTopics, ctx.comforts);
    
    // Merge named entities (people and places)
    const entities = [...ctx.people, ...ctx.places, ...ctx.activities];
    storeState.namedEntities = mergeUniqueArrays(storeState.namedEntities, entities);
    
    // Update topic-emotion map for all extracted topics
    const allTopics = [...ctx.triggers, ...ctx.comforts, ...ctx.activities];
    // Use neutral as default emotion since we don't have emotion context here
    updateTopicEmotionMap(allTopics, 'neutral');
    
    // Update time patterns with current time
    const now = new Date();
    const hourKey = `hour_${now.getHours()}`;
    storeState.timePatterns[hourKey] = (storeState.timePatterns[hourKey] || 0) + 1;
    
    saveToStorage();
  },

  addHints(hints: string[]): void {
    if (!Array.isArray(hints) || hints.length === 0) return;
    
    // Add hints to named entities
    storeState.namedEntities = mergeUniqueArrays(storeState.namedEntities, hints);
    
    saveToStorage();
  },

  getPersonalContext(): {
    triggers: string[];
    comforts: string[];
    entities: string[];
    topTopics: { topic: string; occurrences: number }[];
  } {
    // Calculate top topics from topicEmotionMap
    const topicOccurrences: { topic: string; occurrences: number }[] = [];
    
    for (const [topic, emotions] of Object.entries(storeState.topicEmotionMap)) {
      const totalOccurrences = Object.values(emotions).reduce((sum, count) => sum + count, 0);
      topicOccurrences.push({ topic, occurrences: totalOccurrences });
    }
    
    topicOccurrences.sort((a, b) => b.occurrences - a.occurrences);
    const topTopics = topicOccurrences.slice(0, 10);
    
    return {
      triggers: [...storeState.userTriggers],
      comforts: [...storeState.comfortTopics],
      entities: [...storeState.namedEntities],
      topTopics
    };
  },

  reset(full?: boolean): void {
    if (full) {
      storeState = { ...DEFAULT_STATE };
      try {
        getLocalStorage().removeItem(CONTEXT_LOCAL_KEY);
      } catch (error) {
        console.error('Failed to remove context from storage:', error);
      }
    } else {
      // Partial reset - keep basic structure but clear arrays
      storeState.userTriggers = [];
      storeState.comfortTopics = [];
      storeState.namedEntities = [];
      storeState.topicEmotionMap = {};
      storeState.timePatterns = {};
      saveToStorage();
    }
  },

  hydrate(initial?: Partial<ContextStoreState>): void {
    if (!initial) return;
    
    if (initial.userTriggers && Array.isArray(initial.userTriggers)) {
      storeState.userTriggers = mergeUniqueArrays(storeState.userTriggers, initial.userTriggers);
    }
    
    if (initial.comfortTopics && Array.isArray(initial.comfortTopics)) {
      storeState.comfortTopics = mergeUniqueArrays(storeState.comfortTopics, initial.comfortTopics);
    }
    
    if (initial.namedEntities && Array.isArray(initial.namedEntities)) {
      storeState.namedEntities = mergeUniqueArrays(storeState.namedEntities, initial.namedEntities);
    }
    
    if (initial.topicEmotionMap && typeof initial.topicEmotionMap === 'object') {
      storeState.topicEmotionMap = { ...storeState.topicEmotionMap, ...initial.topicEmotionMap };
    }
    
    if (initial.timePatterns && typeof initial.timePatterns === 'object') {
      storeState.timePatterns = { ...storeState.timePatterns, ...initial.timePatterns };
    }
    
    saveToStorage();
  }
};

// Testing utilities
export const __TEST_ONLY__ = {
  reset(): void {
    storeState = { ...DEFAULT_STATE };
    mockLocalStorage = null;
  },
  
  injectLocalStorageMock(mock: any): void {
    mockLocalStorage = mock;
  },
  
  getInternalState() {
    return { ...storeState };
  },
  
  setInternalState(state: Partial<typeof storeState>): void {
    storeState = { ...storeState, ...state };
  }
};