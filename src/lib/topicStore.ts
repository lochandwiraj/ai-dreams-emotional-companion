// Persistent store for topic metadata with localStorage backing

import { EmotionState } from './emotionDetector';

export interface TopicStoreState {
  topics: Record<string, {
    count: number;
    lastSeen: string;
    emotionCounts: Record<EmotionState, number>;
    intensityAvg: number;
  }>;
  addOrUpdateTopic(topic: string, data: { emotion?: EmotionState; intensity?: number; when?: string }): void;
  getTopic(topic: string): { count: number; lastSeen: string; emotionCounts: Record<EmotionState, number>; intensityAvg: number } | null;
  getAllTopics(): { topic: string; count: number; lastSeen: string; emotionCounts: Record<EmotionState, number>; intensityAvg: number }[];
  reset(full?: boolean): void;
  hydrate(initial: Partial<{ topics: TopicStoreState['topics'] }>): void;
}

export const TOPIC_LOCAL_KEY = 'ai-companion-topics-v1';

const MAX_TOPICS = 200;

// Default emotion counts structure
function createDefaultEmotionCounts(): Record<EmotionState, number> {
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

// In-memory state
let storeState: { topics: TopicStoreState['topics'] } = {
  topics: {}
};

// Mock injection for testing
let mockLocalStorage: Storage | null = null;

function getLocalStorage(): Storage {
  return mockLocalStorage || localStorage;
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().trim();
}

function validateStoredData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  if (!data.topics || typeof data.topics !== 'object') return false;
  
  for (const [topic, topicData] of Object.entries(data.topics)) {
    if (typeof topic !== 'string') return false;
    
    const td = topicData as any;
    if (typeof td.count !== 'number' || td.count < 0) return false;
    if (typeof td.lastSeen !== 'string') return false;
    if (typeof td.intensityAvg !== 'number' || td.intensityAvg < 0 || td.intensityAvg > 10) return false;
    
    if (!td.emotionCounts || typeof td.emotionCounts !== 'object') return false;
    const emotions: EmotionState[] = ['sad', 'angry', 'anxious', 'stressed', 'lonely', 'excited', 'neutral', 'confused', 'overwhelmed'];
    for (const emotion of emotions) {
      if (typeof td.emotionCounts[emotion] !== 'number' || td.emotionCounts[emotion] < 0) {
        return false;
      }
    }
  }
  
  return true;
}

function loadFromStorage(): void {
  try {
    const stored = getLocalStorage().getItem(TOPIC_LOCAL_KEY);
    if (!stored) {
      storeState = { topics: {} };
      return;
    }
    
    const parsed = JSON.parse(stored);
    if (validateStoredData(parsed)) {
      storeState = { topics: { ...parsed.topics } };
    } else {
      console.warn('Invalid topic data found, resetting to defaults');
      storeState = { topics: {} };
    }
  } catch (error) {
    console.error('Failed to load topics from storage:', error);
    storeState = { topics: {} };
  }
}

function saveToStorage(): void {
  try {
    getLocalStorage().setItem(TOPIC_LOCAL_KEY, JSON.stringify(storeState));
  } catch (error) {
    console.error('Failed to save topics to storage:', error);
  }
}

function enforceTopicLimit(): void {
  const topics = Object.entries(storeState.topics);
  
  if (topics.length <= MAX_TOPICS) {
    return;
  }
  
  // Sort by count ascending, then by lastSeen ascending (oldest/lowest count first)
  const sortedTopics = topics.sort(([, a], [, b]) => {
    if (a.count !== b.count) {
      return a.count - b.count;
    }
    return new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
  });
  
  // Remove excess topics starting from the oldest/lowest count
  const topicsToKeep = sortedTopics.slice(-MAX_TOPICS);
  storeState.topics = Object.fromEntries(topicsToKeep);
}

// Initialize on module load
loadFromStorage();

export const topicStore: TopicStoreState = {
  get topics() { return { ...storeState.topics }; },

  addOrUpdateTopic(topic: string, data: { emotion?: EmotionState; intensity?: number; when?: string }): void {
    const normalizedTopic = normalizeTopic(topic);
    if (!normalizedTopic) return;
    
    const now = new Date().toISOString();
    const when = data.when || now;
    const emotion = data.emotion || 'neutral';
    const intensity = data.intensity !== undefined ? data.intensity : 5;
    
    if (!storeState.topics[normalizedTopic]) {
      storeState.topics[normalizedTopic] = {
        count: 0,
        lastSeen: when,
        emotionCounts: createDefaultEmotionCounts(),
        intensityAvg: 0
      };
    }
    
    const topicData = storeState.topics[normalizedTopic];
    
    // Update counts and averages using running average formula
    const oldTotalIntensity = topicData.intensityAvg * topicData.count;
    const newTotalIntensity = oldTotalIntensity + intensity;
    
    topicData.count += 1;
    topicData.lastSeen = when;
    topicData.emotionCounts[emotion] += 1;
    topicData.intensityAvg = newTotalIntensity / topicData.count;
    
    // Enforce topic limit and save
    enforceTopicLimit();
    saveToStorage();
  },

  getTopic(topic: string): { count: number; lastSeen: string; emotionCounts: Record<EmotionState, number>; intensityAvg: number } | null {
    const normalizedTopic = normalizeTopic(topic);
    const topicData = storeState.topics[normalizedTopic];
    
    if (!topicData) {
      return null;
    }
    
    // Return a copy to prevent external mutation
    return {
      count: topicData.count,
      lastSeen: topicData.lastSeen,
      emotionCounts: { ...topicData.emotionCounts },
      intensityAvg: topicData.intensityAvg
    };
  },

  getAllTopics(): { topic: string; count: number; lastSeen: string; emotionCounts: Record<EmotionState, number>; intensityAvg: number }[] {
    const topics = Object.entries(storeState.topics)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        lastSeen: data.lastSeen,
        emotionCounts: { ...data.emotionCounts },
        intensityAvg: data.intensityAvg
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return topics;
  },

  reset(full?: boolean): void {
    storeState.topics = {};
    
    if (full) {
      try {
        getLocalStorage().removeItem(TOPIC_LOCAL_KEY);
      } catch (error) {
        console.error('Failed to remove topics from storage:', error);
      }
    } else {
      saveToStorage();
    }
  },

  hydrate(initial: Partial<{ topics: TopicStoreState['topics'] }>): void {
    if (!initial || !initial.topics) return;
    
    // Safe merge: only add valid topics that don't already exist
    for (const [topic, topicData] of Object.entries(initial.topics)) {
      const normalizedTopic = normalizeTopic(topic);
      if (!normalizedTopic || storeState.topics[normalizedTopic]) continue;
      
      // Validate the topic data structure before merging
      if (typeof topicData.count === 'number' && 
          typeof topicData.lastSeen === 'string' &&
          typeof topicData.intensityAvg === 'number' &&
          topicData.emotionCounts &&
          typeof topicData.emotionCounts === 'object') {
        
        storeState.topics[normalizedTopic] = {
          count: topicData.count,
          lastSeen: topicData.lastSeen,
          emotionCounts: { ...createDefaultEmotionCounts(), ...topicData.emotionCounts },
          intensityAvg: topicData.intensityAvg
        };
      }
    }
    
    enforceTopicLimit();
    saveToStorage();
  }
};

// Testing utilities
export const __TEST_ONLY__ = {
  injectLocalStorageMock(m: any): void {
    mockLocalStorage = m;
  },
  
  reset(): void {
    mockLocalStorage = null;
    storeState = { topics: {} };
  },
  
  getInternalState() {
    return { ...storeState };
  }
};