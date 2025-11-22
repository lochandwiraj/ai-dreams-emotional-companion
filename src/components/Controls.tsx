import { useAIStore } from "../store/aiStore";
import { sleepCycle } from "../lib/sleepCycle";

export default function Controls() {
  const state = useAIStore((s) => s.state);
  const personality = useAIStore((s) => s.personality);
  const dreams = useAIStore((s) => s.dreams);

  return (
    <div className="pointer-events-auto absolute top-6 right-6 bg-zinc-900/70 backdrop-blur-xl border border-white/10 p-5 rounded-2xl w-72 text-white shadow-xl">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        AI System Control
      </h2>
      <p className="text-xs text-gray-500 mb-3">Neural state control</p>

      <div className="text-xs text-gray-400">CURRENT STATE</div>
      <div
        className={`text-lg font-bold mb-4 ${
          state === "dreaming"
            ? "text-purple-400"
            : state === "waking"
            ? "text-orange-400"
            : state === "drowsy"
            ? "text-blue-400"
            : "text-green-400"
        }`}
      >
        {state.toUpperCase()}
      </div>

      <div className="text-xs text-gray-400 mb-1">PERSONALITY</div>
      <div className="text-sm mb-4">
        Tone: {(personality.tone * 100).toFixed(0)}%
        <br />
        Curiosity: {(personality.curiosity * 100).toFixed(0)}%
      </div>

      {/* Dream Log Section */}
      <div>
        <div className="text-xs text-gray-400 mb-1">
          DREAM LOG ({dreams.length})
        </div>
        <div className="max-h-24 overflow-y-auto text-xs text-gray-400 space-y-1 custom-scrollbar">
          {dreams.length > 0 ? (
            dreams
              .slice(-3)
              .reverse()
              .map((d) => (
                <div key={d.id} className="text-gray-400">
                  {d.emotionalTone} ·{" "}
                  {new Date(d.timestamp).toLocaleTimeString()}
                </div>
              ))
          ) : (
            <div className="italic text-gray-500">No dreams yet...</div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => sleepCycle.forceWake()}
          className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg text-xs"
        >
          Wake Up
        </button>
        <button
          onClick={() => useAIStore.setState({ dreams: [] })}
          className="text-pink-400 hover:text-pink-300 text-xs"
        >
          Clear Memory
        </button>
      </div>

      <div className="text-[10px] text-gray-500 mt-3 text-right">v0.2</div>
    </div>
  );
}
