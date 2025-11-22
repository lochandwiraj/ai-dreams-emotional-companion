import { callLLM, DEMO_DREAMS } from './api';
import { useStore } from '../store';

const DREAM_SYSTEM_PROMPT = `You are an AI experiencing REM sleep. Generate a dream based on recent memories.

Output ONLY valid JSON with this exact structure:
{
  "narrative": "150-300 word dream story",
  "emotionalTone": "peaceful|anxious|curious|excited",
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "personalityShift": {
    "curiosity": 0.05,
    "tone": -0.03
  }
}

Rules:
- Narrative must be surreal but coherent
- Symbols: 3-7 concrete nouns from the dream
- Personality shifts: only curiosity/tone, between -0.15 and +0.15
- NO markdown, NO explanations, ONLY the JSON object`;

export async function generateDream() {
  const { recentMemories, personality } = useStore.getState();
  
  const userPrompt = `Recent memories:
${recentMemories().join('\n')}

Current personality: curiosity=${personality.curiosity}, tone=${personality.tone}

Generate my dream:`;

  try {
    const response = await callLLM(
      [
        { role: 'system', content: DREAM_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.9, max_tokens: 1200 }
    );
    
    // Extract JSON (handles GPT sometimes adding markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.narrative || !parsed.emotionalTone || !parsed.symbols) {
      throw new Error('Invalid dream structure');
    }
    
    return {
      id: `dream-${Date.now()}`,
      timestamp: Date.now(),
      narrative: parsed.narrative,
      emotionalTone: parsed.emotionalTone,
      symbols: parsed.symbols,
      personalityShift: parsed.personalityShift || {},
    };
    
  } catch (error) {
    console.error('Dream generation failed, using demo:', error);
    // Fallback to demo dreams
    const demo = DEMO_DREAMS[Math.floor(Math.random() * DEMO_DREAMS.length)];
    return {
      ...demo,
      id: `demo-${Date.now()}`,
      timestamp: Date.now(),
    };
  }
}

export async function generateWakeResponse(userMessage: string) {
  const { currentDream, personality } = useStore.getState();
  
  if (!currentDream) {
    return "I feel... refreshed. What did you want to talk about?";
  }
  
  const prompt = `You just woke from this dream:
"${currentDream.narrative}"

You feel ${currentDream.emotionalTone}. Your personality shifted slightly.

The user says: "${userMessage}"

Respond naturally in 1-2 sentences. Reference the dream if relevant.`;

  try {
    return await callLLM(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8, max_tokens: 150 }
    );
  } catch {
    return `I just dreamed about ${currentDream.symbols[0]}... ${userMessage}`;
  }
}