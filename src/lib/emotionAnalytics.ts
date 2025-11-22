// Emotion analytics for trend metrics and reporting

import { EmotionState, EmotionResult } from './emotionDetector';
import { useEmotionStore } from '../store/emotionStore';

export interface EmotionFrequency {
  emotion: EmotionState;
  count: number;
}

export interface TimeOfDayBreakdown {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface RecurringTopic {
  topic: string;
  occurrences: number;
}

// Mock injection for testing
let mockDataSource: EmotionResult[] | null = null;

function getSourceData(source?: EmotionResult[]): EmotionResult[] {
  if (mockDataSource !== null) {
    return mockDataSource;
  }
  if (source) {
    return source;
  }
  return useEmotionStore().getRecent();
}

function parseTimestamp(timestamp: string): Date {
  try {
    return new Date(timestamp);
  } catch (error) {
    console.warn('Invalid timestamp format, using current date:', timestamp);
    return new Date();
  }
}

function filterByDays(data: EmotionResult[], days: number): EmotionResult[] {
  if (days <= 0) return data;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return data.filter(item => {
    try {
      const itemDate = parseTimestamp(item.detectedAt);
      return itemDate >= cutoffDate;
    } catch (error) {
      return false;
    }
  });
}

export function getEmotionFrequency(days?: number, source?: EmotionResult[]): EmotionFrequency[] {
  let data = getSourceData(source);
  
  if (days !== undefined) {
    data = filterByDays(data, days);
  }
  
  const frequencyMap: Record<EmotionState, number> = {
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
  
  // Count occurrences of each emotion
  data.forEach(item => {
    if (frequencyMap[item.emotion] !== undefined) {
      frequencyMap[item.emotion]++;
    }
  });
  
  // Convert to array and sort by count descending
  const result: EmotionFrequency[] = Object.entries(frequencyMap)
    .map(([emotion, count]) => ({ emotion: emotion as EmotionState, count }))
    .sort((a, b) => b.count - a.count);
  
  return result;
}

export function getEmotionByTimeOfDay(source?: EmotionResult[]): TimeOfDayBreakdown {
  const data = getSourceData(source);
  
  const buckets = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  };
  
  data.forEach(item => {
    try {
      const date = parseTimestamp(item.detectedAt);
      const hours = date.getHours();
      
      if (hours >= 5 && hours < 12) {
        buckets.morning++;
      } else if (hours >= 12 && hours < 17) {
        buckets.afternoon++;
      } else if (hours >= 17 && hours < 21) {
        buckets.evening++;
      } else {
        buckets.night++;
      }
    } catch (error) {
      // Skip invalid timestamps
    }
  });
  
  const total = data.length || 1; // Avoid division by zero
  
  // Return normalized proportions
  return {
    morning: buckets.morning / total,
    afternoon: buckets.afternoon / total,
    evening: buckets.evening / total,
    night: buckets.night / total
  };
}

export function getRecurringTopics(limit: number = 10, source?: EmotionResult[]): RecurringTopic[] {
  const data = getSourceData(source);
  
  const topicCounts: Record<string, number> = {};
  
  data.forEach(item => {
    if (Array.isArray(item.themes)) {
      item.themes.forEach(theme => {
        // Clean and normalize the topic
        const cleanTopic = theme
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .trim();
        
        if (cleanTopic.length > 2) { // Ignore very short topics
          topicCounts[cleanTopic] = (topicCounts[cleanTopic] || 0) + 1;
        }
      });
    }
  });
  
  // Convert to array and sort by occurrences descending
  const topics: RecurringTopic[] = Object.entries(topicCounts)
    .map(([topic, occurrences]) => ({ topic, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, limit);
  
  return topics;
}

export function getProgressMetric(days: number = 14, source?: EmotionResult[]): number {
  let data = getSourceData(source);
  
  if (days !== undefined) {
    data = filterByDays(data, days);
  }
  
  // Need at least 3 samples to calculate progress
  if (data.length < 3) {
    return 0.5;
  }
  
  // Sort by timestamp ascending
  const sortedData = [...data].sort((a, b) => {
    try {
      return parseTimestamp(a.detectedAt).getTime() - parseTimestamp(b.detectedAt).getTime();
    } catch (error) {
      return 0;
    }
  });
  
  // Split into first half and second half
  const midpoint = Math.floor(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, midpoint);
  const secondHalf = sortedData.slice(midpoint);
  
  // Calculate average intensity for each half
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.intensity, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.intensity, 0) / secondHalf.length;
  
  // Map intensity improvement to 0-1 scale
  // Lower intensity in second half indicates improvement
  const intensityDifference = firstHalfAvg - secondHalfAvg;
  
  // Normalize to 0-1 range where:
  // -1 (worsened by max) -> 0
  // 0 (no change) -> 0.5  
  // +1 (improved by max) -> 1
  const normalizedProgress = (intensityDifference / 9) + 0.5; // Divide by 9 since intensity range is 1-10
  
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, normalizedProgress));
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectMockData(data: EmotionResult[] | null): void {
    mockDataSource = data;
  },
  
  reset(): void {
    mockDataSource = null;
  },
  
  getMockDataSource(): EmotionResult[] | null {
    return mockDataSource;
  }
};