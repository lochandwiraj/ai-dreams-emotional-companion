export function buildEmotionDetectionPrompt(userMessage: string): string {
  return `You are an expert emotion analyzer. Analyze this message and detect the user's emotional state.

**Message:** "${userMessage}"

**Instructions:**
- Consider word choice, punctuation, intensity, context
- Detect primary emotion (not multiple)
- Be sensitive to subtle cues
- Consider cultural and contextual nuances

**Respond ONLY with valid JSON (no markdown, no backticks):**
{
  "emotion": "sad|angry|anxious|stressed|lonely|excited|neutral|confused|overwhelmed",
  "confidence": 0.85,
  "intensity": 0.7,
  "themes": ["work stress", "deadline pressure"],
  "needsSupport": true
}

**Emotion Definitions:**
- sad: expressions of sadness, loss, depression, hopelessness
- angry: expressions of anger, frustration, irritation, rage
- anxious: worry, fear, nervousness, panic
- stressed: overwhelm from external pressure, busy, deadline stress
- lonely: isolation, feeling alone, disconnected
- excited: happiness, enthusiasm, anticipation, joy
- neutral: calm, balanced, no strong emotion
- confused: uncertain, unclear, seeking understanding
- overwhelmed: too much to handle, paralyzed by complexity

Respond with JSON only:`;
}