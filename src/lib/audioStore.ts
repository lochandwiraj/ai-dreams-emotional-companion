// src/store/audioStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AudioTrack } from '../lib/audioMappings';
import { selectAudioForEmotion } from '../lib/audioConfig';
import type { EmotionState } from '../lib/emotionDetector';

interface AudioStore {
  // State
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  volume: number;
  queue: AudioTrack[];
  currentTime: number;
  duration: number;
  recentlyPlayed: string[]; // track IDs
  likedTracks: string[];
  dislikedTracks: string[];

  // Actions
  setCurrentTrack: (track: AudioTrack | null) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  queueTrack: (track: AudioTrack) => void;
  removeFromQueue: (trackId: string) => void;
  playNext: () => void;

  suggestTrackForEmotion: (
    emotion: EmotionState,
    intensity?: number
  ) => AudioTrack | null;

  addToRecentlyPlayed: (trackId: string) => void;
  likeTrack: (trackId: string) => void;
  dislikeTrack: (trackId: string) => void;
  resetAudio: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      // -------------------------------------------------------------
      // INITIAL STATE
      // -------------------------------------------------------------
      currentTrack: null,
      isPlaying: false,
      volume: 0.7,
      queue: [],
      currentTime: 0,
      duration: 0,
      recentlyPlayed: [],
      likedTracks: [],
      dislikedTracks: [],

      // -------------------------------------------------------------
      // BASIC ACTIONS
      // -------------------------------------------------------------
      setCurrentTrack: (track) => {
        console.log('[AudioStore] Setting current track:', track?.title || 'null');
        set({ currentTrack: track, currentTime: 0 });
      },

      play: () => {
        console.log('[AudioStore] Play');
        set({ isPlaying: true });
      },

      pause: () => {
        console.log('[AudioStore] Pause');
        set({ isPlaying: false });
      },

      setVolume: (volume) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ volume: clamped });
      },

      setCurrentTime: (time) => set({ currentTime: time }),

      setDuration: (duration) => set({ duration }),

      queueTrack: (track) => {
        console.log('[AudioStore] Queueing track:', track.title);
        set((state) => ({
          queue: [...state.queue, track]
        }));
      },

      removeFromQueue: (trackId) =>
        set((state) => ({
          queue: state.queue.filter((t) => t.id !== trackId)
        })),

      // -------------------------------------------------------------
      // PLAY NEXT TRACK
      // -------------------------------------------------------------
      playNext: () => {
        const { queue, currentTrack } = get();

        // Save previously played track
        if (currentTrack) {
          get().addToRecentlyPlayed(currentTrack.id);
        }

        if (queue.length > 0) {
          const next = queue[0];
          console.log('[AudioStore] Playing next:', next.title);
          set({
            currentTrack: next,
            queue: queue.slice(1),
            isPlaying: true,
            currentTime: 0
          });
        } else {
          console.log('[AudioStore] Queue empty — stopping playback');
          set({ isPlaying: false });
        }
      },

      // -------------------------------------------------------------
      // EMOTION-BASED TRACK SUGGESTION
      // -------------------------------------------------------------
      suggestTrackForEmotion: (emotion, intensity = 0.5) => {
        const { recentlyPlayed, dislikedTracks } = get();
        const exclude = [...recentlyPlayed.slice(-3), ...dislikedTracks];

        console.log(
          `[AudioStore] Suggesting track for emotion "${emotion}" (intensity: ${intensity})`
        );

        const track = selectAudioForEmotion(emotion, intensity, exclude);

        if (track) {
          console.log(`[AudioStore] Suggested: "${track.title}"`);
        } else {
          console.warn(
            `[AudioStore] No suitable track found for emotion "${emotion}"`
          );
        }

        return track;
      },

      // -------------------------------------------------------------
      // RECENTLY PLAYED TRACK MEMORY
      // -------------------------------------------------------------
      addToRecentlyPlayed: (trackId) => {
        set((state) => ({
          recentlyPlayed: [...state.recentlyPlayed.slice(-9), trackId]
        }));
      },

      // -------------------------------------------------------------
      // LIKE / DISLIKE FEEDBACK
      // -------------------------------------------------------------
      likeTrack: (trackId) => {
        console.log('[AudioStore] Like:', trackId);
        set((state) => ({
          likedTracks: [...state.likedTracks, trackId],
          dislikedTracks: state.dislikedTracks.filter((id) => id !== trackId)
        }));
      },

      dislikeTrack: (trackId) => {
        console.log('[AudioStore] Dislike:', trackId);
        set((state) => ({
          dislikedTracks: [...state.dislikedTracks, trackId],
          likedTracks: state.likedTracks.filter((id) => id !== trackId)
        }));
      },

      // -------------------------------------------------------------
      // RESET AUDIO SYSTEM
      // -------------------------------------------------------------
      resetAudio: () => {
        console.log('[AudioStore] Resetting audio system');
        set({
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
          queue: []
        });
      }
    }),

    // -------------------------------------------------------------
    // ZUSTAND PERSIST CONFIG
    // -------------------------------------------------------------
    {
      name: 'audio-store',
      partialize: (state) => ({
        volume: state.volume,
        recentlyPlayed: state.recentlyPlayed,
        likedTracks: state.likedTracks,
        dislikedTracks: state.dislikedTracks
      })
    }
  )
);
