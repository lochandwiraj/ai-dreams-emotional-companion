interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Exponential backoff retry wrapper
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Retry failed');
}

/**
 * Fallback manager for demo mode
 */
export class FallbackManager {
  private failureCount = 0;
  private readonly threshold = 3;
  
  recordFailure() {
    this.failureCount++;
  }
  
  recordSuccess() {
    this.failureCount = Math.max(0, this.failureCount - 1);
  }
  
  shouldUseFallback(): boolean {
    return this.failureCount >= this.threshold;
  }
  
  reset() {
    this.failureCount = 0;
  }
}

export const fallbackManager = new FallbackManager();