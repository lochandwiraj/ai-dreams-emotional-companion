// src/components/EmotionalChat.tsx
import { useState, useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { detectEmotion, getEmotionColor } from '../lib/emotionDetection';
import { generateEmotionalResponse } from '../lib/emotionalResponseEngine';
import { audioEngine, AUDIO_LIBRARY } from '../lib/audioEngine';
import { getVisualizationForEmotion } from '../lib/visualizationEngine';
import { ThumbsUp, ThumbsDown, Music, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  emotion?: string;
  timestamp: number;
}

export default function EmotionalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recordEmotion = useAIStore(s => s.recordEmotion);
  const recordFeedback = useAIStore(s => s.recordFeedback);
  const addMemory = useAIStore(s => s.addMemory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Detect emotion first
    const emotionResult = detectEmotion(input);
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      emotion: emotionResult.emotion,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      recordEmotion(emotionResult.emotion, emotionResult.confidence, input);
      addMemory(`User: ${input}`, emotionResult.intensity);

      // Generate response
      const conversationHistory = messages.slice(-6).map(m => `${m.role}: ${m.content}`);
      const response = await generateEmotionalResponse(input, emotionResult, conversationHistory);

      const aiMessage: Message = {
        id: response.id,
        role: 'ai',
        content: response.message,
        emotion: response.emotion,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
      addMemory(`AI: ${response.message}`, 0.7);

      // Auto-suggest audio if appropriate
      if (response.suggestAudio && emotionResult.intensity > 0.5) {
        const tracks = audioEngine.getRecommendations(response.emotion, 1);
        if (tracks.length > 0) {
          setTimeout(() => {
            audioEngine.play(tracks[0]);
            audioEngine.fadeIn(2000);
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: 'I\'m here with you. Let me take a moment to respond thoughtfully...',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (messageId: string, liked: boolean, emotion: string) => {
    recordFeedback(messageId, liked, emotion as any);
    
    // If liked, record audio preference if playing
    const currentTrack = audioEngine.getCurrentTrack();
    if (currentTrack && liked) {
      audioEngine.recordPreference(emotion as any, currentTrack.id, true);
    }
  };

  const handleVisualization = (emotion: string) => {
    const viz = getVisualizationForEmotion(emotion as any);
    if (viz) {
      setShowVisualization(true);
      // This would trigger the visualization component
      window.dispatchEvent(new CustomEvent('start-visualization', { detail: viz }));
    }
  };

  return (
    <div className="absolute bottom-6 left-6 w-96 h-[450px] bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">💜 Emotional Companion</h2>
        <p className="text-xs text-white/60">I'm here to listen and support you</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-sm mt-8">
            <p>How are you feeling today?</p>
            <p className="text-xs mt-2">I'm here to listen without judgment</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-purple-600/30' : 'bg-white/10'} rounded-2xl p-3`}>
              {msg.emotion && (
                <div 
                  className="text-xs mb-1 font-medium"
                  style={{ color: getEmotionColor(msg.emotion as any) }}
                >
                  {msg.emotion}
                </div>
              )}
              <p className="text-sm text-white/90">{msg.content}</p>
              
              {msg.role === 'ai' && msg.emotion && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handleFeedback(msg.id, true, msg.emotion!)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Helpful"
                  >
                    <ThumbsUp size={14} className="text-white/60 hover:text-green-400" />
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, false, msg.emotion!)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown size={14} className="text-white/60 hover:text-red-400" />
                  </button>
                  <button
                    onClick={() => handleVisualization(msg.emotion!)}
                    className="p-1 hover:bg-white/10 rounded transition-colors ml-auto"
                    title="Start visualization"
                  >
                    <Sparkles size={14} className="text-white/60 hover:text-purple-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Share how you're feeling..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
