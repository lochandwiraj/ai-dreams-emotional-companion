import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIStore } from "../../store/aiStore";
import { generateWakeResponse } from "../../lib/dreamEngine";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const addMemory = useAIStore((s) => s.addMemory);
  const currentDream = useAIStore((s) => s.currentDream);
  const personality = useAIStore((s) => s.personality);
  const clearSignal = useAIStore((s) => s.clearSignal);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear chat on Clear Memory
  useEffect(() => {
    setMessages([]);
  }, [clearSignal]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // UI
    setMessages((p) => [...p, { role: "user", content: userMessage }]);

    // IMPORTANT FIX ⭐ send ONLY the raw user message
    addMemory(userMessage);

    setLoading(true);

    try {
      const response = currentDream
        ? await generateWakeResponse(currentDream, userMessage, personality)
        : "Let's think about that for a moment...";

      setMessages((p) => [...p, { role: "ai", content: response }]);

      // store AI message also
      addMemory(response);
    } catch (err) {
      setMessages((p) => [
        ...p,
        { role: "ai", content: "I’m having trouble thinking right now..." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="absolute bottom-4 left-4 w-[360px] z-30">
      <div className="bg-black/70 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="border-b border-white/10 p-3 text-sm text-gray-300 font-medium">
          💬 Chat
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center italic py-6">
              Start a conversation...
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-white/10 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
