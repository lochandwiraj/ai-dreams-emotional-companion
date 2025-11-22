import { detectEmotion } from './emotionDetector';

// Quick manual tests (run these in console or create proper Jest tests later)
export async function testEmotionDetection() {
  const testCases = [
    "I'm feeling really sad today, nothing seems to be going right",
    "I'm so angry at my boss for overloading me with work!",
    "I have a presentation tomorrow and I'm super nervous",
    "Work is so stressful, I have 10 deadlines this week",
    "I feel so alone, nobody understands me",
    "I'm excited about my vacation next week!",
    "Just a normal day, nothing special"
  ];

  console.log('🧪 Testing Emotion Detection:\n');
  
  for (const message of testCases) {
    const result = await detectEmotion(message);
    console.log(`Message: "${message}"`);
    console.log(`Detected: ${result.emotion} (confidence: ${result.confidence.toFixed(2)}, intensity: ${result.intensity.toFixed(2)})`);
    console.log(`Themes: ${result.themes.join(', ')}`);
    console.log(`Needs Support: ${result.needsSupport ? 'Yes' : 'No'}\n`);
  }
}

// Run in browser console: testEmotionDetection()