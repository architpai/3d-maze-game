import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Maze } from './Maze';
import { Player } from './Player';
import { Exit } from './Exit';
import { generateMaze, gridToWorld, checkCollision } from '../utils/mazeGenerator';

/**
 * Main game component containing the 3D scene
 */
export function Game({ movement, onWin }) {
  const [mazeData, setMazeData] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0.25, z: 0 });
  const [exitPos, setExitPos] = useState({ x: 0, y: 0.5, z: 0 });
  
  const playerSpeed = 0.08;
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());

  // Generate maze on mount
  useEffect(() => {
    const maze = generateMaze(25, 25, Date.now());
    setMazeData(maze);

    // Set player start position
    const startWorld = gridToWorld(maze.start.x, maze.start.y, maze);
    setPlayerPos({ x: startWorld.x, y: 0.25, z: startWorld.z });

    // Set exit position
    const exitWorld = gridToWorld(maze.exit.x, maze.exit.y, maze);
    setExitPos({ x: exitWorld.x, y: 0.5, z: exitWorld.z });
  }, []);

  // Update player position based on movement
  useFrame(() => {
    if (!mazeData) return;

    // Calculate new position
    const newX = playerPos.x + movement.x * playerSpeed;
    const newZ = playerPos.z + movement.z * playerSpeed;

    // Check collision and update position
    let finalX = playerPos.x;
    let finalZ = playerPos.z;

    // Try X movement
    if (!checkCollision(newX, playerPos.z, mazeData)) {
      finalX = newX;
    }

    // Try Z movement
    if (!checkCollision(finalX, newZ, mazeData)) {
      finalZ = newZ;
    }

    // Update position if moved
    if (finalX !== playerPos.x || finalZ !== playerPos.z) {
      setPlayerPos({ x: finalX, y: 0.25, z: finalZ });
    }

    // Check win condition
    const distToExit = Math.sqrt(
      Math.pow(playerPos.x - exitPos.x, 2) + 
      Math.pow(playerPos.z - exitPos.z, 2)
    );
    
    if (distToExit < 0.5) {
      onWin?.();
    }

    // Update camera to follow player (isometric view)
    cameraTarget.current.set(playerPos.x, 0, playerPos.z);
    camera.position.lerp(
      new THREE.Vector3(
        playerPos.x + 10,
        15,
        playerPos.z + 10
      ),
      0.05
    );
    camera.lookAt(cameraTarget.current);
  });

  if (!mazeData) {
    return null;
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Fog for atmosphere - starts at 20 units (10 cells) for clear visibility around player */}
      <fog attach="fog" args={['#0a0a15', 20, 40]} />

      {/* Background color */}
      <color attach="background" args={['#0a0a15']} />

      {/* Game elements */}
      <Maze mazeData={mazeData} />
      <Player position={[playerPos.x, playerPos.y, playerPos.z]} />
      <Exit position={[exitPos.x, exitPos.y, exitPos.z]} />
    </>
  );
}

export default Game;
