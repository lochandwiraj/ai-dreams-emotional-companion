// src/components/AudioPlayer.tsx

import { useState, useRef, useEffect } from 'react';
import { AudioTrack } from '@/lib/audioMappings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AudioPlayerProps {
  track: AudioTrack | null;
  onEnded?: () => void;
}

export function AudioPlayer({ track, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && track) {
      audioRef.current.src = track.url;
      audioRef.current.load();
    }
  }, [track]);

  // Set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return null;
  }

  return (
    <Card className="p-4 bg-slate-900 border-slate-700">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="space-y-3">
        {/* Track Info */}
        <div>
          <h3 className="text-white font-medium">{track.title}</h3>
          <p className="text-slate-400 text-sm">
            {track.category} • {track.tags.join(', ')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setCurrentTime(time);
              if (audioRef.current) {
                audioRef.current.currentTime = time;
              }
            }}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlay}
            variant="default"
            size="sm"
            className="w-24"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-slate-400">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}