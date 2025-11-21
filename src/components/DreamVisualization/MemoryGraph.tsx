// src/components/DreamVisualization/MemoryGraph.tsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAIStore } from "../../store/aiStore";

export default function MemoryGraph() {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const lineGroupRef = useRef<THREE.Group | null>(null);

  const memories = useAIStore((s) => s.memories);
  const connections = useAIStore((s) => s.connections);
  const memoryTrigger = useAIStore((s) => s.memoryTrigger);
  const clearSignal = useAIStore((s) => s.clearSignal);

  // update instances whenever memories change
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color(0x4f46e5); // indigo-blue

    for (let i = 0; i < memories.length; i++) {
      const m = memories[i];
      matrix.makeTranslation(m.position.x, m.position.y, m.position.z);
      const scale = 0.12;
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color);
    }

    // if fewer instances than before, set count appropriately
    (mesh as any).count = memories.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [memories, clearSignal]);

  // draw connections lines
  useEffect(() => {
    const g = lineGroupRef.current;
    if (!g) return;
    // remove old children
    while (g.children.length) g.remove(g.children[0]);

    // create line geometry for each connection
    for (const [a, b] of connections) {
      const ma = memories.find((m) => m.id === a);
      const mb = memories.find((m) => m.id === b);
      if (!ma || !mb) continue;
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ma.position.x, ma.position.y, ma.position.z),
        new THREE.Vector3(mb.position.x, mb.position.y, mb.position.z),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.35 });
      const line = new THREE.Line(geom, mat);
      g.add(line);
    }
  }, [connections, memories, memoryTrigger, clearSignal]);

  // subtle floating animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
      meshRef.current.rotation.x = Math.sin(t * 0.08) * 0.03;
    }
    if (lineGroupRef.current) {
      lineGroupRef.current.rotation.y = Math.sin(t * 0.12) * 0.03;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, memories.length)]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial emissive={"#3b82f6"} emissiveIntensity={0.6} color={"#1e3a8a"} />
      </instancedMesh>

      <group ref={lineGroupRef} />
    </group>
  );
}
