import { detectEmotion } from '../lib/emotionDetector';
import { suggestAudioFromMessage } from '../lib/emotionAudioBridge';

// Test 1: Emotion Detection → Audio Suggestion
async function testIntegration() {
  console.log('=== INTEGRATION TEST ===\n');
  
  // Test anxious emotion
  const suggestion = await suggestAudioFromMessage(
    "I'm feeling really anxious about my presentation tomorrow"
  );
  
  if (suggestion) {
    console.log('✅ Integration working!');
    console.log(`Suggested track: "${suggestion.track.title}"`);
    console.log(`Reason: ${suggestion.reason}`);
    console.log(`Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
  } else {
    console.log('❌ No suggestion generated');
  }
}

testIntegration();