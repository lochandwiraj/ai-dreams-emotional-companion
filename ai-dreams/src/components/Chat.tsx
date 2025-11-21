import { useState } from 'react';
import { useStore } from '../store';
import { generateWakeResponse } from '../lib/dream';

export function Chat() {
  const { state, addMemory, touchInteraction } = useStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    addMemory(`User: ${userMsg}`);
    touchInteraction();
    
    setLoading(true);
    
    try {
      const response = state === 'waking' || state === 'dreaming'
        ? await generateWakeResponse(userMsg)
        : `I heard you. I'm ${state} right now.`;
      
      setMessages((m) => [...m, { role: 'assistant', text: response }]);
      addMemory(`AI: ${response}`);
    } catch (error) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong...' }]);
    } finally {
      setLoading(false);
    }
  };
  
  if (state === 'dreaming') {
    return (
      <div className="fixed bottom-8 right-8 p-6 bg-purple-900/30 backdrop-blur rounded-lg">
        <p className="text-purple-200">💤 Dreaming...</p>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-8 right-8 w-96 max-h-96 flex flex-col bg-gray-900/90 backdrop-blur rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-600 ml-8' : 'bg-gray-700 mr-8'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
      </div>
      
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Talk to me..."
          className="flex-1 bg-gray-800 rounded px-3 py-2 text-white"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}