// Fuse topicStore + emotionTrajectory + contextStore outputs into prioritized dream memory nodes

import { EmotionState } from './emotionDetector';
import { topicStore } from './topicStore';
import { computeTopicTrajectory } from './emotionTrajectory';
import { contextStore } from './contextStore';
import { getSymbolsMatchingTopic } from './dreamSymbolOntology';
import { mapEmotionToSymbols } from './dreamEmotionMapper';

export interface DreamMemoryNode {
  id: string;
  topic: string;
  symbols: { id: string; relevance: number }[];
  relevanceScore: number;
  lastSeen: string;
  emotionSummary: { emotion: EmotionState; intensityAvg: number; occurrences: number };
}

// Mock injection for testing
let mockTopicStore: any = null;
let mockTrajectory: any = null;
let mockOntology: any = null;
let mockContextStore: any = null;

function getTopicStore() {
  return mockTopicStore || topicStore;
}

function getTrajectory() {
  return mockTrajectory || { computeTopicTrajectory };
}

function getOntology() {
  return mockOntology || { getSymbolsMatchingTopic };
}

function getContextStore() {
  return mockContextStore || contextStore;
}

function generateNodeId(topic: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `dream-mem-${timestamp}-${random}-${topic.replace(/[^a-z0-9]/gi, '-')}`;
}

function calculateEvidenceScore(
  frequency: number,
  slope: number,
  intensity: number,
  unhelpfulFeedbackDensity: number
): number {
  // Frequency component (logarithmic to prevent domination by very frequent topics)
  const frequencyScore = Math.min(1, Math.log10(frequency + 1) / 2);
  
  // Slope component - absolute value since both rising and falling are significant
  const slopeScore = Math.min(1, Math.abs(slope) * 2);
  
  // Intensity component (normalized 0-1)
  const intensityScore = intensity / 10;
  
  // Unhelpful feedback penalty (higher density = lower score)
  const feedbackPenalty = 1 - Math.min(1, unhelpfulFeedbackDensity * 2);
  
  // Weighted combination
  const score = (frequencyScore * 0.4) + 
                (slopeScore * 0.2) + 
                (intensityScore * 0.3) + 
                (feedbackPenalty * 0.1);
  
  return Math.max(0, Math.min(1, score));
}

function getUnhelpfulFeedbackDensity(topic: string): number {
  try {
    const contextStore = getContextStore();
    const personalContext = contextStore.getPersonalContext();
    
    // Simple heuristic: if topic appears in triggers, assume higher emotional charge
    // In a real implementation, we'd analyze actual feedback data
    const isTrigger = personalContext.triggers.some(trigger => 
      trigger.toLowerCase().includes(topic.toLowerCase())
    );
    
    const isComfort = personalContext.comforts.some(comfort => 
      comfort.toLowerCase().includes(topic.toLowerCase())
    );
    
    // Triggers might have more unhelpful feedback, comforts less
    if (isTrigger) return 0.6;
    if (isComfort) return 0.2;
    
    return 0.4; // Default moderate density
  } catch (error) {
    return 0.5; // Fallback
  }
}

function findDominantEmotion(emotionCounts: Record<EmotionState, number>): { emotion: EmotionState; occurrences: number } {
  let dominantEmotion: EmotionState = 'neutral';
  let maxOccurrences = 0;
  
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxOccurrences) {
      maxOccurrences = count;
      dominantEmotion = emotion as EmotionState;
    }
  }
  
  return { emotion: dominantEmotion, occurrences: maxOccurrences };
}

export function buildDreamMemoryNodes(options?: { lookbackDays?: number; maxNodes?: number }): DreamMemoryNode[] {
  const lookbackDays = options?.lookbackDays || 30;
  const maxNodes = options?.maxNodes || 15;
  
  try {
    const topicStore = getTopicStore();
    const trajectory = getTrajectory();
    const ontology = getOntology();
    
    const allTopics = topicStore.getAllTopics();
    const candidateList: Array<{ topic: string; evidenceScore: number }> = [];
    
    // Score each topic for evidence strength
    for (const topicData of allTopics) {
      if (topicData.count < 2) continue; // Skip topics with insufficient data
      
      const topicTrajectory = trajectory.computeTopicTrajectory(topicData.topic, lookbackDays);
      const unhelpfulDensity = getUnhelpfulFeedbackDensity(topicData.topic);
      
      const evidenceScore = calculateEvidenceScore(
        topicData.count,
        topicTrajectory.intensitySlope,
        topicTrajectory.averageIntensity,
        unhelpfulDensity
      );
      
      candidateList.push({
        topic: topicData.topic,
        evidenceScore
      });
    }
    
    // Sort by evidence score and take top candidates
    candidateList.sort((a, b) => b.evidenceScore - a.evidenceScore);
    const topCandidates = candidateList.slice(0, maxNodes * 2); // Get extra for filtering
    
    // Hydrate candidates into full memory nodes
    return hydrateMemoryCandidates(topCandidates).slice(0, maxNodes);
    
  } catch (error) {
    console.error('Failed to build dream memory nodes:', error);
    return [];
  }
}

export function scoreMemoryNodeByRelevance(node: DreamMemoryNode): number {
  // Base relevance from evidence score
  let score = node.relevanceScore * 0.6;
  
  // Recency boost (exponential decay over 30 days)
  try {
    const lastSeenDate = new Date(node.lastSeen);
    const daysAgo = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 1 - (daysAgo / 30));
    score += recencyBoost * 0.2;
  } catch {
    // If date parsing fails, no recency boost
  }
  
  // Symbol relevance boost (average of symbol relevances)
  if (node.symbols.length > 0) {
    const avgSymbolRelevance = node.symbols.reduce((sum, symbol) => sum + symbol.relevance, 0) / node.symbols.length;
    score += avgSymbolRelevance * 0.2;
  }
  
  return Math.max(0, Math.min(1, score));
}

export function hydrateMemoryCandidates(candidateList: Array<{ topic: string; evidenceScore: number }>): DreamMemoryNode[] {
  const memoryNodes: DreamMemoryNode[] = [];
  const topicStore = getTopicStore();
  const ontology = getOntology();
  
  for (const candidate of candidateList) {
    try {
      const topicData = topicStore.getTopic(candidate.topic);
      if (!topicData) continue;
      
      // Find dominant emotion for this topic
      const dominantEmotion = findDominantEmotion(topicData.emotionCounts);
      
      // Get matching symbols from ontology
      const matchingSymbols = ontology.getSymbolsMatchingTopic(candidate.topic);
      
      // Map symbols with relevance scoring
      const symbolsWithRelevance = matchingSymbols.map(symbol => {
        // Simple relevance: higher emotion weight for dominant emotion = higher relevance
        const emotionWeight = symbol.emotionWeights[dominantEmotion.emotion] || 0.3;
        const relevance = Math.min(1, emotionWeight * 1.5); // Boost for better distribution
        
        return {
          id: symbol.id,
          relevance: Math.round(relevance * 100) / 100
        };
      });
      
      // Sort symbols by relevance and take top 5
      const topSymbols = symbolsWithRelevance
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);
      
      const memoryNode: DreamMemoryNode = {
        id: generateNodeId(candidate.topic),
        topic: candidate.topic,
        symbols: topSymbols,
        relevanceScore: Math.round(candidate.evidenceScore * 100) / 100,
        lastSeen: topicData.lastSeen,
        emotionSummary: {
          emotion: dominantEmotion.emotion,
          intensityAvg: Math.round(topicData.intensityAvg * 10) / 10,
          occurrences: dominantEmotion.occurrences
        }
      };
      
      memoryNodes.push(memoryNode);
      
    } catch (error) {
      console.error(`Failed to hydrate candidate ${candidate.topic}:`, error);
      continue;
    }
  }
  
  // Sort by relevance score
  return memoryNodes.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectTopicStore(ts: any): void {
    mockTopicStore = ts;
  },
  
  injectTrajectory(t: any): void {
    mockTrajectory = t;
  },
  
  injectOntology(o: any): void {
    mockOntology = o;
  },
  
  injectContextStore(cs: any): void {
    mockContextStore = cs;
  },
  
  reset(): void {
    mockTopicStore = null;
    mockTrajectory = null;
    mockOntology = null;
    mockContextStore = null;
  }
};