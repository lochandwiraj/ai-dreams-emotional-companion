export type EmotionState = 
  | 'sad' 
  | 'angry' 
  | 'anxious' 
  | 'stressed' 
  | 'lonely' 
  | 'excited' 
  | 'neutral' 
  | 'overwhelmed';

export type ResponseType = 
  | 'empathetic-listening'
  | 'validation'
  | 'guided-visualization'
  | 'actionable-advice'
  | 'reflective-question'
  | 'affirmation'
  | 'music-suggestion';

export interface EmotionResult {
  emotion: EmotionState;
  confidence: number;
  intensity: number;
  themes: string[];
  needsSupport: boolean;
}

export interface UserPreferences {
  helpfulResponses: string[];
  unhelpfulResponses: string[];
  preferredActivities: Record<string, number>;
  emotionPatterns: Record<EmotionState, string[]>;
  musicPreferences: {
    genres: string[];
    avoidGenres: string[];
  };
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration: number;
  category: 'ambient' | 'nature' | 'meditation' | 'instrumental';
  emotions: EmotionState[];
  intensity: 'low' | 'medium' | 'high';
  tags: string[];
}
