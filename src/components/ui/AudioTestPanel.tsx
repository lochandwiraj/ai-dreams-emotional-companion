// src/components/UI/AudioTestPanel.tsx

import { useState } from "react";
import { useAudioStore } from "../../store/audioStore";
import { AUDIO_LIBRARY } from "../../lib/audioConfig";
import { Button } from "./button";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

const TEST_EMOTIONS: Array<"sad" | "angry" | "anxious" | "stressed" | "lonely"> = [
  "sad",
  "angry",
  "anxious",
  "stressed",
  "lonely",
];

export function AudioTestPanel() {
  const { setCurrentTrack, play, suggestTrackForEmotion } = useAudioStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  const handleEmotionClick = (emotion: (typeof TEST_EMOTIONS)[number]) => {
    const track = suggestTrackForEmotion(emotion);
    if (!track) return;
    setCurrentTrack(track);
    play();
    setSelectedTrackId(track.id);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTrackId(id);
    const track = AUDIO_LIBRARY.find((t) => t.id === id);
    if (track) {
      setCurrentTrack(track);
      play();
    }
  };

  const handlePlayClick = () => {
    if (!selectedTrackId) return;
    const track = AUDIO_LIBRARY.find((t) => t.id === selectedTrackId);
    if (track) {
      setCurrentTrack(track);
      play();
    }
  };

  return (
    <Card className="w-[320px] bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">
          Audio System Test Panel
        </CardTitle>
        <p className="text-[11px] text-white/60">
          Trigger emotion-based suggestions or pick a track manually.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 pb-4">
        {/* Emotion buttons */}
        <div>
          <p className="text-[11px] text-white/70 mb-2">Test by Emotion:</p>
          <div className="flex flex-wrap gap-2">
            {TEST_EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleEmotionClick(emotion)}
                className="px-3 py-1.5 rounded-full text-xs font-medium
                           bg-white/5 border border-white/15 text-white
                           hover:bg-white/10 hover:border-white/30
                           transition-colors"
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        {/* Track dropdown + play button */}
        <div>
          <p className="text-[11px] text-white/70 mb-2">All Tracks:</p>
          <div className="flex items-center gap-2">
            <select
              aria-label="Select audio track"
              value={selectedTrackId}
              onChange={handleDropdownChange}
              className="w-full text-xs bg-slate-900/70 border border-white/15
                         rounded-lg px-3 py-2 text-white/90 outline-none
                         focus:ring-2 focus:ring-white/25 focus:border-white/40"
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
              onClick={handlePlayClick}
            >
              Play
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
