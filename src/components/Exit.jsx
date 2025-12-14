import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Exit marker component with glowing animation
 */
export function Exit({ position }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const ringsRef = useRef([]);

  // Animate the exit marker
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Rotate the main shape
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.1;
    }

    // Pulse the glow
    if (glowRef.current) {
      const scale = 1.5 + Math.sin(time * 3) * 0.2;
      glowRef.current.scale.setScalar(scale);
      glowRef.current.material.opacity = 0.3 + Math.sin(time * 3) * 0.1;
    }

    // Animate rings
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = time * (i + 1) * 0.3;
        const scale = 1 + Math.sin(time * 2 + i) * 0.1;
        ring.scale.setScalar(scale);
      }
    });
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main exit marker - octahedron */}
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color="#ffcc00"
          emissive="#ff9900"
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Animated rings */}
      {[0, 1].map((i) => (
        <mesh key={i} ref={(el) => (ringsRef.current[i] = el)}>
          <torusGeometry args={[0.5 + i * 0.2, 0.02, 16, 32]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.6 - i * 0.2}
          />
        </mesh>
      ))}

      {/* Point light */}
      <pointLight
        color="#ffd700"
        intensity={2}
        distance={8}
      />
    </group>
  );
}

export default Exit;
