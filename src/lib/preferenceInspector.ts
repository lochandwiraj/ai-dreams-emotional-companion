// Explainability layer producing concise human-readable explanations for recommendations

import { EmotionState } from './emotionDetector';
import { getConfidenceForRecommendation } from './recommenderEngine';
import { getPreferences } from './preferenceEngine';
import { computeDriftScore } from './preferenceMath';

export interface InspectResult {
  responseType: string;
  emotion: EmotionState;
  topSignals: { signal: string; weight: number }[];
  confidence: number;
  humanReadable: string;
  timestamp: string;
}

// Mock injection for testing
let mockRecommender: any = null;
let mockPreferenceEngine: any = null;
let mockMath: any = null;

function getRecommender() {
  return mockRecommender || { getConfidenceForRecommendation };
}

function getPreferenceEngine() {
  return mockPreferenceEngine || { getPreferences };
}

function getMath() {
  return mockMath || { computeDriftScore };
}

export async function inspectRecommendation(
  responseType: string, 
  emotion: EmotionState, 
  context?: { topTopics?: string[]; recentFeedbackCount?: number }
): Promise<InspectResult> {
  const timestamp = new Date().toISOString();
  
  try {
    const recommender = getRecommender();
    const preferenceEngine = getPreferenceEngine();
    
    // Get confidence score
    const confidence = await recommender.getConfidenceForRecommendation(responseType, emotion);
    
    // Collect signals with weights
    const signals: { signal: string; weight: number }[] = [];
    
    try {
      // Signal 1: Preference strength
      const preferences = preferenceEngine.getPreferences();
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
        const preferenceWeight = preferences.preferredActivities[activity];
        signals.push({
          signal: `Your preference for ${activity}`,
          weight: preferenceWeight
        });
      }
    } catch (error) {
      // Continue without preference signal
    }
    
    // Signal 2: Emotion-response compatibility
    const emotionCompatibility: Record<EmotionState, Record<string, number>> = {
      sad: { conversation: 0.9, music: 0.8, meditation: 0.6 },
      angry: { meditation: 0.9, breathing: 0.8, exercise: 0.7 },
      anxious: { meditation: 0.9, breathing: 0.9, mindfulness: 0.8 },
      stressed: { meditation: 0.8, breathing: 0.8, music: 0.7 },
      lonely: { conversation: 0.9, music: 0.7, journaling: 0.6 },
      excited: { music: 0.8, conversation: 0.7, exercise: 0.7 },
      neutral: { conversation: 0.7, music: 0.6, meditation: 0.5 },
      confused: { conversation: 0.8, reflection: 0.9, journaling: 0.7 },
      overwhelmed: { meditation: 0.9, breathing: 0.8, mindfulness: 0.7 }
    };
    
    const compatibilityScore = emotionCompatibility[emotion]?.[responseType] || 0.5;
    signals.push({
      signal: `How well this works for ${emotion} feelings`,
      weight: compatibilityScore
    });
    
    // Signal 3: Recent feedback or topic relevance
    const recentFeedbackCount = context?.recentFeedbackCount || 0;
    if (recentFeedbackCount > 0) {
      const feedbackWeight = Math.min(recentFeedbackCount / 5, 1.0);
      signals.push({
        signal: 'Recent positive feedback patterns',
        weight: feedbackWeight
      });
    } else if (context?.topTopics && context.topTopics.length > 0) {
      signals.push({
        signal: 'Relevance to your frequent topics',
        weight: 0.6
      });
    } else {
      signals.push({
        signal: 'General effectiveness for emotional support',
        weight: 0.5
      });
    }
    
    // Sort signals by weight and take top 3
    const topSignals = signals
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    
    // Generate human-readable explanation
    const humanReadable = generateHumanReadableExplanation(responseType, emotion, confidence, topSignals);
    
    return {
      responseType,
      emotion,
      topSignals,
      confidence,
      humanReadable,
      timestamp
    };
    
  } catch (error) {
    console.error('Inspection failed:', error);
    
    // Fallback result when dependencies are missing
    return {
      responseType,
      emotion,
      topSignals: [{
        signal: 'Insufficient data for detailed analysis',
        weight: 0.1
      }],
      confidence: 0.1,
      humanReadable: 'We need more data to explain this recommendation. This is a generally helpful approach for your current emotional state.',
      timestamp
    };
  }
}

export function explainDrift(activity: string): { driftScore: number; reason: string } {
  try {
    const math = getMath();
    
    // Simplified drift calculation - in real implementation would use historical data
    const mockHistory = [
      { timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), value: 0.7 },
      { timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), value: 0.6 },
      { timestamp: new Date().toISOString(), value: 0.4 }
    ];
    
    const driftScore = math.computeDriftScore(mockHistory);
    
    let reason: string;
    if (driftScore > 0.7) {
      reason = `Your engagement with ${activity} has changed significantly over time, suggesting your preferences may be evolving.`;
    } else if (driftScore > 0.4) {
      reason = `We're noticing some gradual changes in how you engage with ${activity}.`;
    } else {
      reason = `Your engagement with ${activity} has remained relatively consistent.`;
    }
    
    return {
      driftScore,
      reason
    };
    
  } catch (error) {
    console.error('Drift explanation failed:', error);
    
    return {
      driftScore: 0.5,
      reason: `We don't have enough historical data to analyze changes in your ${activity} preferences.`
    };
  }
}

function generateHumanReadableExplanation(
  responseType: string, 
  emotion: EmotionState, 
  confidence: number, 
  topSignals: { signal: string; weight: number }[]
): string {
  const responseTypeNames: Record<string, string> = {
    'meditation': 'meditation',
    'breathing': 'breathing exercises',
    'mindfulness': 'mindfulness practice',
    'music': 'music',
    'song': 'a song',
    'playlist': 'a playlist',
    'conversation': 'conversation',
    'reflection': 'reflection',
    'validation': 'emotional validation',
    'visualization': 'visualization',
    'imagery': 'guided imagery',
    'guided-imagery': 'guided imagery',
    'exercise': 'physical activity',
    'movement': 'movement',
    'stretch': 'stretching',
    'journaling': 'journaling',
    'writing': 'writing',
    'prompt': 'a writing prompt',
    'gratitude': 'gratitude practice',
    'appreciation': 'appreciation exercise',
    'positive-focus': 'positive focus'
  };
  
  const responseName = responseTypeNames[responseType] || responseType;
  
  // Base explanation template
  let baseExplanation = `Based on your patterns, ${responseName} may help with ${emotion} feelings`;
  
  // Add hedging for low confidence
  if (confidence < 0.6) {
    baseExplanation = `This suggestion of ${responseName} might help with ${emotion} feelings`;
  }
  
  if (confidence < 0.3) {
    return `${baseExplanation}, though we're still learning what works best for you.`;
  }
  
  // Add signal-based details
  const strongestSignal = topSignals[0];
  if (strongestSignal && strongestSignal.weight > 0.7) {
    if (strongestSignal.signal.includes('preference')) {
      return `${baseExplanation}, especially since you've shown interest in this type of support before.`;
    } else if (strongestSignal.signal.includes('works for')) {
      return `${baseExplanation}, as this approach often helps people experiencing similar emotions.`;
    } else if (strongestSignal.signal.includes('feedback')) {
      return `${baseExplanation}, building on what's been helpful for you recently.`;
    } else if (strongestSignal.signal.includes('topics')) {
      return `${baseExplanation}, given the topics you've been discussing.`;
    }
  }
  
  // Default explanation
  return `${baseExplanation}. We adjust these suggestions as we learn more about what supports you best.`;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectRecommender(r: any): void {
    mockRecommender = r;
  },
  
  injectPreferenceEngine(pe: any): void {
    mockPreferenceEngine = pe;
  },
  
  injectMath(m: any): void {
    mockMath = m;
  },
  
  reset(): void {
    mockRecommender = null;
    mockPreferenceEngine = null;
    mockMath = null;
  }
};