import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Game } from './components/Game';
import { JoystickOverlay } from './components/JoystickOverlay';
import { MainMenu } from './components/MainMenu';
import { Tutorial } from './components/Tutorial';
import { useControls } from './hooks/useControls';
import './App.css';

const TUTORIAL_STORAGE_KEY = 'mazeExplorer_tutorialCompleted';

function App() {
  // Determine initial state based on localStorage
  const getInitialState = () => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return tutorialCompleted === 'true' ? 'menu' : 'tutorial';
  };

  const [gameState, setGameState] = useState(getInitialState); // 'menu' | 'tutorial' | 'playing' | 'won'
  const { movement, jump, isMobile, joystickState } = useControls();
  const [canJump, setCanJump] = useState(false);
  const gameRef = useRef();

  const handleWin = useCallback(() => {
    setGameState('won');
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('menu');
  }, []);

  const handlePlayGame = useCallback(() => {
    setGameState('playing');
  }, []);

  const handlePlayTutorial = useCallback(() => {
    setGameState('tutorial');
  }, []);

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setGameState('playing');
  }, []);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setGameState('menu');
  }, []);

  return (
    <div className="app">
      {/* Main Menu */}
      {gameState === 'menu' && (
        <MainMenu onPlayGame={handlePlayGame} onPlayTutorial={handlePlayTutorial} />
      )}

      {/* Tutorial */}
      {gameState === 'tutorial' && (
        <Tutorial onComplete={handleTutorialComplete} onSkip={handleTutorialSkip} />
      )}

      {/* 3D Canvas - Always render but only show Game when playing */}
      {(gameState === 'playing' || gameState === 'won') && (
        <Canvas
          shadows
          camera={{ position: [10, 15, 10], fov: 50 }}
          gl={{ antialias: true }}
        >
          {gameState === 'playing' && (
            <Game ref={gameRef} movement={movement} jump={jump} onWin={handleWin} onJumpStateChange={setCanJump} />
          )}
        </Canvas>
      )}

      {/* Mobile joystick overlay */}
      {isMobile && gameState === 'playing' && (
        <JoystickOverlay joystickState={joystickState} canJump={canJump} />
      )}

      {/* Win screen */}
      {gameState === 'won' && (
        <div className="win-overlay">
          <div className="win-content">
            <h1>🎉 YOU WIN! 🎉</h1>
            <p>You found the exit!</p>
            <button onClick={handleRestart} className="restart-btn">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
