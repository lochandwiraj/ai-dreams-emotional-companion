// src/lib/audioEngine.ts
import { EmotionType } from './emotionDetection';

export type AudioCategory = 'ambient' | 'nature' | 'meditation' | 'binaural' | 'instrumental';

export interface AudioTrack {
  id: string;
  name: string;
  category: AudioCategory;
  url: string;
  duration: number;
  emotions: EmotionType[];
  tags: string[];
}

// Audio library - in production, these would be real audio files
export const AUDIO_LIBRARY: AudioTrack[] = [
  // Ambient
  { id: 'amb1', name: 'Peaceful Pad', category: 'ambient', url: '/audio/ambient-1.mp3', duration: 180, emotions: ['calm', 'neutral'], tags: ['soft', 'gentle'] },
  { id: 'amb2', name: 'Deep Space', category: 'ambient', url: '/audio/ambient-2.mp3', duration: 240, emotions: ['calm', 'lonely'], tags: ['spacious', 'ethereal'] },
  
  // Nature
  { id: 'nat1', name: 'Rain on Leaves', category: 'nature', url: '/audio/rain.mp3', duration: 300, emotions: ['sad', 'calm'], tags: ['rain', 'soothing'] },
  { id: 'nat2', name: 'Forest Birds', category: 'nature', url: '/audio/forest.mp3', duration: 240, emotions: ['calm', 'excited'], tags: ['birds', 'morning'] },
  { id: 'nat3', name: 'Ocean Waves', category: 'nature', url: '/audio/ocean.mp3', duration: 360, emotions: ['calm', 'stressed'], tags: ['waves', 'beach'] },
  
  // Meditation
  { id: 'med1', name: 'Singing Bowl', category: 'meditation', url: '/audio/bowl.mp3', duration: 180, emotions: ['anxious', 'stressed'], tags: ['tibetan', 'healing'] },
  { id: 'med2', name: 'Gentle Chimes', category: 'meditation', url: '/audio/chimes.mp3', duration: 200, emotions: ['anxious', 'calm'], tags: ['bells', 'peaceful'] },
  
  // Binaural
  { id: 'bin1', name: '432Hz Healing', category: 'binaural', url: '/audio/432hz.mp3', duration: 300, emotions: ['stressed', 'anxious'], tags: ['healing', 'frequency'] },
  { id: 'bin2', name: '528Hz Love', category: 'binaural', url: '/audio/528hz.mp3', duration: 300, emotions: ['sad', 'lonely'], tags: ['love', 'frequency'] },
  
  // Instrumental
  { id: 'ins1', name: 'Soft Piano', category: 'instrumental', url: '/audio/piano.mp3', duration: 220, emotions: ['sad', 'calm'], tags: ['piano', 'gentle'] },
  { id: 'ins2', name: 'Acoustic Guitar', category: 'instrumental', url: '/audio/guitar.mp3', duration: 180, emotions: ['calm', 'neutral'], tags: ['guitar', 'warm'] },
];

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: AudioTrack | null = null;
  private volume: number = 0.5;
  private userPreferences: Map<EmotionType, string[]> = new Map();

  constructor() {
    // Load preferences from localStorage
    const saved = localStorage.getItem('audio-preferences');
    if (saved) {
      this.userPreferences = new Map(JSON.parse(saved));
    }
  }

  // Get recommended tracks for emotion
  getRecommendations(emotion: EmotionType, limit: number = 3): AudioTrack[] {
    // Check user preferences first
    const preferred = this.userPreferences.get(emotion) || [];
    const preferredTracks = AUDIO_LIBRARY.filter(t => preferred.includes(t.id));
    
    // Get emotion-matched tracks
    const matched = AUDIO_LIBRARY.filter(t => t.emotions.includes(emotion));
    
    // Combine and deduplicate
    const combined = [...preferredTracks, ...matched];
    const unique = Array.from(new Map(combined.map(t => [t.id, t])).values());
    
    return unique.slice(0, limit);
  }

  // Play a track
  async play(track: AudioTrack): Promise<void> {
    if (this.audio) {
      this.audio.pause();
    }

    this.currentTrack = track;
    this.audio = new Audio(track.url);
    this.audio.volume = this.volume;
    this.audio.loop = true;

    try {
      await this.audio.play();
      console.log(`🎵 Playing: ${track.name}`);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  // Stop playback
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
      this.currentTrack = null;
    }
  }

  // Set volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  // Fade in
  fadeIn(duration: number = 2000): void {
    if (!this.audio) return;
    
    this.audio.volume = 0;
    const steps = 20;
    const increment = this.volume / steps;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      if (!this.audio || step >= steps) {
        clearInterval(timer);
        return;
      }
      this.audio.volume = Math.min(this.volume, (step + 1) * increment);
      step++;
    }, interval);
  }

  // Fade out
  fadeOut(duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audio) {
        resolve();
        return;
      }

      const startVolume = this.audio.volume;
      const steps = 20;
      const decrement = startVolume / steps;
      const interval = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        if (!this.audio || step >= steps) {
          clearInterval(timer);
          this.stop();
          resolve();
          return;
        }
        this.audio.volume = Math.max(0, startVolume - (step + 1) * decrement);
        step++;
      }, interval);
    });
  }

  // Record user preference
  recordPreference(emotion: EmotionType, trackId: string, liked: boolean): void {
    const current = this.userPreferences.get(emotion) || [];
    
    if (liked && !current.includes(trackId)) {
      current.push(trackId);
    } else if (!liked) {
      const index = current.indexOf(trackId);
      if (index > -1) current.splice(index, 1);
    }

    this.userPreferences.set(emotion, current);
    localStorage.setItem('audio-preferences', JSON.stringify(Array.from(this.userPreferences.entries())));
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
