// src/lib/audioConfig.ts
// Bridge between emotion detection and audio selection
// Integrates Person A's emotion system with Person C's audio library

import { EmotionState } from './emotionDetector';
import { UserPreferences, getPreferences } from './preferenceEngine';
import { audioMappings, AudioTrack } from './audioMappings';

/* -------------------------------------------------------------
   EMOTION → AUDIO CATEGORY MAP
------------------------------------------------------------- */

const EMOTION_TO_AUDIO_MAP: Record<EmotionState, {
  preferredCategories: AudioTrack['category'][];
  preferredTags: string[];
  intensityRange: { min: number; max: number };
}> = {
  sad: {
    preferredCategories: ['instrumental', 'ambient', 'nature'],
    preferredTags: ['mood', 'calm', 'reflective', 'soft', 'gentle'],
    intensityRange: { min: 0, max: 0.4 }
  },
  angry: {
    preferredCategories: ['nature', 'instrumental', 'binaural'],
    preferredTags: ['release', 'energy', 'power', 'storm', 'dramatic'],
    intensityRange: { min: 0.6, max: 1.0 }
  },
  anxious: {
    preferredCategories: ['meditation', 'binaural', 'nature', 'noise'],
    preferredTags: ['calm', 'breathing', 'grounded', 'relaxation', 'focus'],
    intensityRange: { min: 0, max: 0.3 }
  },
  stressed: {
    preferredCategories: ['meditation', 'nature', 'ambient', 'noise'],
    preferredTags: ['calm', 'focus', 'relaxation', 'release', 'mood'],
    intensityRange: { min: 0, max: 0.5 }
  },
  lonely: {
    preferredCategories: ['ambient', 'instrumental', 'meditation'],
    preferredTags: ['social', 'connection', 'warmth', 'companionship', 'comfort'],
    intensityRange: { min: 0.3, max: 0.7 }
  },
  excited: {
    preferredCategories: ['instrumental', 'binaural', 'nature'],
    preferredTags: ['energy', 'joy', 'positive', 'uplifting', 'motivated'],
    intensityRange: { min: 0.6, max: 1.0 }
  },
  neutral: {
    preferredCategories: ['ambient', 'nature', 'instrumental'],
    preferredTags: ['focus', 'calm', 'background', 'balanced', 'study'],
    intensityRange: { min: 0.3, max: 0.7 }
  },
  confused: {
    preferredCategories: ['meditation', 'ambient', 'nature'],
    preferredTags: ['clarity', 'focus', 'calm', 'grounded', 'clear'],
    intensityRange: { min: 0, max: 0.4 }
  },
  overwhelmed: {
    preferredCategories: ['meditation', 'nature', 'noise', 'binaural'],
    preferredTags: ['calm', 'grounded', 'simplicity', 'release', 'breathing'],
    intensityRange: { min: 0, max: 0.3 }
  }
};

/* -------------------------------------------------------------
   TRACK SCORING
------------------------------------------------------------- */

export function scoreTrackForEmotion(
  track: AudioTrack,
  emotion: EmotionState,
  intensity: number,
  preferences: UserPreferences,
  excludeIds: string[] = []
) {
  if (excludeIds.includes(track.id)) {
    return { track, score: 0, reasons: ['Excluded'] };
  }

  let score = 0;
  const reasons: string[] = [];

  const emotionMap = EMOTION_TO_AUDIO_MAP[emotion];

  // Category match
  if (emotionMap.preferredCategories.includes(track.category)) {
    score += 25;
    reasons.push('Category match');
  }

  // Tag match
  const matchingTags = track.tags.filter(tag =>
    emotionMap.preferredTags.includes(tag)
  );
  if (matchingTags.length > 0) {
    score += 20;
    reasons.push('Tag match');
  }

  // Intensity match
  const trackIntensity = track.intensity === 'low' ? 0.2 :
                         track.intensity === 'medium' ? 0.5 : 0.8;

  const diff = Math.abs(trackIntensity - intensity);
  const intensityScore = Math.max(0, 15 - diff * 30);
  score += intensityScore;

  // Music preference
  const musicPref = preferences.preferredActivities.music;
  score += musicPref * 20;

  // Genre like/dislike
  if (preferences.musicPreferences.genres.includes(track.category)) {
    score += 10;
  }
  if (preferences.musicPreferences.avoidGenres.includes(track.category)) {
    score -= 20;
  }

  // Effectiveness history
  if (track.effectiveness && track.effectiveness[emotion]) {
    score += track.effectiveness[emotion]! * 10;
  }

  return { track, score, reasons };
}

/* -------------------------------------------------------------
   MAIN SELECTOR
------------------------------------------------------------- */

export function selectAudioForEmotion(
  emotion: EmotionState,
  intensity = 0.5,
  excludeIds: string[] = []
): AudioTrack | null {
  const prefs = getPreferences();

  const scored = audioMappings.map(track =>
    scoreTrackForEmotion(track, emotion, intensity, prefs, excludeIds)
  );

  scored.sort((a, b) => b.score - a.score);

  if (scored[0].score > 20) {
    return scored[0].track;
  }

  return audioMappings.find(
    t => EMOTION_TO_AUDIO_MAP[emotion].preferredCategories.includes(t.category)
  ) || null;
}

/* -------------------------------------------------------------
   PLAYLIST BUILDER
------------------------------------------------------------- */

export function generatePlaylistForEmotion(
  emotion: EmotionState,
  intensity: number,
  durationMinutes = 20
): AudioTrack[] {
  const playlist: AudioTrack[] = [];
  const used: string[] = [];
  const target = durationMinutes * 60;
  let total = 0;

  while (total < target) {
    const track = selectAudioForEmotion(emotion, intensity, used);
    if (!track) break;

    playlist.push(track);
    used.push(track.id);
    total += track.duration;

    intensity = Math.max(0.1, intensity - 0.15);
  }

  return playlist;
}

/* ------------------------------------------------------------- */

export const AUDIO_LIBRARY = audioMappings;
