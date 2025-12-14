import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Maze component with instanced walls for performance
 */
export function Maze({ mazeData }) {
  const meshRef = useRef();

  // Create instanced mesh for walls
  const { geometry, material, count, matrices } = useMemo(() => {
    const walls = mazeData.walls;
    const count = walls.length;
    
    // Box geometry for walls
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Wall material with subtle gradient look
    const material = new THREE.MeshStandardMaterial({
      color: '#2a2a3e',
      roughness: 0.7,
      metalness: 0.2,
    });

    // Create transformation matrices for each wall
    const matrices = walls.map((wall) => {
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(...wall.position),
        new THREE.Quaternion(),
        new THREE.Vector3(...wall.size)
      );
      return matrix;
    });

    return { geometry, material, count, matrices };
  }, [mazeData]);

  // Set instance matrices after mount
  useFrame(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[mazeData.width * mazeData.cellSize + 4, mazeData.height * mazeData.cellSize + 4]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Instanced walls */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export default Maze;
