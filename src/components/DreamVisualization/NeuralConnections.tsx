// src/components/DreamVisualization/NeuralConnections.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAIStore } from '../../store/aiStore';

interface Neuron {
  position: THREE.Vector3;
  connections: number[];
}

const CONNECTION_COLOR: Record<string, string> = {
  dreaming: '#a78bfa',
  drowsy: '#4361ee',
  awake: '#06b6d4',
  waking: '#fb923c',
  processing: '#7dd3fc',
  idle: '#4361ee',
};

export function NeuralConnections() {
  const { state } = useAIStore();
  const groupRef = useRef<THREE.Group | null>(null);

  const neurons = useMemo(() => {
    const neuronCount = 48;
    const nodes: Neuron[] = [];

    for (let i = 0; i < neuronCount; i++) {
      const theta = (i / neuronCount) * Math.PI * 2;
      const phi = Math.acos((i / neuronCount) * 2 - 1);
      const radius = 3 + (Math.random() - 0.5) * 0.5;

      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      const connCount = 2 + Math.floor(Math.random() * 3);
      const connections: number[] = [];
      for (let j = 0; j < connCount; j++) {
        const target = (i + 1 + Math.floor(Math.random() * 12)) % neuronCount;
        if (!connections.includes(target) && target !== i) connections.push(target);
      }

      nodes.push({ position: pos, connections });
    }

    return nodes;
  }, []);

  useFrame((frameState) => {
    const t = frameState.clock.elapsedTime;

    if (!groupRef.current) return;

    // base rotation
    const baseSpeed = state === 'dreaming' ? 0.08 : state === 'waking' ? 0.06 : 0.02;
    groupRef.current.rotation.y = t * baseSpeed;
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.02;
  });

  const lineColor = CONNECTION_COLOR[state ?? 'idle'] ?? CONNECTION_COLOR.idle;

  return (
    <group ref={groupRef}>
      {/* neuron nodes */}
      {neurons.map((neuron, i) => (
        <mesh key={`node-${i}`} position={neuron.position}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial
            color={state === 'dreaming' ? '#c084fc' : '#4361ee'}
            emissive={state === 'dreaming' ? '#7c3aed' : '#223055'}
            emissiveIntensity={state === 'dreaming' ? 0.9 : 0.1}
            transparent
            opacity={state === 'dreaming' ? 0.95 : 0.7}
          />
        </mesh>
      ))}

      {/* connections (glowing lines) */}
      {neurons.map((neuron, i) =>
        neuron.connections.map((targetIndex, idx) => {
          const target = neurons[targetIndex];
          const points = [neuron.position.clone(), target.position.clone()];
          // line pulsing is handled by Drei Line via opacity/color props (we can re-render)
          return (
            <Line
              key={`line-${i}-${idx}`}
              points={points}
              color={lineColor}
              lineWidth={1}
              transparent
              opacity={state === 'dreaming' ? 0.45 : state === 'waking' ? 0.35 : 0.18}
              dashed={false}
              // simple animation via onUpdate - we animate material opacity slightly
              onUpdate={(self: any) => {
                const mat: any = self.material;
                if (!mat) return;
                const t = performance.now() * 0.001;
                const pulse = 0.5 + Math.abs(Math.sin(t * (state === 'dreaming' ? 3 : 1.2))) * (state === 'dreaming' ? 0.6 : 0.25);
                mat.opacity = Math.min(1, (state === 'dreaming' ? 0.45 : 0.18) * pulse);
                // slight color lerp effect (imperative)
                const targetColor = new THREE.Color(lineColor);
                if (mat.color) mat.color.lerp(targetColor, 0.05);
              }}
            />
          );
        })
      )}
    </group>
  );
}
