// src/lib/memoryEngine.ts
// Unified Memory Engine for AI Dreams.
// Upgraded for:
// - Emotional metadata
// - Topic + context integration
// - Safe Zustand mutation
// - Dream-engine compatibility

import { useMemoryStore } from "../store/memoryStore";
import { topicStore } from "./topicStore";
import { contextStore } from "./contextStore";
import type { RuntimeEmotion } from "./emotionRuntimeAdapter";

/* -------------------------------------------------------------
   1. IMPORTANCE SCORING
------------------------------------------------------------- */

export function calculateImportance(content: string): number {
  const lower = content.toLowerCase();

  const important = [
    "remember", "important", "never forget", "always",
    "love", "hate", "fear", "hope", "dream",
    "question", "wonder", "curious", "why"
  ];

  const trivial = ["okay", "ok", "yeah", "sure", "maybe", "dunno", "whatever", "idk"];

  let score = 0.5;

  for (const kw of important) if (lower.includes(kw)) score += 0.1;
  for (const kw of trivial) if (lower.includes(kw)) score -= 0.05;

  if (content.includes("?")) score += 0.15;
  if (content.length > 100) score += 0.1;
  if (content.length > 200) score += 0.1;

  return Math.max(0.1, Math.min(1, score));
}

/* -------------------------------------------------------------
   2. TAG EXTRACTION
------------------------------------------------------------- */

export function extractTags(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const stopWords = ["about", "there", "their", "would", "could", "should"];
  const filtered = words.filter((w) => !stopWords.includes(w));

  return [...new Set(filtered)].slice(0, 5);
}

/* -------------------------------------------------------------
   3. MAIN MEMORY INSERTION
------------------------------------------------------------- */

export function addMemoryWithAnalysis(
  content: string,
  emotionalSnapshot?: RuntimeEmotion
) {
  const store = useMemoryStore.getState();

  const importance = calculateImportance(content);
  const tags = extractTags(content);

  // 1) Insert basic memory
  store.addMemory(content, importance);

  // 2) Extend last memory with emotional metadata + tags + topics
  const memories = store.memories;
  if (memories.length > 0) {
    const last = memories[memories.length - 1];

    // Ensure safety mutation
    const enriched = {
      ...last,
      tags,
      emotion: emotionalSnapshot?.payload || null,
      stability: emotionalSnapshot?.stability?.stabilityIndex ?? null,
      unifiedEmotion: emotionalSnapshot?.harmonized?.unifiedEmotion ?? null,
      intensity: emotionalSnapshot?.harmonized?.unifiedIntensity ?? null,
      updatedAt: new Date().toISOString()
    };

    Object.assign(last, enriched);

    // 3) Update topic store
    for (const t of tags) {
      topicStore.addOrUpdateTopic(t, {
        emotion: enriched.unifiedEmotion || "neutral",
        intensity: enriched.intensity ? enriched.intensity * 10 : 5,
        when: enriched.updatedAt
      });
    }

    // 4) Feed into contextStore
    if (tags.length > 0) {
      contextStore.addHints(tags);
    }
  }

  console.log(
    `[MemoryEngine] Stored memory: importance=${importance.toFixed(2)}, tags=[${tags.join(", ")}]`
  );
}

/* -------------------------------------------------------------
   4. MEMORY DECAY MANAGER
------------------------------------------------------------- */

class MemoryDecayManager {
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.interval) return;

    console.log("🧠 MemoryDecayManager running every 5 minutes");

    this.interval = setInterval(() => {
      const store = useMemoryStore.getState();

      try {
        store.applyDecay?.();
      } catch (err) {
        console.warn("[MemoryEngine] applyDecay failed:", err);
      }

      try {
        store.pruneMemories?.();
      } catch (err) {
        console.warn("[MemoryEngine] pruneMemories failed:", err);
      }

      console.log("💭 Memory decay cycle executed");
    }, 5 * 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("🧠 MemoryDecayManager stopped");
    }
  }
}

export const memoryDecay = new MemoryDecayManager();
