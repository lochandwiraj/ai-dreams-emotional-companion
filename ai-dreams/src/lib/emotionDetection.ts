// src/lib/emotionDetection.ts
export type EmotionType = 
  | 'sad' 
  | 'anxious' 
  | 'stressed' 
  | 'angry' 
  | 'lonely' 
  | 'excited' 
  | 'calm' 
  | 'neutral';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number; // 0-1
  intensity: number; // 0-1
  keywords: string[];
}

const EMOTION_PATTERNS: Record<EmotionType, string[]> = {
  sad: ['sad', 'depressed', 'down', 'unhappy', 'crying', 'tears', 'heartbroken', 'grief', 'loss', 'miss', 'blue', 'miserable', 'hopeless', 'devastated', 'hurt', 'pain', 'sorrow', 'melancholy', 'gloomy', 'disappointed'],
  anxious: ['anxious', 'worried', 'nervous', 'panic', 'fear', 'scared', 'overwhelmed', 'stress', 'tense', 'uneasy', 'restless', 'jittery', 'on edge', 'freaking out', 'terrified', 'afraid', 'concerned', 'apprehensive', 'dread'],
  stressed: ['stressed', 'pressure', 'overwhelmed', 'busy', 'exhausted', 'tired', 'burnout', 'too much', 'swamped', 'overworked', 'drained', 'worn out', 'frazzled', 'stretched', 'burden', 'heavy', 'weighed down'],
  angry: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'rage', 'hate', 'pissed', 'upset', 'livid', 'outraged', 'resentful', 'bitter', 'hostile', 'aggravated', 'infuriated', 'enraged'],
  lonely: ['lonely', 'alone', 'isolated', 'nobody', 'empty', 'abandoned', 'disconnected', 'solitary', 'friendless', 'unwanted', 'rejected', 'excluded', 'left out', 'invisible', 'forgotten'],
  excited: ['excited', 'happy', 'joy', 'great', 'amazing', 'wonderful', 'love', 'thrilled', 'awesome', 'fantastic', 'brilliant', 'excellent', 'delighted', 'ecstatic', 'elated', 'cheerful', 'glad', 'pleased', 'pumped', 'stoked', 'energized'],
  calm: ['calm', 'peaceful', 'relaxed', 'content', 'serene', 'tranquil', 'okay', 'fine', 'chill', 'mellow', 'composed', 'balanced', 'centered', 'at ease', 'comfortable', 'settled'],
  neutral: ['neutral', 'normal', 'regular', 'usual', 'ordinary', 'nothing special']
};

const INTENSITY_WORDS = {
  high: ['very', 'extremely', 'really', 'so', 'incredibly', 'totally', 'completely'],
  low: ['a bit', 'slightly', 'somewhat', 'kind of', 'sort of', 'little']
};

export function detectEmotion(text: string): EmotionResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  
  const scores: Record<EmotionType, number> = {
    sad: 0,
    anxious: 0,
    stressed: 0,
    angry: 0,
    lonely: 0,
    excited: 0,
    calm: 0,
    neutral: 0
  };

  const foundKeywords: string[] = [];

  // Score each emotion
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        scores[emotion as EmotionType] += 1;
        foundKeywords.push(pattern);
      }
    }
  }

  // Find dominant emotion
  let maxScore = 0;
  let dominantEmotion: EmotionType = 'neutral';
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion as EmotionType;
    }
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.3;

  // Calculate intensity
  let intensity = 0.5;
  for (const word of INTENSITY_WORDS.high) {
    if (lower.includes(word)) intensity = Math.min(1, intensity + 0.2);
  }
  for (const word of INTENSITY_WORDS.low) {
    if (lower.includes(word)) intensity = Math.max(0, intensity - 0.2);
  }

  return {
    emotion: dominantEmotion,
    confidence,
    intensity,
    keywords: foundKeywords
  };
}

export function getEmotionColor(emotion: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    sad: '#6B7FD7',
    anxious: '#E07856',
    stressed: '#D97757',
    angry: '#E63946',
    lonely: '#8B7FB8',
    excited: '#FFB703',
    calm: '#06D6A0',
    neutral: '#8D99AE'
  };
  return colors[emotion];
}
