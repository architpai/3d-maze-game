import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Glowing blue sphere player component
 * Movement is controlled externally via props
 */
export function Player({ position, onPositionUpdate }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const spotLightRef = useRef();
  const targetPosition = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  // Update target position when prop changes
  useFrame(() => {
    if (meshRef.current) {
      targetPosition.current.set(position[0], position[1], position[2]);
      
      // Smooth lerp to target position
      meshRef.current.position.lerp(targetPosition.current, 0.15);
      
      // Sync glow sphere
      if (glowRef.current) {
        glowRef.current.position.copy(meshRef.current.position);
      }

      // Sync spotlight position (above player, pointing down)
      if (spotLightRef.current) {
        spotLightRef.current.position.set(
          meshRef.current.position.x,
          meshRef.current.position.y + 8,
          meshRef.current.position.z
        );
        spotLightRef.current.target.position.copy(meshRef.current.position);
        spotLightRef.current.target.updateMatrixWorld();
      }
    }
  });

  // Animate glow pulsing
  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Spotlight for fog-of-war circular illumination */}
      <spotLight
        ref={spotLightRef}
        position={[position[0], position[1] + 8, position[2]]}
        angle={Math.PI / 4}
        penumbra={1}
        intensity={1080}
        color="#4488ff"
        distance={40}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* Outer glow sphere */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main player sphere */}
      <mesh ref={meshRef} position={position} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#0066ff"
          emissive="#0088ff"
          emissiveIntensity={2}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* Point light for local glow on walls */}
      <pointLight
        position={position}
        color="#0088ff"
        intensity={2}
        distance={4}
      />
    </group>
  );
}

export default Player;

