import { useState, useCallback } from 'react';
import { detectEmotion, getEmotionHistory } from './emotionDetector';
import { EmotionResult } from './emotionTypes';

export function useEmotionDetection() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const analyzeMessage = useCallback(async (message: string) => {
    setIsDetecting(true);
    try {
      const result = await detectEmotion(message);
      setCurrentEmotion(result);
      return result;
    } catch (error) {
      console.error('Emotion detection error:', error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const history = getEmotionHistory();

  return {
    currentEmotion,
    isDetecting,
    analyzeMessage,
    history
  };
}