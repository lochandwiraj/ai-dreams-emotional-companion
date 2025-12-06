import { useEffect, useState } from "react";
import { ping } from "./lib/openrouter";
import { sleepCycle } from "./lib/sleepCycle";
import { memoryDecay } from "./lib/memoryEngine";
import { useAIStore } from "./store/aiStore";
import { handleConnectionFailure } from "./demo/demoMode";

import NeuralSpace from "./components/DreamVisualization/NeuralSpace";
import ControlPanel from "./components/UI/ControlPanel";
import EmotionalChat from "./components/EmotionalChat";
import AudioPlayer from "./components/AudioPlayer";
import VisualizationMode from "./components/VisualizationMode";
import EmotionalDashboard from "./components/EmotionalDashboard";

import "./index.css";

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const clearMemories = useAIStore((s) => s.clearMemories);

  useEffect(() => {
    let started = false;
    (async () => {
      if (started) return;
      started = true;

      try {
        const res = await ping();
        if (res?.ok) {
          console.log("✅ Connected:", res.message);
          setConnected(true);
        } else {
          console.warn("⚠️ Connection failed:", res?.message);
          setConnected(false);
          handleConnectionFailure();
        }
      } catch {
        setConnected(false);
        handleConnectionFailure();
      }

      sleepCycle.start();
      memoryDecay.start();

      return () => {
        sleepCycle.stop();
        memoryDecay.stop();
      };
    })();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {/* 3D Neural Background */}
      <NeuralSpace />

      {/* Visualization Overlay */}
      <VisualizationMode />

      {/* Top-right: Audio Player, State Control & Clear Memory */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 z-30">
        <AudioPlayer />
        <ControlPanel />
        <button
          onClick={clearMemories}
          className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-md transition-all text-xs w-full"
        >
          🧹 Clear Memory
        </button>
      </div>

      {/* Bottom-left: Emotional Chat */}
      <EmotionalChat />

      {/* Bottom-right: Emotional Dashboard */}
      <EmotionalDashboard />

      {/* Top-center: Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="text-2xl font-light text-white/90">🌙 AI Dreams</h1>
        <p className="text-xs text-white/50">Emotional Companion</p>
      </div>

      {/* Connection warning */}
      {connected === false && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded-full border border-red-500/30 z-30">
          ✗ Disconnected — running in demo mode
        </div>
      )}
    </div>
  );
}
