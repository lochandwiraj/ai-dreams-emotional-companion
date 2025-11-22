// Preference engine for tracking user feedback and generating recommendations
// Privacy note: This engine does not store raw conversation text, only metadata and preferences

import { EmotionState } from './emotionDetector';

export interface UserPreferences {
  helpfulResponses: string[];
  unhelpfulResponses: string[];
  preferredActivities: {
    meditation: number;
    music: number;
    conversation: number;
    visualization: number;
  };
  emotionPatterns: Record<EmotionState, string[]>;
  musicPreferences: { genres: string[]; avoidGenres: string[] };
  personalContext: {
    triggers: string[];
    comfortTopics: string[];
    relationshipStatus?: string;
    workSituation?: string;
  };
}

export const PREFERENCES_LOCAL_KEY = 'ai-companion-preferences-v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  helpfulResponses: [],
  unhelpfulResponses: [],
  preferredActivities: {
    meditation: 0.5,
    music: 0.5,
    conversation: 0.5,
    visualization: 0.5
  },
  emotionPatterns: {
    sad: [],
    angry: [],
    anxious: [],
    stressed: [],
    lonely: [],
    excited: [],
    neutral: [],
    confused: [],
    overwhelmed: []
  },
  musicPreferences: { genres: [], avoidGenres: [] },
  personalContext: {
    triggers: [],
    comfortTopics: [],
    relationshipStatus: undefined,
    workSituation: undefined
  }
};

// Response type → activity mapping
const RESPONSE_TYPE_TO_ACTIVITY: Record<
  string,
  keyof UserPreferences['preferredActivities']
> = {
  meditation: 'meditation',
  breathing: 'meditation',
  mindfulness: 'meditation',
  music: 'music',
  song: 'music',
  playlist: 'music',
  talk: 'conversation',
  conversation: 'conversation',
  chat: 'conversation',
  visualization: 'visualization',
  imagery: 'visualization',
  'guided-imagery': 'visualization'
};

function validatePreferences(data: any): data is UserPreferences {
  if (!data || typeof data !== 'object') return false;

  if (!Array.isArray(data.helpfulResponses)) return false;
  if (!Array.isArray(data.unhelpfulResponses)) return false;

  const activities = ['meditation', 'music', 'conversation', 'visualization'];
  for (const a of activities) {
    if (typeof data.preferredActivities[a] !== 'number') return false;
  }

  const emotions: EmotionState[] = [
    'sad',
    'angry',
    'anxious',
    'stressed',
    'lonely',
    'excited',
    'neutral',
    'confused',
    'overwhelmed'
  ];

  for (const emotion of emotions) {
    if (!Array.isArray(data.emotionPatterns[emotion])) return false;
  }

  if (!Array.isArray(data.musicPreferences.genres)) return false;
  if (!Array.isArray(data.musicPreferences.avoidGenres)) return false;

  if (!Array.isArray(data.personalContext.triggers)) return false;
  if (!Array.isArray(data.personalContext.comfortTopics)) return false;

  return true;
}

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_LOCAL_KEY);
    if (!stored) return initPreferences();

    const parsed = JSON.parse(stored);
    if (validatePreferences(parsed)) return parsed;

    console.warn('Invalid preferences found — resetting.');
    return initPreferences();
  } catch {
    return initPreferences();
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_LOCAL_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences:', err);
  }
}

export function initPreferences(): UserPreferences {
  const prefs = { ...DEFAULT_PREFERENCES };
  savePreferences(prefs);
  return prefs;
}

export function recordFeedback(params: {
  messageId?: string;
  responseType: string;
  emotion: EmotionState;
  helpful: boolean;
  optionalNote?: string;
}): void {
  const prefs = loadPreferences();

  // Track helpful/unhelpful responses
  if (params.messageId) {
    const target = params.helpful ? prefs.helpfulResponses : prefs.unhelpfulResponses;
    const other = params.helpful ? prefs.unhelpfulResponses : prefs.helpfulResponses;

    if (!target.includes(params.messageId)) target.push(params.messageId);
    const idx = other.indexOf(params.messageId);
    if (idx > -1) other.splice(idx, 1);
  }

  // Activity weight update
  const activityKey = RESPONSE_TYPE_TO_ACTIVITY[params.responseType];
  if (activityKey) {
    const adj = params.helpful ? 0.1 : -0.1;
    prefs.preferredActivities[activityKey] = Math.max(
      0,
      Math.min(1, prefs.preferredActivities[activityKey] + adj)
    );
  }

  // Pattern extraction from optional note
  if (params.optionalNote) {
    const nounRegex = /\b([a-z]{3,})\b/gi;
    const words = params.optionalNote.match(nounRegex) || [];

    const common = new Set([
      'the',
      'and',
      'but',
      'for',
      'not',
      'you',
      'your',
      'this',
      'that',
      'with',
      'have',
      'from'
    ]);

    const uniqueNouns = [...new Set(words.map((w) => w.toLowerCase()))].filter(
      (w) => !common.has(w)
    );

    for (const noun of uniqueNouns) {
      if (!prefs.emotionPatterns[params.emotion].includes(noun)) {
        prefs.emotionPatterns[params.emotion].push(noun);
      }
    }

    // Max 20 per emotion
    if (prefs.emotionPatterns[params.emotion].length > 20) {
      prefs.emotionPatterns[params.emotion] = prefs.emotionPatterns[
        params.emotion
      ].slice(-20);
    }
  }

  savePreferences(prefs);
}

export function updatePreferenceWeights(): void {
  const prefs = loadPreferences();
  const total = prefs.helpfulResponses.length + prefs.unhelpfulResponses.length;
  if (total === 0) return;

  const ratio = prefs.helpfulResponses.length / total;
  const adj = (ratio - 0.5) * 0.1;

  Object.keys(prefs.preferredActivities).forEach((key) => {
    const k = key as keyof UserPreferences['preferredActivities'];
    prefs.preferredActivities[k] = Math.max(
      0,
      Math.min(1, prefs.preferredActivities[k] + adj)
    );
  });

  savePreferences(prefs);
}

export function analyzePreferences(emotion: EmotionState) {
  const prefs = loadPreferences();

  const scores = [
    { activity: 'meditation', score: prefs.preferredActivities.meditation },
    { activity: 'music', score: prefs.preferredActivities.music },
    { activity: 'conversation', score: prefs.preferredActivities.conversation },
    { activity: 'visualization', score: prefs.preferredActivities.visualization }
  ];

  const patternCount = prefs.emotionPatterns[emotion].length;
  const patternBonus = Math.min(patternCount * 0.05, 0.3);

  const emotionAdjustments: Record<
    EmotionState,
    Partial<Record<keyof UserPreferences['preferredActivities'], number>>
  > = {
    sad: { music: 0.2, conversation: 0.1 },
    angry: { meditation: 0.3, visualization: 0.1 },
    anxious: { meditation: 0.3 },
    stressed: { meditation: 0.2, music: 0.1 },
    lonely: { conversation: 0.3, music: 0.1 },
    excited: { music: 0.2, conversation: 0.1 },
    neutral: { conversation: 0.1, music: 0.1 },
    confused: { conversation: 0.3, visualization: 0.1 },
    overwhelmed: { meditation: 0.3, visualization: 0.2 }
  };

  for (const item of scores) {
    if (emotionAdjustments[emotion][item.activity as any]) {
      item.score += emotionAdjustments[emotion][item.activity as any]!;
    }
    item.score += patternBonus;
  }

  scores.sort((a, b) => b.score - a.score);

  const totalFb = prefs.helpfulResponses.length + prefs.unhelpfulResponses.length;
  const fbConf = Math.min(totalFb / 10, 1);
  const patternConf = Math.min(patternCount / 5, 1);

  const confidence = Number(((fbConf * 0.6 + patternConf * 0.4)).toFixed(2));

  return {
    recommendedActivities: scores.slice(0, 3).map((s) => s.activity),
    confidence
  };
}

export function resetPreferences(full?: boolean): void {
  if (full) {
    initPreferences();
  } else {
    const current = loadPreferences();
    const reset: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      musicPreferences: current.musicPreferences,
      personalContext: current.personalContext
    };
    savePreferences(reset);
  }
}

export function getPreferences(): UserPreferences {
  return JSON.parse(JSON.stringify(loadPreferences()));
}

// Testing utilities
export const __TEST_ONLY__ = {
  clearStorage: () => localStorage.removeItem(PREFERENCES_LOCAL_KEY),
  setMockPreferences: (prefs: UserPreferences) =>
    localStorage.setItem(PREFERENCES_LOCAL_KEY, JSON.stringify(prefs)),
  getDefaultPreferences: () => JSON.parse(JSON.stringify(DEFAULT_PREFERENCES))
};

/* -------------------------------------------------------------
   AUDIO-SPECIFIC PREFERENCE TRACKING  (ADDED AS REQUESTED)
------------------------------------------------------------- */

/** Update genre preference after like / dislike */
export function updateMusicGenrePreference(
  genre: string,
  liked: boolean
): void {
  const prefs = loadPreferences();

  if (liked) {
    if (!prefs.musicPreferences.genres.includes(genre)) {
      prefs.musicPreferences.genres.push(genre);
    }
    prefs.musicPreferences.avoidGenres = prefs.musicPreferences.avoidGenres.filter(
      (g) => g !== genre
    );
  } else {
    if (!prefs.musicPreferences.avoidGenres.includes(genre)) {
      prefs.musicPreferences.avoidGenres.push(genre);
    }
    prefs.musicPreferences.genres = prefs.musicPreferences.genres.filter(
      (g) => g !== genre
    );
  }

  savePreferences(prefs);
  console.log(
    `[PreferenceEngine] Updated genre preference: ${genre} → ${
      liked ? 'liked' : 'avoided'
    }`
  );
}

/** Recommend categories based on preference history */
export function getRecommendedAudioCategories(): string[] {
  const prefs = loadPreferences();
  const categories: string[] = [];

  if (prefs.preferredActivities.music > 0.6) {
    categories.push('instrumental', 'ambient');
  }

  if (prefs.preferredActivities.meditation > 0.6) {
    categories.push('meditation', 'binaural');
  }

  if (categories.length === 0) {
    categories.push('nature', 'ambient');
  }

  return categories;
}
