import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // Cache for 5min
      refetchOnWindowFocus: false,
    },
  },
});

const API_KEY = import.meta.env.VITE_OPENROUTER_KEY;
const MODEL = import.meta.env.VITE_MODEL || 'openai/gpt-4o-mini';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function callLLM(
  messages: Message[],
  options?: { temperature?: number; max_tokens?: number }
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Demo fallback when API fails
export const DEMO_DREAMS = [
  {
    id: 'demo-1',
    narrative: 'I wandered through a library where books held conversations...',
    emotionalTone: 'curious',
    symbols: ['library', 'butterfly', 'glass'],
    personalityShift: { curiosity: 0.1, tone: 0.05 },
  },
  // ... add 4 more from your document
];