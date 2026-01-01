import './MainMenu.css';

/**
 * Main menu component with Play Game and Tutorial buttons
 */
export function MainMenu({ onPlayGame, onPlayTutorial }) {
  return (
    <div className="main-menu">
      <div className="menu-content">
        {/* Animated background orbs */}
        <div className="menu-orb menu-orb-1" />
        <div className="menu-orb menu-orb-2" />
        <div className="menu-orb menu-orb-3" />

        {/* Title */}
        <h1 className="menu-title">LUCI'S EXPLORATION</h1>
        <p className="menu-subtitle">Navigate through the darkness. Find the exit.</p>

        {/* Buttons */}
        <div className="menu-buttons">
          <button className="menu-btn menu-btn-primary" onClick={onPlayGame}>
            <span className="btn-icon">🎮</span>
            Play Game
          </button>
          <button className="menu-btn menu-btn-secondary" onClick={onPlayTutorial}>
            <span className="btn-icon">📖</span>
            How to Play
          </button>
        </div>

        {/* Footer hint */}
        <p className="menu-hint">Use WASD or Arrow keys to move • Collect power-ups • Find the golden exit</p>
      </div>
    </div>
  );
}

export default MainMenu;
