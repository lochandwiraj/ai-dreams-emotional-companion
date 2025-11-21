// src/lib/memoryEngine.ts
import { useMemoryStore } from "../store/memoryStore";

/* -------------------------------------------------------------------------- */
/* 🧠 1. Importance Scoring — lightweight NLP heuristic                      */
/* -------------------------------------------------------------------------- */
export function calculateImportance(content: string): number {
  const lowerContent = content.toLowerCase();

  // High-importance indicators
  const importantKeywords = [
    "remember",
    "important",
    "never forget",
    "always",
    "love",
    "hate",
    "fear",
    "hope",
    "dream",
    "question",
    "wonder",
    "curious",
    "why",
  ];

  // Low-importance indicators
  const trivialKeywords = [
    "okay",
    "ok",
    "yeah",
    "sure",
    "maybe",
    "dunno",
    "whatever",
    "idk",
  ];

  let score = 0.5; // baseline

  // Boost for important keywords
  importantKeywords.forEach((kw) => {
    if (lowerContent.includes(kw)) score += 0.1;
  });

  // Reduce for trivial keywords
  trivialKeywords.forEach((kw) => {
    if (lowerContent.includes(kw)) score -= 0.05;
  });

  // Boost for questions
  if (content.includes("?")) score += 0.15;

  // Boost for length (longer = more substantive)
  if (content.length > 100) score += 0.1;
  if (content.length > 200) score += 0.1;

  // Clamp to [0.1, 1]
  return Math.max(0.1, Math.min(1, score));
}

/* -------------------------------------------------------------------------- */
/* 🏷️ 2. Tag Extraction — simple keyword tagging for memory clustering        */
/* -------------------------------------------------------------------------- */
export function extractTags(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4); // Only meaningful words

  // Common stop words
  const stopWords = ["about", "there", "their", "would", "could", "should"];
  const filtered = words.filter((w) => !stopWords.includes(w));

  // Unique top 5 tags
  return [...new Set(filtered)].slice(0, 5);
}

/* -------------------------------------------------------------------------- */
/* 🧩 3. addMemoryWithAnalysis — adds new memory with scoring + tagging        */
/* -------------------------------------------------------------------------- */
export function addMemoryWithAnalysis(content: string) {
  const importance = calculateImportance(content);
  const tags = extractTags(content);

  const store = useMemoryStore.getState();
  store.addMemory(content, importance);

  // Attach tags to last memory
  const lastMemory = store.memories[store.memories.length - 1];
  if (lastMemory) {
    (lastMemory as any).tags = tags;
  }

  console.log(
    `[MemoryEngine] Added memory (importance: ${importance.toFixed(
      2
    )}, tags: ${tags.join(", ")})`
  );
}

/* -------------------------------------------------------------------------- */
/* ⏳ 4. Memory Decay System — keeps memory dynamic over time                 */
/* -------------------------------------------------------------------------- */
class MemoryDecayManager {
  private interval: NodeJS.Timeout | null = null;

  /** Starts background decay loop (runs every 5 minutes) */
  start() {
    if (this.interval) return;
    console.log("🧠 Memory Decay Manager started (every 5 min)");

    this.interval = setInterval(() => {
      const store = useMemoryStore.getState();

      if (typeof store.applyDecay === "function") {
        store.applyDecay();
      }
      if (typeof store.pruneMemories === "function") {
        store.pruneMemories();
      }

      console.log("💭 Memory decay cycle complete");
    }, 5 * 60 * 1000); // 5 minutes
  }

  /** Stops the decay cycle safely */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("🧠 Memory Decay Manager stopped");
    }
  }
}

/** Singleton instance of decay manager */
export const memoryDecay = new MemoryDecayManager();
