// src/components/AudioPlayer.tsx
import { useState, useEffect } from 'react';
import { audioEngine, AUDIO_LIBRARY, AudioTrack } from '../lib/audioEngine';
import { useAIStore } from '../store/aiStore';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const currentEmotion = useAIStore(s => s.currentEmotion);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  const handlePlay = (track: AudioTrack) => {
    audioEngine.play(track);
    setCurrentTrack(track);
    setIsPlaying(true);
    setShowLibrary(false);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const getRecommendedTracks = () => {
    if (!currentEmotion) return AUDIO_LIBRARY.slice(0, 5);
    return audioEngine.getRecommendations(currentEmotion, 5);
  };

  return (
    <div className="w-80">
      {/* Current Track */}
      {currentTrack && (
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-2 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
              <p className="text-xs text-white/60">{currentTrack.category}</p>
            </div>

            <div className="flex items-center gap-2">
              {volume === 0 ? <VolumeX size={16} className="text-white/60" /> : <Volume2 size={16} className="text-white/60" />}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16"
              />
            </div>
          </div>
        </div>
      )}

      {/* Library Toggle */}
      <button
        onClick={() => setShowLibrary(!showLibrary)}
        className="w-full bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-3 hover:bg-white/5 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Music size={18} className="text-purple-400" />
          <span className="text-sm text-white">Therapeutic Audio</span>
        </div>
        <span className="text-xs text-white/60">{showLibrary ? '▼' : '▶'}</span>
      </button>

      {/* Library */}
      {showLibrary && (
        <div className="mt-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-3 max-h-96 overflow-y-auto shadow-xl">
          <p className="text-xs text-white/60 mb-3">
            {currentEmotion ? `Recommended for ${currentEmotion}` : 'All tracks'}
          </p>
          
          <div className="space-y-2">
            {getRecommendedTracks().map((track) => (
              <button
                key={track.id}
                onClick={() => handlePlay(track)}
                className={`w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors ${
                  currentTrack?.id === track.id ? 'bg-purple-600/20 border border-purple-500/30' : ''
                }`}
              >
                <p className="text-sm text-white">{track.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">{track.category}</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/40">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
