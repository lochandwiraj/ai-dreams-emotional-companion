import { callOpenRouter } from '../openrouter';
import { buildEmotionDetectionPrompt } from './emotionPrompts';
import { EmotionResult, EmotionState } from './emotionTypes';

// Fallback keyword detection if API fails
const EMOTION_KEYWORDS: Record<EmotionState, string[]> = {
  sad: ['sad', 'depressed', 'down', 'hopeless', 'cry', 'crying', 'heartbroken', 'miserable'],
  angry: ['angry', 'furious', 'hate', 'frustrated', 'mad', 'annoyed', 'irritated', 'pissed'],
  anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'panic', 'terrified', 'fear'],
  stressed: ['stressed', 'overwhelmed', 'pressure', 'busy', 'swamped', 'deadline', 'too much'],
  lonely: ['lonely', 'alone', 'isolated', 'nobody', 'disconnected', 'abandoned'],
  excited: ['excited', 'happy', 'joy', 'thrilled', 'amazing', 'wonderful', 'great', 'love'],
  neutral: ['okay', 'fine', 'alright', 'normal'],
  confused: ['confused', 'unclear', 'dont understand', "don't know", 'lost', 'uncertain'],
  overwhelmed: ['overwhelmed', 'cant handle', "can't cope", 'too much', 'drowning', 'breaking']
};

export async function detectEmotion(userMessage: string): Promise<EmotionResult> {
  try {
    // Call OpenRouter API
    const prompt = buildEmotionDetectionPrompt(userMessage);
    const response = await callOpenRouter(prompt, {
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent classification
      maxTokens: 200
    });

    // Parse JSON response
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const result: EmotionResult = {
      emotion: parsed.emotion,
      confidence: parsed.confidence,
      intensity: parsed.intensity,
      themes: parsed.themes || [],
      needsSupport: parsed.needsSupport,
      timestamp: new Date()
    };

    // Cache this result
    cacheEmotionResult(result);

    return result;

  } catch (error) {
    console.error('Emotion detection failed, using fallback:', error);
    return fallbackEmotionDetection(userMessage);
  }
}

// Fallback: Simple keyword matching
function fallbackEmotionDetection(message: string): EmotionResult {
  const lowerMessage = message.toLowerCase();
  const scores: Record<EmotionState, number> = {
    sad: 0, angry: 0, anxious: 0, stressed: 0, 
    lonely: 0, excited: 0, neutral: 0, confused: 0, overwhelmed: 0
  };

  // Count keyword matches
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[emotion as EmotionState]++;
      }
    }
  }

  // Find highest score
  const topEmotion = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0];

  const emotion = topEmotion[0] as EmotionState;
  const matchCount = topEmotion[1];

  return {
    emotion: matchCount > 0 ? emotion : 'neutral',
    confidence: matchCount > 0 ? Math.min(matchCount * 0.3, 0.8) : 0.5,
    intensity: matchCount > 0 ? Math.min(matchCount * 0.25, 0.9) : 0.3,
    themes: [],
    needsSupport: ['sad', 'anxious', 'overwhelmed'].includes(emotion) && matchCount > 2,
    timestamp: new Date()
  };
}

// Cache management (simple in-memory for now)
const emotionCache: EmotionResult[] = [];
const MAX_CACHE_SIZE = 10;

function cacheEmotionResult(result: EmotionResult) {
  emotionCache.unshift(result);
  if (emotionCache.length > MAX_CACHE_SIZE) {
    emotionCache.pop();
  }
}

export function getEmotionHistory(): EmotionResult[] {
  return [...emotionCache];
}

export function getEmotionTrends(limit: number = 5): Record<EmotionState, number> {
  const recent = emotionCache.slice(0, limit);
  const counts: Record<EmotionState, number> = {
    sad: 0, angry: 0, anxious: 0, stressed: 0,
    lonely: 0, excited: 0, neutral: 0, confused: 0, overwhelmed: 0
  };

  recent.forEach(result => {
    counts[result.emotion]++;
  });

  return counts;
}