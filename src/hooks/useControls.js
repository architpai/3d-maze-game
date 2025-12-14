import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Unified controls hook for both mobile (touch joystick) and PC (WASD)
 * Returns normalized movement vector and touch state for joystick rendering
 */
export function useControls() {
    const [movement, setMovement] = useState({ x: 0, z: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [joystickState, setJoystickState] = useState({
        active: false,
        origin: { x: 0, y: 0 },
        current: { x: 0, y: 0 },
    });

    const keysPressed = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
    });

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(isTouchDevice && isSmallScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Normalize vector to have max magnitude of 1
    const normalizeVector = useCallback((x, z) => {
        const magnitude = Math.sqrt(x * x + z * z);
        if (magnitude > 1) {
            return { x: x / magnitude, z: z / magnitude };
        }
        return { x, z };
    }, []);

    // Keyboard controls
    useEffect(() => {
        if (isMobile) return;

        const updateMovement = () => {
            const keys = keysPressed.current;
            let x = 0;
            let z = 0;

            if (keys.w || keys.ArrowUp) z -= 1;
            if (keys.s || keys.ArrowDown) z += 1;
            if (keys.a || keys.ArrowLeft) x -= 1;
            if (keys.d || keys.ArrowRight) x += 1;

            setMovement(normalizeVector(x, z));
        };

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key in keysPressed.current || e.key in keysPressed.current) {
                e.preventDefault();
                keysPressed.current[key] = true;
                keysPressed.current[e.key] = true;
                updateMovement();
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (key in keysPressed.current || e.key in keysPressed.current) {
                keysPressed.current[key] = false;
                keysPressed.current[e.key] = false;
                updateMovement();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isMobile, normalizeVector]);

    // Touch controls
    useEffect(() => {
        if (!isMobile) return;

        const joystickRadius = 60; // Max distance from origin

        const handleTouchStart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            setJoystickState({
                active: true,
                origin: { x: touch.clientX, y: touch.clientY },
                current: { x: touch.clientX, y: touch.clientY },
            });
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            if (!joystickState.active && e.touches.length === 0) return;

            const touch = e.touches[0];
            const origin = joystickState.active
                ? joystickState.origin
                : { x: touch.clientX, y: touch.clientY };

            const deltaX = touch.clientX - origin.x;
            const deltaY = touch.clientY - origin.y;

            // Calculate distance and clamp to joystick radius
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const clampedDistance = Math.min(distance, joystickRadius);
            const angle = Math.atan2(deltaY, deltaX);

            const clampedX = origin.x + Math.cos(angle) * clampedDistance;
            const clampedY = origin.y + Math.sin(angle) * clampedDistance;

            setJoystickState((prev) => ({
                ...prev,
                active: true,
                current: { x: clampedX, y: clampedY },
            }));

            // Convert to normalized movement (-1 to 1)
            const normalizedX = (clampedDistance / joystickRadius) * Math.cos(angle);
            const normalizedZ = (clampedDistance / joystickRadius) * Math.sin(angle);

            setMovement({ x: normalizedX, z: normalizedZ });
        };

        const handleTouchEnd = () => {
            setJoystickState({
                active: false,
                origin: { x: 0, y: 0 },
                current: { x: 0, y: 0 },
            });
            setMovement({ x: 0, z: 0 });
        };

        // Attach to document for full-screen joystick
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isMobile, joystickState.active, joystickState.origin]);

    return {
        movement,
        isMobile,
        joystickState,
    };
}

export default useControls;
