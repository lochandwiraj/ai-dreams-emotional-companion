import { useAIStore } from "../../store/aiStore";
import { sleepCycle } from "../../lib/sleepCycle";

export default function ControlPanel() {
  const state = useAIStore((s) => s.state);
  const transitionTo = useAIStore((s) => s.transitionTo);
  const clearMemories = useAIStore((s) => s.clearMemories);

  const states: Array<"awake" | "drowsy" | "dreaming" | "waking"> = [
    "dreaming",
    "drowsy",
    "awake",
    "waking",
  ];

  return (
    <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-3 w-full text-sm text-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-sm">AI System Control</h3>
        <span className="text-gray-400 text-xs">v0.2</span>
      </div>

      <div className="mb-2">
        <div className="text-gray-400 text-xs mb-1">CURRENT STATE</div>
        <div className="text-white font-bold text-sm uppercase tracking-wide mb-2">
          {state}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {states.map((s) => (
          <button
            key={s}
            onClick={() => transitionTo(s)}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all text-xs ${
              state === s
                ? "bg-blue-600 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          sleepCycle.forceWake();
        }}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded-lg font-medium text-xs"
      >
        Toggle Dream
      </button>
    </div>
  );
}
