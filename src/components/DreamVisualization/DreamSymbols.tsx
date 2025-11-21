// DreamSymbols.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Simple floating symbols used during 'dreaming'.
 * We create a handful of primitive shapes with soft emissive materials
 * and float/rotate them to give the 'symbol' effect.
 */
export function DreamSymbols() {
  const groupRef = useRef<THREE.Group | null>(null);

  const nodes = useMemo(() => {
    // few symbols scattered around
    const items: { pos: THREE.Vector3; scale: number; geometry: 'torus' | 'cone' | 'box' }[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 2.2;
      items.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        scale: 0.35 + Math.random() * 0.6,
        geometry: ['torus', 'cone', 'box'][Math.floor(Math.random() * 3)] as any,
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;
    groupRef.current.rotation.y = t * 0.08;
    groupRef.current.children.forEach((c, idx) => {
      const wob = Math.sin(t * (0.8 + idx * 0.02)) * 0.15;
      c.position.y += Math.sin(t * 0.6 + idx) * 0.0005; // tiny drift
      c.rotation.x += 0.005 + (idx % 3) * 0.002;
      c.rotation.y += 0.004 + (idx % 2) * 0.001;
      c.position.x += Math.sin(t * 0.3 + idx) * 0.0004;
      c.scale.setScalar(1 + Math.sin(t * 1.2 + idx) * 0.08);
      // slight bobbing using wob (applied to z for variety)
      c.position.z = (c.userData as any).baseZ + wob * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => {
        const color = new THREE.Color().setHSL(0.68 + (i % 5) * 0.02, 0.6, 0.6);
        const emissive = color.clone().multiplyScalar(0.7);
        if (n.geometry === 'torus') {
          return (
            <mesh key={i} position={n.pos} scale={n.scale} userData={{ baseZ: n.pos.z }}>
              <torusGeometry args={[0.25, 0.08, 8, 24]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.9} metalness={0.2} roughness={0.3} />
            </mesh>
          );
        } else if (n.geometry === 'cone') {
          return (
            <mesh key={i} position={n.pos} scale={n.scale} userData={{ baseZ: n.pos.z }}>
              <coneGeometry args={[0.25, 0.6, 12]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.9} metalness={0.05} roughness={0.4} />
            </mesh>
          );
        } else {
          return (
            <mesh key={i} position={n.pos} scale={n.scale} userData={{ baseZ: n.pos.z }}>
              <boxGeometry args={[0.35, 0.35, 0.35]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} metalness={0.1} roughness={0.25} />
            </mesh>
          );
        }
      })}
    </group>
  );
}

export default DreamSymbols;
