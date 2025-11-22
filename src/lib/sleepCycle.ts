// src/lib/sleepCycle.ts
import { useAIStore } from "../store/aiStore";
import { generateDream } from "./dreamEngine";
import { getUnifiedEmotion } from "./emotionRuntimeAdapter";
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

  /* -------------------------------------------------------
     CHECK: Should the AI become drowsy?
  ------------------------------------------------------- */
  private check() {
    const store = useAIStore.getState();
    if (store.state !== "awake") return;

    const idle = Date.now() - store.lastInteraction;

    if (idle >= this.AWAKE_DURATION) {
      this.enterDrowsy();
    }
  }

  /* -------------------------------------------------------
     ENTER DROWSY
  ------------------------------------------------------- */
  private enterDrowsy() {
    const store = useAIStore.getState();
    if (store.state !== "awake") return;

    store.transitionTo("drowsy");
    console.log("[SleepCycle] -> drowsy");

    // Schedule dream phase
    this.transitionTimer = setTimeout(
      () => this.enterDream(),
      this.DROWSY_DURATION
    );
  }

  /* -------------------------------------------------------
     ENTER DREAM
     Includes emotional context from unifiedEmotion
  ------------------------------------------------------- */
  private async enterDream() {
    const store = useAIStore.getState();
    if (store.state !== "drowsy") return;

    store.transitionTo("dreaming");
    console.log("[SleepCycle] -> dreaming");

    try {
      // Fetch emotional context before dreaming
      const emotionalContext = await getUnifiedEmotion();

      // Use fullMessage instead of just `content`
      const memContents = store.memories.map((m) => m.fullMessage);

      const dream = await generateDream(
        memContents,
        store.personality,
        emotionalContext
      );

      store.processDream(dream);
      this.failureCount = 0;

      console.log(
        `[SleepCycle] dream processed: tone=${dream.emotionalTone}`
      );
    } catch (err) {
      console.error("[SleepCycle] dream generation failed:", err);

      this.failureCount++;
      const store2 = useAIStore.getState();

      if (this.failureCount >= 3 && !store2.demoMode) {
        store2.toggleDemoMode();
        console.warn("[SleepCycle] switched to demo mode");
      }

      const demo = getDemoDream();
      store2.processDream(demo);

      console.log("[SleepCycle] used demo dream");
    }

    this.transitionTimer = setTimeout(() => this.wake(), this.DREAM_DURATION);
  }

  /* -------------------------------------------------------
     WAKE (dream → waking → awake)
  ------------------------------------------------------- */
  private wake() {
    const store = useAIStore.getState();
    if (store.state !== "dreaming" && store.state !== "drowsy") return;

    store.transitionTo("waking");
    console.log("[SleepCycle] -> waking");

    this.transitionTimer = setTimeout(() => {
      store.transitionTo("awake");

      // Reset idle timer
      useAIStore.setState({ lastInteraction: Date.now() });

      console.log("[SleepCycle] -> awake");

      this.transitionTimer = null;
    }, this.WAKING_DURATION);
  }

  /* FORCE WAKE */
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
