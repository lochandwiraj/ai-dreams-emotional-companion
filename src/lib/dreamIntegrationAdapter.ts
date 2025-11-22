// Provide Dream Engine with consolidated emotional→symbolic→memory→conflict payload

import { EmotionState } from './emotionDetector';
import { SymbolNode, mapEmotionToSymbols } from './dreamEmotionMapper';
import { DreamMemoryNode, buildDreamMemoryNodes } from './dreamMemoryIntegrator';
import { ConflictCluster, detectConflictClusters } from './emotionConflictResolver';
import { getLongTermProfile } from './emotionTrajectory';
import { getCachedProfile } from './userProfileModel';

export interface DreamIntegrationPayload {
  symbols: SymbolNode[];
  memoryNodes: DreamMemoryNode[];
  conflicts: ConflictCluster[];
  emotionalArc: {
    dominantEmotion: EmotionState | null;
    intensityBaseline: number;
    trajectory: { slope: number; volatility: number };
  };
  profileSnapshot?: { userId?: string; smallSummary?: string };
  generatedAt: string;
}

// Mock injection for testing
let mockMapper: any = null;
let mockIntegrator: any = null;
let mockConflictResolver: any = null;
let mockProfileModel: any = null;
let mockTrajectory: any = null;

function getMapper() {
  return mockMapper || { mapEmotionToSymbols };
}

function getIntegrator() {
  return mockIntegrator || { buildDreamMemoryNodes };
}

function getConflictResolver() {
  return mockConflictResolver || { detectConflictClusters };
}

function getProfileModel() {
  return mockProfileModel || { getCachedProfile };
}

function getTrajectory() {
  return mockTrajectory || { getLongTermProfile };
}

function getCurrentEmotionContext(): { emotion: EmotionState; intensity: number; themes: string[] } {
  // In a real implementation, this would get the current/latest emotion
  // For now, return a neutral default
  return {
    emotion: 'neutral',
    intensity: 5,
    themes: ['daily-life', 'reflection']
  };
}

function createProfileSnapshot(): { userId?: string; smallSummary?: string } {
  try {
    const profileModel = getProfileModel();
    const profile = profileModel.getCachedProfile();
    
    if (!profile) {
      return {
        smallSummary: 'Building emotional profile patterns'
      };
    }
    
    const dominantEmotion = profile.emotionalBaseline.dominantEmotion || 'neutral';
    const intensity = profile.emotionalBaseline.intensityBaseline;
    
    return {
      userId: profile.userId,
      smallSummary: `Baseline: ${dominantEmotion} at ${intensity}/10 intensity`
    };
  } catch (error) {
    return {
      smallSummary: 'Emotional patterns developing'
    };
  }
}

function extractEmotionalArc(): {
  dominantEmotion: EmotionState | null;
  intensityBaseline: number;
  trajectory: { slope: number; volatility: number };
} {
  try {
    const trajectory = getTrajectory();
    const longTermProfile = trajectory.getLongTermProfile();
    
    // Use 14-day metrics for emotional arc
    const fourteenDayMetrics = longTermProfile.last14Days;
    
    return {
      dominantEmotion: fourteenDayMetrics.dominantEmotion,
      intensityBaseline: fourteenDayMetrics.averageIntensity,
      trajectory: {
        slope: fourteenDayMetrics.intensitySlope,
        volatility: fourteenDayMetrics.volatilityIndex
      }
    };
  } catch (error) {
    // Fallback values
    return {
      dominantEmotion: 'neutral',
      intensityBaseline: 5,
      trajectory: {
        slope: 0,
        volatility: 0.5
      }
    };
  }
}

export function buildDreamPayload(opts?: { lookbackDays?: number; maxSymbols?: number; maxMemoryNodes?: number }): DreamIntegrationPayload {
  const lookbackDays = opts?.lookbackDays || 14;
  const maxSymbols = opts?.maxSymbols || 6;
  const maxMemoryNodes = opts?.maxMemoryNodes || 8;
  
  try {
    const mapper = getMapper();
    const integrator = getIntegrator();
    const conflictResolver = getConflictResolver();
    
    // Get current emotion context for symbol mapping
    const emotionContext = getCurrentEmotionContext();
    
    // Build symbols from current emotional state
    const allSymbols = mapper.mapEmotionToSymbols({
      emotionResult: {
        emotion: emotionContext.emotion,
        intensity: emotionContext.intensity,
        themes: emotionContext.themes,
        confidence: 0.7,
        needsSupport: false,
        detectedAt: new Date().toISOString()
      },
      topics: emotionContext.themes
    }, { maxSymbols: maxSymbols * 2 }); // Get extra for filtering
    
    const symbols = allSymbols.slice(0, maxSymbols);
    
    // Build memory nodes from recent topics and patterns
    const memoryNodes = integrator.buildDreamMemoryNodes({
      lookbackDays,
      maxNodes: maxMemoryNodes
    });
    
    // Detect conflict clusters
    const allConflicts = conflictResolver.detectConflictClusters({
      lookbackDays,
      minCooccurrences: 2
    });
    
    const conflicts = allConflicts.slice(0, 5); // Cap at 5 conflicts
    
    // Build emotional arc from trajectory data
    const emotionalArc = extractEmotionalArc();
    
    // Create minimal profile snapshot
    const profileSnapshot = createProfileSnapshot();
    
    return {
      symbols,
      memoryNodes,
      conflicts,
      emotionalArc,
      profileSnapshot,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Failed to build dream payload:', error);
    
    // Return minimal fallback payload
    return {
      symbols: [],
      memoryNodes: [],
      conflicts: [],
      emotionalArc: {
        dominantEmotion: 'neutral',
        intensityBaseline: 5,
        trajectory: {
          slope: 0,
          volatility: 0.5
        }
      },
      profileSnapshot: {
        smallSummary: 'System initializing emotional patterns'
      },
      generatedAt: new Date().toISOString()
    };
  }
}

export function validateDreamPayload(payload: DreamIntegrationPayload): { ok: boolean; issues?: string[] } {
  const issues: string[] = [];
  
  // Check payload structure
  if (!payload || typeof payload !== 'object') {
    return { ok: false, issues: ['Payload is not a valid object'] };
  }
  
  // Validate symbols
  if (!Array.isArray(payload.symbols)) {
    issues.push('Symbols must be an array');
  } else {
    if (payload.symbols.length > 20) {
      issues.push(`Too many symbols: ${payload.symbols.length} (max 20)`);
    }
    
    payload.symbols.forEach((symbol, index) => {
      if (!symbol.symbol || typeof symbol.symbol !== 'string') {
        issues.push(`Symbol ${index} missing valid symbol field`);
      }
      if (symbol.intensity < 0 || symbol.intensity > 1) {
        issues.push(`Symbol ${index} intensity out of bounds: ${symbol.intensity}`);
      }
      if (symbol.relevance < 0 || symbol.relevance > 1) {
        issues.push(`Symbol ${index} relevance out of bounds: ${symbol.relevance}`);
      }
    });
  }
  
  // Validate memory nodes
  if (!Array.isArray(payload.memoryNodes)) {
    issues.push('Memory nodes must be an array');
  } else {
    if (payload.memoryNodes.length > 15) {
      issues.push(`Too many memory nodes: ${payload.memoryNodes.length} (max 15)`);
    }
    
    payload.memoryNodes.forEach((node, index) => {
      if (!node.topic || typeof node.topic !== 'string') {
        issues.push(`Memory node ${index} missing valid topic`);
      }
      if (node.relevanceScore < 0 || node.relevanceScore > 1) {
        issues.push(`Memory node ${index} relevance score out of bounds: ${node.relevanceScore}`);
      }
      if (!Array.isArray(node.symbols)) {
        issues.push(`Memory node ${index} symbols must be an array`);
      }
    });
  }
  
  // Validate conflicts
  if (!Array.isArray(payload.conflicts)) {
    issues.push('Conflicts must be an array');
  } else {
    if (payload.conflicts.length > 10) {
      issues.push(`Too many conflicts: ${payload.conflicts.length} (max 10)`);
    }
    
    payload.conflicts.forEach((conflict, index) => {
      if (!Array.isArray(conflict.emotions) || conflict.emotions.length === 0) {
        issues.push(`Conflict ${index} missing valid emotions array`);
      }
      if (conflict.conflictValue < 0 || conflict.conflictValue > 1) {
        issues.push(`Conflict ${index} conflict value out of bounds: ${conflict.conflictValue}`);
      }
    });
  }
  
  // Validate emotional arc
  if (!payload.emotionalArc || typeof payload.emotionalArc !== 'object') {
    issues.push('Missing emotional arc data');
  } else {
    if (payload.emotionalArc.intensityBaseline < 1 || payload.emotionalArc.intensityBaseline > 10) {
      issues.push(`Intensity baseline out of bounds: ${payload.emotionalArc.intensityBaseline}`);
    }
    if (Math.abs(payload.emotionalArc.trajectory.slope) > 5) {
      issues.push(`Trajectory slope out of reasonable range: ${payload.emotionalArc.trajectory.slope}`);
    }
    if (payload.emotionalArc.trajectory.volatility < 0 || payload.emotionalArc.trajectory.volatility > 1) {
      issues.push(`Volatility out of bounds: ${payload.emotionalArc.trajectory.volatility}`);
    }
  }
  
  // Validate generated timestamp
  if (!payload.generatedAt || typeof payload.generatedAt !== 'string') {
    issues.push('Missing or invalid generatedAt timestamp');
  } else {
    try {
      const generatedDate = new Date(payload.generatedAt);
      if (isNaN(generatedDate.getTime())) {
        issues.push('Invalid generatedAt timestamp format');
      }
    } catch {
      issues.push('Failed to parse generatedAt timestamp');
    }
  }
  
  // Check total payload size (rough estimate)
  const payloadSize = JSON.stringify(payload).length;
  if (payloadSize > 100000) { // 100KB limit
    issues.push(`Payload too large: ${payloadSize} bytes (max 100KB)`);
  }
  
  return {
    ok: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined
  };
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectMapper(m: any): void {
    mockMapper = m;
  },
  
  injectIntegrator(i: any): void {
    mockIntegrator = i;
  },
  
  injectConflictResolver(c: any): void {
    mockConflictResolver = c;
  },
  
  injectProfileModel(p: any): void {
    mockProfileModel = p;
  },
  
  injectTrajectory(t: any): void {
    mockTrajectory = t;
  },
  
  reset(): void {
    mockMapper = null;
    mockIntegrator = null;
    mockConflictResolver = null;
    mockProfileModel = null;
    mockTrajectory = null;
  }
};