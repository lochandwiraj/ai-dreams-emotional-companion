// Adaptive recalibration of user preference weights to handle drift, noise, and outliers

import { getPreferences } from './preferenceEngine';
import { getRecentFeedback } from './feedbackEngine';
import { computeDriftScore, clamp01 } from './preferenceMath';

export interface RecalibrationResult {
  recalibratedPreferences: Record<string, number>;
  driftScore: number;
  reLearnRecommended: boolean;
  credibilityFactor: number;
  timestamp: string;
}

export class RecalibratorDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecalibratorDependencyError';
  }
}

// Mock injection for testing
let mockPreferenceEngine: any = null;
let mockFeedbackEngine: any = null;
let mockMath: any = null;

function getPreferenceEngine() {
  if (mockPreferenceEngine) return mockPreferenceEngine;
  if (!getPreferences) throw new RecalibratorDependencyError('preferenceEngine.getPreferences not available');
  return { getPreferences };
}

function getFeedbackEngine() {
  if (mockFeedbackEngine) return mockFeedbackEngine;
  if (!getRecentFeedback) throw new RecalibratorDependencyError('feedbackEngine.getRecentFeedback not available');
  return { getRecentFeedback };
}

function getMath() {
  if (mockMath) return mockMath;
  if (!computeDriftScore || !clamp01) throw new RecalibratorDependencyError('preferenceMath utilities not available');
  return { computeDriftScore, clamp01 };
}

let forceRelearnFlag = false;

export async function recalibratePreferences(options?: {
  lookbackSamples?: number;
  minSamplesForAction?: number;
}): Promise<RecalibrationResult> {
  const lookbackSamples = options?.lookbackSamples || 50;
  const minSamplesForAction = options?.minSamplesForAction || 10;
  
  try {
    const preferenceEngine = getPreferenceEngine();
    const feedbackEngine = getFeedbackEngine();
    const math = getMath();
    
    // Get current preferences and recent feedback
    const preferences = preferenceEngine.getPreferences();
    const recentFeedback = feedbackEngine.getRecentFeedback(lookbackSamples);
    
    // Check if we have enough samples
    if (recentFeedback.length < minSamplesForAction) {
      return {
        recalibratedPreferences: { ...preferences.preferredActivities },
        driftScore: 0.5,
        reLearnRecommended: false,
        credibilityFactor: 0.1,
        timestamp: new Date().toISOString()
      };
    }
    
    // Compute drift score over activity weights
    const activityHistory = Object.keys(preferences.preferredActivities).map(activity => {
      // For drift calculation, we need historical data - using current as placeholder
      // In a real implementation, we'd need to store historical preference values
      return {
        timestamp: new Date().toISOString(),
        value: preferences.preferredActivities[activity as keyof typeof preferences.preferredActivities]
      };
    });
    
    const driftScore = math.computeDriftScore(activityHistory);
    
    // Compute credibility factor
    const credibilityFactor = computeCredibilityFactorInternal(recentFeedback);
    
    // Apply smoothing to current preferences
    const recalibratedPreferences = applySmoothingInternal(preferences.preferredActivities, 0.3);
    
    // Determine if re-learn is recommended
    const reLearnRecommended = forceRelearnFlag || (driftScore > 0.6 && credibilityFactor > 0.4);
    
    // Reset force relearn flag if it was set
    if (forceRelearnFlag) {
      forceRelearnFlag = false;
    }
    
    return {
      recalibratedPreferences,
      driftScore,
      reLearnRecommended,
      credibilityFactor,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    if (error instanceof RecalibratorDependencyError) {
      throw error;
    }
    
    console.error('Recalibration failed:', error);
    throw new Error('Recalibration process failed');
  }
}

export function applySmoothing(preferences: Record<string, number>, smoothingFactor: number = 0.3): Record<string, number> {
  return applySmoothingInternal(preferences, smoothingFactor);
}

function applySmoothingInternal(preferences: Record<string, number>, smoothingFactor: number): Record<string, number> {
  const math = getMath();
  const smoothed: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(preferences)) {
    // Exponential smoothing: new_value = smoothingFactor * current + (1 - smoothingFactor) * previous
    // Since we don't have previous values, we smooth toward neutral (0.5)
    const neutralTarget = 0.5;
    const smoothedValue = (smoothingFactor * value) + ((1 - smoothingFactor) * neutralTarget);
    smoothed[key] = math.clamp01(smoothedValue);
  }
  
  return smoothed;
}

export function computeCredibilityFactor(windowSeconds: number = 604800): number {
  try {
    const feedbackEngine = getFeedbackEngine();
    const recentFeedback = feedbackEngine.getRecentFeedback(100); // Get up to 100 samples
    
    // Filter feedback within time window
    const cutoffTime = Date.now() - (windowSeconds * 1000);
    const windowFeedback = recentFeedback.filter(feedback => {
      try {
        const feedbackTime = new Date(feedback.detectedAt).getTime();
        return feedbackTime >= cutoffTime;
      } catch {
        return false;
      }
    });
    
    return computeCredibilityFactorInternal(windowFeedback);
  } catch (error) {
    console.error('Failed to compute credibility factor:', error);
    return 0.1;
  }
}

function computeCredibilityFactorInternal(feedback: any[]): number {
  if (feedback.length === 0) {
    return 0.1;
  }
  
  // Calculate feedback density (samples per day)
  if (feedback.length < 2) {
    return 0.2;
  }
  
  // Calculate consistency (helpful rate stability)
  const helpfulCount = feedback.filter(f => f.helpful).length;
  const totalCount = feedback.length;
  const helpfulRate = helpfulCount / totalCount;
  
  // Calculate variance in helpfulness
  const batches: boolean[][] = [];
  const batchSize = Math.max(2, Math.floor(feedback.length / 3));
  
  for (let i = 0; i < feedback.length; i += batchSize) {
    batches.push(feedback.slice(i, i + batchSize).map(f => f.helpful));
  }
  
  if (batches.length < 2) {
    return Math.min(0.8, helpfulRate);
  }
  
  const batchRates = batches.map(batch => {
    const helpfulInBatch = batch.filter(Boolean).length;
    return helpfulInBatch / batch.length;
  });
  
  // Lower variance = higher credibility
  const mean = batchRates.reduce((sum, rate) => sum + rate, 0) / batchRates.length;
  const variance = batchRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / batchRates.length;
  
  // Combine factors: higher helpful rate and lower variance = higher credibility
  const helpfulFactor = helpfulRate;
  const consistencyFactor = Math.max(0, 1 - (variance * 2)); // Penalize high variance
  
  return (helpfulFactor * 0.6) + (consistencyFactor * 0.4);
}

export function forceRelearnNow(): void {
  forceRelearnFlag = true;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectPreferenceEngine(pe: any): void {
    mockPreferenceEngine = pe;
  },
  
  injectFeedbackEngine(fe: any): void {
    mockFeedbackEngine = fe;
  },
  
  injectMath(m: any): void {
    mockMath = m;
  },
  
  reset(): void {
    mockPreferenceEngine = null;
    mockFeedbackEngine = null;
    mockMath = null;
    forceRelearnFlag = false;
  },
  
  getForceRelearnFlag(): boolean {
    return forceRelearnFlag;
  }
};