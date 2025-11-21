import { useAIStore } from "../store/aiStore";
import { DEMO_DREAMS } from "./demoData";

let demoInterval: NodeJS.Timeout | null = null;

/**
 * 🎭 Enables demo mode — cycles through demo dreams periodically.
 */
export function startDemoMode() {
  const store = useAIStore.getState();
  store.toggleDemoMode();
  console.log("🎭 Demo mode activated");

  // Preload a couple of demo dreams
  DEMO_DREAMS.slice(0, 2).forEach((dream) => store.processDream(dream));

  // Cycle through dreams every 90 seconds
  let dreamIndex = 2;
  demoInterval = setInterval(() => {
    if (store.state === "dreaming") {
      const dream = DEMO_DREAMS[dreamIndex % DEMO_DREAMS.length];
      store.processDream({
        ...dream,
        id: `demo-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
      dreamIndex++;
    }
  }, 90000);
}

/**
 * 🛑 Stops demo mode and clears interval
 */
export function stopDemoMode() {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
    console.log("🛑 Demo mode stopped");
  }
}

/**
 * ⚠️ Called automatically when OpenRouter API fails
 */
export function handleConnectionFailure() {
  const store = useAIStore.getState();
  if (!store.demoMode) {
    console.warn("⚠️ Connection failure — activating demo mode");
    startDemoMode();
  }
}
