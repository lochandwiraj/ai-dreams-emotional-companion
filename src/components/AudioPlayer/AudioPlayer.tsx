import { useEffect, useRef } from "react";
import { useAudioStore } from "../../store/audioStore";
import type { AudioTrack } from "../../lib/audioMappings";

interface AudioPlayerProps {
  track: AudioTrack | null;
  onEnded?: () => void;
}

function formatTime(sec: number): string {
  if (!sec || !Number.isFinite(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isPlaying,
    play,
    pause,
    volume,
    setVolume,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    playNext,
  } = useAudioStore();

  // keep audio element in sync with store
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, volume, track?.url]);

  // whenever track changes, load it
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    }
  }, [track?.id]);

  const hasTrack = !!track;

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl px-5 py-4 text-white space-y-3">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-wide text-white/50">
          {hasTrack ? "Now playing" : "No track selected"}
        </p>
        <h3 className="font-semibold text-sm mt-1 truncate">
          {hasTrack ? track?.title : "Choose a track from the Test Panel"}
        </h3>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-white/60">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{
                width:
                  duration > 0
                    ? `${Math.min(100, (currentTime / duration) * 100)}%`
                    : "0%",
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-2">
        {/* Transport controls */}
        <div className="flex items-center gap-2">
          {/* Prev (placeholder / disabled visually) */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center
                       bg-white/5 text-white/40 text-xs cursor-default"
            disabled
          >
            ⏮
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => {
              if (!hasTrack) return;
              isPlaying ? pause() : play();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center
                       bg-white text-slate-900 text-base shadow-lg
                       hover:scale-[1.03] active:scale-95 transition"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Next */}
          <button
            onClick={() => {
              playNext();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center
                       bg-white/5 text-white/80 text-xs hover:bg-white/10 transition"
          >
            ⏭
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none text-white/80">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-white"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={track?.url || undefined}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime || 0);
        }}
        onEnded={() => {
          pause();
          onEnded?.();
        }}
      />
    </div>
  );
};
