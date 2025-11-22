import { useState } from 'react';
import { useAIStore } from '../../store/aiStore';
import { formatDistanceToNow } from 'date-fns';

export default function DreamJournal() {
  const [isOpen, setIsOpen] = useState(false);
  const dreams = useAIStore((s) => s.dreams);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
      >
        📖 Dream Journal ({dreams.length})
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-96 max-h-[70vh] bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">Dream Journal</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Dream List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {dreams.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No dreams yet...</p>
        ) : (
          [...dreams].reverse().map((dream) => (
            <div key={dream.id} className="bg-gray-900/50 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(dream.timestamp), { addSuffix: true })}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  dream.emotionalTone === 'peaceful' ? 'bg-blue-500/20 text-blue-300' :
                  dream.emotionalTone === 'anxious' ? 'bg-red-500/20 text-red-300' :
                  dream.emotionalTone === 'curious' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-purple-500/20 text-purple-300'
                }`}>
                  {dream.emotionalTone}
                </span>
              </div>
              
              <p className="text-gray-200 text-sm mb-3 line-clamp-3">
                {dream.narrative}
              </p>
              
              {dream.symbols.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dream.symbols.map((symbol, i) => (
                    <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {symbol}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}