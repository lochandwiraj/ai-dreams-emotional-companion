// src/lib/similarityEngine.ts
// Text normalization + semantic similarity helpers for AI Dreams.
// Supports:
//  - memory graph building
//  - dream memory integration
//  - emotional theme clustering
//  - topic-based linking

/* -------------------------------------------------------------
   1. TEXT NORMALIZER
------------------------------------------------------------- */

export function normalize(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------
   2. SIMILARITY GROUPS (expandable)
------------------------------------------------------------- */

const SIMILARITY_GROUPS: string[][] = [
  // elemental
  ["water", "ice", "snow", "river", "ocean", "sea", "liquid"],
  ["fire", "flame", "burn", "heat", "ember"],
  ["sky", "cloud", "air", "wind", "breeze"],

  // abstract emotional
  ["fear", "scared", "afraid", "anxiety"],
  ["sad", "grief", "pain", "hurt"],
  ["happy", "joy", "excited", "delight", "glad"],

  // social / relational
  ["friend", "buddy", "pal", "mate"],
  ["john", "jon", "david", "dave"],

  // ai-related
  ["ai", "assistant", "bot", "machine", "llm"],

  // dream-related
  ["dream", "vision", "imagination", "fantasy", "hallucination"],

  // introspective
  ["think", "thought", "reflect", "wonder", "consider"],
];

/* -------------------------------------------------------------
   3. SIMILARITY HELPER
------------------------------------------------------------- */

export function shouldConnect(a: string, b: string): boolean {
  a = normalize(a);
  b = normalize(b);

  if (!a || !b) return false;

  // identical
  if (a === b) return true;

  // same similarity group
  for (const group of SIMILARITY_GROUPS) {
    if (group.includes(a) && group.includes(b)) {
      return true;
    }
  }

  // partial match
  if (a.includes(b) || b.includes(a)) return true;

  // prefix match ("sadness" vs "sad")
  if (a.startsWith(b) || b.startsWith(a)) return true;

  return false;
}
