export type EmotionState = 
  | 'sad' 
  | 'angry' 
  | 'anxious' 
  | 'stressed' 
  | 'lonely' 
  | 'excited' 
  | 'neutral' 
  | 'confused'
  | 'overwhelmed';

export interface EmotionResult {
  emotion: EmotionState;
  confidence: number;        // 0-1
  intensity: number;         // 0-1, how strongly they feel it
  themes: string[];          // Detected topics: ["work", "relationships"]
  needsSupport: boolean;     // High intensity negative emotion
  timestamp: Date;
}

export interface EmotionHistory {
  emotions: EmotionResult[];
  patterns: Record<EmotionState, number>; // Frequency count
}