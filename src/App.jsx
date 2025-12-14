import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Game } from './components/Game';
import { JoystickOverlay } from './components/JoystickOverlay';
import { useControls } from './hooks/useControls';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'won'
  const { movement, isMobile, joystickState } = useControls();

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
          <Game movement={movement} onWin={handleWin} />
        )}
      </Canvas>

      {/* Mobile joystick overlay */}
      {isMobile && <JoystickOverlay joystickState={joystickState} />}

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
