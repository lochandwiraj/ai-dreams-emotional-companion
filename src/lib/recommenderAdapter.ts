// Provide clean read-only bundles for UI, Response Generator, Audio System, and Dream Engine

import { EmotionState } from './emotionDetector';
import { getRecommendationsForEmotion } from './recommenderEngine';
import { generateInsightsForUser } from './insightGenerator';
import { getTopTopics } from './topicTracker';

export interface RecommenderBundle {
  recommendations: { responseType: string; score: number; confidence: number; rationale: string }[];
  insights: string[];
  topicHighlights: { topic: string; severity: number }[];
}

// Mock injection for testing
let mockRecommender: any = null;
let mockInsightGenerator: any = null;
let mockTopicTracker: any = null;

function getRecommender() {
  return mockRecommender || { getRecommendationsForEmotion };
}

function getInsightGenerator() {
  return mockInsightGenerator || { generateInsightsForUser };
}

function getTopicTracker() {
  return mockTopicTracker || { getTopTopics };
}

export async function getRecommenderBundleForEmotion(
  emotion: EmotionState,
  opts?: { maxRecommendations?: number; maxInsights?: number }
): Promise<RecommenderBundle> {
  const maxRecommendations = opts?.maxRecommendations || 5;
  const maxInsights = opts?.maxInsights || 5;
  
  const bundle: RecommenderBundle = {
    recommendations: [],
    insights: [],
    topicHighlights: []
  };
  
  try {
    // Get recommendations from recommender engine
    try {
      const recommendations = await getRecommender().getRecommendationsForEmotion(emotion, { max: maxRecommendations });
      bundle.recommendations = recommendations.map(rec => ({
        responseType: rec.responseType,
        score: rec.normalizedScore,
        confidence: rec.confidence,
        rationale: rec.rationale
      }));
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      // Fallback recommendations
      bundle.recommendations = [
        {
          responseType: 'conversation',
          score: 0.8,
          confidence: 0.5,
          rationale: `Talking through ${emotion} feelings can provide perspective and support.`
        },
        {
          responseType: 'music',
          score: 0.7,
          confidence: 0.5,
          rationale: `Music often helps shift ${emotion} moods and improve emotional state.`
        }
      ].slice(0, maxRecommendations);
    }
    
    // Get insights from insight generator
    try {
      const insights = getInsightGenerator().generateInsightsForUser(maxInsights);
      bundle.insights = insights;
    } catch (error) {
      console.error('Failed to get insights:', error);
      // Fallback insights
      bundle.insights = [
        `You've been experiencing ${emotion} feelings recently.`,
        "Noticing emotional patterns is the first step toward understanding.",
        "Regular check-ins help track how different topics affect your mood."
      ].slice(0, maxInsights);
    }
    
    // Get topic highlights from topic tracker
    try {
      const topTopics = getTopicTracker().getTopTopics(5);
      bundle.topicHighlights = topTopics.map(topic => ({
        topic: topic.topic,
        severity: topic.severityScore
      }));
    } catch (error) {
      console.error('Failed to get topic highlights:', error);
      // Fallback topic highlights
      bundle.topicHighlights = [
        { topic: 'daily-routine', severity: 0.3 },
        { topic: 'work', severity: 0.4 },
        { topic: 'relationships', severity: 0.5 }
      ].slice(0, 3);
    }
    
  } catch (error) {
    console.error('Failed to generate recommender bundle:', error);
    // Ensure we always return a valid bundle structure
    if (bundle.recommendations.length === 0) {
      bundle.recommendations = [{
        responseType: 'conversation',
        score: 0.5,
        confidence: 0.3,
        rationale: 'Let\'s talk about how you\'re feeling.'
      }];
    }
    
    if (bundle.insights.length === 0) {
      bundle.insights = ['We\'re here to support you through your emotional journey.'];
    }
    
    if (bundle.topicHighlights.length === 0) {
      bundle.topicHighlights = [{ topic: 'emotional-patterns', severity: 0.5 }];
    }
  }
  
  // Apply final limits
  bundle.recommendations = bundle.recommendations.slice(0, maxRecommendations);
  bundle.insights = bundle.insights.slice(0, maxInsights);
  bundle.topicHighlights = bundle.topicHighlights.slice(0, 5);
  
  return bundle;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectRecommender(r: any): void {
    mockRecommender = r;
  },
  
  injectInsightGenerator(i: any): void {
    mockInsightGenerator = i;
  },
  
  injectTopicTracker(t: any): void {
    mockTopicTracker = t;
  },
  
  reset(): void {
    mockRecommender = null;
    mockInsightGenerator = null;
    mockTopicTracker = null;
  }
};