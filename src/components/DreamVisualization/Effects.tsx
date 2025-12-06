// Effects.tsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useAIStore } from '../../store/aiStore';

export function Effects() {
  const { gl } = useThree();
  const { state } = useAIStore();

  // Strengths map by state
  const strengths = {
    dreaming: { bloom: 1.2, chroma: 0.015, vignette: 0.25 },
    drowsy: { bloom: 0.45, chroma: 0.002, vignette: 0.12 },
    awake: { bloom: 0.6, chroma: 0.004, vignette: 0.08 },
    waking: { bloom: 0.9, chroma: 0.01, vignette: 0.16 },
    idle: { bloom: 0.4, chroma: 0.001, vignette: 0.06 },
    processing: { bloom: 0.7, chroma: 0.006, vignette: 0.1 },
  };

  const s = strengths[state ?? 'idle'] ?? strengths.idle;

  // ensure composer uses the same pixel ratio as renderer (avoid blurriness)
  useEffect(() => {
    gl.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }, [gl]);

  return (
    // We pass camera & gl via context automatically in r3f
    <EffectComposer multisampling={0} autoClear={false}>
      <Bloom
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        intensity={s.bloom}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[s.chroma, s.chroma] as any}
      />
      <Vignette eskil={false} offset={0.6} darkness={s.vignette} />
    </EffectComposer>
  );
}

export default Effects;
