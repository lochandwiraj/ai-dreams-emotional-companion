import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAIStore } from "../../store/aiStore";

export default function DreamNetwork() {
  const state = useAIStore((s) => s.state);
  const memories = useAIStore((s) => s.memories);
  const connections = useAIStore((s) => s.connections);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = state === "dreaming" ? 0.05 : 0.018;
    groupRef.current.rotation.y = clock.elapsedTime * speed;
  });

  const NODE_COLOR = "#ffdf5d";
  const NODE_SIZE = 0.12;

  const connectionLines = useMemo(() => {
    return connections.map(([a, b], i) => {
      const A = memories.find((m) => m.id === a);
      const B = memories.find((m) => m.id === b);
      if (!A || !B) return null;

      const positions = new Float32Array([
        A.position.x / 3,
        A.position.y / 3,
        A.position.z / 3,
        B.position.x / 3,
        B.position.y / 3,
        B.position.z / 3,
      ]);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      return (
        <line key={i} geometry={geometry}>
          <lineBasicMaterial color={NODE_COLOR} transparent opacity={0.25} linewidth={1} />
        </line>
      );
    });
  }, [connections, memories]);

  return (
    <group ref={groupRef}>
      {memories.map((m) => (
        <mesh key={m.id} position={[m.position.x / 3, m.position.y / 3, m.position.z / 3]}>
          <sphereGeometry args={[NODE_SIZE, 16, 16]} />
          <meshStandardMaterial
            emissive={NODE_COLOR}
            emissiveIntensity={1}
            color={NODE_COLOR}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
      ))}
      {connectionLines}
    </group>
  );
}
