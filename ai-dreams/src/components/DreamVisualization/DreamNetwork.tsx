// src/components/DreamVisualization/DreamNetwork.tsx
import React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAIStore } from "../../store/aiStore";

export default function DreamNetwork() {
  const state = useAIStore((s) => s.state);
  const memories = useAIStore((s) => s.memories);
  const connections = useAIStore((s) => s.connections);

  const groupRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = state === "dreaming" ? 0.05 : 0.018;
    groupRef.current.rotation.y = clock.elapsedTime * speed;
  });

  // Use light purple during dreaming, default blue otherwise
  const COLOR = state === "dreaming" ? "#c4b5fd" : "#4f46e5";
  const SIZE = 0.08;

  return (
    <group ref={groupRef}>

      {/* MEMORY NODES */}
      {memories.map((m) => (
        <mesh key={m.id} position={[m.position.x, m.position.y, m.position.z]}>
          <sphereGeometry args={[SIZE, 16, 16]} />
          <meshStandardMaterial
            emissive={COLOR}
            emissiveIntensity={state === "dreaming" ? 1.2 : 0.8}
            color={COLOR}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* CONNECTION LINES */}
      {connections.map(([a, b], i) => {
        const A = memories.find((m) => m.id === a);
        const B = memories.find((m) => m.id === b);
        if (!A || !B) return null;

        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(A.position.x, A.position.y, A.position.z),
          new THREE.Vector3(B.position.x, B.position.y, B.position.z),
        ]);

        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial
              color={COLOR}
              transparent
              opacity={state === "dreaming" ? 0.4 : 0.25}
              linewidth={1}
            />
          </line>
        );
      })}

    </group>
  );
}
