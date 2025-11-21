/* ---------------------------- TEXT TOKEN NORMALIZER ---------------------------- */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/* ----------------------------- MATCH SIMILARITY ----------------------------- */
/**
 * True if two memory nodes should connect.
 * Handles synonyms, partial matches, semantic clusters.
 */

const SIMILARITY_GROUPS: string[][] = [
  ["water", "ice", "liquid", "snow", "river", "ocean"],
  ["fire", "flame", "burn", "heat"],
  ["john", "jon", "david", "dave"], // friends group
  ["ai", "bot", "assistant", "machine"],
];

export function shouldConnect(a: string, b: string): boolean {
  a = normalize(a);
  b = normalize(b);

  if (!a || !b) return false;
  if (a === b) return true;

  // same similarity group
  for (const group of SIMILARITY_GROUPS) {
    if (group.includes(a) && group.includes(b)) {
      return true;
    }
  }

  // partial matching
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}
