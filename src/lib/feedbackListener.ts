// Feedback listener for UI feedback events
// Privacy note: optionalNote may contain small hints but avoid storing full messages

import { EmotionState } from './emotionDetector';
import { recordFeedback } from './preferenceEngine';
import { useEmotionStore } from '../store/emotionStore';

export interface FeedbackEvent {
  messageId?: string;
  responseType: string;
  helpful: boolean;
  optionalNote?: string;
}

// Mock injection for testing
let mockPreferenceEngine: typeof recordFeedback | null = null;
let mockEmotionStore: typeof useEmotionStore | null = null;

function getEmotionStore() {
  return mockEmotionStore ? mockEmotionStore() : useEmotionStore();
}

function getPreferenceEngine() {
  return mockPreferenceEngine || recordFeedback;
}

export async function handleFeedbackEvent(event: FeedbackEvent): Promise<{ 
  ok: boolean; 
  saved: boolean; 
  summary?: { 
    emotion: EmotionState; 
    recommendationSeed?: any 
  } 
}> {
  try {
    // Validate inputs
    if (!event || typeof event.responseType !== 'string' || typeof event.helpful !== 'boolean') {
      return {
        ok: false,
        saved: false
      };
    }

    // Get last detected emotion from store with fallback to neutral
    const store = getEmotionStore();
    const lastEmotion = store.lastDetectedEmotion?.emotion || 'neutral';

    // Construct payload for preference engine
    const feedbackPayload = {
      messageId: event.messageId,
      responseType: event.responseType,
      emotion: lastEmotion,
      helpful: event.helpful,
      optionalNote: event.optionalNote
    };

    // Call preference engine
    getPreferenceEngine()(feedbackPayload);

    // Create summary for response
    const summary = {
      emotion: lastEmotion,
      recommendationSeed: {
        responseType: event.responseType,
        helpful: event.helpful,
        timestamp: new Date().toISOString()
      }
    };

    return {
      ok: true,
      saved: true,
      summary
    };

  } catch (error) {
    console.error('Failed to handle feedback event:', error);
    return {
      ok: false,
      saved: false
    };
  }
}

export async function mockFeedbackEvent(event: FeedbackEvent): Promise<any> {
  // Mock implementation that doesn't actually persist data
  const mockResult = {
    ok: true,
    saved: false, // Indicates this was a mock save
    summary: {
      emotion: 'neutral' as EmotionState,
      recommendationSeed: {
        responseType: event.responseType,
        helpful: event.helpful,
        timestamp: new Date().toISOString(),
        mock: true
      }
    }
  };

  // Simulate async operation
  return new Promise(resolve => {
    setTimeout(() => resolve(mockResult), 10);
  });
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectMocks(preferenceEngine: typeof recordFeedback | null, emotionStore: typeof useEmotionStore | null): void {
    mockPreferenceEngine = preferenceEngine;
    mockEmotionStore = emotionStore;
  },

  resetMocks(): void {
    mockPreferenceEngine = null;
    mockEmotionStore = null;
  },

  getMockState(): { preferenceEngine: typeof recordFeedback | null; emotionStore: typeof useEmotionStore | null } {
    return {
      preferenceEngine: mockPreferenceEngine,
      emotionStore: mockEmotionStore
    };
  }
};