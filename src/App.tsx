import { useEffect, useState } from "react";
import { ping } from "./lib/openrouter";
import { sleepCycle } from "./lib/sleepCycle";
import { memoryDecay } from "./lib/memoryEngine";
import { useAIStore } from "./store/aiStore";
import { handleConnectionFailure } from "./demo/demoMode";

import NeuralSpace from "./components/DreamVisualization/NeuralSpace";
import ControlPanel from "./components/UI/ControlPanel";
import ChatInterface from "./components/UI/ChatInterface";

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
      <NeuralSpace />

      {/* Top-right control */}
      <ControlPanel />

      {/* Bottom-left chat */}
      <ChatInterface />

      {/* Bottom-right clear memory */}
      <button
        onClick={clearMemories}
        className="absolute bottom-6 right-6 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-lg font-medium shadow-md transition-all"
      >
        🧹 Clear Memory
      </button>

      {/* Connection warning */}
      {connected === false && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded-full border border-red-500/30 z-30">
          ✗ Disconnected — running in demo mode
        </div>
      )}
    </div>
  );
}
