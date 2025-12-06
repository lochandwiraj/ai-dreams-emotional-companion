// src/components/DreamVisualization/NeuronParticles.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAIStore } from '../../store/aiStore';

type VisualProfile = {
  colorHex: string;
  baseSize: number;
  pulseSpeed: number;
  pulseAmp: number;
  rotationSpeed: number;
  wobbleAmp: number;
};

// Profiles for all states (reduced motion speed)
const PROFILES: Record<string, VisualProfile> = {
  dreaming:  { colorHex: '#a78bfa', baseSize: 0.07, pulseSpeed: 2.0, pulseAmp: 0.045, rotationSpeed: 0.06, wobbleAmp: 0.10 },
  drowsy:    { colorHex: '#4361ee', baseSize: 0.045, pulseSpeed: 0.6, pulseAmp: 0.015, rotationSpeed: 0.015, wobbleAmp: 0.03 },
  awake:     { colorHex: '#06b6d4', baseSize: 0.05, pulseSpeed: 1.5, pulseAmp: 0.01, rotationSpeed: 0.03, wobbleAmp: 0.02 },
  waking:    { colorHex: '#fb923c', baseSize: 0.07, pulseSpeed: 2.2, pulseAmp: 0.03, rotationSpeed: 0.08, wobbleAmp: 0.08 },
  idle:      { colorHex: '#4361ee', baseSize: 0.045, pulseSpeed: 0.8, pulseAmp: 0.008, rotationSpeed: 0.015, wobbleAmp: 0.01 },
};

export function NeuronParticles() {
  const { state } = useAIStore();
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);

  const particleCount = 1000;

  // initial spherical distribution
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = 1.8 + Math.random() * 2.2;
      arr[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  const initialPositions = useMemo(() => new Float32Array(positions), [positions]);
  const profile = PROFILES[state ?? 'idle'] ?? PROFILES.idle;

  useFrame((frameState) => {
    if (!pointsRef.current || !materialRef.current) return;

    const time = frameState.clock.elapsedTime;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;

    // slower rotation
    pointsRef.current.rotation.y = time * profile.rotationSpeed;
    pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.03;

    // animate geometry positions (slower wobble)
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      const phase = (i % 10) * 0.13 + (i % 7) * 0.07;
      const wobble = state === 'dreaming' ? profile.wobbleAmp * 1.5 : profile.wobbleAmp;

      posAttr.array[i3]     = ix + Math.sin(time * profile.pulseSpeed + phase) * wobble;
      posAttr.array[i3 + 1] = iy + Math.cos(time * profile.pulseSpeed * 0.8 + phase) * (wobble * 0.9);
      posAttr.array[i3 + 2] = iz + Math.sin(time * profile.pulseSpeed * 1.2 + phase) * (wobble * 0.7);
    }
    posAttr.needsUpdate = true;

    // slower pulsing for size and opacity
    const pulse = 1 + Math.sin(time * profile.pulseSpeed) * profile.pulseAmp;
    materialRef.current.size = profile.baseSize * pulse;
    materialRef.current.opacity = Math.min(
      1,
      0.35 + Math.abs(Math.sin(time * profile.pulseSpeed)) * (profile.pulseAmp * 4)
    );

    // Mono color - use profile color consistently
    materialRef.current.color.set(profile.colorHex);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        ref={materialRef}
        size={profile.baseSize}
        color={profile.colorHex}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default NeuronParticles;