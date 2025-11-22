// src/components/UI/ControlPanel.tsx

import { useAIStore } from "../../store/aiStore";
import { sleepCycle } from "../../lib/sleepCycle";

export default function ControlPanel() {
  const state = useAIStore((s) => s.state);
  const transitionTo = useAIStore((s) => s.transitionTo);

  const states: Array<"awake" | "drowsy" | "dreaming" | "waking"> = [
    "awake",
    "drowsy",
    "dreaming",
    "waking",
  ];

  return (
    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-5 w-72 text-sm text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">AI System Control</h3>
        <span className="text-gray-400 text-xs">v0.3</span>
      </div>

      {/* Current state */}
      <div className="mb-2">
        <div className="text-gray-400 text-xs mb-1">CURRENT STATE</div>
        <div className="text-white font-bold text-base uppercase tracking-wide mb-3">
          {state}
        </div>
      </div>

      {/* Manual transitions */}
      <p className="text-gray-400 text-xs mb-2">Manually set neural mode</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {states.map((s) => (
          <button
            key={s}
            onClick={() => transitionTo(s)}
            className={`py-2 rounded-lg font-medium transition-all ${
              state === s
                ? "bg-blue-600 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Force dream start */}
      <button
        onClick={() => {
          transitionTo("drowsy");
          setTimeout(() => sleepCycle["enterDream"]?.(), 200);
        }}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white py-2 rounded-lg font-medium mb-3"
      >
        🌙 Force Dream Start
      </button>

      {/* Force wake */}
      <button
        onClick={() => sleepCycle.forceWake()}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium mb-3"
      >
        ☀️ Force Wake
      </button>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">System ready</div>
    </div>
  );
}
