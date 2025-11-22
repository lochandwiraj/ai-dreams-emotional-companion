// Statistical + heuristic analyzer for emotion patterns and correlations

import { EmotionState, EmotionResult } from './emotionDetector';
import { useEmotionStore } from '../store/emotionStore';
import { contextStore } from './contextStore';

export interface TopicCorrelation {
  topic: string;
  emotion: EmotionState;
  occurrences: number;
  correlationScore: number;
}

// In-memory pattern data
let patternData: {
  topicEmotionCounts: Record<string, Record<EmotionState, number>>;
  topicTotalCounts: Record<string, number>;
  emotionTotalCounts: Record<EmotionState, number>;
  totalObservations: number;
} = {
  topicEmotionCounts: {},
  topicTotalCounts: {},
  emotionTotalCounts: {
    sad: 0,
    angry: 0,
    anxious: 0,
    stressed: 0,
    lonely: 0,
    excited: 0,
    neutral: 0,
    confused: 0,
    overwhelmed: 0
  },
  totalObservations: 0
};

// Mock injection for testing
let mockEmotionStore: typeof useEmotionStore | null = null;
let mockContextStore: typeof contextStore | null = null;

function getEmotionStore() {
  return mockEmotionStore ? mockEmotionStore() : useEmotionStore();
}

function getContextStore() {
  return mockContextStore || contextStore;
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function calculateCorrelationScore(topic: string, emotion: EmotionState, occurrences: number): number {
  const topicTotal = patternData.topicTotalCounts[topic] || 1;
  const emotionTotal = patternData.emotionTotalCounts[emotion] || 1;
  const totalObs = patternData.totalObservations || 1;
  
  // correlationScore = occurrences / sqrt(topic_total * emotion_total), normalized 0..1
  const rawScore = occurrences / Math.sqrt(topicTotal * emotionTotal);
  
  // Normalize to 0-1 range using total observations as context
  const maxPossibleScore = 1 / Math.sqrt(1 * 1); // Maximum when topic_total = emotion_total = 1
  const normalizedScore = Math.min(1, rawScore / maxPossibleScore);
  
  return Math.round(normalizedScore * 100) / 100;
}

export function updatePatterns(source?: { emotions?: EmotionResult[]; contexts?: any[] }): void {
  let emotions: EmotionResult[] = [];
  let contexts: any[] = [];
  
  if (source) {
    emotions = source.emotions || [];
    contexts = source.contexts || [];
  } else {
    // Pull from stores when no source provided
    const emotionStore = getEmotionStore();
    emotions = emotionStore.getRecent();
    contexts = [getContextStore().getPersonalContext()];
  }
  
  // Reset pattern data
  patternData = {
    topicEmotionCounts: {},
    topicTotalCounts: {},
    emotionTotalCounts: {
      sad: 0,
      angry: 0,
      anxious: 0,
      stressed: 0,
      lonely: 0,
      excited: 0,
      neutral: 0,
      confused: 0,
      overwhelmed: 0
    },
    totalObservations: 0
  };
  
  // Count emotion occurrences
  emotions.forEach(emotionResult => {
    patternData.emotionTotalCounts[emotionResult.emotion]++;
    patternData.totalObservations++;
  });
  
  // Extract topics from contexts and count co-occurrences with emotions
  contexts.forEach(context => {
    const allTopics = [
      ...(context.triggers || []),
      ...(context.comforts || []),
      ...(context.entities || []),
      ...(context.topTopics?.map((t: any) => t.topic) || [])
    ];
    
    allTopics.forEach(topic => {
      const normalizedTopic = normalizeTopic(topic);
      if (normalizedTopic.length < 2) return;
      
      // Initialize topic counts if needed
      if (!patternData.topicEmotionCounts[normalizedTopic]) {
        patternData.topicEmotionCounts[normalizedTopic] = {
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
      
      if (!patternData.topicTotalCounts[normalizedTopic]) {
        patternData.topicTotalCounts[normalizedTopic] = 0;
      }
      
      // For each emotion, count co-occurrence (simplified heuristic)
      // In a real implementation, we'd need temporal alignment between emotions and contexts
      Object.keys(patternData.emotionTotalCounts).forEach(emotion => {
        // Simple heuristic: if this topic appears frequently and emotion appears frequently,
        // assume some correlation based on overall patterns
        const emotionCount = patternData.emotionTotalCounts[emotion as EmotionState];
        if (emotionCount > 0) {
          patternData.topicEmotionCounts[normalizedTopic][emotion as EmotionState] += 1;
          patternData.topicTotalCounts[normalizedTopic]++;
        }
      });
    });
  });
}

export function getTriggerEmotionCorrelations(limit: number = 10): TopicCorrelation[] {
  const correlations: TopicCorrelation[] = [];
  
  for (const [topic, emotionCounts] of Object.entries(patternData.topicEmotionCounts)) {
    for (const [emotion, occurrences] of Object.entries(emotionCounts)) {
      if (occurrences > 0) {
        const correlationScore = calculateCorrelationScore(topic, emotion as EmotionState, occurrences);
        correlations.push({
          topic,
          emotion: emotion as EmotionState,
          occurrences,
          correlationScore
        });
      }
    }
  }
  
  // Sort by correlation score descending
  correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  
  return correlations.slice(0, limit);
}

export function getTopicRecurrence(limit: number = 10): { topic: string; count: number }[] {
  const recurrences: { topic: string; count: number }[] = [];
  
  for (const [topic, count] of Object.entries(patternData.topicTotalCounts)) {
    if (count > 0) {
      recurrences.push({ topic, count });
    }
  }
  
  // Sort by count descending
  recurrences.sort((a, b) => b.count - a.count);
  
  return recurrences.slice(0, limit);
}

export function generateInsights(limit: number = 5): string[] {
  const insights: string[] = [];
  
  // Get top correlations for insight generation
  const topCorrelations = getTriggerEmotionCorrelations(10);
  const topRecurrences = getTopicRecurrence(10);
  
  // Insight templates
  const correlationTemplates = [
    "When {{topic}} comes up, you tend to feel {{emotion}}.",
    "{{Topic}} often correlates with feeling {{emotion}}.",
    "Noticed that {{topic}} is frequently associated with {{emotion}} emotions."
  ];
  
  const recurrenceTemplates = [
    "{{Topic}} has been a recurring theme recently.",
    "You've mentioned {{topic}} multiple times in our conversations.",
    "{{Topic}} appears to be an important topic for you."
  ];
  
  const mixedTemplates = [
    "{{Topic}} seems to trigger {{emotion}} feelings for you.",
    "When discussing {{topic}}, you often experience {{emotion}}.",
    "{{Topic}} frequently comes up alongside {{emotion}} emotions."
  ];
  
  // Generate correlation-based insights
  for (const correlation of topCorrelations.slice(0, 3)) {
    if (correlation.correlationScore > 0.3) {
      const template = correlationTemplates[Math.floor(Math.random() * correlationTemplates.length)];
      const insight = template
        .replace('{{topic}}', correlation.topic)
        .replace('{{Topic}}', correlation.topic.charAt(0).toUpperCase() + correlation.topic.slice(1))
        .replace('{{emotion}}', correlation.emotion);
      insights.push(insight);
    }
  }
  
  // Generate recurrence-based insights
  for (const recurrence of topRecurrences.slice(0, 2)) {
    if (recurrence.count >= 3) {
      const template = recurrenceTemplates[Math.floor(Math.random() * recurrenceTemplates.length)];
      const insight = template
        .replace('{{topic}}', recurrence.topic)
        .replace('{{Topic}}', recurrence.topic.charAt(0).toUpperCase() + recurrence.topic.slice(1));
      insights.push(insight);
    }
  }
  
  // Generate mixed insights combining correlations and recurrences
  for (let i = 0; i < Math.min(topCorrelations.length, topRecurrences.length) && insights.length < limit; i++) {
    const correlation = topCorrelations[i];
    const recurrence = topRecurrences[i];
    
    if (correlation.correlationScore > 0.2 && recurrence.count >= 2) {
      const template = mixedTemplates[Math.floor(Math.random() * mixedTemplates.length)];
      const insight = template
        .replace('{{topic}}', correlation.topic)
        .replace('{{Topic}}', correlation.topic.charAt(0).toUpperCase() + correlation.topic.slice(1))
        .replace('{{emotion}}', correlation.emotion);
      
      if (!insights.includes(insight)) {
        insights.push(insight);
      }
    }
  }
  
  // Fill with default insights if needed
  const defaultInsights = [
    "Your emotional patterns show a mix of different states throughout the day.",
    "It seems like certain topics consistently affect your mood.",
    "You're developing awareness of what triggers different emotional responses.",
    "Regular conversations help track emotional trends over time.",
    "Noticing patterns is the first step toward emotional understanding."
  ];
  
  while (insights.length < limit && insights.length < defaultInsights.length) {
    insights.push(defaultInsights[insights.length]);
  }
  
  return insights.slice(0, limit);
}

export function resetPatterns(): void {
  patternData = {
    topicEmotionCounts: {},
    topicTotalCounts: {},
    emotionTotalCounts: {
      sad: 0,
      angry: 0,
      anxious: 0,
      stressed: 0,
      lonely: 0,
      excited: 0,
      neutral: 0,
      confused: 0,
      overwhelmed: 0
    },
    totalObservations: 0
  };
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectStoreMocks(mocks: { emotionStore?: typeof useEmotionStore; contextStore?: typeof contextStore }): void {
    if (mocks.emotionStore) {
      mockEmotionStore = mocks.emotionStore;
    }
    if (mocks.contextStore) {
      mockContextStore = mocks.contextStore;
    }
  },
  
  reset(): void {
    mockEmotionStore = null;
    mockContextStore = null;
    resetPatterns();
  },
  
  getPatternData() {
    return { ...patternData };
  },
  
  setPatternData(data: typeof patternData): void {
    patternData = { ...data };
  }
};