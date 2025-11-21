// src/store/hooks.ts
import { useAIStore } from './aiStore';

// Selective subscriptions for better performance
export const useAIState = () => useAIStore(state => state.state);
export const usePersonality = () => useAIStore(state => state.personality);
export const useCurrentDream = () => useAIStore(state => state.currentDream);
export const useMemories = () => useAIStore(state => state.memories);
export const useDreams = () => useAIStore(state => state.dreams);
export const useIsProcessing = () => useAIStore(state => state.isProcessing);

// Action hooks
export const useAIActions = () => useAIStore(state => ({
  transitionTo: state.transitionTo,
  addMemory: state.addMemory,
  processDream: state.processDream,
  updateLastInteraction: state.updateLastInteraction
}));