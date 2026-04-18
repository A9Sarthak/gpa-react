import React, { useRef, useCallback } from 'react';
import './Spotlight.css';

/**
 * SpotlightCard – wraps any content with the cursor glow effect.
 * Add className / style props as usual; the spotlight is injected via ::before.
 */
export function SpotlightCard({ children, className = '', style = {}, ...rest }) {
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--y', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spot-op', '1');
  }, []);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty('--spot-op', '0');
  }, []);

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * MagneticButton – a <button> that gently shifts toward the cursor while hovered
 * and paints the same radial spotlight inside itself.
 */
export function MagneticButton({
  children,
  className = '',
  strength = 0.3,    // how far the button travels (0 = none, 1 = full distance)
  maxShift = 10,     // maximum px displacement
  style = {},
  ...rest
}) {
  const ref     = useRef(null);
  const frameId = useRef(null);
  const target  = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    current.current.x = lerp(current.current.x, target.current.x, 0.12);
    current.current.y = lerp(current.current.y, target.current.y, 0.12);

    el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;

    // Keep looping while still displaced
    if (
      Math.abs(current.current.x - target.current.x) > 0.05 ||
      Math.abs(current.current.y - target.current.y) > 0.05
    ) {
      frameId.current = requestAnimationFrame(tick);
    }
  }, []);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Spotlight vars
    el.style.setProperty('--x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--y', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spot-op', '1');

    // Magnetic shift
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    target.current.x = Math.max(-maxShift, Math.min(maxShift, dx));
    target.current.y = Math.max(-maxShift, Math.min(maxShift, dy));

    cancelAnimationFrame(frameId.current);
    frameId.current = requestAnimationFrame(tick);
  }, [strength, maxShift, tick]);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty('--spot-op', '0');
    target.current = { x: 0, y: 0 };
    cancelAnimationFrame(frameId.current);
    frameId.current = requestAnimationFrame(tick);
  }, [tick]);

  return (
    <button
      ref={ref}
      className={`magnetic-btn ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      {children}
    </button>
  );
}
