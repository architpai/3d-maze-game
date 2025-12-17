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

    const [jump, setJump] = useState(false);

    const keysPressed = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        ' ': false,
    });

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            // Relaxed check: Simply checking for touch capability is safer for testing
            setIsMobile(isTouchDevice);
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
        // Allow keyboard controls even on mobile (for bluetooth keyboards + synthetic jump events)
        // if (isMobile) return; 

        const updateMovement = () => {
            const keys = keysPressed.current;
            let x = 0;
            let z = 0;

            if (keys.w || keys.ArrowUp) z -= 1;
            if (keys.s || keys.ArrowDown) z += 1;
            if (keys.a || keys.ArrowLeft) x -= 1;
            if (keys.d || keys.ArrowRight) x += 1;

            setJump(keys[' ']);

            setMovement(normalizeVector(x, z));
        };

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            const keyCheck = key === ' ' ? ' ' : key; // Handle space explicitly

            if (keyCheck in keysPressed.current || e.key in keysPressed.current) {
                // e.preventDefault(); // Don't prevent default for everything, might block browser shortcuts
                if (key === ' ') e.preventDefault(); // Only prevent scroll on space

                keysPressed.current[keyCheck] = true;
                updateMovement();
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            const keyCheck = key === ' ' ? ' ' : key;

            if (keyCheck in keysPressed.current || e.key in keysPressed.current) {
                keysPressed.current[keyCheck] = false;
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

    // Touch controls (Add jump button logic later if needed, for now auto-hop or button?)
    // User didn't ask for mobile jump button specifically, but implied "user"
    // I'll leave mobile jump out for now or assume auto-jump? No, 'jump modifier' implies active use.
    // I'll focus on PC Spacebar first as the user mentioned "WASD".

    useEffect(() => {
        if (!isMobile) return;

        const handleTouchStart = (e) => {
            // Check if touch target is a button (like the jump button)
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }

            // Only handle the first touch if multiple
            const touch = e.changedTouches[0];
            setJoystickState({
                active: true,
                origin: { x: touch.clientX, y: touch.clientY },
                current: { x: touch.clientX, y: touch.clientY },
            });
        };

        const handleTouchMove = (e) => {
            setJoystickState(prev => {
                if (!prev.active) return prev;

                const touch = e.changedTouches[0];
                const dx = touch.clientX - prev.origin.x;
                const dy = touch.clientY - prev.origin.y;

                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 10; // Extreme sensitivity (10px to max speed)

                let moveX = dx;
                let moveY = dy;

                // Clamp to max radius
                if (distance > maxDistance) {
                    const ratio = maxDistance / distance;
                    moveX = dx * ratio;
                    moveY = dy * ratio;
                }

                // Update movement output (-1 to 1)
                setMovement({
                    x: moveX / maxDistance,
                    z: moveY / maxDistance
                });

                return {
                    ...prev,
                    current: {
                        x: prev.origin.x + moveX,
                        y: prev.origin.y + moveY
                    }
                };
            });
        };

        const handleTouchEnd = () => {
            setJoystickState(prev => ({ ...prev, active: false }));
            setMovement({ x: 0, z: 0 });
        };

        // Attach listeners to window with passive: false to prevent scrolling
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile]);

    return {
        movement,
        jump,
        isMobile,
        joystickState,
    };
}

export default useControls;
