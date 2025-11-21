// src/lib/sleepCycle.ts
import { useAIStore } from "../store/aiStore";
import { generateDream } from "./dreamEngine";
import { getDemoDream } from "../demo/demoData";

/* FAST mode toggle */
const FAST_MODE = import.meta.env.VITE_FAST_MODE === "true";
const SPEED = FAST_MODE ? 0.1 : 1;

export class SleepCycleManager {
  private readonly AWAKE_DURATION = FAST_MODE ? 30_000 : 180_000;
  private readonly DROWSY_DURATION = FAST_MODE ? 10_000 : 30_000;
  private readonly DREAM_DURATION = FAST_MODE ? 20_000 : 60_000;
  private readonly WAKING_DURATION = 3000 * SPEED;

  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private failureCount = 0;
  private isRunning = false;

  constructor() {
    console.log(`[SleepCycle] Initialized (FAST=${FAST_MODE})`);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.check();
    const poll = 5000 * SPEED;
    this.checkTimer = setInterval(() => this.check(), poll);
    console.log("[SleepCycle] started");
  }

  stop() {
    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    console.log("[SleepCycle] stopped");
  }

  destroy() {
    this.stop();
  }

  private check() {
    const store = useAIStore.getState();
    if (store.state !== "awake") return;

    const idle = Date.now() - store.lastInteraction;
    const mins = Math.floor(idle / 60000);
    const secs = Math.floor((idle % 60000) / 1000);
    console.log(`[SleepCycle] awake for ${mins}m ${secs}s`);

    if (idle >= this.AWAKE_DURATION) {
      this.enterDrowsy();
    }
  }

  private enterDrowsy() {
    const store = useAIStore.getState();
    if (store.state !== "awake") return;

    store.transitionTo("drowsy");
    console.log("[SleepCycle] -> drowsy");
    // schedule dream
    this.transitionTimer = setTimeout(() => this.enterDream(), this.DROWSY_DURATION);
  }

  private async enterDream() {
    const store = useAIStore.getState();
    if (store.state !== "drowsy") return;

    store.transitionTo("dreaming");
    console.log("[SleepCycle] -> dreaming");

    try {
      const memContents = store.memories.map((m) => m.content);
      const dream = await generateDream(memContents, store.personality);

      if (!dream) throw new Error("null dream returned");

      store.processDream(dream);
      this.failureCount = 0;
      console.log("[SleepCycle] dream processed:", dream.emotionalTone);
    } catch (err) {
      console.error("[SleepCycle] dream generation failed:", err);
      this.failureCount++;
      if (this.failureCount >= 3 && !store.demoMode) {
        store.toggleDemoMode();
        console.warn("[SleepCycle] switched to demo mode");
      }
      const demo = getDemoDream();
      store.processDream(demo);
      console.log("[SleepCycle] used demo dream");
    }

    this.transitionTimer = setTimeout(() => this.wake(), this.DREAM_DURATION);
  }

  private wake() {
    const store = useAIStore.getState();
    if (store.state !== "dreaming" && store.state !== "drowsy") {
      // if we were already forced to awake, no-op
      return;
    }
    store.transitionTo("waking");
    console.log("[SleepCycle] -> waking");
    this.transitionTimer = setTimeout(() => {
      store.transitionTo("awake");
      useAIStore.setState({ lastInteraction: Date.now() });
      console.log("[SleepCycle] -> awake");
    }, this.WAKING_DURATION);
  }

  forceWake() {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    const store = useAIStore.getState();
    store.transitionTo("awake");
    useAIStore.setState({ lastInteraction: Date.now() });
    console.log("[SleepCycle] force wake");
  }
}

export const sleepCycle = new SleepCycleManager();
