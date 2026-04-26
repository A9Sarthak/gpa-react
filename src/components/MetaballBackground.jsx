import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useTheme } from '../context/ThemeContext';

export default function MetaballBackground() {
  const mountRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    let animationFrameId;
    let width  = window.innerWidth;
    let height = window.innerHeight;

    // Disable heavy WebGL completely on mobile to save battery.
    // Falls back to smooth CSS background defined in index.css
    if (width <= 768) return;

    const container = mountRef.current;
    const scene     = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      0.1, 10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // ─── Particles ────────────────────────────────────────────────────────────
    const numParticles = 25;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        position: new THREE.Vector2(
          (Math.random() - 0.5) * width,
          (Math.random() - 0.5) * height
        ),
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * 3.0,
          (Math.random() - 0.5) * 3.0
        ),
        // Unique phase seed used for curl noise so each drooplet swirls differently
        phase: Math.random() * Math.PI * 2
      });
    }

    const u_particles = Array(numParticles).fill(null).map(() => new THREE.Vector2());

    // ─── Uniforms ─────────────────────────────────────────────────────────────
    const uniforms = {
      u_resolution : { value: new THREE.Vector2(width, height) },
      u_particles  : { value: u_particles },
      u_time       : { value: 0.0 },
      u_mergeGlow  : { value: 0.0 },   // ← drives the subtle merge brightness burst
      u_uiDimmer   : { value: 1.0 },   // ← adaptive safe-zone opacity
      u_themeMode  : { value: theme === 'light' ? 1.0 : 0.0 }
    };

    // ─── Shaders ──────────────────────────────────────────────────────────────
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec2  u_resolution;
      uniform vec2  u_particles[${numParticles}];
      uniform float u_time;
      uniform float u_mergeGlow;
      uniform float u_uiDimmer;
      uniform float u_themeMode;
      varying vec2  vUv;

      void main() {
        float field  = 0.0;
        float aspect = u_resolution.x / u_resolution.y;

        vec2 uv = vUv;
        uv.x = (uv.x - 0.5) * aspect + 0.5;

        // ── Multi-octave domain warp → makes blobs look like flowing liquid ──
        float t = u_time * 0.22;
        vec2 w  = uv;
        // Octave 1 – large, slow undulation
        w.x += sin(uv.y * 3.5 + t)        * 0.10 + cos(uv.y * 1.8 - t * 1.1) * 0.06;
        w.y += cos(uv.x * 3.5 + t * 0.9)  * 0.10 + sin(uv.x * 1.8 + t * 0.7) * 0.06;
        // Octave 2 – finer ripple layered on top
        w.x += sin(uv.y * 7.0 + t * 1.7)  * 0.025;
        w.y += cos(uv.x * 7.0 - t * 1.3)  * 0.025;

        for (int i = 0; i < ${numParticles}; i++) {
          vec2 p = u_particles[i];
          p.x = (p.x - 0.5) * aspect + 0.5;
          float d = distance(w, p);
          field += 0.002 / (d * d + 0.0001);
        }

        // ── Soft boundary – Size Limiting threshold tuning ──
        // Decreased minimum to 0.4 so heavily scattered single particles 
        // remain visibly drawn and don't optically vanish!
        float intensity = smoothstep(0.4, 5.0, field);

        // ── Theme Palettes ──
        // Dark Mode: Deep Void, Magenta, Soft Pink
        vec3 darkDeep = vec3(0.10, 0.05, 0.15);   
        vec3 darkMid  = vec3(0.50, 0.15, 0.40);   
        vec3 darkCore = vec3(0.80, 0.40, 0.60);   

        // Light Mode: Richer pastels for clear visibility on white background
        vec3 lightDeep = vec3(0.75, 0.82, 0.95);  // Clear sky blue base
        vec3 lightMid  = vec3(0.55, 0.65, 0.90);  // Rich, vibrant blue mid-tone
        vec3 lightCore = vec3(0.85, 0.55, 0.82);  // Pronounced magenta/pink core

        vec3 cDeep = mix(darkDeep, lightDeep, u_themeMode);
        vec3 cMid  = mix(darkMid,  lightMid,  u_themeMode);
        vec3 cCore = mix(darkCore, lightCore, u_themeMode);

        float mapMid  = smoothstep(1.1, 2.5, field);
        float mapCore = smoothstep(2.5, 8.0, field);

        vec3 col = mix(cDeep, cMid,  mapMid);
        col      = mix(col,   cCore, mapCore);

        // ── Merge glow burst ────────
        col *= 1.0 + u_mergeGlow * 0.25;

        // ── Adaptive Opacity (Safe Zones) ────────
        // Fade out AND mathematically shrink by multiplying the raw intensity field
        col *= u_uiDimmer;
        float alpha = (intensity * u_uiDimmer) * 0.85;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent : true,
      blending    : THREE.NormalBlending,
      depthWrite  : false
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const plane    = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // ─── Post-processing ──────────────────────────────────────────────────────
    const composer   = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Near zero bloom to guarantee no blindness or white cores
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.05, 0.8);
    bloomPass.threshold = 0.50;
    composer.addPass(bloomPass);

    // ─── Intersection Observer for Smart Pausing ──────────────────────────────
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0 });
    
    if (container) {
      observer.observe(container);
    }

    // ─── Interaction state ────────────────────────────────────────────────────
    const mouse       = new THREE.Vector2(-9999, -9999);
    const lerpedMouse = new THREE.Vector2(-9999, -9999); // Dragging physics vector
    let   idleTimer   = 0.0;
    let   activeTimer = 10.0; // pre-warm so blobs start looking alive
    let   mergeGlow   = 0.0; // current glow level, smoothly decays
    let   isUiHovered = false; // Tracks if a premium UI element is hovered
    let   uiFadeMultiplier = 1.0;
    let   explosionImpulse = 0.0; // Kinetic burst tracker

    const onMouseMove = (e) => {
      mouse.x   = e.clientX - width  / 2;
      mouse.y   = -(e.clientY - height / 2);
      idleTimer = 0.0;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onUiHover = (e) => {
      const active = e.detail?.active || false;
      if (active && !isUiHovered) {
        explosionImpulse = 1.0; // Trigger bang exactly on touch!
      }
      isUiHovered = active;
    };
    window.addEventListener('ui-hover-focus', onUiHover);

    const onResize = () => {
      width  = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.left   = width  / -2;
      camera.right  = width  / 2;
      camera.top    = height / 2;
      camera.bottom = height / -2;
      camera.updateProjectionMatrix();
      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(width, height);
      material.uniforms.u_resolution.value.set(width, height);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();

    // ─── Animation loop ───────────────────────────────────────────────────────
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt    = clock.getDelta();
      const safeDt = Math.min(dt, 0.05);

      material.uniforms.u_time.value += safeDt;
      idleTimer += safeDt;

      // ── Smooth Cursor Tracking with Drag Offset ──
      if (mouse.x > -9000) {
        if (lerpedMouse.x < -9000) lerpedMouse.copy(mouse); // init
        const targetX = mouse.x; 
        const targetY = mouse.y; 
        
        // Lerp to offset target to create a physical drag lag
        lerpedMouse.x += (targetX - lerpedMouse.x) * 0.035;
        lerpedMouse.y += (targetY - lerpedMouse.y) * 0.035;
      }
      
      // ── UI Safe Zone Dimming ──
      // User explicitly requested to RESTORE blob opacity so it does not disappear.
      const targetFade = 1.0;
      uiFadeMultiplier += (targetFade - uiFadeMultiplier) * 0.12;
      material.uniforms.u_uiDimmer.value = uiFadeMultiplier;

      // Decay explosion impulse every frame to mimic a physical shockwave
      explosionImpulse += (0.0 - explosionImpulse) * 0.1;

      // Active / idle bookkeeping
      if (idleTimer < 0.2) {
        activeTimer += safeDt;
      } else {
        activeTimer = Math.max(0, activeTimer - safeDt * 0.5);
      }

      const halfW = width  / 2;
      const halfH = height / 2;

      // ── Detect merge density for glow burst ──
      let totalDensity = 0;
      for (let i = 0; i < numParticles; i++) {
        for (let j = i + 1; j < numParticles; j++) {
          const d = particles[i].position.distanceTo(particles[j].position);
          if (d < 120) totalDensity += (120 - d) / 120; // 0-1 contribution per close pair
        }
      }
      
      // Normalise and smooth the glow — spike fast, decay slowly. 
      const targetGlow = Math.min(totalDensity / (numParticles * 0.8), 1.0);
      
      if (targetGlow > mergeGlow) {
        mergeGlow += (targetGlow - mergeGlow) * 0.12; // fast attack
      } else {
        mergeGlow += (targetGlow - mergeGlow) * 0.025; // slow release 
      }
      material.uniforms.u_mergeGlow.value = mergeGlow;
      // Also modulate bloom strength cleanly
      bloomPass.strength = 0.3 + (mergeGlow * 0.2) * uiFadeMultiplier;

      // ── Per-particle physics ─────────────────────────────────────────────
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        const t = material.uniforms.u_time.value;

        // Staggered thresholds (same deterministic formula as before)
        const myIdleThreshold = 2.0 + ((Math.sin(i * 123.45) * 0.5 + 0.5) * 8.0);
        const myJoinThreshold = ((Math.cos(i * 321.98) * 0.5 + 0.5) * 2.5);

        // ── Mouse attraction (staggered joining) ──
        if (idleTimer < myIdleThreshold && activeTimer >= myJoinThreshold && mouse.x > -9000) {
          // Each particle orbits a unique offset so the merged shape is never circular
          const baseOrbitR = 60 + (i % 5) * 18;
          const orbitR = isUiHovered ? baseOrbitR * 2.5 : baseOrbitR; // expand orbit to split behind text
          const orbitX = Math.sin(p.phase + t * 1.8) * orbitR;
          const orbitY = Math.cos(p.phase + t * 1.4) * orbitR;

          // Utilize lerped dragged cursor
          const dx   = (lerpedMouse.x + orbitX) - p.position.x;
          const dy   = (lerpedMouse.y + orbitY) - p.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // ── Explosive Scatter Impulse (Billiard Break!) ──
          // Attraction is ALWAYS normal (3.5) so it stays perfectly normal on screen!
          // BUT we inject a massive negative force multiplied by our decaying impulse
          // so it violently explodes the exact millisecond you touch the text!
          const currentPullRadius = 450;
          const currentForceMult  = 3.5;
          
          if (dist < currentPullRadius && dist > 8) {
            let force = ((currentPullRadius - dist) / currentPullRadius) * currentForceMult * safeDt;
            // Inject kinetic shockwave
            force -= explosionImpulse * 35.0 * safeDt;
            
            p.velocity.x += dx * force;
            p.velocity.y += dy * force;
          }
        }

        // ── Particle-to-Particle Repulsion (Splitting & Idle Scatter) ──
        let doRepel = idleTimer >= myIdleThreshold;
        let repelStrength = 0.012;
        let repelDist = 180;
        let breakMult = doRepel ? Math.min((idleTimer - myIdleThreshold) * 0.12, 1.0) : 0.0;

        // When hovered on UI, we FORCE explicit splitting so they never merge into a big blob
        if (isUiHovered) {
          doRepel = true;
          repelStrength = 0.45; // Very strong repulsion to instantly shatter big blobs
          repelDist = 200;      // Ensure they stay apart
          breakMult = 1.0; 
        }

        if (doRepel) {
          for (let j = 0; j < numParticles; j++) {
            if (i === j) continue;
            const other = particles[j];
            const dist  = p.position.distanceTo(other.position);
            if (dist < repelDist && dist > 0) {
              const repel = p.position.clone().sub(other.position).normalize();
              repel.multiplyScalar((repelDist - dist) * repelStrength * breakMult * safeDt);
              p.velocity.add(repel);
            }
          }
        }

        // ── Curl / liquid swirl force ─────────────────────────────────────
        // Generates a smooth rotational field which makes motion feel viscous
        // rather than ballistic. Unique phase per particle = different swirl direction.
        const curlStrength = 0.55;
        p.velocity.x += Math.cos(p.phase + t * 0.6 + p.position.y * 0.003) * curlStrength * safeDt;
        p.velocity.y += Math.sin(p.phase + t * 0.5 + p.position.x * 0.003) * curlStrength * safeDt;

        // ── Viscous damping — mimics liquid drag, not rubber-banding ──────
        // lerp velocity toward rest instead of a flat scale so fast blobs
        // decelerate more smoothly
        const drag = Math.pow(0.955, 60 * safeDt); // frame-rate independent
        p.velocity.multiplyScalar(drag);

        // Speed cap — keeps blobs from going supersonic on mouse flicks
        const speed    = p.velocity.length();
        const maxSpeed = 6.5;
        if (speed > maxSpeed) p.velocity.multiplyScalar(maxSpeed / speed);

        p.position.add(p.velocity);

        // Soft wall bounce (absorb some energy so they don't ping forever)
        if (p.position.x >  halfW) { p.position.x =  halfW; p.velocity.x *= -0.4; }
        if (p.position.x < -halfW) { p.position.x = -halfW; p.velocity.x *= -0.4; }
        if (p.position.y >  halfH) { p.position.y =  halfH; p.velocity.y *= -0.4; }
        if (p.position.y < -halfH) { p.position.y = -halfH; p.velocity.y *= -0.4; }

        u_particles[i].set(
          p.position.x / width  + 0.5,
          p.position.y / height + 0.5
        );
      }

      if (isVisible) {
        if (theme === 'light') {
          // Bypass UnrealBloomPass in Light Mode to preserve absolute alpha transparency 
          // over the #f8fafc CSS background without post-processing gray artifacts.
          renderer.render(scene, camera);
        } else {
          composer.render();
        }
      }
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('ui-hover-focus', onUiHover);
      window.removeEventListener('resize',    onResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return (
    <div
      ref={mountRef}
      style={{
        position      : 'fixed',
        top           : 0,
        left          : 0,
        width         : '100%',
        height        : '100%',
        zIndex        : -1,
        pointerEvents : 'none',
        background    : 'transparent',
        transform     : 'scale(1.05)' // Prevent minor blur edge clipping
      }}
    />
  );
}
