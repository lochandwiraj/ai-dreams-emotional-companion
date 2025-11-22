// Thin read-only adapter exposing profile bundles for UI, Response Generator, Audio Engine, and Dream Engine

import { UserProfile, buildUserProfile, getCachedProfile } from './userProfileModel';

export interface ProfileBundle {
  profile: UserProfile;
  recommendedSupportStyles: string[];
  quickSummary: string;
  warnings?: string[];
  generatedAt: string;
}

// Mock injection for testing
let mockUserProfileModel: any = null;

function getUserProfileModel() {
  return mockUserProfileModel || { buildUserProfile, getCachedProfile };
}

export async function getProfileBundle(opts?: { forceRefresh?: boolean }): Promise<ProfileBundle> {
  const userProfileModel = getUserProfileModel();
  
  let profile: UserProfile;
  if (opts?.forceRefresh) {
    profile = await userProfileModel.buildUserProfile({ forceRefresh: true });
  } else {
    const cached = userProfileModel.getCachedProfile();
    if (cached) {
      profile = cached;
    } else {
      profile = await userProfileModel.buildUserProfile();
    }
  }
  
  const recommendedSupportStyles = getRecommendedSupportStylesInternal(profile);
  const quickSummary = getQuickSummaryInternal(profile);
  const warnings = generateWarnings(profile);
  
  return {
    profile,
    recommendedSupportStyles,
    quickSummary,
    warnings: warnings.length > 0 ? warnings : undefined,
    generatedAt: new Date().toISOString()
  };
}

export function getRecommendedSupportStyles(limit: number = 3): string[] {
  const userProfileModel = getUserProfileModel();
  const profile = userProfileModel.getCachedProfile();
  
  if (!profile) {
    return ['conversation', 'music', 'meditation'].slice(0, limit);
  }
  
  return getRecommendedSupportStylesInternal(profile, limit);
}

function getRecommendedSupportStylesInternal(profile: UserProfile, limit: number = 3): string[] {
  // Get top activities from preference summary
  const topActivities = profile.preferenceSummary
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(item => item.activity);
  
  // If we don't have enough preferences, supplement with defaults based on emotional state
  if (topActivities.length < limit) {
    const defaultStyles: Record<string, string[]> = {
      sad: ['conversation', 'music', 'journaling'],
      angry: ['meditation', 'breathing', 'exercise'],
      anxious: ['meditation', 'breathing', 'mindfulness'],
      stressed: ['meditation', 'music', 'visualization'],
      lonely: ['conversation', 'music', 'connection'],
      excited: ['music', 'conversation', 'celebration'],
      neutral: ['conversation', 'music', 'reflection'],
      confused: ['conversation', 'journaling', 'clarification'],
      overwhelmed: ['meditation', 'breathing', 'prioritization']
    };
    
    const emotion = profile.emotionalBaseline.dominantEmotion || 'neutral';
    const emotionDefaults = defaultStyles[emotion] || ['conversation', 'music', 'meditation'];
    
    // Merge without duplicates
    const merged = [...new Set([...topActivities, ...emotionDefaults])];
    return merged.slice(0, limit);
  }
  
  return topActivities;
}

export function getQuickSummary(): string {
  const userProfileModel = getUserProfileModel();
  const profile = userProfileModel.getCachedProfile();
  
  if (!profile) {
    return "We're still learning about your emotional patterns and preferences.";
  }
  
  return getQuickSummaryInternal(profile);
}

function getQuickSummaryInternal(profile: UserProfile): string {
  const emotion = profile.emotionalBaseline.dominantEmotion;
  const intensity = profile.emotionalBaseline.intensityBaseline;
  const topActivity = profile.preferenceSummary[0]?.activity || 'conversation';
  
  if (!emotion) {
    return `Your emotional baseline is steady around intensity ${intensity}/10, and you often find ${topActivity} helpful.`;
  }
  
  const intensityDescription = intensity >= 7 ? 'heightened' : intensity >= 4 ? 'moderate' : 'calm';
  
  const summaries: Record<string, string> = {
    sad: `Recently experiencing ${intensityDescription} sadness, with ${topActivity} being most supportive.`,
    angry: `Managing ${intensityDescription} anger, finding ${topActivity} particularly helpful.`,
    anxious: `Dealing with ${intensityDescription} anxiety, often supported by ${topActivity}.`,
    stressed: `Facing ${intensityDescription} stress levels, where ${topActivity} provides relief.`,
    lonely: `Feeling ${intensityDescription} loneliness, with ${topActivity} offering comfort.`,
    excited: `Enjoying ${intensityDescription} excitement, enhanced by ${topActivity}.`,
    neutral: `Maintaining a ${intensityDescription} emotional balance, with ${topActivity} as a preferred activity.`,
    confused: `Working through ${intensityDescription} confusion, finding clarity through ${topActivity}.`,
    overwhelmed: `Navigating ${intensityDescription} overwhelm, supported by ${topActivity}.`
  };
  
  return summaries[emotion] || `Your emotional patterns show ${intensityDescription} ${emotion}, with ${topActivity} being most helpful.`;
}

function generateWarnings(profile: UserProfile): string[] {
  const warnings: string[] = [];
  
  // Check for high emotional volatility
  if (profile.trajectory.last7Days.volatilityIndex > 0.7) {
    warnings.push("High emotional variability detected in the past week");
  }
  
  // Check for rapid preference drift
  if (profile.stabilityMetrics.preferenceStability < 0.3) {
    warnings.push("Rapid changes in preferences observed - adapting support strategies");
  }
  
  // Check for consistently high intensity
  if (profile.trajectory.last14Days.averageIntensity > 7.5) {
    warnings.push("Sustained high emotional intensity over the past two weeks");
  }
  
  // Check for low recovery rate
  if (profile.trajectory.last30Days.recoveryRate < 0.3) {
    warnings.push("Slower than usual emotional recovery patterns detected");
  }
  
  return warnings;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectUserProfileModel(up: any): void {
    mockUserProfileModel = up;
  },
  
  reset(): void {
    mockUserProfileModel = null;
  }
};