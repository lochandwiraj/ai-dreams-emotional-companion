// Pure math utilities for weighting, smoothing, normalization, recency decay, and drift detection

export function weightedSum(weights: Record<string, number>, mapping: Record<string, number>): number {
  if (!weights || !mapping || typeof weights !== 'object' || typeof mapping !== 'object') {
    return 0;
  }

  let sum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = mapping[key] || 0;
    sum += weight * value;
  }
  return sum;
}

export function exponentialRecencyWeight(ageSeconds: number, halfLifeSeconds: number = 604800): number {
  if (ageSeconds < 0 || halfLifeSeconds <= 0) {
    return 0;
  }
  
  if (ageSeconds === 0) {
    return 1;
  }
  
  const decayConstant = Math.log(2) / halfLifeSeconds;
  return Math.exp(-decayConstant * ageSeconds);
}

export function normalizeScores(scores: number[]): number[] {
  if (!Array.isArray(scores) || scores.length === 0) {
    return [];
  }
  
  const validScores = scores.filter(score => typeof score === 'number');
  if (validScores.length === 0) {
    return [];
  }
  
  const min = Math.min(...validScores);
  const max = Math.max(...validScores);
  
  if (min === max) {
    return validScores.map(() => 0.5);
  }
  
  return validScores.map(score => (score - min) / (max - min));
}

export function clamp01(x: number): number {
  if (typeof x !== 'number' || isNaN(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

export function computeDriftScore(history: { timestamp: string; value: number }[], windowSeconds: number = 2592000): number {
  if (!Array.isArray(history) || history.length < 2) {
    return 0.5;
  }
  
  const validHistory = history.filter(item => 
    item && 
    typeof item.timestamp === 'string' && 
    typeof item.value === 'number' &&
    !isNaN(item.value)
  );
  
  if (validHistory.length < 2) {
    return 0.5;
  }
  
  // Sort by timestamp ascending
  validHistory.sort((a, b) => {
    try {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } catch {
      return 0;
    }
  });
  
  const now = Date.now();
  const cutoffTime = now - (windowSeconds * 1000);
  
  // Split into early and recent periods
  const earlyPeriod: number[] = [];
  const recentPeriod: number[] = [];
  
  for (const item of validHistory) {
    try {
      const itemTime = new Date(item.timestamp).getTime();
      if (itemTime < cutoffTime) {
        earlyPeriod.push(item.value);
      } else {
        recentPeriod.push(item.value);
      }
    } catch {
      // Skip invalid timestamps
    }
  }
  
  if (earlyPeriod.length === 0 || recentPeriod.length === 0) {
    return 0.5;
  }
  
  const earlyAvg = earlyPeriod.reduce((sum, val) => sum + val, 0) / earlyPeriod.length;
  const recentAvg = recentPeriod.reduce((sum, val) => sum + val, 0) / recentPeriod.length;
  
  // Calculate drift as absolute difference normalized by range
  const allValues = [...earlyPeriod, ...recentPeriod];
  const range = Math.max(...allValues) - Math.min(...allValues);
  
  if (range === 0) {
    return 0.5;
  }
  
  const driftMagnitude = Math.abs(recentAvg - earlyAvg) / range;
  return clamp01(driftMagnitude);
}

export function mergeWithRecencyBias(values: Array<{ key: string; value: number; timestamp: string }>, factor: number = 0.5): Record<string, number> {
  if (!Array.isArray(values) || values.length === 0) {
    return {};
  }
  
  const validValues = values.filter(item => 
    item && 
    typeof item.key === 'string' && 
    typeof item.value === 'number' && 
    !isNaN(item.value) &&
    typeof item.timestamp === 'string'
  );
  
  if (validValues.length === 0) {
    return {};
  }
  
  const now = Date.now();
  const result: Record<string, number> = {};
  const keyWeights: Record<string, number> = {};
  
  for (const item of validValues) {
    try {
      const itemTime = new Date(item.timestamp).getTime();
      const ageSeconds = (now - itemTime) / 1000;
      const recencyWeight = exponentialRecencyWeight(ageSeconds, 604800 * factor); // Scale half-life by factor
      
      if (!result[item.key]) {
        result[item.key] = 0;
        keyWeights[item.key] = 0;
      }
      
      result[item.key] += item.value * recencyWeight;
      keyWeights[item.key] += recencyWeight;
    } catch {
      // Skip invalid timestamps
    }
  }
  
  // Normalize by total weights
  for (const key of Object.keys(result)) {
    if (keyWeights[key] > 0) {
      result[key] /= keyWeights[key];
    }
  }
  
  return result;
}