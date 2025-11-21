import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';
import { generateDream } from './dream';

describe('Dream Generation', () => {
  beforeEach(() => {
    useStore.setState({
      memories: ['Test memory 1', 'Test memory 2'],
      personality: { curiosity: 0.5, tone: 0.5, interests: [] },
    });
  });
  
  it('should generate valid dream structure', async () => {
    const dream = await generateDream();
    
    expect(dream).toHaveProperty('narrative');
    expect(dream).toHaveProperty('symbols');
    expect(dream.symbols).toBeInstanceOf(Array);
    expect(dream.symbols.length).toBeGreaterThan(0);
  });
  
  it('should use demo fallback on API failure', async () => {
    // Temporarily break API
    const original = import.meta.env.VITE_OPENROUTER_KEY;
    import.meta.env.VITE_OPENROUTER_KEY = 'invalid';
    
    const dream = await generateDream();
    expect(dream.id).toMatch(/^demo-/);
    
    import.meta.env.VITE_OPENROUTER_KEY = original;
  });
});