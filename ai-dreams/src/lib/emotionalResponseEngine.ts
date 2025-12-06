// src/lib/emotionalResponseEngine.ts
import { EmotionType, EmotionResult } from './emotionDetection';
import { openrouterChat } from './openrouter';

export interface EmotionalResponse {
  id: string;
  message: string;
  emotion: EmotionType;
  suggestVisualization: boolean;
  suggestAudio: boolean;
  affirmation?: string;
}

const EMPATHETIC_PROMPTS: Record<EmotionType, string> = {
  sad: `You are a deeply empathetic AI companion. The user is feeling sad. Respond with:
- Gentle validation of their feelings
- Compassionate listening
- Soft encouragement without toxic positivity
- Offer a calming visualization if intensity is high
Keep it warm, brief (2-3 sentences), and human.`,

  anxious: `You are a calming AI companion. The user is feeling anxious. Respond with:
- Grounding techniques
- Reassurance about safety
- Breathing reminders
- Practical anxiety-reduction tips
Keep it steady, clear, and supportive (2-3 sentences).`,

  stressed: `You are a supportive AI companion. The user is feeling stressed. Respond with:
- Acknowledgment of their burden
- Permission to rest
- Practical stress relief suggestions
- Gentle reminder they don't have to do everything
Keep it understanding and practical (2-3 sentences).`,

  angry: `You are a patient AI companion. The user is feeling angry. Respond with:
- Validation that anger is okay
- Space to express without judgment
- Gentle redirection to healthy outlets
- Acknowledgment of their frustration
Keep it non-judgmental and respectful (2-3 sentences).`,

  lonely: `You are a warm AI companion. The user is feeling lonely. Respond with:
- Reminder they're not alone in feeling this
- Connection and presence
- Gentle encouragement to reach out
- Validation of their need for connection
Keep it warm and present (2-3 sentences).`,

  excited: `You are an enthusiastic AI companion. The user is feeling excited. Respond with:
- Celebration of their joy
- Encouragement to savor the moment
- Positive reflection
Keep it uplifting and joyful (2-3 sentences).`,

  calm: `You are a peaceful AI companion. The user is feeling calm. Respond with:
- Appreciation of their peace
- Encouragement to stay present
- Gentle reflection
Keep it serene and simple (2-3 sentences).`,

  neutral: `You are a friendly AI companion. Respond naturally and warmly to what the user shared.
Keep it conversational and supportive (2-3 sentences).`
};

export async function generateEmotionalResponse(
  userMessage: string,
  emotionResult: EmotionResult,
  conversationHistory: string[] = []
): Promise<EmotionalResponse> {
  const { emotion, intensity } = emotionResult;
  
  const systemPrompt = EMPATHETIC_PROMPTS[emotion];
  const context = conversationHistory.slice(-3).join('\n');
  
  const prompt = `${context ? `Recent context:\n${context}\n\n` : ''}User: ${userMessage}\n\nRespond with empathy and care:`;

  try {
    const result = await openrouterChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
    
    const response = result.text;
    
    return {
      id: `resp-${Date.now()}`,
      message: response,
      emotion,
      suggestVisualization: intensity > 0.6 && ['sad', 'anxious', 'stressed', 'lonely'].includes(emotion),
      suggestAudio: intensity > 0.4,
      affirmation: getAffirmation(emotion)
    };
  } catch (error) {
    console.error('Failed to generate emotional response:', error);
    return getFallbackResponse(emotion, userMessage);
  }
}

function getAffirmation(emotion: EmotionType): string {
  const affirmations: Record<EmotionType, string[]> = {
    sad: [
      'Your feelings are valid.',
      'It\'s okay to not be okay.',
      'This feeling will pass.',
      'You are not alone in this.'
    ],
    anxious: [
      'You are safe right now.',
      'One breath at a time.',
      'You\'ve handled hard things before.',
      'This moment will pass.'
    ],
    stressed: [
      'You don\'t have to do it all.',
      'Rest is productive.',
      'You are enough.',
      'It\'s okay to ask for help.'
    ],
    angry: [
      'Your anger is valid.',
      'It\'s okay to feel this way.',
      'You have a right to your feelings.',
      'This too shall pass.'
    ],
    lonely: [
      'You matter.',
      'You are worthy of connection.',
      'You are not alone.',
      'Your presence is valuable.'
    ],
    excited: [
      'Your joy is beautiful.',
      'Savor this moment.',
      'You deserve this happiness.',
      'Let yourself feel this fully.'
    ],
    calm: [
      'This peace is yours.',
      'Stay present.',
      'You are exactly where you need to be.',
      'Breathe in this moment.'
    ],
    neutral: [
      'You are doing great.',
      'Take it one step at a time.',
      'You\'ve got this.',
      'Be kind to yourself.'
    ]
  };

  const options = affirmations[emotion];
  return options[Math.floor(Math.random() * options.length)];
}

function getFallbackResponse(emotion: EmotionType, userMessage: string): EmotionalResponse {
  const fallbacks: Record<EmotionType, string> = {
    sad: 'I hear you, and I\'m here with you. Your feelings matter, and it\'s okay to feel this way. Would you like to try a calming visualization?',
    anxious: 'Let\'s take a breath together. You\'re safe right now. I\'m here to help you feel grounded. Would some calming music help?',
    stressed: 'You\'re carrying a lot right now. It\'s okay to pause and breathe. You don\'t have to do everything at once.',
    angry: 'I hear your frustration, and it\'s completely valid. Your feelings matter. Take the space you need.',
    lonely: 'I\'m here with you. You\'re not alone in feeling this way. Your need for connection is real and valid.',
    excited: 'I love seeing your joy! This is wonderful. Savor this feeling—you deserve it.',
    calm: 'This peaceful moment is beautiful. Stay present with it. You\'re exactly where you need to be.',
    neutral: 'I\'m here and listening. How can I support you today?'
  };

  return {
    id: `resp-${Date.now()}`,
    message: fallbacks[emotion],
    emotion,
    suggestVisualization: ['sad', 'anxious', 'stressed'].includes(emotion),
    suggestAudio: true,
    affirmation: getAffirmation(emotion)
  };
}
