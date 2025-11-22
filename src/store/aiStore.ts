// src/store/aiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shouldConnect, normalize } from "../lib/similarityEngine";
import { useMemoryStore } from "./memoryStore"; // ✅ IMPORT THIS

/* ---------------------------- TYPES ---------------------------- */

export type AIState = "awake" | "drowsy" | "dreaming" | "waking";

export interface Personality {
  tone: number;
  curiosity: number;
  interests: string[];
  memoryWeights: Record<string, number>;
}

export interface MemoryNode {
  id: string;
  content: string;
  fullMessage: string;
  timestamp: number;
  importance: number;
  position: { x: number; y: number; z: number };
}

export interface Dream {
  id: string;
  timestamp: number;
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

  memoryTrigger: number;
  clearSignal: number;

  demoMode?: boolean;

  transitionTo: (state: AIState) => void;
  addMemory: (msg: string, importance?: number) => void;
  clearMemories: () => void;
  processDream: (dream: Dream) => void;
  applyPersonalityShift: (shift: Partial<Personality>) => void;
  updateLastInteraction: () => void;
  toggleDemoMode: () => void;
}

/* ---------------------------- DEFAULTS ---------------------------- */

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

      memoryTrigger: 0,
      clearSignal: 0,
      demoMode: false,

      /* ------------ STATE TRANSITION ------------ */
      transitionTo: (state) => {
        const prev = get().state;
        if (!["awake", "drowsy", "dreaming", "waking"].includes(state)) {
          console.warn("[AIStore] attempt to transition to unknown state:", state);
          return;
        }
        console.log(`STATE: ${prev} → ${state}`);
        set({ state });
      },

      /* ------------ ADD MEMORY NODE ------------ */
      addMemory: (msg, importance = 0.5) => {
        const clean = normalize(msg);
        if (!clean) return;

        const now = Date.now();
        const newNode: MemoryNode = {
          id: `mem-${now}-${Math.floor(Math.random() * 1000)}`,
          content: clean,
          fullMessage: msg,
          timestamp: now,
          importance: Math.max(0, Math.min(1, importance)),
          position: randomPosition(),
        };

        // ✅ ALSO ADD TO MEMORY STORE FOR SYNCING
        try {
          useMemoryStore.getState().addMemory(msg, importance);
        } catch (err) {
          console.warn("[AIStore] Failed to sync to memoryStore:", err);
        }

        set((s) => {
          const updatedMemories = [...s.memories, newNode];

          const updatedConnections = [...s.connections];
          for (const existing of s.memories) {
            try {
              if (shouldConnect(newNode.content, existing.content)) {
                updatedConnections.push([newNode.id, existing.id]);
              }
            } catch (err) {
              console.warn("[AIStore] similarity check failed:", err);
            }
          }

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
            lastInteraction: now,
          };
        });
      },

      /* ------------ CLEAR ALL MEMORY ------------ */
      clearMemories: () => {
        console.log("🧹 ALL MEMORY CLEARED");
        
        // ✅ ALSO CLEAR MEMORY STORE
        try {
          useMemoryStore.getState().memories = [];
        } catch (err) {
          console.warn("[AIStore] Failed to clear memoryStore:", err);
        }

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
          try {
            get().applyPersonalityShift(dream.personalityShift);
          } catch (err) {
            console.warn("[AIStore] applyPersonalityShift failed:", err);
          }
        }
      },

      /* ------------ PERSONALITY SHIFT ------------ */
      applyPersonalityShift: (shift) =>
        set((s) => ({
          personality: { ...s.personality, ...shift },
        })),

      updateLastInteraction: () => set({ lastInteraction: Date.now() }),

      toggleDemoMode: () =>
        set((s) => ({ demoMode: !s.demoMode })),
    }),
    {
      name: "ai-dreams-memory-store",
      partialize: (s) => ({
        memories: s.memories,
        connections: s.connections,
        dreams: s.dreams,
        personality: s.personality,
      }),
    }
  )
);