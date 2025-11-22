// src/types.ts
export type AIState = "awake" | "drowsy" | "dreaming" | "waking";

export interface Personality {
  tone: number;
  curiosity: number;
  interests: string[];
  memoryWeights: Record<string, number>;
}

export interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
  associatedSymbols: string[];
}

export interface Dream {
  id: string;
  timestamp: string;
  narrative: string;
  emotionalTone: string;
  symbols: string[];
  personalityShift: Partial<Personality>;
  triggerMemories: string[];
}
