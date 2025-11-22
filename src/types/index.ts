// src/types/index.ts
export type AIState = 'awake' | 'drowsy' | 'dreaming' | 'waking';

export interface Personality {
  tone: number;           // 0-1: analytical to emotional
  curiosity: number;      // 0-1: focused to exploratory
  interests: string[];    // accumulated topics
  memoryWeights: Record<string, number>;
}

export interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;     // 0-1
  associatedSymbols: string[];
}

export interface Dream {
  id: string;
  timestamp: string;
  narrative: string;
  emotionalTone: 'peaceful' | 'anxious' | 'curious' | 'excited';
  symbols: string[];
  personalityShift: Partial<Personality>;
  triggerMemories: string[];  // which memories triggered this
}