import './JoystickOverlay.css';

/**
 * Visual joystick overlay for mobile controls
 */
export function JoystickOverlay({ joystickState, canJump }) {
  const { origin, current, active } = joystickState;

  return (
    <>
      {/* Visual Joystick (Only when active) */}
      {active && (
        <div className="joystick-container">
          <div
            className="joystick-outer"
            style={{
              left: origin.x,
              top: origin.y,
            }}
          />
          <div
            className="joystick-inner"
            style={{
              left: current.x,
              top: current.y,
            }}
          />
        </div>
      )}

      {/* Jump Button (Always visible on mobile IF CAN JUMP) */}
      {canJump && (
      <button
        style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 255, 0, 0.4)', // Slightly greener to indicate active
            border: '2px solid rgba(255, 255, 255, 0.8)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            touchAction: 'none',
            outline: 'none',
            userSelect: 'none',
            pointerEvents: 'auto',
            backdropFilter: 'blur(5px)'
        }}
        onTouchStart={(e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        }}
        onTouchEnd={(e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
        }}
      >
        JUMP
      </button>
      )}
    </>
  );
}

export default JoystickOverlay;
