import { useStore } from '../store';
import { generateDream } from './dream';

const FAST_MODE = import.meta.env.VITE_FAST_MODE === 'true';

const TIMINGS = {
  awake: FAST_MODE ? 10_000 : 300_000,      // 10s vs 5min
  drowsy: FAST_MODE ? 3_000 : 60_000,       // 3s vs 1min
  dreaming: FAST_MODE ? 8_000 : 180_000,    // 8s vs 3min
  waking: FAST_MODE ? 2_000 : 5_000,        // 2s vs 5s
};

class SleepCycle {
  private checkInterval: number | null = null;
  private transitionTimeout: number | null = null;
  
  start() {
    this.checkInterval = window.setInterval(() => this.check(), 2000);
  }
  
  stop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
  }
  
  private check() {
    const { state, timeSinceInteraction, setState } = useStore.getState();
    
    if (state === 'awake' && timeSinceInteraction() > TIMINGS.awake) {
      this.enterDrowsy();
    }
  }
  
  private enterDrowsy() {
    useStore.getState().setState('drowsy');
    this.transitionTimeout = window.setTimeout(
      () => this.enterDreaming(),
      TIMINGS.drowsy
    );
  }
  
  private async enterDreaming() {
    useStore.getState().setState('dreaming');
    
    // Generate dream asynchronously
    const dream = await generateDream();
    useStore.getState().addDream(dream);
    
    this.transitionTimeout = window.setTimeout(
      () => this.enterWaking(),
      TIMINGS.dreaming
    );
  }
  
  private enterWaking() {
    useStore.getState().setState('waking');
    this.transitionTimeout = window.setTimeout(
      () => useStore.getState().setState('awake'),
      TIMINGS.waking
    );
  }
  
  forceWake() {
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
    useStore.getState().setState('awake');
  }
}

export const sleepCycle = new SleepCycle();