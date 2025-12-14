import './JoystickOverlay.css';

/**
 * Visual joystick overlay for mobile controls
 */
export function JoystickOverlay({ joystickState }) {
  if (!joystickState.active) {
    return null;
  }

  const { origin, current } = joystickState;

  return (
    <div className="joystick-container">
      {/* Outer ring (origin) */}
      <div
        className="joystick-outer"
        style={{
          left: origin.x,
          top: origin.y,
        }}
      />
      
      {/* Inner knob (current touch position) */}
      <div
        className="joystick-inner"
        style={{
          left: current.x,
          top: current.y,
        }}
      />
    </div>
  );
}

export default JoystickOverlay;
