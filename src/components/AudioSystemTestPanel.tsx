import { useState } from "react";
import { useAudioStore } from "../../store/audioStore";
import { AUDIO_LIBRARY } from "../../lib/audioConfig";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function AudioTestPanel() {
  const { setCurrentTrack, play, suggestTrackForEmotion } = useAudioStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  const testEmotions: Array<"sad" | "angry" | "anxious" | "stressed" | "lonely"> = [
    "sad",
    "angry",
    "anxious",
    "stressed",
    "lonely",
  ];

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTrackId(id);

    const track = AUDIO_LIBRARY.find((t) => t.id === id);
    if (track) {
      setCurrentTrack(track);
      play();
    }
  };

  return (
    <Card className="w-[320px] bg-slate-900/70 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl p-5 space-y-5">
      {/* Title */}
      <div>
        <h3 className="font-semibold text-lg text-white">
          Audio System Test Panel
        </h3>
        <p className="text-xs text-white/60 mt-1">
          Try different emotions or pick a track manually.
        </p>
      </div>

      {/* Emotion buttons */}
      <div>
        <p className="text-xs text-white/70 mb-2">Test by Emotion:</p>

        <div className="flex flex-wrap gap-2">
          {testEmotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => {
                const track = suggestTrackForEmotion(emotion);
                if (track) {
                  setCurrentTrack(track);
                  play();
                  setSelectedTrackId(track.id);
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium
                         bg-white/5 border border-white/10 text-white
                         hover:bg-white/10 hover:border-white/20
                         transition shadow-sm"
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Track dropdown + play */}
      <div>
        <p className="text-xs text-white/70 mb-2">All Tracks:</p>

        <div className="flex items-center gap-2">
          <select
            aria-label="Select audio track"
            value={selectedTrackId}
            onChange={handleDropdownChange}
            className="w-full text-xs bg-slate-900/60 border border-white/15
                       rounded-lg px-3 py-2 text-white/90 outline-none
                       focus:ring-2 focus:ring-white/20 focus:border-white/30"
          >
            <option value="">— Select a track —</option>
            {AUDIO_LIBRARY.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title} · {track.category}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            className="text-xs px-3"
            onClick={() => {
              if (!selectedTrackId) return;
              const track = AUDIO_LIBRARY.find(
                (t) => t.id === selectedTrackId
              );
              if (track) {
                setCurrentTrack(track);
                play();
              }
            }}
          >
            Play
          </Button>
        </div>
      </div>
    </Card>
  );
}
