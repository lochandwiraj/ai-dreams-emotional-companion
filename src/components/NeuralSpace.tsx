import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAIStore } from '../store/aiStore';
import { useMemo } from 'react';
import * as THREE from 'three';

function Particles() {
  const state = useAIStore((s) => s.state);
  const dream = useAIStore((s) => s.currentDream);
  
  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    
    return positions;
  }, []);
  
  const color = useMemo(() => {
    if (state === 'dreaming') {
      const tone = dream?.emotionalTone || 'peaceful';
      return {
        peaceful: '#60a5fa',
        anxious: '#f87171',
        curious: '#a78bfa',
        excited: '#fbbf24',
      }[tone] || '#60a5fa';
    }
    return state === 'awake' ? '#10b981' : '#6b7280';
  }, [state, dream]);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={state === 'dreaming' ? 0.08 : 0.05}
        color={color}
        transparent
        opacity={state === 'dreaming' ? 0.8 : 0.4}
      />
    </points>
  );
}

export default function NeuralSpace() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <Particles />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}