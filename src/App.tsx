// src/App.tsx

import { useEffect, useState, useRef } from "react";
import { ping } from "./lib/openrouter";
import { sleepCycle } from "./lib/sleepCycle";
import { memoryDecay } from "./lib/memoryEngine";
import { useAIStore } from "./store/aiStore";
import { handleConnectionFailure } from "./demo/demoMode";

import NeuralSpace from "./components/DreamVisualization/NeuralSpace";
import ControlPanel from "./components/UI/ControlPanel";
import { MemoryDebugger } from "./components/MemoryDebugger";
import ChatInterface from "./components/UI/ChatInterface";

import { AudioTestPanel } from "./components/ui/emotional/AudioSystemTestPanel";
import { AudioPlayer } from "./components/AudioPlayer/AudioPlayer";
import { useAudioStore } from "./store/audioStore";

import "./index.css";

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const clearMemories = useAIStore((s) => s.clearMemories);
  const audioStore = useAudioStore();
  const startedRef = useRef(false);

  // ---------------------------
  // INIT LOGIC
  // ---------------------------
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cleanupDone = false;

    const initialize = async () => {
      try {
        const res = await ping();
        setConnected(Boolean(res?.ok));
        if (!res?.ok) handleConnectionFailure();
      } catch {
        setConnected(false);
        handleConnectionFailure();
      }

      sleepCycle.start();
      memoryDecay.start();
    };

    initialize();

    return () => {
      if (!cleanupDone) {
        sleepCycle.stop();
        memoryDecay.stop();
        cleanupDone = true;
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black text-white font-sans">

      {/* BACKGROUND CANVAS */}
      <div className="pointer-events-none">
        <NeuralSpace />
      </div>

      {/* RIGHT CONTROL PANEL */}
      <div className="pointer-events-auto">
        <ControlPanel />
      </div>

      {/* LEFT SIDE PANEL STACK */}
      <div className="absolute left-4 top-4 w-[300px] flex flex-col gap-5 z-40 pointer-events-auto">
        <MemoryDebugger />
        <AudioTestPanel />
        <ChatInterface />
      </div>

      {/* NOW PLAYING — moved up */}
      {audioStore.currentTrack && (
        <div className="absolute bottom-24 right-6 w-[380px] z-40 pointer-events-auto">
          <AudioPlayer
            track={audioStore.currentTrack}
            onEnded={() => {
              audioStore.playNext();
            }}
          />
        </div>
      )}

      {/* CLEAR MEMORY BUTTON — positioned under audio player */}
      <button
        onClick={clearMemories}
        className="absolute bottom-6 right-6 bg-pink-600 hover:bg-pink-700 
                   text-white px-5 py-2 rounded-lg font-medium shadow-md 
                   pointer-events-auto"
      >
        🧹 Clear Memory
      </button>

      {/* DISCONNECTED WARNING */}
      {connected === false && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/30 
                        text-red-300 px-4 py-2 rounded-lg text-sm border 
                        border-red-700/40 z-50 pointer-events-auto">
          ✗ Disconnected — running in demo mode
        </div>
      )}
    </div>
  );
}
