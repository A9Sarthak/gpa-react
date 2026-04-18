import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default function MetaballBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let width  = window.innerWidth;
    let height = window.innerHeight;

    const container = mountRef.current;
    const scene     = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      0.1, 10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
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
      u_mergeGlow  : { value: 0.0 }   // ← drives the subtle merge brightness burst
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

        // ── Soft boundary – wider smoothstep = no hard edge ──────────────────
        float intensity = smoothstep(0.9, 1.5, field);

        // ── Premium dark-mode palette (deep navy → violet → icy periwinkle) ──
        vec3 cDeep    = vec3(0.04, 0.06, 0.20);   // outer aura: deep navy
        vec3 cMid     = vec3(0.30, 0.18, 0.58);   // body: soft violet
        vec3 cCore    = vec3(0.38, 0.62, 0.88);   // core: icy periwinkle (never white)

        float mapMid  = smoothstep(1.1, 2.8, field);
        float mapCore = smoothstep(2.8, 5.5, field);

        vec3 col = mix(cDeep, cMid,  mapMid);
        col      = mix(col,   cCore, mapCore);

        // ── Merge glow burst – subtle brightness lift, no colour shift ────────
        col *= 1.0 + u_mergeGlow * 0.35;

        gl_FragColor = vec4(col, intensity * 0.82);
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

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.7);
    bloomPass.threshold = 0.18;
    composer.addPass(bloomPass);

    // ─── Interaction state ────────────────────────────────────────────────────
    const mouse       = new THREE.Vector2(-9999, -9999);
    let   idleTimer   = 0.0;
    let   activeTimer = 10.0; // pre-warm so blobs start looking alive
    let   mergeGlow   = 0.0; // current glow level, smoothly decays

    const onMouseMove = (e) => {
      mouse.x   = e.clientX - width  / 2;
      mouse.y   = -(e.clientY - height / 2);
      idleTimer = 0.0;
    };
    window.addEventListener('mousemove', onMouseMove);

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
      // Normalise and smooth the glow — spike fast, decay slowly
      const targetGlow = Math.min(totalDensity / (numParticles * 0.8), 1.0);
      if (targetGlow > mergeGlow) {
        mergeGlow += (targetGlow - mergeGlow) * 0.12; // fast attack
      } else {
        mergeGlow += (targetGlow - mergeGlow) * 0.025; // slow release → settles naturally
      }
      material.uniforms.u_mergeGlow.value = mergeGlow;
      // Also modulate bloom strength slightly with glow
      bloomPass.strength = 0.55 + mergeGlow * 0.25;

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
          const orbitR = 60 + (i % 5) * 18;
          const orbitX = Math.sin(p.phase + t * 1.8) * orbitR;
          const orbitY = Math.cos(p.phase + t * 1.4) * orbitR;

          const dx   = (mouse.x + orbitX) - p.position.x;
          const dy   = (mouse.y + orbitY) - p.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 450 && dist > 8) {
            const force = ((450 - dist) / 450) * 4.5 * safeDt;
            p.velocity.x += dx * force;
            p.velocity.y += dy * force;
          }
        }

        // ── Idle scatter (staggered, amoeba-slow) ──
        if (idleTimer >= myIdleThreshold) {
          const breakMult = Math.min((idleTimer - myIdleThreshold) * 0.12, 1.0);
          for (let j = 0; j < numParticles; j++) {
            if (i === j) continue;
            const other = particles[j];
            const dist  = p.position.distanceTo(other.position);
            if (dist < 180 && dist > 0) {
              const repel = p.position.clone().sub(other.position).normalize();
              repel.multiplyScalar((180 - dist) * 0.012 * breakMult * safeDt);
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

      composer.render();
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize',    onResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

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
        background    : '#080a14'   // deep dark navy — complements the palette
      }}
    />
  );
}
