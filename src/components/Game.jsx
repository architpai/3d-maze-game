import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Maze } from './Maze';
import { Player } from './Player';
import { Exit } from './Exit';
import { generateMaze, gridToWorld, checkCollision, solveMaze } from '../utils/mazeGenerator';

/**
 * Main game component containing the 3D scene
 */
export const Game = forwardRef(({ movement, jump, onWin, onJumpStateChange }, ref) => {
  const [mazeData, setMazeData] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0.6, z: 0 }); // Increased initial Y for bigger player
  const [exitPos, setExitPos] = useState({ x: 0, y: 0.5, z: 0 });
  const [activeEffects, setActiveEffects] = useState({});
  const [wispPath, setWispPath] = useState(null);
  const [jumpsRemaining, setJumpsRemaining] = useState(0);

  // Physics refs
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  const lastJumpTime = useRef(0);
  
  const playerSpeedBase = 0.12; // Increased base speed
  const jumpForce = 0.4;
  const gravity = 0.015;
  const wallHeight = 2.5;

  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());

  // Generate maze on mount
  useEffect(() => {
    const maze = generateMaze(35, 35, Date.now()); // Bigger maze
    setMazeData(maze);

    // Set player start position
    const startWorld = gridToWorld(maze.start.x, maze.start.y, maze);
    setPlayerPos({ x: startWorld.x, y: 0.6, z: startWorld.z });

    // Set exit position
    const exitWorld = gridToWorld(maze.exit.x, maze.exit.y, maze);
    setExitPos({ x: exitWorld.x, y: 0.5, z: exitWorld.z });
  }, []);

  // Activate modifier
  const activateModifier = useCallback((mod) => {
    const duration = 5000; // All effects last 5s now (or 10s for speed? keep speed 10s?)
    // User said "3 jumps or 5 sec". Speed? Implicitly speed might stay 10s.
    // Let's set Jump to 5s. Speed 10s.
    const actualDuration = mod.type === 'jump' ? 5000 : 10000;
    
    setActiveEffects(prev => ({
      ...prev,
      [mod.type]: Date.now() + duration
    }));

    // Effect specific logic
    if (mod.type === 'jump') {
      setJumpsRemaining(3);
    }
    if (mod.type === 'wisp') {
      // Calculate path
      if (mazeData) {
        const path = solveMaze(playerPos, exitPos, mazeData);
        // Add current pos and exit pos to path for smoothness
        const fullPath = [
            new THREE.Vector3(playerPos.x, 1, playerPos.z),
            ...path.map(p => new THREE.Vector3(p.x, 1, p.z)),
            new THREE.Vector3(exitPos.x, 1, exitPos.z)
        ];
        setWispPath(fullPath);
      }
    }

    // Set timeout to clear effect
    setTimeout(() => {
      setActiveEffects(prev => {
        const next = { ...prev };
        delete next[mod.type];
        return next;
      });
      if (mod.type === 'wisp') {
        setWispPath(null);
      }
      if (mod.type === 'jump') {
          setJumpsRemaining(0);
      }
    }, duration);

    // Remove modifier from map
    setMazeData(prev => ({
      ...prev,
      modifiers: prev.modifiers.map(m => 
        m.id === mod.id ? { ...m, active: false } : m
      )
    }));
  }, [mazeData, playerPos, exitPos]);

  // DEBUG: Spawn specific modifier
  const spawnDebugModifier = (type) => {
    if (!mazeData) return;
    const offsetX = (Math.random() - 0.5) * 4;
    const offsetZ = (Math.random() - 0.5) * 4;
    const newMod = {
      id: `debug_${Date.now()}_${Math.random()}`,
      type,
      // Place near player but slightly offset
      position: [playerPos.x + 2, 0.5, playerPos.z + (Math.random() - 0.5) * 2],
      gridX: 0,
      gridY: 0,
      active: true
    };
    
    setMazeData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, newMod]
    }));
  };

  const clearDebugModifiers = () => {
    setActiveEffects({});
    setJumpsRemaining(0);
  };

  useImperativeHandle(ref, () => ({
    spawnDebugModifier,
    clearDebugModifiers
  }));

  // Notify parent about jump state changes for UI
  useEffect(() => {
     const canJump = (activeEffects.jump && jumpsRemaining > 0);
     onJumpStateChange?.(canJump);
  }, [activeEffects.jump, jumpsRemaining, onJumpStateChange]);

  // Game Loop
  useFrame(() => {
    if (!mazeData) return;

    // 1. Handle Physics (Gravity & Jumping)
    let newY = playerPos.y + velocityY.current;
    
    // Check if we are currently over a wall (to land on it)
    // We use a wider radius matching player size to prevent clipping into edges
    // CRITICAL FIX: Only snap to wall top if we are ALREADY high enough (jumping/falling onto it)
    // Otherwise, walking into a wall on the ground acts like a "vertical wall"
    const isOverWall = checkCollision(playerPos.x, playerPos.z, mazeData, 0.6);
    const isHighEnough = playerPos.y > wallHeight * 0.8; // Must be > ~2.0 to land on 2.5 wall
    const groundLevel = (isOverWall && isHighEnough) ? wallHeight : 0.6;
    
    // Floor collision
    // Collide with ground OR wall top if over wall
    // Floor collision
    // Collide with ground OR wall top if over wall
    if (newY <= groundLevel + 0.01) {
      newY = groundLevel;
      velocityY.current = 0;
      isGrounded.current = true;
    } else {
      velocityY.current -= gravity;
      // Only set ungrounded if significantly above current ground level
      if (newY > groundLevel + 0.05) { 
        isGrounded.current = false;
      }
    }

    // Jump Input
    // Cooldown to prevent double triggers per frame if holding
    const now = Date.now();
    if (jump && now - lastJumpTime.current > 200) {
      // STRICT MODIFIER REQUIREMENT: Can only jump with active modifier
      if (activeEffects.jump && jumpsRemaining > 0) {
        if (isGrounded.current || jumpsRemaining > 0) {
           velocityY.current = jumpForce;
           
           // Decrement jumps
           setJumpsRemaining(prev => Math.max(0, prev - 1));
           
           isGrounded.current = false;
           lastJumpTime.current = now;
        }
      }
    }

    // 2. Movement
    const speedMultiplier = activeEffects.speed ? 2.5 : 1; // 2.5x speed
    const moveX = movement.x * playerSpeedBase * speedMultiplier;
    const moveZ = movement.z * playerSpeedBase * speedMultiplier;
    
    // ... (rest of movement logic same as before) 
    
    const nextX = playerPos.x + moveX;
    const nextZ = playerPos.z + moveZ;
    
    // 3. Collision Detection
    // If we are high enough (above walls), ignore collision
    // Allow free movement if we are ON TOP of walls (approx 2.4+)
    const isAboveWalls = newY > wallHeight - 0.2; 
    
    let finalX = playerPos.x;
    let finalZ = playerPos.z;

    if (isAboveWalls) {
        finalX = nextX;
        finalZ = nextZ;
    } else {
        // Check for collisions with maze walls
        const collisionX = checkCollision(nextX, playerPos.z, mazeData, 0.4);
        const collisionZ = checkCollision(playerPos.x, nextZ, mazeData, 0.4);

        if (!collisionX) {
            finalX = nextX;
        }
        if (!collisionZ) {
            finalZ = nextZ;
        }
    }

    // 4. Update Position
    // Apply Slide if active (re-calculate efficiently)
    let slideX = 0;
    let slideZ = 0;
    
    // Check if we are on the wall (using same radius 0.6) and need to slide
    if (newY > 1.0 && checkCollision(finalX, finalZ, mazeData, 0.6)) { 
       const step = 0.5;
       const slideSpeed = 0.1; // Faster slide
       
       if (!checkCollision(finalX + step, finalZ, mazeData, 0.6)) slideX += slideSpeed;
       if (!checkCollision(finalX - step, finalZ, mazeData, 0.6)) slideX -= slideSpeed;
       if (!checkCollision(finalX, finalZ + step, mazeData, 0.6)) slideZ += slideSpeed;
       if (!checkCollision(finalX, finalZ - step, mazeData, 0.6)) slideZ -= slideSpeed;
    }

    if (finalX + slideX !== playerPos.x || finalZ + slideZ !== playerPos.z || newY !== playerPos.y) {
      setPlayerPos({ x: finalX + slideX, y: newY, z: finalZ + slideZ });
    }

    // 5. Modifier Collection
    mazeData.modifiers.forEach(mod => {
      if (mod.active) {
        const dx = finalX - mod.position[0];
        const dz = finalZ - mod.position[2];
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 1.0) { // Collection radius
          activateModifier(mod);
        }
      }
    });

    // 6. Win Condition
    const distToExit = Math.sqrt(
      Math.pow(finalX - exitPos.x, 2) + 
      Math.pow(finalZ - exitPos.z, 2)
    );
    
    if (distToExit < 1.5) { // Increased win radius
      onWin?.();
    }

    if (finalX + slideX !== playerPos.x || finalZ + slideZ !== playerPos.z || newY !== playerPos.y) {
      setPlayerPos({ x: finalX + slideX, y: newY, z: finalZ + slideZ });
    }

    // 7. Camera Follow
    cameraTarget.current.set(finalX, 0, finalZ);
    camera.position.lerp(
      new THREE.Vector3(
        finalX + 15, // Higher and further back for wider view
        25,
        finalZ + 20
      ),
      0.05
    );
    camera.lookAt(cameraTarget.current);
  });

  // Calculate Player Color based on active effect
  let playerColor = "#0066ff";
  let playerEmissive = "#0088ff";

  // Check priority: Jump > Speed > Wisp
  const now = Date.now();
  let activeType = null;
  let remainingTime = 0;
  let duration = 0;

  if (activeEffects.jump && activeEffects.jump > now) {
     activeType = 'jump';
     remainingTime = activeEffects.jump - now;
     duration = 5000;
  } else if (activeEffects.speed && activeEffects.speed > now) {
     activeType = 'speed';
     remainingTime = activeEffects.speed - now;
     duration = 10000;
  } else if (activeEffects.wisp && activeEffects.wisp > now) {
     activeType = 'wisp';
     remainingTime = activeEffects.wisp - now;
     duration = 5000;
  }

  if (activeType) {
      // Lerp back to base blue as time runs out (last 2 seconds)
      const fadeStart = 2000;
      let alpha = 1;
      if (remainingTime < fadeStart) {
          alpha = remainingTime / fadeStart;
      }
      
      const targetColor = activeType === 'jump' ? new THREE.Color('#00ff00') : 
                          activeType === 'speed' ? new THREE.Color('#00ffff') : 
                          new THREE.Color('#ffd700');
      
      const baseColor = new THREE.Color('#0066ff');
      
      const blended = baseColor.clone().lerp(targetColor, alpha);
      playerColor = '#' + blended.getHexString();
      playerEmissive = playerColor;
  }

  if (!mazeData) return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[20, 50, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Fog - Dynamic based on wisp/vision - Actually just make it further for the big maze */}
      <fog attach="fog" args={['#0a0a15', 20, 60]} /> 
      {/* Background */}
      <color attach="background" args={['#0a0a15']} />

      {/* Game elements */}
      <Maze mazeData={mazeData} />
      <Player position={[playerPos.x, playerPos.y, playerPos.z]} color={playerColor} emissive={playerEmissive} />
      <Exit position={[exitPos.x, exitPos.y, exitPos.z]} />

      {/* Wisp Path */}
      {wispPath && activeEffects.wisp && (
         <Line
            points={wispPath}
            color="gold"
            lineWidth={4}
            dashed={false}
            alphaWrite
         />
      )}

      {/* HUD (REMOVED ACTIVE EFFECTS LIST) */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
      </Html>
    </>
  );
});

export default Game;
