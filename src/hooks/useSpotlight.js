import { useEffect } from 'react';

/**
 * Attaches a pointer-tracking spotlight effect to a container element.
 * Writes --x and --y CSS custom properties (in px) relative to the element's
 * top-left corner so CSS can paint a radial-gradient that follows the cursor.
 *
 * @param {React.RefObject} ref – ref attached to the container element
 */
export function useSpotlight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--x', `${x}px`);
      el.style.setProperty('--y', `${y}px`);
      el.style.setProperty('--spotlight-opacity', '1');
    };

    const onLeave = () => {
      el.style.setProperty('--spotlight-opacity', '0');
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
}
