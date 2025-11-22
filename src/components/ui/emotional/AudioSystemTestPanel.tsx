// src/components/ui/emotional/AudioSystemTestPanel.tsx

import { useState } from "react";
import { useAudioStore } from "../../../store/audioStore";
import { audioMappings } from "../../../lib/audioMappings";
import { Card } from "../card";
import { Button } from "../button";

export function AudioTestPanel() {
  const { setCurrentTrack, play, suggestTrackForEmotion } = useAudioStore();
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const EMOTIONS = ["sad", "angry", "anxious", "stressed", "lonely"];

  const handleSelect = (e: any) => {
    const id = e.target.value;
    setSelectedTrackId(id);
    const track = audioMappings.find((t) => t.id === id);
    if (track) {
      setCurrentTrack(track);
      play();
    }
  };

  return (
    <Card className="w-full p-5 rounded-xl bg-[#0B0F1A]/80 backdrop-blur-xl border border-white/10 shadow-xl text-white space-y-5">

      <h2 className="text-lg font-semibold">Audio System Test Panel</h2>

      <p className="text-sm text-white/60">
        Trigger emotion-based suggestions or pick a track manually.
      </p>

      <div>
        <p className="text-xs text-white/50 mb-2">Test by Emotion:</p>

        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion}
              onClick={() => {
                const track = suggestTrackForEmotion(emotion as any);
                if (track) {
                  setCurrentTrack(track);
                  play();
                  setSelectedTrackId(track.id);
                }
              }}
              className="px-3 py-1 text-sm rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">All Tracks:</p>

        <div className="flex items-center gap-2">
          <select
            value={selectedTrackId}
            onChange={handleSelect}
            className="w-full p-2 rounded-md bg-white/5 border border-white/10 text-sm focus:outline-none"
          >
            <option value="">— Select a track —</option>
            {audioMappings.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title} — {track.category}
              </option>
            ))}
          </select>

          <Button size="sm" variant="secondary" onClick={() => {
            const track = audioMappings.find((t) => t.id === selectedTrackId);
            if (track) {
              setCurrentTrack(track);
              play();
            }
          }}>
            Play
          </Button>
        </div>
      </div>
    </Card>
  );
}
