// src/components/MemoryDebugger.tsx
import { useMemoryStore } from "../store/memoryStore";
import { useAIStore } from "../store/aiStore";

export function MemoryDebugger() {
  const memories = useMemoryStore((s) => s.memories);
  const aiMemories = useAIStore((s) => s.memories);
  const connections = useAIStore((s) => s.connections);

  return (
    <div className="w-full bg-black/90 text-white p-4 rounded-xl text-xs font-mono border border-cyan-500/30 backdrop-blur-xl shadow-xl">

      <h3 className="text-cyan-400 font-bold mb-2">🐛 Memory Debug Panel</h3>

      <div className="space-y-2">

        <div className="flex justify-between">
          <span className="text-yellow-400">memoryStore.memories:</span>
          <span className="text-green-400 font-bold">{memories.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-400">aiStore.memories:</span>
          <span className="text-green-400 font-bold">{aiMemories?.length || 0}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-400">aiStore.connections:</span>
          <span className="text-green-400 font-bold">{connections?.length || 0}</span>
        </div>

        {memories.length === 0 && !aiMemories?.length && (
          <div className="text-red-400 p-2 bg-red-900/20 rounded mt-2 text-center">
            ⚠️ No memories detected!
            <div className="text-gray-400 text-[10px]">Try chatting with the AI</div>
          </div>
        )}
      </div>
    </div>
  );
}
