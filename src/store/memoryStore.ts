// src/store/memoryStore.ts
// Unified memory store for AI Dreams.
// Fully integrated with memoryEngine, emotion adapter, dream engine,
// conflict system, topic store, and user profile model.

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

export interface Memory {
  id: string;
  content: string;
  timestamp: number;

  // Core
  importance: number;        // 0–1
  emotionalWeight: number;   // -1..1 (reserved for future use)
  decayRate: number;         // 0.00–0.15
  accessCount: number;
  lastAccessed: number;

  // Tags
  tags: string[];
  relatedDreams: string[];

  // 🔥 NEW: Emotional metadata (added to support emotionRuntimeAdapter)
  emotion?: any;                   // full EmotionContractPayload
  unifiedEmotion?: string | null;  // canonical emotion (sad/anxious/etc)
  intensity?: number | null;       // 0–1
  stability?: number | null;       // emotional stability index
  updatedAt?: string | null;       // when enriched
}

interface MemoryStore {
  memories: Memory[];

  addMemory: (content: string, importance?: number) => void;
  strengthenMemory: (id: string) => void;
  getRelevantMemories: (count?: number) => Memory[];

  applyDecay: () => void;
  pruneMemories: () => void;

  getById: (id: string) => Memory | undefined;
  addRelatedDream: (memoryId: string, dreamId: string) => void;
  tagMemory: (id: string, tags: string[]) => void;
}

/* -------------------------------------------------------------
   STORE IMPLEMENTATION
------------------------------------------------------------- */

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],

      /* -------------------------------------------------------
         ADD MEMORY
      ------------------------------------------------------- */
      addMemory: (content, importance = 0.5) => {
        const now = Date.now();

        const memory: Memory = {
          id: `mem_${now}_${Math.random().toString(36).slice(2, 9)}`,
          content,
          timestamp: now,
          importance: Math.max(0.01, Math.min(1, importance)),
          emotionalWeight: 0,
          decayRate: 0.05,
          accessCount: 0,
          lastAccessed: now,
          tags: [],
          relatedDreams: [],

          // New emotional fields start as null until memoryEngine enriches them
          unifiedEmotion: null,
          intensity: null,
          stability: null,
          emotion: null,
          updatedAt: null
        };

        set((s) => ({
          memories: [...s.memories, memory],
        }));
      },

      /* -------------------------------------------------------
         STRENGTHEN MEMORY
      ------------------------------------------------------- */
      strengthenMemory: (id) => {
        const now = Date.now();

        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  importance: Math.min(1, m.importance + 0.15),
                  accessCount: m.accessCount + 1,
                  lastAccessed: now,
                }
              : m
          ),
        }));
      },

      /* -------------------------------------------------------
         GET RELEVANT MEMORIES
      ------------------------------------------------------- */
      getRelevantMemories: (count = 10) => {
        const now = Date.now();

        return get()
          .memories.map((m) => {
            const days = (now - m.timestamp) / (1000 * 60 * 60 * 24);
            const decayedImportance = m.importance * Math.exp(-m.decayRate * days);
            const recencyBoost = m.accessCount > 0 ? 0.15 : 0;

            return {
              ...m,
              effectiveImportance: decayedImportance + recencyBoost,
            };
          })
          .sort((a, b) => b.effectiveImportance - a.effectiveImportance)
          .slice(0, count);
      },

      /* -------------------------------------------------------
         DECAY
      ------------------------------------------------------- */
      applyDecay: () => {
        const now = Date.now();

        set((s) => ({
          memories: s.memories.map((m) => {
            const days = (now - m.timestamp) / (1000 * 60 * 60 * 24);
            const newImportance = m.importance * Math.exp(-m.decayRate * days);

            return {
              ...m,
              importance: Math.max(0.01, newImportance),
            };
          }),
        }));
      },

      /* -------------------------------------------------------
         PRUNE
      ------------------------------------------------------- */
      pruneMemories: () => {
        set((s) => ({
          memories: s.memories
            .filter((m) => m.importance > 0.05)
            .slice(-150),
        }));
      },

      /* -------------------------------------------------------
         GET BY ID
      ------------------------------------------------------- */
      getById: (id) => get().memories.find((m) => m.id === id),

      /* -------------------------------------------------------
         LINK DREAM → MEMORY
      ------------------------------------------------------- */
      addRelatedDream: (memoryId, dreamId) => {
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === memoryId
              ? {
                  ...m,
                  relatedDreams: Array.from(new Set([...m.relatedDreams, dreamId])),
                }
              : m
          ),
        }));
      },

      /* -------------------------------------------------------
         ADD TAGS
      ------------------------------------------------------- */
      tagMemory: (id, tags) => {
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  tags: Array.from(new Set([...m.tags, ...tags])),
                }
              : m
          ),
        }));
      },
    }),

    {
      name: "memory-store",
      version: 3,
      partialize: (s) => ({ memories: s.memories }),

      migrate: (persisted) => {
        // gentle migration: ensure new fields exist
        if (!persisted.memories) return persisted;

        const upgraded = {
          ...persisted,
          memories: persisted.memories.map((m: any) => ({
            ...m,
            unifiedEmotion: m.unifiedEmotion ?? null,
            intensity: m.intensity ?? null,
            stability: m.stability ?? null,
            emotion: m.emotion ?? null,
            updatedAt: m.updatedAt ?? null
          }))
        };

        return upgraded;
      },
    }
  )
);
