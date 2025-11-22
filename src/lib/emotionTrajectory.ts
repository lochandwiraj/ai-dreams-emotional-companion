// Compute long-term emotion trajectories and volatility indices

import { EmotionState, EmotionResult } from './emotionDetector';
import { useEmotionStore } from '../store/emotionStore';

export interface TrajectoryMetrics {
  windowDays: number;
  averageIntensity: number;
  dominantEmotion: EmotionState | null;
  intensitySlope: number;
  volatilityIndex: number;
  recoveryRate: number;
  sampleCount: number;
}

// Mock injection for testing
let mockEmotionStore: typeof useEmotionStore | null = null;

function getEmotionStore() {
  return mockEmotionStore ? mockEmotionStore() : useEmotionStore();
}

function filterByDays(data: EmotionResult[], windowDays: number): EmotionResult[] {
  if (windowDays <= 0) return data;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  
  return data.filter(item => {
    try {
      const itemDate = new Date(item.detectedAt);
      return itemDate >= cutoffDate;
    } catch (error) {
      return false;
    }
  });
}

function groupByDay(data: EmotionResult[]): Map<string, EmotionResult[]> {
  const dayMap = new Map<string, EmotionResult[]>();
  
  data.forEach(item => {
    try {
      const date = new Date(item.detectedAt);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, []);
      }
      dayMap.get(dayKey)!.push(item);
    } catch (error) {
      // Skip invalid timestamps
    }
  });
  
  return dayMap;
}

function calculateDailyAverages(dayMap: Map<string, EmotionResult[]>): { day: string; intensity: number; dominantEmotion: EmotionState }[] {
  const dailyAverages: { day: string; intensity: number; dominantEmotion: EmotionState }[] = [];
  
  for (const [day, items] of dayMap.entries()) {
    if (items.length === 0) continue;
    
    const totalIntensity = items.reduce((sum, item) => sum + item.intensity, 0);
    const avgIntensity = totalIntensity / items.length;
    
    // Find dominant emotion for the day
    const emotionCounts: Record<EmotionState, number> = {
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
    
    items.forEach(item => {
      emotionCounts[item.emotion]++;
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as EmotionState;
    
    dailyAverages.push({
      day,
      intensity: avgIntensity,
      dominantEmotion
    });
  }
  
  // Sort by date ascending
  dailyAverages.sort((a, b) => a.day.localeCompare(b.day));
  
  return dailyAverages;
}

function computeLinearSlope(data: { day: string; intensity: number }[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const x = data.map((_, index) => index);
  const y = data.map(item => item.intensity);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  return slope;
}

function computeVolatilityIndex(intensities: number[]): number {
  if (intensities.length < 2) return 0;
  
  const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
  const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-1 range (assuming intensity range 1-10)
  const maxPossibleStdDev = Math.sqrt(((10 - 1) ** 2) / 4); // Approx max std dev for uniform distribution
  const normalizedVolatility = stdDev / maxPossibleStdDev;
  
  return Math.min(1, Math.max(0, normalizedVolatility));
}

function computeRecoveryRate(data: EmotionResult[]): number {
  if (data.length < 3) return 0.5;
  
  const highIntensityThreshold = 7; // >0.7 of max intensity 10
  const baselineThreshold = 5; // <0.5 of max intensity 10
  
  let totalRecoveryTime = 0;
  let recoveryEvents = 0;
  
  // Sort by timestamp ascending
  const sortedData = [...data].sort((a, b) => 
    new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
  );
  
  let highIntensityStart: Date | null = null;
  
  for (let i = 0; i < sortedData.length; i++) {
    const current = sortedData[i];
    
    if (current.intensity > highIntensityThreshold && !highIntensityStart) {
      // Start of high intensity period
      highIntensityStart = new Date(current.detectedAt);
    } else if (current.intensity <= baselineThreshold && highIntensityStart) {
      // Recovery to baseline
      const recoveryTimeMs = new Date(current.detectedAt).getTime() - highIntensityStart.getTime();
      const recoveryTimeDays = recoveryTimeMs / (1000 * 60 * 60 * 24);
      
      totalRecoveryTime += recoveryTimeDays;
      recoveryEvents++;
      highIntensityStart = null;
    }
  }
  
  if (recoveryEvents === 0) return 0.5;
  
  const averageRecoveryDays = totalRecoveryTime / recoveryEvents;
  
  // Normalize recovery rate: faster recovery = higher score
  // Assuming 7 days is maximum expected recovery time
  const maxRecoveryDays = 7;
  const recoveryRate = Math.max(0, 1 - (averageRecoveryDays / maxRecoveryDays));
  
  return Math.min(1, recoveryRate);
}

export function computeTrajectoryMetrics(windowDays: number = 30, source?: EmotionResult[]): TrajectoryMetrics {
  let data = source || getEmotionStore().getRecent();
  
  if (windowDays > 0) {
    data = filterByDays(data, windowDays);
  }
  
  if (data.length < 3) {
    return {
      windowDays,
      averageIntensity: 5,
      dominantEmotion: null,
      intensitySlope: 0,
      volatilityIndex: 0.5,
      recoveryRate: 0.5,
      sampleCount: data.length
    };
  }
  
  // Group by day and compute daily averages
  const dayMap = groupByDay(data);
  const dailyAverages = calculateDailyAverages(dayMap);
  
  // Calculate overall metrics
  const totalIntensity = data.reduce((sum, item) => sum + item.intensity, 0);
  const averageIntensity = totalIntensity / data.length;
  
  // Find dominant emotion overall
  const emotionCounts: Record<EmotionState, number> = {
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
  
  data.forEach(item => {
    emotionCounts[item.emotion]++;
  });
  
  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0][0] as EmotionState;
  
  // Calculate intensity slope
  const intensitySlope = computeLinearSlope(dailyAverages.map(avg => ({ day: avg.day, intensity: avg.intensity })));
  
  // Calculate volatility index
  const intensities = data.map(item => item.intensity);
  const volatilityIndex = computeVolatilityIndex(intensities);
  
  // Calculate recovery rate
  const recoveryRate = computeRecoveryRate(data);
  
  return {
    windowDays,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    dominantEmotion,
    intensitySlope: Math.round(intensitySlope * 100) / 100,
    volatilityIndex: Math.round(volatilityIndex * 100) / 100,
    recoveryRate: Math.round(recoveryRate * 100) / 100,
    sampleCount: data.length
  };
}

export function computeTopicTrajectory(
  topic: string, 
  windowDays: number = 30, 
  source?: { emotions?: EmotionResult[]; topicStoreSnapshot?: any }
): {
  topic: string;
  averageIntensity: number;
  intensitySlope: number;
  volatilityIndex: number;
  occurrences: number;
} {
  let emotionData = source?.emotions || getEmotionStore().getRecent();
  
  if (windowDays > 0) {
    emotionData = filterByDays(emotionData, windowDays);
  }
  
  // Filter emotions that mention the topic in themes
  const topicEmotions = emotionData.filter(item => 
    Array.isArray(item.themes) && 
    item.themes.some(theme => 
      theme.toLowerCase().includes(topic.toLowerCase())
    )
  );
  
  if (topicEmotions.length < 3) {
    return {
      topic,
      averageIntensity: 5,
      intensitySlope: 0,
      volatilityIndex: 0.5,
      occurrences: topicEmotions.length
    };
  }
  
  // Calculate topic-specific metrics
  const totalIntensity = topicEmotions.reduce((sum, item) => sum + item.intensity, 0);
  const averageIntensity = totalIntensity / topicEmotions.length;
  
  // Group by day for slope calculation
  const dayMap = groupByDay(topicEmotions);
  const dailyAverages = calculateDailyAverages(dayMap);
  const intensitySlope = computeLinearSlope(dailyAverages.map(avg => ({ day: avg.day, intensity: avg.intensity })));
  
  // Calculate volatility
  const intensities = topicEmotions.map(item => item.intensity);
  const volatilityIndex = computeVolatilityIndex(intensities);
  
  return {
    topic,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    intensitySlope: Math.round(intensitySlope * 100) / 100,
    volatilityIndex: Math.round(volatilityIndex * 100) / 100,
    occurrences: topicEmotions.length
  };
}

export function getLongTermProfile(): {
  last30Days: TrajectoryMetrics;
  last14Days: TrajectoryMetrics;
  last7Days: TrajectoryMetrics;
  last1Day: TrajectoryMetrics;
} {
  return {
    last30Days: computeTrajectoryMetrics(30),
    last14Days: computeTrajectoryMetrics(14),
    last7Days: computeTrajectoryMetrics(7),
    last1Day: computeTrajectoryMetrics(1)
  };
}

export function resetTrajectories(): void {
  // This function primarily resets any cached state
  // The actual emotion data is managed by the emotion store
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectEmotionStore(es: typeof useEmotionStore | null): void {
    mockEmotionStore = es;
  },
  
  reset(): void {
    mockEmotionStore = null;
  }
};