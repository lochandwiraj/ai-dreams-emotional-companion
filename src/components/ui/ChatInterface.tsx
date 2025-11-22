// src/components/UI/ChatInterface.tsx

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIStore } from "../../store/aiStore";
import { handleUserMessage } from "../../lib/conversationEngine";
import { wakeResponse } from "../../lib/dreamEngine";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentDream = useAIStore((s) => s.currentDream);
  const personality = useAIStore((s) => s.personality);
  const clearSignal = useAIStore((s) => s.clearSignal);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [clearSignal]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      let aiResponse = currentDream
        ? await wakeResponse(currentDream, userMessage, personality)
        : await handleUserMessage(userMessage);

      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Error…" }]);
    }

    setLoading(false);
  };

  return (
    <div className="w-full bg-black/70 backdrop-blur-md rounded-xl border border-white/10 shadow-xl">

      <div className="border-b border-white/10 p-3 text-sm text-gray-300 font-medium">
        💬 Chat
      </div>

      <div ref={scrollRef} className="max-h-48 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center italic py-6">
            Start a conversation...
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
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

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-white/10"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
