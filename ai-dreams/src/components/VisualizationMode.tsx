// src/components/VisualizationMode.tsx
import { useState, useEffect } from 'react';
import { VisualizationPlayer, VisualizationScript } from '../lib/visualizationEngine';
import { audioEngine, AUDIO_LIBRARY } from '../lib/audioEngine';
import { X } from 'lucide-react';

const player = new VisualizationPlayer();

export default function VisualizationMode() {
  const [active, setActive] = useState(false);
  const [script, setScript] = useState<VisualizationScript | null>(null);
  const [currentSentence, setCurrentSentence] = useState('');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const handleStart = (e: CustomEvent) => {
      const vizScript = e.detail as VisualizationScript;
      setScript(vizScript);
      setActive(true);

      // Start audio if suggested
      if (vizScript.audioSuggestion) {
        const track = AUDIO_LIBRARY.find(t => t.id === vizScript.audioSuggestion);
        if (track) {
          audioEngine.play(track);
          audioEngine.fadeIn(3000);
        }
      }

      // Start visualization
      player.play(
        vizScript,
        (sentence, index, totalSentences) => {
          setCurrentSentence(sentence);
          setProgress(index + 1);
          setTotal(totalSentences);
        },
        () => {
          // On complete
          setTimeout(() => {
            handleClose();
          }, 3000);
        }
      );
    };

    window.addEventListener('start-visualization', handleStart as EventListener);
    return () => {
      window.removeEventListener('start-visualization', handleStart as EventListener);
      player.stop();
    };
  }, []);

  const handleClose = () => {
    player.stop();
    audioEngine.fadeOut(2000);
    setActive(false);
    setScript(null);
    setCurrentSentence('');
    setProgress(0);
  };

  if (!active || !script) return null;

  const sceneGradients = {
    forest: 'from-green-900/40 via-emerald-800/30 to-teal-900/40',
    ocean: 'from-blue-900/40 via-cyan-800/30 to-teal-900/40',
    mountain: 'from-slate-900/40 via-gray-800/30 to-blue-900/40',
    space: 'from-indigo-900/40 via-purple-800/30 to-black/60',
    garden: 'from-pink-900/40 via-rose-800/30 to-green-900/40'
  };

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br ${sceneGradients[script.sceneType]} backdrop-blur-xl flex items-center justify-center`}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X size={20} className="text-white" />
      </button>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 text-center">
        <h2 className="text-2xl font-light text-white/90 mb-8">{script.title}</h2>
        
        <p className="text-3xl font-light text-white leading-relaxed min-h-[120px] flex items-center justify-center animate-fade-in">
          {currentSentence}
        </p>

        {/* Progress */}
        <div className="mt-12">
          <div className="flex justify-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-all duration-500 ${
                  i < progress ? 'bg-white/60' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-white/40 mt-4">
            {progress} / {total}
          </p>
        </div>

        {/* Breathing indicator */}
        <div className="mt-16 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse-slow flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
