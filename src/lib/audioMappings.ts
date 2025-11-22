// src/lib/audioMappings.ts

import type { EmotionState } from "./emotionDetector";

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration: number;
  category: "ambient" | "nature" | "meditation" | "instrumental" | "binaural" | "noise";
  intensity: "low" | "medium" | "high";
  tags: string[];
  bpm?: number;
  effectiveness?: Partial<Record<EmotionState, number>>;
}

export const audioMappings: AudioTrack[] = [
  {
    id: "gentle-ocean-waves",
    title: "Gentle Ocean Waves",
    url: "/audio/nature/ocean-waves.mp3",
    duration: 420,
    category: "nature",
    intensity: "medium",
    tags: ["relaxation", "water", "calm"],
    effectiveness: { anxious: 0.8, stressed: 0.7 }
  },

  {
    id: "forest-ambience",
    title: "Forest Ambience",
    url: "/audio/nature/forest.mp3",
    duration: 480,
    category: "nature",
    intensity: "low",
    tags: ["forest", "focus", "calm"],
    effectiveness: { stressed: 0.6, confused: 0.5 }
  },

  {
    id: "gentle-rain",
    title: "Gentle Rain",
    url: "/audio/nature/rain.mp3",
    duration: 390,
    category: "nature",
    intensity: "low",
    tags: ["rain", "calming", "sleep"],
    effectiveness: { anxious: 0.7, sad: 0.6 }
  },

  // ⭐ NEW CUSTOM TRACK YOU GENERATED ⭐
  {
    id: "calm-generated-tone",
    title: "Calm Generated Tone",
    url: "/audio/ambient/calm_generated.wav",   // <-- place file here!
    duration: 60,
    category: "ambient",
    intensity: "low",
    tags: ["calm", "relax", "focus"],
    effectiveness: { sad: 0.6, anxious: 0.7, stressed: 0.6 }
  }
];

export default audioMappings;
