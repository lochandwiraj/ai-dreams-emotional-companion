// src/components/DreamVisualization/MemoryGraph.tsx
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAIStore } from "../../store/aiStore";

export default function MemoryGraph() {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const lineGroupRef = useRef<THREE.Group | null>(null);
  
  const memories = useAIStore((s) => s.memories);
  const connections = useAIStore((s) => s.connections);
  const state = useAIStore((s) => s.state);
  const memoryTrigger = useAIStore((s) => s.memoryTrigger);

  const memoryNodes = useMemo(() => {
    if (!memories || memories.length === 0) return [];
    
    console.log("📊 [MemoryGraph] Processing memories:", memories.length);
    
    return memories.map((mem, idx) => {
      console.log(`Memory ${idx}:`, {
        id: mem.id.slice(0, 15),
        position: mem.position,
        content: mem.content?.slice(0, 30)
      });
      return {
        id: mem.id,
        position: mem.position,
        importance: mem.importance,
        content: mem.content,
      };
    });
  }, [memories]);

  // Update particles
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || memoryNodes.length === 0) return;

    const matrix = new THREE.Matrix4();
    const tempColor = new THREE.Color("#00ff00"); // Bright green

    for (let i = 0; i < memoryNodes.length; i++) {
      const node = memoryNodes[i];
      matrix.makeTranslation(node.position.x, node.position.y, node.position.z);
      matrix.scale(new THREE.Vector3(0.2, 0.2, 0.2)); // Large
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = memoryNodes.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    console.log(`✅ Rendered ${memoryNodes.length} particles`);
  }, [memoryNodes, memoryTrigger]);

  // Draw connections with HEAVY DEBUGGING
  useEffect(() => {
    console.log("🔗 [CONNECTION EFFECT] Starting...");
    console.log("lineGroupRef.current:", !!lineGroupRef.current);
    console.log("memoryNodes.length:", memoryNodes.length);
    console.log("connections from store:", connections);
    
    const g = lineGroupRef.current;
    if (!g) {
      console.error("❌ lineGroupRef is NULL!");
      return;
    }

    // Clear old
    while (g.children.length > 0) g.remove(g.children[0]);
    console.log("✅ Cleared old lines");

    // Force create connections between ALL consecutive memories
    if (memoryNodes.length >= 2) {
      console.log("🔧 Creating FORCED connections...");
      
      for (let i = 0; i < memoryNodes.length - 1; i++) {
        const nodeA = memoryNodes[i];
        const nodeB = memoryNodes[i + 1];
        
        console.log(`Drawing line ${i}: ${nodeA.id.slice(0,10)} -> ${nodeB.id.slice(0,10)}`);
        console.log(`  From: (${nodeA.position.x.toFixed(1)}, ${nodeA.position.y.toFixed(1)}, ${nodeA.position.z.toFixed(1)})`);
        console.log(`  To: (${nodeB.position.x.toFixed(1)}, ${nodeB.position.y.toFixed(1)}, ${nodeB.position.z.toFixed(1)})`);

        const points = [
          new THREE.Vector3(nodeA.position.x, nodeA.position.y, nodeA.position.z),
          new THREE.Vector3(nodeB.position.x, nodeB.position.y, nodeB.position.z),
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xff0000, // RED for visibility
          transparent: false,
          opacity: 1.0,
          linewidth: 5,
        });
        
        const line = new THREE.Line(geometry, material);
        g.add(line);
        console.log(`  ✅ Line ${i} added to group`);
      }
      
      console.log(`✅ Total lines in group: ${g.children.length}`);
    } else {
      console.warn("⚠️ Need at least 2 memories to draw connections");
    }
  }, [memoryNodes, connections, memoryTrigger]);

  // Animation
  useFrame(() => {
    // NO rotation so lines are easier to see
  });

  console.log("🎨 [RENDER] memoryNodes:", memoryNodes.length);

  if (memoryNodes.length === 0) {
    console.warn("⚠️ No memory nodes, returning null");
    return null;
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Particles */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, memoryNodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00ff00" />
      </instancedMesh>
      
      {/* Lines group */}
      <group ref={lineGroupRef} />
      
      {/* Debug: Red cube at origin */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="red" />
      </mesh>
      
      {/* Debug: Show first memory position */}
      {memoryNodes.length > 0 && (
        <mesh position={[
          memoryNodes[0].position.x,
          memoryNodes[0].position.y,
          memoryNodes[0].position.z
        ]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}
    </group>
  );
}