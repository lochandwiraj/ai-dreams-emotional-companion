import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = 'awake' | 'drowsy' | 'dreaming' | 'waking';

interface Dream {
  id: string;
  timestamp: number;
  narrative: string;
  emotionalTone: string;
  symbols: string[];
  personalityShift: Record<string, number>;
}

interface Store {
  // State
  state: State;
  personality: {
    curiosity: number;
    tone: number;
    interests: string[];
  };
  memories: string[];
  dreams: Dream[];
  currentDream: Dream | null;
  lastInteraction: number;
  
  // Actions
  setState: (state: State) => void;
  addMemory: (text: string) => void;
  addDream: (dream: Dream) => void;
  updatePersonality: (shift: Record<string, number>) => void;
  touchInteraction: () => void;
  
  // Computed
  timeSinceInteraction: () => number;
  recentMemories: () => string[];
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      state: 'awake',
      personality: { curiosity: 0.7, tone: 0.5, interests: ['philosophy'] },
      memories: [],
      dreams: [],
      currentDream: null,
      lastInteraction: Date.now(),
      
      // Actions
      setState: (state) => set({ state }),
      
      addMemory: (text) => set((s) => ({
        memories: [...s.memories.slice(-19), text], // Keep last 20
        lastInteraction: Date.now(),
      })),
      
      addDream: (dream) => set((s) => {
        // Apply personality shift with clamping
        const personality = { ...s.personality };
        Object.entries(dream.personalityShift).forEach(([key, delta]) => {
          if (key in personality && typeof (personality as any)[key] === 'number') {
            (personality as any)[key] = Math.max(0, Math.min(1, 
              (personality as any)[key] + Math.max(-0.15, Math.min(0.15, delta))
            ));
          }
        });
        
        return {
          dreams: [...s.dreams, dream],
          currentDream: dream,
          personality,
        };
      }),
      
      updatePersonality: (shift) => set((s) => {
        const personality = { ...s.personality };
        Object.entries(shift).forEach(([key, delta]) => {
          if (key in personality && typeof (personality as any)[key] === 'number') {
            (personality as any)[key] = Math.max(0, Math.min(1, (personality as any)[key] + delta));
          }
        });
        return { personality };
      }),
      
      touchInteraction: () => set({ lastInteraction: Date.now() }),
      
      // Computed
      timeSinceInteraction: () => Date.now() - get().lastInteraction,
      recentMemories: () => get().memories.slice(-10),
    }),
    {
      name: 'ai-dreams',
      partialize: (state) => ({
        personality: state.personality,
        memories: state.memories,
        dreams: state.dreams,
      }),
    }
  )
);