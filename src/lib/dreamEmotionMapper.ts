// Map awake-state emotions + trajectory + context into symbolic dream primitives

import { EmotionState, EmotionResult } from './emotionDetector';

export type SymbolNode = {
  symbol: string;
  category: 'element' | 'archetype' | 'space' | 'motif';
  intensity: number;
  modifiers: string[];
  motion: string | null;
  sourceEmotion?: EmotionState;
  relevance: number;
};

export interface MappingContext {
  emotionResult: EmotionResult;
  trajectory?: { slope: number; volatility: number } | null;
  topics?: string[];
  profileSnapshot?: any;
}

// Mock injection for testing
let mockOntology: any = null;
let mockTrajectory: any = null;

// Default dream symbol ontology
const DEFAULT_ONTOLOGY = {
  getTopSymbolsForEmotion(emotion: EmotionState): Array<{
    symbol: string;
    category: 'element' | 'archetype' | 'space' | 'motif';
    baseWeight: number;
    motion: string | null;
  }> {
    const emotionSymbols: Record<EmotionState, Array<{
      symbol: string;
      category: 'element' | 'archetype' | 'space' | 'motif';
      baseWeight: number;
      motion: string | null;
    }>> = {
      sad: [
        { symbol: 'ocean', category: 'element', baseWeight: 0.8, motion: 'ebbing' },
        { symbol: 'shadow', category: 'archetype', baseWeight: 0.7, motion: 'lingering' },
        { symbol: 'empty-room', category: 'space', baseWeight: 0.6, motion: 'still' },
        { symbol: 'fading-light', category: 'motif', baseWeight: 0.5, motion: 'dimming' }
      ],
      angry: [
        { symbol: 'fire', category: 'element', baseWeight: 0.9, motion: 'raging' },
        { symbol: 'warrior', category: 'archetype', baseWeight: 0.8, motion: 'charging' },
        { symbol: 'storm', category: 'space', baseWeight: 0.7, motion: 'swirling' },
        { symbol: 'shattered-glass', category: 'motif', baseWeight: 0.6, motion: 'breaking' }
      ],
      anxious: [
        { symbol: 'maze', category: 'space', baseWeight: 0.8, motion: 'wandering' },
        { symbol: 'clock', category: 'motif', baseWeight: 0.7, motion: 'ticking' },
        { symbol: 'fog', category: 'element', baseWeight: 0.6, motion: 'shifting' },
        { symbol: 'watcher', category: 'archetype', baseWeight: 0.5, motion: 'observing' }
      ],
      stressed: [
        { symbol: 'pressure', category: 'element', baseWeight: 0.8, motion: 'building' },
        { symbol: 'tower', category: 'space', baseWeight: 0.7, motion: 'leaning' },
        { symbol: 'worker', category: 'archetype', baseWeight: 0.6, motion: 'laboring' },
        { symbol: 'tangled-strings', category: 'motif', baseWeight: 0.5, motion: 'pulling' }
      ],
      lonely: [
        { symbol: 'desert', category: 'space', baseWeight: 0.8, motion: 'expanding' },
        { symbol: 'echo', category: 'motif', baseWeight: 0.7, motion: 'fading' },
        { symbol: 'orphan', category: 'archetype', baseWeight: 0.6, motion: 'searching' },
        { symbol: 'mist', category: 'element', baseWeight: 0.5, motion: 'drifting' }
      ],
      excited: [
        { symbol: 'sparkles', category: 'element', baseWeight: 0.8, motion: 'dancing' },
        { symbol: 'celebrant', category: 'archetype', baseWeight: 0.7, motion: 'rejoicing' },
        { symbol: 'festival', category: 'space', baseWeight: 0.6, motion: 'swaying' },
        { symbol: 'fireworks', category: 'motif', baseWeight: 0.5, motion: 'exploding' }
      ],
      neutral: [
        { symbol: 'garden', category: 'space', baseWeight: 0.8, motion: 'growing' },
        { symbol: 'still-water', category: 'element', baseWeight: 0.7, motion: 'calm' },
        { symbol: 'observer', category: 'archetype', baseWeight: 0.6, motion: 'watching' },
        { symbol: 'balance', category: 'motif', baseWeight: 0.5, motion: 'steady' }
      ],
      confused: [
        { symbol: 'labyrinth', category: 'space', baseWeight: 0.8, motion: 'twisting' },
        { symbol: 'mirror', category: 'motif', baseWeight: 0.7, motion: 'reflecting' },
        { symbol: 'jester', category: 'archetype', baseWeight: 0.6, motion: 'tumbling' },
        { symbol: 'smoke', category: 'element', baseWeight: 0.5, motion: 'wavering' }
      ],
      overwhelmed: [
        { symbol: 'waterfall', category: 'element', baseWeight: 0.8, motion: 'pouring' },
        { symbol: 'avalanche', category: 'space', baseWeight: 0.7, motion: 'falling' },
        { symbol: 'drowning-figure', category: 'archetype', baseWeight: 0.6, motion: 'sinking' },
        { symbol: 'overflowing-cup', category: 'motif', baseWeight: 0.5, motion: 'spilling' }
      ]
    };

    return emotionSymbols[emotion] || [
      { symbol: 'unknown', category: 'motif', baseWeight: 0.5, motion: 'floating' }
    ];
  }
};

function getOntology() {
  return mockOntology || DEFAULT_ONTOLOGY;
}

function getTrajectoryMock() {
  return mockTrajectory;
}

export function mapEmotionToSymbols(ctx: MappingContext, opts?: { maxSymbols?: number }): SymbolNode[] {
  const maxSymbols = opts?.maxSymbols || 8;
  const emotion = ctx.emotionResult.emotion;
  const intensity = ctx.emotionResult.intensity;
  
  // Get base symbols from ontology
  const ontology = getOntology();
  const baseSymbols = ontology.getTopSymbolsForEmotion(emotion);
  
  // Convert base symbols to SymbolNodes with scoring
  const symbolNodes: SymbolNode[] = baseSymbols.map(baseSymbol => {
    const node: SymbolNode = {
      symbol: baseSymbol.symbol,
      category: baseSymbol.category,
      intensity: intensity / 10, // Normalize to 0-1
      modifiers: [],
      motion: baseSymbol.motion,
      sourceEmotion: emotion,
      relevance: 0
    };
    
    // Score the node
    node.relevance = scoreSymbolNode(node, ctx);
    
    return node;
  });
  
  // Apply trajectory modifiers
  if (ctx.trajectory) {
    symbolNodes.forEach(node => {
      // Add slope-based modifiers
      if (ctx.trajectory!.slope > 0.1) {
        node.modifiers.push('rising');
        if (node.motion) node.motion = 'ascending';
      } else if (ctx.trajectory!.slope < -0.1) {
        node.modifiers.push('sinking');
        if (node.motion) node.motion = 'descending';
      }
      
      // Add volatility-based modifiers
      if (ctx.trajectory!.volatility > 0.7) {
        node.modifiers.push('chaotic');
        if (node.motion) node.motion = 'swirling';
      } else if (ctx.trajectory!.volatility < 0.3) {
        node.modifiers.push('steady');
        if (node.motion) node.motion = 'flowing';
      }
    });
  }
  
  // Apply topic-based boosts
  if (ctx.topics && ctx.topics.length > 0) {
    symbolNodes.forEach(node => {
      // Simple topic matching - in real implementation would use semantic similarity
      const topicMatch = ctx.topics!.some(topic => 
        node.symbol.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(node.symbol.toLowerCase())
      );
      
      if (topicMatch) {
        node.relevance *= 1.2; // 20% boost for topic relevance
        node.modifiers.push('thematic');
      }
    });
  }
  
  // Normalize and return top symbols
  return normalizeSymbolNodes(symbolNodes).slice(0, maxSymbols);
}

export function scoreSymbolNode(node: SymbolNode, ctx?: MappingContext): number {
  if (!ctx) return node.relevance;
  
  let score = 0;
  
  // Base weight from ontology (approximated)
  const ontology = getOntology();
  const baseSymbols = ontology.getTopSymbolsForEmotion(node.sourceEmotion || 'neutral');
  const baseSymbol = baseSymbols.find(s => s.symbol === node.symbol);
  const baseWeight = baseSymbol?.baseWeight || 0.5;
  
  score += baseWeight * 0.4; // 40% base weight
  
  // Intensity multiplier
  const intensityMultiplier = 0.5 + (node.intensity * 0.5); // 0.5 to 1.0 range
  score += intensityMultiplier * 0.3; // 30% intensity influence
  
  // Contextual boosts
  if (ctx.trajectory) {
    // Volatility influence - higher volatility favors more dynamic symbols
    const volatilityBoost = ctx.trajectory.volatility > 0.6 ? 0.2 : 0;
    score += volatilityBoost * 0.2; // 20% trajectory influence
    
    // Slope influence - rising/sinking emotions
    const slopeInfluence = Math.abs(ctx.trajectory.slide) * 0.1;
    score += slopeInfluence * 0.1; // 10% slope influence
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(1, score));
}

export function normalizeSymbolNodes(nodes: SymbolNode[]): SymbolNode[] {
  if (nodes.length === 0) return [];
  
  // Sort by relevance descending
  const sorted = [...nodes].sort((a, b) => b.relevance - a.relevance);
  
  // Normalize relevance scores to 0-1 range based on max
  const maxRelevance = Math.max(...sorted.map(node => node.relevance));
  if (maxRelevance > 0) {
    sorted.forEach(node => {
      node.relevance = Math.max(0, Math.min(1, node.relevance / maxRelevance));
    });
  }
  
  return sorted;
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectOntology(o: any): void {
    mockOntology = o;
  },
  
  injectTrajectoryMock(t: any): void {
    mockTrajectory = t;
  },
  
  reset(): void {
    mockOntology = null;
    mockTrajectory = null;
  },
  
  getDefaultOntology() {
    return DEFAULT_ONTOLOGY;
  }
};