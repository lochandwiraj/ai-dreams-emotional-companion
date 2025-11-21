import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number; // 0-1, calculated
  emotionalWeight: number; // -1 to 1
  decayRate: number; // how fast it fades
  accessCount: number; // how many times referenced
  lastAccessed: number;
  tags: string[]; // extracted keywords
  relatedDreams: string[]; // dream IDs that referenced this
}

interface MemoryStore {
  memories: Memory[];
  addMemory: (content: string, importance?: number) => void;
  strengthenMemory: (id: string) => void;
  getRelevantMemories: (count: number) => Memory[];
  applyDecay: () => void;
  pruneMemories: () => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      
      addMemory: (content, importance = 0.5) => {
        const memory: Memory = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content,
          timestamp: Date.now(),
          importance,
          emotionalWeight: 0,
          decayRate: 0.05, // 5% per day default
          accessCount: 0,
          lastAccessed: Date.now(),
          tags: [],
          relatedDreams: []
        };
        
        set(state => ({
          memories: [...state.memories, memory]
        }));
      },
      
      strengthenMemory: (id) => {
        set(state => ({
          memories: state.memories.map(m => 
            m.id === id 
              ? { 
                  ...m, 
                  importance: Math.min(1, m.importance + 0.1),
                  accessCount: m.accessCount + 1,
                  lastAccessed: Date.now()
                }
              : m
          )
        }));
      },
      
      getRelevantMemories: (count = 10) => {
        const now = Date.now();
        return get().memories
          .map(m => {
            // Calculate effective importance with decay
            const daysSince = (now - m.timestamp) / (1000 * 60 * 60 * 24);
            const decayed = m.importance * Math.exp(-m.decayRate * daysSince);
            const recencyBoost = m.accessCount > 0 ? 0.2 : 0;
            return { ...m, effectiveImportance: decayed + recencyBoost };
          })
          .sort((a, b) => b.effectiveImportance - a.effectiveImportance)
          .slice(0, count);
      },
      
      applyDecay: () => {
        const now = Date.now();
        set(state => ({
          memories: state.memories.map(m => {
            const daysSince = (now - m.timestamp) / (1000 * 60 * 60 * 24);
            const newImportance = m.importance * Math.exp(-m.decayRate * daysSince);
            return { ...m, importance: Math.max(0.01, newImportance) };
          })
        }));
      },
      
      pruneMemories: () => {
        set(state => ({
          memories: state.memories
            .filter(m => m.importance > 0.05) // Remove very weak memories
            .slice(-100) // Keep last 100 max
        }));
      }
    }),
    { name: 'memory-store' }
  )
);