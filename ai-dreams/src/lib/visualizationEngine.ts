// src/lib/visualizationEngine.ts
import { EmotionType } from './emotionDetection';

export interface VisualizationScript {
  id: string;
  emotion: EmotionType;
  title: string;
  duration: number; // seconds
  sentences: string[];
  audioSuggestion?: string;
  sceneType: 'forest' | 'ocean' | 'mountain' | 'space' | 'garden';
}

export const VISUALIZATION_SCRIPTS: VisualizationScript[] = [
  {
    id: 'vis-sad-1',
    emotion: 'sad',
    title: 'Healing Light',
    duration: 180,
    sceneType: 'forest',
    audioSuggestion: 'nat1',
    sentences: [
      'Close your eyes and take a deep breath.',
      'Imagine yourself in a peaceful forest clearing.',
      'Soft rain falls gently around you, washing away your sadness.',
      'Each drop carries away a piece of your pain.',
      'You feel lighter with every breath.',
      'The forest embraces you with warmth and acceptance.',
      'You are safe here. You are held.',
      'Your feelings are valid, and they will pass.',
      'Like the rain, this too shall flow away.',
      'Take one more deep breath, and when you\'re ready, open your eyes.'
    ]
  },
  {
    id: 'vis-anxious-1',
    emotion: 'anxious',
    title: 'Grounding Breath',
    duration: 150,
    sceneType: 'ocean',
    audioSuggestion: 'nat3',
    sentences: [
      'Let\'s ground together. Take a slow breath in.',
      'Imagine standing on a calm beach.',
      'Feel the sand beneath your feet, solid and supportive.',
      'Watch the waves roll in... and out... in... and out.',
      'Your breath matches the rhythm of the ocean.',
      'In... and out. Steady. Calm.',
      'Notice five things you can see around you.',
      'Four things you can touch.',
      'Three things you can hear.',
      'Two things you can smell.',
      'One thing you can taste.',
      'You are here. You are present. You are safe.'
    ]
  },
  {
    id: 'vis-stressed-1',
    emotion: 'stressed',
    title: 'Mountain Release',
    duration: 200,
    sceneType: 'mountain',
    audioSuggestion: 'med1',
    sentences: [
      'Breathe deeply. You\'ve been carrying so much.',
      'Imagine yourself on a mountain peak.',
      'The air is crisp and clear.',
      'With each exhale, release one burden.',
      'Let it fall away into the valley below.',
      'You don\'t need to hold everything.',
      'Some things can be set down.',
      'Feel your shoulders relax.',
      'Your jaw unclench.',
      'Your breath deepen.',
      'You are more than your to-do list.',
      'You are enough, exactly as you are.',
      'Rest here for a moment.'
    ]
  },
  {
    id: 'vis-lonely-1',
    emotion: 'lonely',
    title: 'Connected Universe',
    duration: 180,
    sceneType: 'space',
    audioSuggestion: 'amb2',
    sentences: [
      'Close your eyes and breathe.',
      'Imagine floating gently in space.',
      'You see Earth below, glowing softly.',
      'Billions of hearts beating together.',
      'You are part of this vast, connected web.',
      'Your loneliness is felt by others too.',
      'You are not alone in feeling alone.',
      'Somewhere, someone is thinking of you.',
      'Somewhere, someone needs exactly what you offer.',
      'You are a unique thread in the fabric of existence.',
      'And you matter.',
      'Take a breath, and feel that connection.'
    ]
  },
  {
    id: 'vis-calm-1',
    emotion: 'calm',
    title: 'Garden of Peace',
    duration: 120,
    sceneType: 'garden',
    audioSuggestion: 'nat2',
    sentences: [
      'You\'re already in a peaceful place.',
      'Let\'s deepen that feeling.',
      'Imagine a beautiful garden.',
      'Flowers bloom in every color.',
      'Birds sing softly.',
      'A gentle breeze carries the scent of jasmine.',
      'You sit on a comfortable bench.',
      'Nothing to do. Nowhere to be.',
      'Just this moment.',
      'Just this breath.',
      'Just this peace.',
      'Carry this feeling with you.'
    ]
  }
];

export function getVisualizationForEmotion(emotion: EmotionType): VisualizationScript | null {
  const scripts = VISUALIZATION_SCRIPTS.filter(v => v.emotion === emotion);
  if (scripts.length === 0) return null;
  return scripts[Math.floor(Math.random() * scripts.length)];
}

export class VisualizationPlayer {
  private currentScript: VisualizationScript | null = null;
  private currentIndex: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private onSentenceChange: ((sentence: string, index: number, total: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  play(script: VisualizationScript, onSentence: (s: string, i: number, t: number) => void, onDone: () => void): void {
    this.stop();
    
    this.currentScript = script;
    this.currentIndex = 0;
    this.onSentenceChange = onSentence;
    this.onComplete = onDone;

    const interval = (script.duration * 1000) / script.sentences.length;
    
    // Show first sentence immediately
    this.showCurrentSentence();

    // Schedule remaining sentences
    this.timer = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex >= script.sentences.length) {
        this.stop();
        if (this.onComplete) this.onComplete();
      } else {
        this.showCurrentSentence();
      }
    }, interval);
  }

  private showCurrentSentence(): void {
    if (!this.currentScript || !this.onSentenceChange) return;
    
    const sentence = this.currentScript.sentences[this.currentIndex];
    const total = this.currentScript.sentences.length;
    this.onSentenceChange(sentence, this.currentIndex, total);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentScript = null;
    this.currentIndex = 0;
  }

  getCurrentScript(): VisualizationScript | null {
    return this.currentScript;
  }
}
