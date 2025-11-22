// Canonical ontology of dream symbols, categories, emotionWeights, and aliases

import { EmotionState } from './emotionDetector';

export type SymbolCategory = 'element' | 'archetype' | 'space' | 'motif';

export interface OntologySymbol {
  id: string;
  label: string;
  category: SymbolCategory;
  emotionWeights: Record<EmotionState, number>;
  aliases?: string[];
  defaultModifiers?: string[];
  description?: string;
}

export const SYMBOL_ONTOLOGY: Record<string, OntologySymbol> = {
  // Elements (10 symbols)
  'ocean': {
    id: 'ocean',
    label: 'Ocean',
    category: 'element',
    emotionWeights: {
      sad: 0.9, angry: 0.3, anxious: 0.6, stressed: 0.4, lonely: 0.8,
      excited: 0.2, neutral: 0.5, confused: 0.4, overwhelmed: 0.7
    },
    aliases: ['water', 'sea', 'waves', 'tide', 'deep'],
    defaultModifiers: ['vast', 'deep', 'endless'],
    description: 'Representing emotional depth and subconscious currents'
  },
  'fire': {
    id: 'fire',
    label: 'Fire',
    category: 'element',
    emotionWeights: {
      sad: 0.1, angry: 0.9, anxious: 0.3, stressed: 0.6, lonely: 0.2,
      excited: 0.8, neutral: 0.3, confused: 0.4, overwhelmed: 0.5
    },
    aliases: ['flame', 'blaze', 'burning', 'heat', 'ember'],
    defaultModifiers: ['raging', 'consuming', 'transformative'],
    description: 'Symbolizing passion, anger, and transformative energy'
  },
  'wind': {
    id: 'wind',
    label: 'Wind',
    category: 'element',
    emotionWeights: {
      sad: 0.4, angry: 0.6, anxious: 0.7, stressed: 0.5, lonely: 0.3,
      excited: 0.6, neutral: 0.4, confused: 0.8, overwhelmed: 0.6
    },
    aliases: ['breeze', 'gust', 'air', 'storm', 'whirlwind'],
    defaultModifiers: ['changing', 'unpredictable', 'invisible'],
    description: 'Representing change, uncertainty, and invisible forces'
  },
  'earth': {
    id: 'earth',
    label: 'Earth',
    category: 'element',
    emotionWeights: {
      sad: 0.3, angry: 0.2, anxious: 0.1, stressed: 0.2, lonely: 0.4,
      excited: 0.3, neutral: 0.8, confused: 0.2, overwhelmed: 0.1
    },
    aliases: ['ground', 'soil', 'mountain', 'rock', 'foundation'],
    defaultModifiers: ['stable', 'grounding', 'ancient'],
    description: 'Symbolizing stability, foundation, and groundedness'
  },
  'storm': {
    id: 'storm',
    label: 'Storm',
    category: 'element',
    emotionWeights: {
      sad: 0.6, angry: 0.8, anxious: 0.7, stressed: 0.9, lonely: 0.4,
      excited: 0.5, neutral: 0.2, confused: 0.6, overwhelmed: 0.8
    },
    aliases: ['thunder', 'lightning', 'tempest', 'gale'],
    defaultModifiers: ['violent', 'unleashed', 'cleansing'],
    description: 'Representing emotional turmoil and release'
  },
  'mist': {
    id: 'mist',
    label: 'Mist',
    category: 'element',
    emotionWeights: {
      sad: 0.7, angry: 0.2, anxious: 0.8, stressed: 0.5, lonely: 0.6,
      excited: 0.1, neutral: 0.3, confused: 0.9, overwhelmed: 0.4
    },
    aliases: ['fog', 'vapor', 'haze', 'cloud'],
    defaultModifiers: ['obscuring', 'mysterious', 'ephemeral'],
    description: 'Symbolizing uncertainty, mystery, and unclear paths'
  },
  'crystal': {
    id: 'crystal',
    label: 'Crystal',
    category: 'element',
    emotionWeights: {
      sad: 0.2, angry: 0.1, anxious: 0.3, stressed: 0.4, lonely: 0.3,
      excited: 0.7, neutral: 0.6, confused: 0.5, overwhelmed: 0.2
    },
    aliases: ['gem', 'diamond', 'quartz', 'prism'],
    defaultModifiers: ['clarity', 'refracting', 'precious'],
    description: 'Representing clarity, insight, and inner truth'
  },
  'river': {
    id: 'river',
    label: 'River',
    category: 'element',
    emotionWeights: {
      sad: 0.5, angry: 0.4, anxious: 0.6, stressed: 0.5, lonely: 0.4,
      excited: 0.6, neutral: 0.7, confused: 0.5, overwhelmed: 0.6
    },
    aliases: ['stream', 'flow', 'current', 'waterway'],
    defaultModifiers: ['flowing', 'continuous', 'journeying'],
    description: 'Symbolizing life flow, progression, and emotional currents'
  },
  'ice': {
    id: 'ice',
    label: 'Ice',
    category: 'element',
    emotionWeights: {
      sad: 0.8, angry: 0.7, anxious: 0.4, stressed: 0.6, lonely: 0.9,
      excited: 0.1, neutral: 0.3, confused: 0.5, overwhelmed: 0.4
    },
    aliases: ['frost', 'glacier', 'frozen', 'cold'],
    defaultModifiers: ['frozen', 'brittle', 'preserving'],
    description: 'Representing emotional coldness, isolation, and preservation'
  },
  'sunlight': {
    id: 'sunlight',
    label: 'Sunlight',
    category: 'element',
    emotionWeights: {
      sad: 0.1, angry: 0.2, anxious: 0.1, stressed: 0.2, lonely: 0.3,
      excited: 0.9, neutral: 0.7, confused: 0.2, overwhelmed: 0.1
    },
    aliases: ['sun', 'light', 'ray', 'dawn'],
    defaultModifiers: ['warming', 'revealing', 'nourishing'],
    description: 'Symbolizing hope, clarity, and positive energy'
  },

  // Archetypes (10 symbols)
  'child': {
    id: 'child',
    label: 'Child',
    category: 'archetype',
    emotionWeights: {
      sad: 0.3, angry: 0.1, anxious: 0.4, stressed: 0.2, lonely: 0.5,
      excited: 0.8, neutral: 0.6, confused: 0.7, overwhelmed: 0.3
    },
    aliases: ['innocent', 'youth', 'beginner'],
    defaultModifiers: ['innocent', 'curious', 'vulnerable'],
    description: 'Representing innocence, new beginnings, and vulnerability'
  },
  'warrior': {
    id: 'warrior',
    label: 'Warrior',
    category: 'archetype',
    emotionWeights: {
      sad: 0.2, angry: 0.9, anxious: 0.3, stressed: 0.7, lonely: 0.1,
      excited: 0.6, neutral: 0.4, confused: 0.2, overwhelmed: 0.5
    },
    aliases: ['fighter', 'soldier', 'protector', 'hero'],
    defaultModifiers: ['brave', 'determined', 'protective'],
    description: 'Symbolizing strength, conflict, and protection'
  },
  'teacher': {
    id: 'teacher',
    label: 'Teacher',
    category: 'archetype',
    emotionWeights: {
      sad: 0.4, angry: 0.2, anxious: 0.3, stressed: 0.5, lonely: 0.3,
      excited: 0.5, neutral: 0.8, confused: 0.6, overwhelmed: 0.4
    },
    aliases: ['mentor', 'guide', 'wise-one', 'instructor'],
    defaultModifiers: ['wise', 'guiding', 'knowledgeable'],
    description: 'Representing wisdom, guidance, and learning'
  },
  'healer': {
    id: 'healer',
    label: 'Healer',
    category: 'archetype',
    emotionWeights: {
      sad: 0.7, angry: 0.3, anxious: 0.6, stressed: 0.8, lonely: 0.4,
      excited: 0.4, neutral: 0.6, confused: 0.5, overwhelmed: 0.7
    },
    aliases: ['doctor', 'caregiver', 'nurturer', 'therapist'],
    defaultModifiers: ['compassionate', 'restorative', 'gentle'],
    description: 'Symbolizing healing, care, and emotional support'
  },
  'trickster': {
    id: 'trickster',
    label: 'Trickster',
    category: 'archetype',
    emotionWeights: {
      sad: 0.2, angry: 0.4, anxious: 0.5, stressed: 0.3, lonely: 0.2,
      excited: 0.7, neutral: 0.3, confused: 0.9, overwhelmed: 0.4
    },
    aliases: ['jester', 'fool', 'deceiver', 'mischief'],
    defaultModifiers: ['playful', 'deceptive', 'unpredictable'],
    description: 'Representing chaos, humor, and unexpected change'
  },
  'orphan': {
    id: 'orphan',
    label: 'Orphan',
    category: 'archetype',
    emotionWeights: {
      sad: 0.9, angry: 0.3, anxious: 0.7, stressed: 0.5, lonely: 0.9,
      excited: 0.1, neutral: 0.2, confused: 0.6, overwhelmed: 0.4
    },
    aliases: ['abandoned', 'alone', 'isolated'],
    defaultModifiers: ['lonely', 'abandoned', 'searching'],
    description: 'Symbolizing abandonment, loneliness, and searching for belonging'
  },
  'ruler': {
    id: 'ruler',
    label: 'Ruler',
    category: 'archetype',
    emotionWeights: {
      sad: 0.3, angry: 0.7, anxious: 0.4, stressed: 0.8, lonely: 0.6,
      excited: 0.5, neutral: 0.7, confused: 0.3, overwhelmed: 0.9
    },
    aliases: ['king', 'queen', 'leader', 'authority'],
    defaultModifiers: ['commanding', 'responsible', 'powerful'],
    description: 'Representing control, responsibility, and authority'
  },
  'explorer': {
    id: 'explorer',
    label: 'Explorer',
    category: 'archetype',
    emotionWeights: {
      sad: 0.2, angry: 0.3, anxious: 0.6, stressed: 0.4, lonely: 0.5,
      excited: 0.9, neutral: 0.5, confused: 0.7, overwhelmed: 0.3
    },
    aliases: ['adventurer', 'pioneer', 'wanderer', 'discoverer'],
    defaultModifiers: ['curious', 'brave', 'independent'],
    description: 'Symbolizing adventure, discovery, and independence'
  },
  'artist': {
    id: 'artist',
    label: 'Artist',
    category: 'archetype',
    emotionWeights: {
      sad: 0.6, angry: 0.4, anxious: 0.5, stressed: 0.6, lonely: 0.4,
      excited: 0.8, neutral: 0.7, confused: 0.6, overwhelmed: 0.5
    },
    aliases: ['creator', 'painter', 'musician', 'writer'],
    defaultModifiers: ['creative', 'expressive', 'visionary'],
    description: 'Representing creativity, expression, and imagination'
  },
  'guardian': {
    id: 'guardian',
    label: 'Guardian',
    category: 'archetype',
    emotionWeights: {
      sad: 0.4, angry: 0.6, anxious: 0.3, stressed: 0.7, lonely: 0.2,
      excited: 0.4, neutral: 0.8, confused: 0.2, overwhelmed: 0.6
    },
    aliases: ['protector', 'watchman', 'sentinel', 'defender'],
    defaultModifiers: ['vigilant', 'protective', 'steadfast'],
    description: 'Symbolizing protection, vigilance, and boundaries'
  },

  // Spaces (10 symbols)
  'forest': {
    id: 'forest',
    label: 'Forest',
    category: 'space',
    emotionWeights: {
      sad: 0.5, angry: 0.3, anxious: 0.7, stressed: 0.4, lonely: 0.6,
      excited: 0.4, neutral: 0.6, confused: 0.8, overwhelmed: 0.5
    },
    aliases: ['woods', 'jungle', 'trees', 'wilderness'],
    defaultModifiers: ['dense', 'mysterious', 'alive'],
    description: 'Representing the unknown, growth, and natural complexity'
  },
  'castle': {
    id: 'castle',
    label: 'Castle',
    category: 'space',
    emotionWeights: {
      sad: 0.6, angry: 0.5, anxious: 0.4, stressed: 0.7, lonely: 0.8,
      excited: 0.3, neutral: 0.5, confused: 0.6, overwhelmed: 0.4
    },
    aliases: ['fortress', 'palace', 'stronghold', 'tower'],
    defaultModifiers: ['fortified', 'grand', 'isolated'],
    description: 'Symbolizing defense, isolation, and inner structure'
  },
  'labyrinth': {
    id: 'labyrinth',
    label: 'Labyrinth',
    category: 'space',
    emotionWeights: {
      sad: 0.4, angry: 0.5, anxious: 0.9, stressed: 0.8, lonely: 0.6,
      excited: 0.3, neutral: 0.2, confused: 0.9, overwhelmed: 0.7
    },
    aliases: ['maze', 'puzzle', 'complex', 'twisting'],
    defaultModifiers: ['confusing', 'intricate', 'endless'],
    description: 'Representing confusion, complexity, and life puzzles'
  },
  'garden': {
    id: 'garden',
    label: 'Garden',
    category: 'space',
    emotionWeights: {
      sad: 0.2, angry: 0.1, anxious: 0.2, stressed: 0.3, lonely: 0.4,
      excited: 0.7, neutral: 0.9, confused: 0.3, overwhelmed: 0.2
    },
    aliases: ['paradise', 'sanctuary', 'oasis', 'cultivated'],
    defaultModifiers: ['peaceful', 'nurturing', 'orderly'],
    description: 'Symbolizing peace, growth, and cultivated beauty'
  },
  'desert': {
    id: 'desert',
    label: 'Desert',
    category: 'space',
    emotionWeights: {
      sad: 0.7, angry: 0.4, anxious: 0.6, stressed: 0.5, lonely: 0.9,
      excited: 0.2, neutral: 0.3, confused: 0.5, overwhelmed: 0.4
    },
    aliases: ['wasteland', 'barren', 'dunes', 'arid'],
    defaultModifiers: ['empty', 'harsh', 'isolated'],
    description: 'Representing emptiness, isolation, and spiritual testing'
  },
  'city': {
    id: 'city',
    label: 'City',
    category: 'space',
    emotionWeights: {
      sad: 0.5, angry: 0.6, anxious: 0.8, stressed: 0.9, lonely: 0.7,
      excited: 0.6, neutral: 0.4, confused: 0.7, overwhelmed: 0.8
    },
    aliases: ['metropolis', 'urban', 'streets', 'buildings'],
    defaultModifiers: ['crowded', 'complex', 'artificial'],
    description: 'Symbolizing complexity, society, and modern pressures'
  },
  'cave': {
    id: 'cave',
    label: 'Cave',
    category: 'space',
    emotionWeights: {
      sad: 0.6, angry: 0.4, anxious: 0.7, stressed: 0.5, lonely: 0.8,
      excited: 0.3, neutral: 0.4, confused: 0.6, overwhelmed: 0.5
    },
    aliases: ['cavern', 'grotto', 'underground', 'darkness'],
    defaultModifiers: ['hidden', 'protective', 'primordial'],
    description: 'Representing the subconscious, hidden truths, and safety'
  },
  'bridge': {
    id: 'bridge',
    label: 'Bridge',
    category: 'space',
    emotionWeights: {
      sad: 0.4, angry: 0.3, anxious: 0.7, stressed: 0.6, lonely: 0.5,
      excited: 0.6, neutral: 0.5, confused: 0.8, overwhelmed: 0.4
    },
    aliases: ['crossing', 'connection', 'transition', 'span'],
    defaultModifiers: ['connecting', 'transitional', 'precarious'],
    description: 'Symbolizing transitions, connections, and crossing boundaries'
  },
  'library': {
    id: 'library',
    label: 'Library',
    category: 'space',
    emotionWeights: {
      sad: 0.3, angry: 0.2, anxious: 0.4, stressed: 0.5, lonely: 0.4,
      excited: 0.5, neutral: 0.8, confused: 0.6, overwhelmed: 0.3
    },
    aliases: ['archive', 'knowledge', 'books', 'wisdom'],
    defaultModifiers: ['orderly', 'knowledgeable', 'quiet'],
    description: 'Representing knowledge, memory, and organized thought'
  },
  'shoreline': {
    id: 'shoreline',
    label: 'Shoreline',
    category: 'space',
    emotionWeights: {
      sad: 0.6, angry: 0.3, anxious: 0.5, stressed: 0.4, lonely: 0.7,
      excited: 0.5, neutral: 0.6, confused: 0.7, overwhelmed: 0.5
    },
    aliases: ['beach', 'coast', 'edge', 'boundary'],
    defaultModifiers: ['liminal', 'meeting', 'transitional'],
    description: 'Symbolizing boundaries, transitions, and meeting points'
  },

  // Motifs (10 symbols)
  'key': {
    id: 'key',
    label: 'Key',
    category: 'motif',
    emotionWeights: {
      sad: 0.3, angry: 0.2, anxious: 0.4, stressed: 0.5, lonely: 0.3,
      excited: 0.7, neutral: 0.5, confused: 0.6, overwhelmed: 0.4
    },
    aliases: ['unlock', 'access', 'solution', 'answer'],
    defaultModifiers: ['unlocking', 'revealing', 'essential'],
    description: 'Representing solutions, access, and hidden answers'
  },
  'mirror': {
    id: 'mirror',
    label: 'Mirror',
    category: 'motif',
    emotionWeights: {
      sad: 0.6, angry: 0.4, anxious: 0.5, stressed: 0.6, lonely: 0.5,
      excited: 0.3, neutral: 0.5, confused: 0.8, overwhelmed: 0.4
    },
    aliases: ['reflection', 'self', 'image', 'truth'],
    defaultModifiers: ['reflecting', 'revealing', 'distorting'],
    description: 'Symbolizing self-reflection, truth, and identity'
  },
  'clock': {
    id: 'clock',
    label: 'Clock',
    category: 'motif',
    emotionWeights: {
      sad: 0.5, angry: 0.4, anxious: 0.8, stressed: 0.9, lonely: 0.3,
      excited: 0.4, neutral: 0.5, confused: 0.6, overwhelmed: 0.7
    },
    aliases: ['time', 'hourglass', 'deadline', 'passing'],
    defaultModifiers: ['ticking', 'urgent', 'measuring'],
    description: 'Representing time pressure, deadlines, and mortality'
  },
  'door': {
    id: 'door',
    label: 'Door',
    category: 'motif',
    emotionWeights: {
      sad: 0.4, angry: 0.3, anxious: 0.7, stressed: 0.5, lonely: 0.5,
      excited: 0.6, neutral: 0.5, confused: 0.8, overwhelmed: 0.4
    },
    aliases: ['gateway', 'entrance', 'opportunity', 'barrier'],
    defaultModifiers: ['opening', 'closing', 'transitional'],
    description: 'Symbolizing opportunities, transitions, and choices'
  },
  'chain': {
    id: 'chain',
    label: 'Chain',
    category: 'motif',
    emotionWeights: {
      sad: 0.7, angry: 0.6, anxious: 0.5, stressed: 0.8, lonely: 0.4,
      excited: 0.2, neutral: 0.3, confused: 0.4, overwhelmed: 0.6
    },
    aliases: ['bondage', 'connection', 'restraint', 'link'],
    defaultModifiers: ['binding', 'connecting', 'restricting'],
    description: 'Representing constraints, connections, and obligations'
  },
  'veil': {
    id: 'veil',
    label: 'Veil',
    category: 'motif',
    emotionWeights: {
      sad: 0.5, angry: 0.3, anxious: 0.7, stressed: 0.4, lonely: 0.4,
      excited: 0.3, neutral: 0.4, confused: 0.8, overwhelmed: 0.5
    },
    aliases: ['curtain', 'cover', 'mystery', 'hidden'],
    defaultModifiers: ['concealing', 'mysterious', 'thin'],
    description: 'Symbolizing mystery, separation, and hidden truths'
  },
  'ladder': {
    id: 'ladder',
    label: 'Ladder',
    category: 'motif',
    emotionWeights: {
      sad: 0.3, angry: 0.2, anxious: 0.5, stressed: 0.4, lonely: 0.3,
      excited: 0.8, neutral: 0.5, confused: 0.6, overwhelmed: 0.4
    },
    aliases: ['ascent', 'progress', 'climb', 'achievement'],
    defaultModifiers: ['ascending', 'progressive', 'precarious'],
    description: 'Representing progress, achievement, and upward movement'
  },
  'mask': {
    id: 'mask',
    label: 'Mask',
    category: 'motif',
    emotionWeights: {
      sad: 0.6, angry: 0.5, anxious: 0.7, stressed: 0.8, lonely: 0.7,
      excited: 0.3, neutral: 0.4, confused: 0.6, overwhelmed: 0.5
    },
    aliases: ['disguise', 'persona', 'hidden', 'performance'],
    defaultModifiers: ['concealing', 'performing', 'protective'],
    description: 'Symbolizing hidden identity, social roles, and protection'
  },
  'web': {
    id: 'web',
    label: 'Web',
    category: 'motif',
    emotionWeights: {
      sad: 0.4, angry: 0.3, anxious: 0.8, stressed: 0.7, lonely: 0.5,
      excited: 0.2, neutral: 0.3, confused: 0.9, overwhelmed: 0.6
    },
    aliases: ['network', 'trap', 'connection', 'complex'],
    defaultModifiers: ['entangling', 'connecting', 'delicate'],
    description: 'Representing complexity, connections, and entrapment'
  },
  'seed': {
    id: 'seed',
    label: 'Seed',
    category: 'motif',
    emotionWeights: {
      sad: 0.3, angry: 0.2, anxious: 0.4, stressed: 0.3, lonely: 0.4,
      excited: 0.8, neutral: 0.6, confused: 0.5, overwhelmed: 0.2
    },
    aliases: ['potential', 'beginning', 'growth', 'future'],
    defaultModifiers: ['potential', 'growing', 'hidden'],
    description: 'Symbolizing potential, new beginnings, and future growth'
  }
};

function deepCloneSymbol(symbol: OntologySymbol): OntologySymbol {
  return {
    ...symbol,
    emotionWeights: { ...symbol.emotionWeights },
    aliases: symbol.aliases ? [...symbol.aliases] : undefined,
    defaultModifiers: symbol.defaultModifiers ? [...symbol.defaultModifiers] : undefined
  };
}

export function getSymbolsMatchingTopic(topic: string): OntologySymbol[] {
  const normalizedTopic = topic.toLowerCase().trim();
  const matchingSymbols: OntologySymbol[] = [];
  
  for (const symbol of Object.values(SYMBOL_ONTOLOGY)) {
    // Check direct match with symbol ID or label
    if (symbol.id.toLowerCase().includes(normalizedTopic) || 
        symbol.label.toLowerCase().includes(normalizedTopic)) {
      matchingSymbols.push(deepCloneSymbol(symbol));
      continue;
    }
    
    // Check aliases
    if (symbol.aliases && symbol.aliases.some(alias => 
        alias.toLowerCase().includes(normalizedTopic))) {
      matchingSymbols.push(deepCloneSymbol(symbol));
      continue;
    }
    
    // Check description
    if (symbol.description && symbol.description.toLowerCase().includes(normalizedTopic)) {
      matchingSymbols.push(deepCloneSymbol(symbol));
    }
  }
  
  return matchingSymbols;
}

export function getTopSymbolsForEmotion(emotion: EmotionState, threshold: number = 0.3): OntologySymbol[] {
  const symbolsWithWeights = Object.values(SYMBOL_ONTOLOGY)
    .map(symbol => ({
      symbol: deepCloneSymbol(symbol),
      weight: symbol.emotionWeights[emotion]
    }))
    .filter(item => item.weight >= threshold)
    .sort((a, b) => b.weight - a.weight);
  
  return symbolsWithWeights.map(item => item.symbol);
}

export function getAllSymbols(): OntologySymbol[] {
  return Object.values(SYMBOL_ONTOLOGY).map(symbol => deepCloneSymbol(symbol));
}