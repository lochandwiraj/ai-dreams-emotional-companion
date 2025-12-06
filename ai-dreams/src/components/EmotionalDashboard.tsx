// src/components/EmotionalDashboard.tsx
import { useAIStore } from '../store/aiStore';
import { getEmotionColor } from '../lib/emotionDetection';
import { BarChart3, Heart, TrendingUp } from 'lucide-react';

export default function EmotionalDashboard() {
  const emotionalHistory = useAIStore(s => s.emotionalHistory);
  const getEmotionPatterns = useAIStore(s => s.getEmotionPatterns);

  const patterns = getEmotionPatterns();
  const recentEmotions = emotionalHistory.slice(-10);
  
  const totalCount = Object.values(patterns).reduce((a, b) => a + b, 0);
  const sortedPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="absolute bottom-6 right-6 w-80 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl max-h-[500px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Heart size={18} className="text-pink-400" />
        <h3 className="text-lg font-semibold text-white">Emotional Wellness</h3>
      </div>

      {/* Recent Timeline */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-white/60" />
          <p className="text-xs text-white/60">Recent Emotions</p>
        </div>
        <div className="flex gap-1">
          {recentEmotions.map((state, i) => (
            <div
              key={i}
              className="flex-1 h-12 rounded"
              style={{ backgroundColor: getEmotionColor(state.emotion) + '80' }}
              title={`${state.emotion} (${Math.round(state.confidence * 100)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-white/60" />
          <p className="text-xs text-white/60">Emotion Patterns</p>
        </div>
        <div className="space-y-2">
          {sortedPatterns.map(([emotion, count]) => {
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={emotion}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80 capitalize">{emotion}</span>
                  <span className="text-white/60">{count} times</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getEmotionColor(emotion as any)
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {emotionalHistory.length > 5 && (
        <div className="mt-6 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-white/80">
            💡 <strong>Insight:</strong> You've shared {emotionalHistory.length} emotional moments with me. 
            {sortedPatterns[0] && ` Your most common feeling is ${sortedPatterns[0][0]}.`}
          </p>
        </div>
      )}

      {emotionalHistory.length === 0 && (
        <div className="text-center text-white/40 text-sm py-8">
          <p>Start sharing how you feel</p>
          <p className="text-xs mt-2">I'll track patterns to support you better</p>
        </div>
      )}
    </div>
  );
}
