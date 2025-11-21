import { addMemoryWithAnalysis } from './memoryEngine';
import { useMemoryStore } from '../store/memoryStore';

export async function handleUserMessage(message: string) {
  const store = useAIStore.getState();
  
  // Add with automatic importance calculation
  addMemoryWithAnalysis(`User: ${message}`);
  
  const justWoke = store.state === 'waking' || 
    (store.currentDream && (Date.now() - new Date(store.currentDream.timestamp).getTime() < 60000));
  
  let response: string;
  if (justWoke && store.currentDream) {
    response = await wakeResponse(store.currentDream, message, store.personality);
  } else {
    response = `I heard: "${message}". (normal response)`;
  }
  
  addMemoryWithAnalysis(`AI: ${response}`);
  return response;
}