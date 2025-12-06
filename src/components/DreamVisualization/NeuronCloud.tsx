// src/components/DreamVisualization/NeuronCloud.tsx
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

const PROFILES: Record<string, VisualProfile> = {
  dreaming: {
    colorHex: '#a78bfa', // purple
    baseSize: 0.08,
    pulseSpeed: 6,
    pulseAmp: 0.035,
    rotationSpeed: 0.22,
    wobbleAmp: 0.12,
  },
  drowsy: {
    colorHex: '#4361ee', // dark blue
    baseSize: 0.045,
    pulseSpeed: 1.0,
    pulseAmp: 0.015,
    rotationSpeed: 0.03,
    wobbleAmp: 0.03,
  },
  awake: {
    colorHex: '#06b6d4', // cyan
    baseSize: 0.05,
    pulseSpeed: 2.5,
    pulseAmp: 0.01,
    rotationSpeed: 0.06,
    wobbleAmp: 0.02,
  },
  waking: {
    colorHex: '#fb923c', // orange
    baseSize: 0.07,
    pulseSpeed: 4.5,
    pulseAmp: 0.03,
    rotationSpeed: 0.14,
    wobbleAmp: 0.08,
  },
  processing: {
    colorHex: '#7dd3fc',
    baseSize: 0.05,
    pulseSpeed: 2.0,
    pulseAmp: 0.02,
    rotationSpeed: 0.05,
    wobbleAmp: 0.03,
  },
  idle: {
    colorHex: '#4361ee',
    baseSize: 0.045,
    pulseSpeed: 1.2,
    pulseAmp: 0.008,
    rotationSpeed: 0.02,
    wobbleAmp: 0.01,
  },
};

export function NeuronCloud() {
  const { state, currentDream } = useAIStore();
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);

  const particleCount = 1000;

  // initial positions (spherical distribution)
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = 1.8 + Math.random() * 2.2; // between ~1.8 and 4
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [particleCount]);

  // keep a copy of initial positions to reference when wobbling
  const initialPositions = useMemo(() => new Float32Array(positions), [positions]);

  // choose profile based on state
  const profile = PROFILES[state ?? 'idle'] ?? PROFILES.idle;

  useFrame((frameState) => {
    const time = frameState.clock.elapsedTime;
    if (!pointsRef.current || !materialRef.current) return;

    // rotate cloud
    pointsRef.current.rotation.y = time * profile.rotationSpeed;
    pointsRef.current.rotation.x = Math.sin(time * 0.02) * 0.05;

    // animate geometry positions (wobble)
    const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      // tiny, per-particle phase to make motion organic
      const phase = (i % 10) * 0.13 + (i % 7) * 0.07;

      posAttr.array[i3] = ix + Math.sin(time * (profile.pulseSpeed * 0.5) + phase) * profile.wobbleAmp;
      posAttr.array[i3 + 1] = iy + Math.cos(time * (profile.pulseSpeed * 0.4) + phase) * (profile.wobbleAmp * 0.8);
      posAttr.array[i3 + 2] = iz + Math.sin(time * (profile.pulseSpeed * 0.6) + phase) * (profile.wobbleAmp * 0.6);
    }
    posAttr.needsUpdate = true;

    // pulse the size and opacity
    const pulse = 1 + Math.sin(time * profile.pulseSpeed) * profile.pulseAmp;
    materialRef.current.size = profile.baseSize * pulse;
    // opacity stronger when dreaming/waking
    materialRef.current.opacity = Math.min(1, 0.35 + Math.abs(Math.sin(time * profile.pulseSpeed)) * (profile.pulseAmp * 6));

    // color blending: if dreaming and a currentDream exists, we may prefer emotion
    if (state === 'dreaming' && currentDream?.emotionalTone) {
      const toneMap: Record<string, string> = {
        peaceful: '#7dd3fc',
        anxious: '#ff6b6b',
        curious: '#a78bfa',
        excited: '#ffd166',
        melancholic: '#55608f',
      };
      const target = new THREE.Color(toneMap[currentDream.emotionalTone] ?? profile.colorHex);
      materialRef.current.color.lerp(target, 0.02);
    } else {
      const target = new THREE.Color(profile.colorHex);
      materialRef.current.color.lerp(target, 0.02);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} args={[positions, 3]} />
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
