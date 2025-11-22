// Extract structured entities from conversation text using LLM-first approach with fallback

export interface ExtractedContext {
  people: string[];
  places: string[];
  activities: string[];
  triggers: string[];
  comforts: string[];
  raw?: string;
  extractedAt: string;
}

// Mock injection for testing
let mockLLM: ((prompt: string) => Promise<string>) | null = null;

// LLM request stub - to be implemented by consumer
async function sendLLMRequest(prompt: string): Promise<string> {
  if (mockLLM) {
    return mockLLM(prompt);
  }
  // TODO: Implement actual LLM API call
  // This should make the actual HTTP request to the LLM service
  // and return the raw string response
  throw new Error('sendLLMRequest not implemented - TODO: Add actual LLM API integration');
}

function normalizeEntries(items: any[]): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.toLowerCase().trim())
    .filter((item, index, array) => array.indexOf(item) === index) // Dedupe
    .slice(0, 10); // Limit to 10 items per category
}

function validateExtractedContext(data: any): data is ExtractedContext {
  if (!data || typeof data !== 'object') return false;
  
  const requiredArrays = ['people', 'places', 'activities', 'triggers', 'comforts'];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) return false;
    if (!data[key].every((item: any) => typeof item === 'string')) return false;
  }
  
  if (data.raw !== undefined && typeof data.raw !== 'string') return false;
  if (data.extractedAt !== undefined && typeof data.extractedAt !== 'string') return false;
  
  return true;
}

export function buildEntityPrompt(text: string): string {
  return `Extract entities from the following text and return ONLY a JSON object with this exact structure:
{
  "people": ["array", "of", "person", "names", "or", "relations"],
  "places": ["array", "of", "locations", "or", "environments"],
  "activities": ["array", "of", "actions", "hobbies", "or", "events"],
  "triggers": ["array", "of", "stressors", "or", "negative", "catalysts"],
  "comforts": ["array", "of", "positive", "sources", "or", "supports"]
}

Text: "${text}"

Rules:
- Each array should contain 0-10 relevant items
- All items should be lowercase and trimmed
- People: names, pronouns, relationship terms (e.g., "boss", "mom", "friend")
- Places: physical locations, environments (e.g., "office", "home", "park")
- Activities: actions, hobbies, tasks (e.g., "working", "gaming", "exercising")
- Triggers: sources of stress, anxiety, or negative emotions
- Comforts: sources of joy, relaxation, or positive emotions
- Return ONLY the JSON, no other text or explanation`;
}

export function fallbackEntityExtractor(text: string): ExtractedContext {
  const lowercaseText = text.toLowerCase();
  const entities: ExtractedContext = {
    people: [],
    places: [],
    activities: [],
    triggers: [],
    comforts: [],
    extractedAt: new Date().toISOString()
  };

  // Simple regex patterns for fallback extraction
  const patterns = {
    people: /\b(?:my\s+)?(?:mom|dad|parent|father|mother|brother|sister|sibling|friend|boss|manager|colleague|partner|wife|husband|boyfriend|girlfriend|teacher|doctor|therapist)\b|\b(?:[A-Z][a-z]+)\s+[A-Z][a-z]+\b/g,
    places: /\b(?:home|office|work|school|university|college|park|store|shop|mall|restaurant|cafe|hospital|clinic|gym|classroom|bedroom|kitchen|bathroom)\b/g,
    activities: /\b(?:working|studying|reading|writing|gaming|exercising|running|walking|sleeping|cooking|eating|driving|traveling|shopping|cleaning|watching|listening)\b/g,
    triggers: /\b(?:deadline|exam|test|meeting|presentation|conflict|argument|fight|traffic|noise|crowd|pressure|expectation|demand|criticism|rejection)\b/g,
    comforts: /\b(?:music|book|movie|tv|show|game|walk|run|exercise|food|meal|snack|drink|tea|coffee|sleep|rest|nap|meditation|breathing|friend|family|pet)\b/g
  };

  // Extract entities using patterns
  for (const [category, pattern] of Object.entries(patterns)) {
    const matches = lowercaseText.match(pattern) || [];
    entities[category as keyof Omit<ExtractedContext, 'raw' | 'extractedAt'>] = 
      [...new Set(matches)].slice(0, 10); // Dedupe and limit
  }

  // Extract additional nouns as potential entities
  const nounRegex = /\b[a-z]{3,}\b/g;
  const allWords = lowercaseText.match(nounRegex) || [];
  const commonWords = new Set(['the', 'and', 'but', 'for', 'not', 'you', 'your', 'this', 'that', 'with', 'have', 'from', 'like', 'just', 'know', 'think', 'feel', 'felt', 'feeling']);

  const uniqueNouns = [...new Set(allWords.filter(word => !commonWords.has(word)))].slice(0, 15);

  // Distribute unique nouns to appropriate categories based on simple heuristics
  for (const noun of uniqueNouns) {
    if (entities.people.length < 10 && /^(mr|ms|mrs|dr)\.?\s+[a-z]/.test(noun)) {
      entities.people.push(noun);
    } else if (entities.places.length < 10 && /room|house|building|place|area/.test(noun)) {
      entities.places.push(noun);
    } else if (entities.activities.length < 10 && /ing$/.test(noun)) {
      entities.activities.push(noun);
    } else if (entities.triggers.length < 10 && /stress|worry|anxiety|fear|anger|sad/.test(noun)) {
      entities.triggers.push(noun);
    } else if (entities.comforts.length < 10 && /happy|joy|peace|calm|relax|fun/.test(noun)) {
      entities.comforts.push(noun);
    }
  }

  // Add limited raw context (truncated)
  if (text.length > 0) {
    entities.raw = text.substring(0, 200);
  }

  return entities;
}

export async function extractEntities(text: string, opts?: { forceFallback?: boolean }): Promise<ExtractedContext> {
  const forceFallback = opts?.forceFallback ?? false;

  if (forceFallback) {
    return fallbackEntityExtractor(text);
  }

  try {
    const prompt = buildEntityPrompt(text);
    const llmResponse = await sendLLMRequest(prompt);

    try {
      // Try to parse JSON from LLM response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
      const rawResult = JSON.parse(jsonString);

      // Validate and normalize the result
      if (validateExtractedContext(rawResult)) {
        const normalizedContext: ExtractedContext = {
          people: normalizeEntries(rawResult.people),
          places: normalizeEntries(rawResult.places),
          activities: normalizeEntries(rawResult.activities),
          triggers: normalizeEntries(rawResult.triggers),
          comforts: normalizeEntries(rawResult.comforts),
          extractedAt: new Date().toISOString()
        };

        // Add limited raw context if needed
        if (text.length > 0) {
          normalizedContext.raw = text.substring(0, 200);
        }

        return normalizedContext;
      } else {
        throw new Error('Invalid JSON structure from LLM');
      }
    } catch (parseError) {
      // JSON parsing failed, use fallback
      console.warn('LLM returned invalid JSON, using fallback extractor:', parseError);
      return fallbackEntityExtractor(text);
    }
  } catch (llmError) {
    // LLM request failed, use fallback
    console.warn('LLM request failed, using fallback extractor:', llmError);
    return fallbackEntityExtractor(text);
  }
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectLLM(fn: (prompt: string) => Promise<string>): void {
    mockLLM = fn;
  },

  reset(): void {
    mockLLM = null;
  },

  getMockState(): typeof mockLLM {
    return mockLLM;
  }
};