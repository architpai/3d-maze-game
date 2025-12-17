import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function Modifiers({ modifiers }) {
  const orbsRef = useRef();
  const ringsRef = useRef();
  const wispRef = useRef();

  // Filter modifiers by type for specific instances
  const jumpModifiers = useMemo(() => modifiers.filter(m => m.type === 'jump'), [modifiers]);
  const wispModifiers = useMemo(() => modifiers.filter(m => m.type === 'wisp'), [modifiers]);

  // Initial Setup: Set colors and positions
  useEffect(() => {
    if (!orbsRef.current) return;

    // Set colors for main orbs
    modifiers.forEach((mod, i) => {
      if (mod.type === 'speed') _color.set('#00ffff');
      else if (mod.type === 'jump') _color.set('#00ff00');
      else if (mod.type === 'wisp') _color.set('#ffd700');
      
      orbsRef.current.setColorAt(i, _color);
    });
    orbsRef.current.instanceColor.needsUpdate = true;
  }, [modifiers]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 1. Update Main Orbs (All types)
    if (orbsRef.current) {
      modifiers.forEach((mod, i) => {
        // If not active, scale to 0
        const scale = mod.active ? 1 : 0;
        
        dummy.position.set(mod.position[0], mod.position[1], mod.position[2]);
        
        // Float animation
        dummy.position.y += Math.sin(time * 2 + i) * 0.1;
        
        // Spin animation
        dummy.rotation.set(0, time + i, 0);
        
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        orbsRef.current.setMatrixAt(i, dummy.matrix);
      });
      orbsRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Jump Rings (Only 'jump' types)
    if (ringsRef.current) {
        jumpModifiers.forEach((mod, i) => {
            // Find global active state
            const original = modifiers.find(m => m.id === mod.id);
            const scale = original?.active ? 1 : 0;

            if (scale > 0) {
                dummy.position.set(mod.position[0], mod.position[1], mod.position[2]);
                dummy.position.y += Math.sin(time * 2 + mod.gridX) * 0.1; // Sync with orb
                
                // Ring spin (different axis)
                dummy.rotation.set(Math.PI / 2, 0, time);
                
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                ringsRef.current.setMatrixAt(i, dummy.matrix);
            } else {
                // Hide
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                ringsRef.current.setMatrixAt(i, dummy.matrix);
            }
        });
        ringsRef.current.instanceMatrix.needsUpdate = true;
    }

     // 3. Update Wisp Cores (Only 'wisp' types)
     if (wispRef.current) {
        wispModifiers.forEach((mod, i) => {
            const original = modifiers.find(m => m.id === mod.id);
            const scale = original?.active ? 1 : 0;

            if (scale > 0) {
                 dummy.position.set(mod.position[0], mod.position[1], mod.position[2]);
                 dummy.position.y += Math.sin(time * 2 + mod.gridX) * 0.1;
                 dummy.rotation.set(0, 0, 0);
                 dummy.scale.setScalar(scale);
                 dummy.updateMatrix();
                 wispRef.current.setMatrixAt(i, dummy.matrix);
            } else {
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                wispRef.current.setMatrixAt(i, dummy.matrix);
            }
        });
        wispRef.current.instanceMatrix.needsUpdate = true;
     }

  });

  return (
    <group>
      {/* 1. Main Orbs (Octahedron) - Rendering ALL modifiers */}
      <instancedMesh ref={orbsRef} args={[null, null, modifiers.length]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
            roughness={0.2} 
            metalness={0.8} 
            emissiveIntensity={2}
        />
      </instancedMesh>

      {/* 2. Jump Rings (Torus) - Rendering only Jump modifiers */}
      <instancedMesh ref={ringsRef} args={[null, null, jumpModifiers.length]}>
        <torusGeometry args={[0.7, 0.08, 16, 32]} />
        <meshStandardMaterial 
            color="#ffaa00" 
            emissive="#ffaa00" 
            emissiveIntensity={1}
        />
      </instancedMesh>

      {/* 3. Wisp Specifics (Small Sphere) - Rendering only Wisp modifiers */}
      <instancedMesh ref={wispRef} args={[null, null, wispModifiers.length]}>
         <sphereGeometry args={[0.2, 16, 16]} />
         <meshBasicMaterial color="gold" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

export default Modifiers;
