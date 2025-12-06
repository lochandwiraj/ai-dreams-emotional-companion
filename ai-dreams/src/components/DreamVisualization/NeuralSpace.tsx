import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { NeuronParticles } from './NeuronParticles';
import { Effects } from './Effects';
import DreamNetwork from './DreamNetwork';   // <-- ADDED THIS
import { useAIStore } from '../../store/aiStore';

/**
 * NeuralSpace: main 3D canvas
 * - No large dream shapes rendered
 * - Uses Effects (post-processing) if available
 * - OrbitControls zoom enabled
 */
export function NeuralSpace(): JSX.Element {
  const { state } = useAIStore();

  return (
    <div className="fixed inset-0 w-full h-screen bg-gradient-to-b from-gray-950 to-black">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 1000 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />

        {/* Background & subtle fog */}
        <color attach="background" args={['#000814']} />
        <fog attach="fog" args={['#000814', 6, 30]} />

        {/* Lighting */}
        <ambientLight intensity={0.35} />
        <pointLight
          position={[0, 0, 0]}
          intensity={state === 'dreaming' ? 1.6 : 0.5}
          color={state === 'dreaming' ? '#c4b5fd' : '#4361ee'}
        />
        <pointLight position={[8, 6, -6]} intensity={state === 'dreaming' ? 0.3 : 0.18} color={state === 'dreaming' ? '#c4b5fd' : '#0ea5e9'} />

        {/* Stars */}
        <Stars radius={100} depth={50} count={1800} factor={4} saturation={0.5} fade speed={0.3} />

        {/* Effects */}
        <Suspense fallback={null}>
          <Effects />
        </Suspense>

        {/* 🌐 MEMORY GRAPH */}
        <Suspense fallback={null}>
          <DreamNetwork />  
        </Suspense>

        {/* Main particle system */}
        <Suspense fallback={null}>
          <NeuronParticles />
        </Suspense>

        {/* Camera controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={state === 'dreaming' ? 0.45 : 0.18}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

export default NeuralSpace;
