// src/lib/symbolExtractor.ts
import { openrouterChat } from "./openrouter";

/* -------------------------------------------------------------------------- */
/* 🌌 Dream Symbol Types                                                      */
/* -------------------------------------------------------------------------- */
export interface DreamSymbol {
  text: string;
  category: "object" | "emotion" | "action" | "place";
  strength: number; // 0–1
}

/* -------------------------------------------------------------------------- */
/* ⚡ Step 5: Fast Local Symbol Parser (No API Calls, Pure Regex)             */
/* -------------------------------------------------------------------------- */
export function extractSymbolsLocal(narrative: string): DreamSymbol[] {
  const symbols: DreamSymbol[] = [];

  // Curated dream symbol keywords
  const symbolPatterns = {
    objects: [
      "mirror",
      "key",
      "book",
      "door",
      "window",
      "clock",
      "bird",
      "butterfly",
      "ocean",
      "mountain",
      "tree",
      "flower",
      "light",
      "shadow",
      "star",
      "moon",
      "sun",
    ],
    emotions: [
      "fear",
      "joy",
      "love",
      "anger",
      "peace",
      "anxiety",
      "wonder",
      "curiosity",
      "longing",
    ],
    actions: [
      "fly",
      "fall",
      "run",
      "swim",
      "climb",
      "dance",
      "sing",
      "whisper",
      "shout",
    ],
    places: [
      "forest",
      "city",
      "ocean",
      "sky",
      "desert",
      "mountain",
      "valley",
      "cave",
      "bridge",
    ],
  };

  const lower = narrative.toLowerCase();

  // Scan narrative for each symbol
  Object.entries(symbolPatterns).forEach(([category, words]) => {
    words.forEach((word) => {
      const regex = new RegExp(`\\b${word}s?\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) {
        const strength = Math.min(1, matches.length * 0.25);
        symbols.push({
          text: word,
          category: category.slice(0, -1) as DreamSymbol["category"], // remove plural “s”
          strength,
        });
      }
    });
  });

  // Deduplicate and sort by strength (descending)
  const unique = Array.from(new Map(symbols.map((s) => [s.text, s])).values());
  unique.sort((a, b) => b.strength - a.strength);

  // Keep only top 7 symbols
  return unique.slice(0, 7);
}

/* -------------------------------------------------------------------------- */
/* 🔮 Step 6: Optional API Symbol Extraction (OpenRouter)                    */
/* -------------------------------------------------------------------------- */
export async function extractSymbolsAPI(
  narrative: string
): Promise<DreamSymbol[]> {
  const prompt = `Extract 5–7 symbolic elements from this dream narrative.
Return ONLY a JSON array of objects with keys:
{text, category (object|emotion|action|place), strength (0–1)}.

Dream: "${narrative}"

JSON only:`;

  try {
    const res = await openrouterChat(
      [{ role: "user", content: prompt }],
      { max_tokens: 300 }
    );

    if (!res.ok) throw new Error("API extraction failed");

    // Clean markdown fences if returned
    const clean = res.text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) throw new Error("Invalid API response format");

    console.log("🌐 Symbol extraction (API) succeeded:", parsed);
    return parsed;
  } catch (err) {
    console.warn("⚠️ Symbol API failed, reverting to local parser:", err);
    return extractSymbolsLocal(narrative);
  }
}
