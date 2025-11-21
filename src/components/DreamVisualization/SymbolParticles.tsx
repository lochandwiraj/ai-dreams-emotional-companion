import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAIStore } from '../../store/aiStore';

export default function SymbolParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const currentDream = useAIStore((s) => s.currentDream);
  const state = useAIStore((s) => s.state);

  const symbols = useMemo(() => {
    if (!currentDream || state !== 'dreaming') return [];
    
    return currentDream.symbols.slice(0, 5).map((symbol, i) => {
      const angle = (i / currentDream.symbols.length) * Math.PI * 2;
      const radius = 4;
      
      return {
        text: symbol,
        position: [
          Math.cos(angle) * radius,
          Math.sin(i * 0.5) * 2,
          Math.sin(angle) * radius
        ] as [number, number, number]
      };
    });
  }, [currentDream, state]);

  useFrame(({ clock }) => {
    if (groupRef.current && symbols.length > 0) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  if (symbols.length === 0) return null;

  return (
    <group ref={groupRef}>
      {symbols.map((symbol, i) => (
        <Text
          key={i}
          position={symbol.position}
          fontSize={0.3}
          color="#a78bfa"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {symbol.text}
        </Text>
      ))}
    </group>
  );
}