import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Game } from './components/Game';
import { JoystickOverlay } from './components/JoystickOverlay';
import { useControls } from './hooks/useControls';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'won'
  const { movement, jump, isMobile, joystickState } = useControls();
  const [canJump, setCanJump] = useState(false);
  const gameRef = useRef();

  const handleWin = useCallback(() => {
    setGameState('won');
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('playing');
    // Force remount of Game component
    window.location.reload();
  }, []);

  return (
    <div className="app">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [10, 15, 10], fov: 50 }}
        gl={{ antialias: true }}
      >
        {gameState === 'playing' && (
          <Game ref={gameRef} movement={movement} jump={jump} onWin={handleWin} onJumpStateChange={setCanJump} />
        )}
      </Canvas>

      {/* DEBUG OVERLAY */}
      {/* {gameState === 'playing' && (
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 1000 }}>
            <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px', textShadow: '1px 1px 2px black' }}>DEBUG TOOLS</div>
            <button onClick={() => gameRef.current?.spawnDebugModifier('speed')} style={{ padding: '8px', background: '#00ffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Spawn Speed</button>
            <button onClick={() => gameRef.current?.spawnDebugModifier('jump')} style={{ padding: '8px', background: '#00ff00', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Spawn Jump</button>
            <button onClick={() => gameRef.current?.spawnDebugModifier('wisp')} style={{ padding: '8px', background: 'gold', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Spawn Wisp</button>
            <button onClick={() => gameRef.current?.clearDebugModifiers()} style={{ padding: '8px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Effects</button>
        </div>
      )} */}

      {/* Mobile joystick overlay */}
      {isMobile && <JoystickOverlay joystickState={joystickState} canJump={canJump} />}

      {/* Win screen */}
      {gameState === 'won' && (
        <div className="win-overlay">
          <div className="win-content">
            <h1>🎉 YOU WIN! 🎉</h1>
            <p>You found the exit!</p>
            <button onClick={handleRestart} className="restart-btn">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
