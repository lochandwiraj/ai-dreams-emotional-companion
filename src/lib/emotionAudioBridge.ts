// src/lib/emotionAudioBridge.ts
// High-level bridge that connects emotion detection → audio suggestions → preference tracking

import { detectEmotion, EmotionResult, EmotionState } from './emotionDetector';
import { selectAudioForEmotion, generatePlaylistForEmotion } from './audioConfig';
import { recordFeedback, analyzePreferences } from './preferenceEngine';
import { useAudioStore } from '../store/audioStore';
import type { AudioTrack } from './audioMappings';

/* -------------------------------------------------------------
   SMART AUDIO SUGGESTION SYSTEM
------------------------------------------------------------- */

export interface AudioSuggestion {
  track: AudioTrack;
  reason: string;
  confidence: number; // 0-1
  alternatives: AudioTrack[];
}

/**
 * Detects emotion from user message and suggests appropriate audio
 */
export async function suggestAudioFromMessage(
  message: string
): Promise<AudioSuggestion | null> {
  console.log('[EmotionAudioBridge] Analyzing message for audio suggestion...');
  
  // 1. Detect emotion
  const emotionResult = await detectEmotion(message);
  
  if (!emotionResult || emotionResult.confidence < 0.3) {
    console.log('[EmotionAudioBridge] Emotion confidence too low, skipping audio suggestion');
    return null;
  }
  
  console.log(`[EmotionAudioBridge] Detected: ${emotionResult.emotion} (confidence: ${emotionResult.confidence.toFixed(2)})`);
  
  // 2. Check if user needs audio support
  if (!emotionResult.needsSupport && emotionResult.emotion === 'neutral') {
    console.log('[EmotionAudioBridge] User seems fine, no audio suggestion needed');
    return null;
  }
  
  // 3. Get audio recommendation
  const intensity = emotionResult.intensity / 10; // Convert 1-10 to 0-1
  const track = selectAudioForEmotion(emotionResult.emotion, intensity);
  
  if (!track) {
    console.warn('[EmotionAudioBridge] No track found for emotion:', emotionResult.emotion);
    return null;
  }
  
  // 4. Get user preferences for this emotion
  const prefs = analyzePreferences(emotionResult.emotion);
  
  // 5. Generate suggestion with alternatives
  const audioStore = useAudioStore.getState();
  const excludeIds = [track.id, ...audioStore.recentlyPlayed.slice(-2)];
  
  const alternatives: AudioTrack[] = [];
  for (let i = 0; i < 2; i++) {
    const alt = selectAudioForEmotion(
      emotionResult.emotion, 
      intensity + (i * 0.2), // Vary intensity slightly
      excludeIds
    );
    if (alt && !alternatives.some(t => t.id === alt.id)) {
      alternatives.push(alt);
      excludeIds.push(alt.id);
    }
  }
  
  // 6. Generate reason text
  const reason = generateSuggestionReason(emotionResult, track, prefs.confidence);
  
  return {
    track,
    reason,
    confidence: emotionResult.confidence * prefs.confidence,
    alternatives
  };
}

function generateSuggestionReason(
  emotion: EmotionResult,
  track: AudioTrack,
  prefConfidence: number
): string {
  const reasons: string[] = [];
  
  // Emotion-based reason
  if (emotion.needsSupport) {
    reasons.push(`I sense you're feeling ${emotion.emotion}`);
  } else {
    reasons.push(`Based on your ${emotion.emotion} mood`);
  }
  
  // Track-specific reason
  if (track.category === 'meditation') {
    reasons.push('this guided meditation might help');
  } else if (track.category === 'nature') {
    reasons.push('these nature sounds could be calming');
  } else if (track.category === 'instrumental') {
    reasons.push('this music might resonate with you');
  } else if (track.category === 'binaural') {
    reasons.push('these brainwave frequencies could help');
  } else if (track.category === 'ambient') {
    reasons.push('this ambience might create the right atmosphere');
  } else {
    reasons.push('this audio might be helpful');
  }
  
  // Preference-based reason
  if (prefConfidence > 0.7) {
    reasons.push("It's worked well for you before");
  } else if (prefConfidence > 0.4) {
    reasons.push("Similar tracks have helped you");
  }
  
  return reasons.join(', ') + '.';
}

/* -------------------------------------------------------------
   AUDIO FEEDBACK TRACKING
------------------------------------------------------------- */

/**
 * Records user feedback on audio track effectiveness
 */
export function recordAudioFeedback(params: {
  trackId: string;
  emotion: EmotionState;
  helpful: boolean;
  note?: string;
}) {
  console.log(`[EmotionAudioBridge] Recording feedback: ${params.helpful ? 'helpful' : 'not helpful'} for ${params.trackId}`);
  
  // Update preference engine
  recordFeedback({
    messageId: params.trackId,
    responseType: 'music',
    emotion: params.emotion,
    helpful: params.helpful,
    optionalNote: params.note
  });
  
  // Update audio store
  const audioStore = useAudioStore.getState();
  if (params.helpful) {
    audioStore.likeTrack(params.trackId);
  } else {
    audioStore.dislikeTrack(params.trackId);
  }
}

/* -------------------------------------------------------------
   AUTOMATIC AUDIO SUGGESTIONS
------------------------------------------------------------- */

/**
 * Automatically suggest and queue audio when user needs support
 */
export async function autoSuggestAudioIfNeeded(
  message: string,
  autoQueue: boolean = false
): Promise<void> {
  const suggestion = await suggestAudioFromMessage(message);
  
  if (!suggestion) {
    return;
  }
  
  console.log(`[EmotionAudioBridge] Auto-suggestion: "${suggestion.track.title}"`);
  console.log(`[EmotionAudioBridge] Reason: ${suggestion.reason}`);
  
  const audioStore = useAudioStore.getState();
  
  if (autoQueue) {
    // Automatically start playing
    audioStore.setCurrentTrack(suggestion.track);
    audioStore.play();
    console.log('[EmotionAudioBridge] Auto-playing suggested track');
  } else {
    // Just queue it for user to manually start
    audioStore.queueTrack(suggestion.track);
    console.log('[EmotionAudioBridge] Queued suggested track');
  }
}

/* -------------------------------------------------------------
   PLAYLIST GENERATION
------------------------------------------------------------- */

/**
 * Generate a playlist for the detected emotion
 */
export async function generateEmotionalPlaylist(
  message: string,
  durationMinutes: number = 20
): Promise<AudioTrack[] | null> {
  const emotionResult = await detectEmotion(message);
  
  if (!emotionResult) {
    return null;
  }
  
  const intensity = emotionResult.intensity / 10;
  const playlist = generatePlaylistForEmotion(
    emotionResult.emotion,
    intensity,
    durationMinutes
  );
  
  console.log(`[EmotionAudioBridge] Generated ${playlist.length}-track playlist for ${emotionResult.emotion}`);
  
  return playlist;
}

/* -------------------------------------------------------------
   EXPORTS
------------------------------------------------------------- */

export type { AudioSuggestion };