// src/store/aiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shouldConnect, normalize } from "../lib/similarityEngine";
import { EmotionType } from "../lib/emotionDetection";

/* ---------------------------- TYPES ---------------------------- */

export type AIState = "awake" | "drowsy" | "dreaming" | "waking";

export interface Personality {
  tone: number;
  curiosity: number;
  interests: string[];
  memoryWeights: Record<string, number>;
}

export interface EmotionalState {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
  message: string;
}

export interface ResponseFeedback {
  responseId: string;
  liked: boolean;
  emotion: EmotionType;
  timestamp: number;
}

export interface MemoryNode {
  id: string;
  content: string;        // normalized content
  fullMessage: string;    // original message
  timestamp: number;
  importance: number;
  position: { x: number; y: number; z: number };
}

export interface Dream {
  id: string;
  timestamp: string;
  narrative: string;
  emotionalTone: "peaceful" | "anxious" | "curious" | "excited";
  symbols: string[];
  personalityShift?: Partial<Personality>;
}

interface AIStore {
  state: AIState;
  personality: Personality;
  memories: MemoryNode[];
  connections: Array<[string, string]>;
  dreams: Dream[];
  currentDream: Dream | null;
  lastInteraction: number;

  // Emotional companion features
  emotionalHistory: EmotionalState[];
  feedbackHistory: ResponseFeedback[];
  currentEmotion: EmotionType | null;

  memoryTrigger: number;
  clearSignal: number;

  transitionTo: (state: AIState) => void;
  addMemory: (msg: string, importance?: number) => void;
  clearMemories: () => void;
  processDream: (dream: Dream) => void;
  applyPersonalityShift: (shift: Partial<Personality>) => void;
  updateLastInteraction: () => void;
  toggleDemoMode: () => void;
  
  // Emotional companion methods
  recordEmotion: (emotion: EmotionType, confidence: number, message: string) => void;
  recordFeedback: (responseId: string, liked: boolean, emotion: EmotionType) => void;
  getEmotionPatterns: () => Record<EmotionType, number>;
}

const DEFAULT_PERSONALITY: Personality = {
  tone: 0.5,
  curiosity: 0.7,
  interests: [],
  memoryWeights: {},
};

/* ---------------------------- POSITION UTILITY ---------------------------- */
function randomPosition() {
  return {
    x: (Math.random() - 0.5) * 6,
    y: (Math.random() - 0.5) * 4,
    z: (Math.random() - 0.5) * 6,
  };
}

/* ---------------------------- STORE ---------------------------- */
export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      state: "awake",
      personality: DEFAULT_PERSONALITY,
      memories: [],
      connections: [],
      dreams: [],
      currentDream: null,
      lastInteraction: Date.now(),

      // Emotional companion state
      emotionalHistory: [],
      feedbackHistory: [],
      currentEmotion: null,

      memoryTrigger: 0,
      clearSignal: 0,

      /* ------------ STATE TRANSITION ------------ */
      transitionTo: (state) => {
        const prev = get().state;
        console.log(`STATE: ${prev} → ${state}`);
        set({ state });
      },

      /* ------------ ADD MEMORY NODE ------------ */
      addMemory: (msg, importance = 0.5) => {
        const clean = normalize(msg);
        if (!clean) return;

        const newNode: MemoryNode = {
          id: `mem-${Date.now()}`,
          content: clean,
          fullMessage: msg,
          timestamp: Date.now(),
          importance,
          position: randomPosition(),
        };

        set((s) => {
          const updatedMemories = [...s.memories, newNode];
          const updatedConnections = [...s.connections];

          // similarity connections
          for (const existing of s.memories) {
            if (shouldConnect(newNode.content, existing.content)) {
              updatedConnections.push([newNode.id, existing.id]);
            }
          }

          // remove duplicate edges
          const seen = new Set<string>();
          const unique: Array<[string, string]> = [];

          for (const [a, b] of updatedConnections) {
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push([a, b]);
            }
          }

          return {
            memories: updatedMemories,
            connections: unique,
            memoryTrigger: s.memoryTrigger + 1,
            lastInteraction: Date.now(),
          };
        });
      },

      /* ------------ CLEAR ALL MEMORY ------------ */
      clearMemories: () => {
        console.log("🧹 ALL MEMORY CLEARED");
        set({
          memories: [],
          connections: [],
          memoryTrigger: 0,
          clearSignal: Date.now(),
        });
      },

      /* ------------ DREAM PROCESSING ------------ */
      processDream: (dream) => {
        set((s) => ({
          currentDream: dream,
          dreams: [...s.dreams.slice(-19), dream],
        }));
        if (dream.personalityShift) {
          get().applyPersonalityShift(dream.personalityShift);
        }
      },

      /* ------------ PERSONALITY SHIFT ------------ */
      applyPersonalityShift: (shift) =>
        set((s) => ({
          personality: { ...s.personality, ...shift },
        })),

      updateLastInteraction: () => set({ lastInteraction: Date.now() }),

      toggleDemoMode: () => set((s) => ({ demoMode: !s.demoMode })),

      /* ------------ EMOTIONAL COMPANION METHODS ------------ */
      recordEmotion: (emotion, confidence, message) => {
        set((s) => ({
          emotionalHistory: [
            ...s.emotionalHistory.slice(-99), // Keep last 100
            {
              emotion,
              confidence,
              timestamp: Date.now(),
              message
            }
          ],
          currentEmotion: emotion
        }));
      },

      recordFeedback: (responseId, liked, emotion) => {
        set((s) => ({
          feedbackHistory: [
            ...s.feedbackHistory,
            {
              responseId,
              liked,
              emotion,
              timestamp: Date.now()
            }
          ]
        }));
      },

      getEmotionPatterns: () => {
        const history = get().emotionalHistory;
        const counts: Record<string, number> = {};
        
        history.forEach(({ emotion }) => {
          counts[emotion] = (counts[emotion] || 0) + 1;
        });

        return counts as Record<EmotionType, number>;
      },
    }),
    {
      name: "ai-dreams-memory-store",
      partialize: (s) => ({
        memories: s.memories,
        connections: s.connections,
        dreams: s.dreams,
        personality: s.personality,
        emotionalHistory: s.emotionalHistory,
        feedbackHistory: s.feedbackHistory,
      }),
    }
  )
);
