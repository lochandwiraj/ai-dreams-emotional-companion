import { useStore } from '../store';
import { sleepCycle } from '../lib/sleep';

export function Dashboard() {
  const { state, personality, dreams, currentDream } = useStore();
  
  return (
    <div className="fixed top-8 left-8 space-y-4">
      {/* State Indicator */}
      <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4">
        <div className="text-sm text-gray-400">Status</div>
        <div className="text-2xl font-bold capitalize">{state}</div>
        {state !== 'awake' && (
          <button
            onClick={() => sleepCycle.forceWake()}
            className="mt-2 px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-500"
          >
            Force Wake
          </button>
        )}
      </div>
      
      {/* Personality */}
      <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-2">Personality</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Curiosity</span>
            <span>{(personality.curiosity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Tone</span>
            <span>{(personality.tone * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      {/* Current Dream */}
      {currentDream && (
        <div className="bg-purple-900/30 backdrop-blur rounded-lg p-4 max-w-sm">
          <div className="text-sm text-purple-300 mb-2">Latest Dream</div>
          <div className="text-xs text-purple-200 line-clamp-3">
            {currentDream.narrative}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {currentDream.symbols.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-purple-700/50 rounded text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Dream Count */}
      <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4">
        <div className="text-sm text-gray-400">Total Dreams</div>
        <div className="text-xl font-bold">{dreams.length}</div>
      </div>
    </div>
  );
}