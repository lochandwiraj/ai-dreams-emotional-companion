// src/store/emotionStore.ts
// Local in-memory store for emotional state.
// Fully compatible with the new EmotionRuntimeAdapter & StabilityEngine.
// This is a lightweight non-Zustand store (Zustand-like API).

import { EmotionResult } from "../lib/emotionDetector";

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

export interface EmotionHistoryItem extends EmotionResult {
  id: string;
}

export interface EmotionStoreState {
  lastDetectedEmotion: EmotionResult | null;
  emotionHistory: EmotionHistoryItem[];

  // core actions
  addEmotion(result: EmotionResult): void;
  setLastDetectedEmotion(result: EmotionResult): void;
  clearHistory(): void;
  getRecent(n?: number): EmotionHistoryItem[];

  // added for compatibility with Phase 2–4 modules
  hydrate(initialArray: EmotionHistoryItem[]): void;
  getHistoryWindow(ms: number): EmotionHistoryItem[];
}

/* -------------------------------------------------------------
   INTERNAL STORE IMPLEMENTATION
------------------------------------------------------------- */

// private persistent state
let storeState: {
  lastDetectedEmotion: EmotionResult | null;
  emotionHistory: EmotionHistoryItem[];
} = {
  lastDetectedEmotion: null,
  emotionHistory: []
};

const HISTORY_LIMIT = 200; // increased for trajectory analysis

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/* -------------------------------------------------------------
   STORE FACTORY (Zustand-like interface)
------------------------------------------------------------- */

export const useEmotionStore = (): EmotionStoreState => {
  /* ------------------ add emotion ------------------ */
  const addEmotion = (result: EmotionResult): void => {
    const item: EmotionHistoryItem = {
      ...result,
      id: generateId()
    };

    // newest first
    storeState.emotionHistory.unshift(item);

    // cap history
    if (storeState.emotionHistory.length > HISTORY_LIMIT) {
      storeState.emotionHistory = storeState.emotionHistory.slice(
        0,
        HISTORY_LIMIT
      );
    }

    storeState.lastDetectedEmotion = result;
  };

  /* ------------------ set last emotion ------------------ */
  const setLastDetectedEmotion = (result: EmotionResult): void => {
    storeState.lastDetectedEmotion = result;
  };

  /* ------------------ clear history ------------------ */
  const clearHistory = (): void => {
    storeState.lastDetectedEmotion = null;
    storeState.emotionHistory = [];
  };

  /* ------------------ get recent ------------------ */
  const getRecent = (n: number = 10): EmotionHistoryItem[] => {
    return storeState.emotionHistory.slice(0, n);
  };

  /* ------------------ get time-window history ------------------ */
  const getHistoryWindow = (ms: number): EmotionHistoryItem[] => {
    const now = Date.now();
    return storeState.emotionHistory.filter(
      (e) => now - new Date(e.detectedAt).getTime() <= ms
    );
  };

  /* ------------------ hydrate initial history ------------------ */
  const hydrate = (initialArray: EmotionHistoryItem[]): void => {
    const safeCopy = [...initialArray].slice(0, HISTORY_LIMIT);
    storeState.emotionHistory = safeCopy;
    storeState.lastDetectedEmotion = safeCopy.length ? safeCopy[0] : null;
  };

  /* ------------------ expose store API ------------------ */
  return {
    lastDetectedEmotion: storeState.lastDetectedEmotion,
    emotionHistory: storeState.emotionHistory,
    addEmotion,
    setLastDetectedEmotion,
    clearHistory,
    getRecent,
    hydrate,
    getHistoryWindow
  };
};

/* -------------------------------------------------------------
   TESTING HOOKS
------------------------------------------------------------- */

export const __TEST_ONLY__ = {
  resetState() {
    storeState = {
      lastDetectedEmotion: null,
      emotionHistory: []
    };
  },
  getInternalState() {
    return storeState;
  }
};
