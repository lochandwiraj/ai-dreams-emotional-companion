import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useStore } from '../store';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Particles() {
  const { state, currentDream } = useStore();
  const particlesRef = useRef<THREE.Points>(null);
  
  // Generate particle positions
  const particles = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    return positions;
  }, []);
  
  // Color based on state
  const color = useMemo(() => {
    const colors = {
      awake: '#4ade80',
      drowsy: '#fbbf24',
      dreaming: '#c084fc',
      waking: '#60a5fa',
    };
    return colors[state];
  }, [state]);
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={state === 'dreaming' ? 0.8 : 0.4}
        sizeAttenuation
      />
    </points>
  );
}

export function Scene() {
  const state = useStore((s) => s.state);
  
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <color attach="background" args={['#0a0a0a']} />
        
        <Stars radius={100} depth={50} count={5000} fade speed={1} />
        
        <Particles />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={state === 'dreaming' ? 2 : 0.5}
        />
        
        {state === 'dreaming' && (
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} intensity={1.5} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}