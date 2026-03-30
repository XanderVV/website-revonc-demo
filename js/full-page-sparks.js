/* ============================================================
   FULL-PAGE SPARKS — Canvas particles across the entire viewport
   Replaces the old CSS-based dp__particles with richer visuals.
   Scroll-linked density: more particles as you scroll deeper.
   ============================================================ */
(function () {
  'use strict';

  // Reduced motion check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Create fixed canvas
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Hi-DPI
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Particle system ---
  var BASE_COUNT = 25;
  var MAX_COUNT = 45;
  var particles = [];

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createParticle() {
    // Spawn along the bottom of the viewport with random x
    var roll = Math.random();
    var hue, sat, lit;
    if (roll < 0.60) {
      hue = 174; sat = 75; lit = randomBetween(55, 70);  // teal
    } else if (roll < 0.85) {
      hue = 145; sat = 65; lit = randomBetween(55, 70);  // green
    } else {
      hue = 26; sat = 90; lit = randomBetween(55, 65);   // orange
    }

    return {
      x: randomBetween(0, W),
      y: H + randomBetween(5, 30),
      vx: randomBetween(-0.15, 0.15),
      vy: randomBetween(-0.3, -0.9),
      size: randomBetween(1.0, 2.5),
      maxLife: randomBetween(250, 500),
      life: 0,
      hue: hue,
      sat: sat,
      lit: lit,
      wobbleSpeed: randomBetween(0.01, 0.04),
      wobbleAmp: randomBetween(0.2, 0.8),
      wobbleOffset: randomBetween(0, Math.PI * 2)
    };
  }

  // Initialize with staggered phases
  for (var i = 0; i < BASE_COUNT; i++) {
    var p = createParticle();
    p.life = Math.floor(randomBetween(0, p.maxLife));
    p.y = randomBetween(0, H); // Spread across viewport initially
    particles.push(p);
  }

  // Scroll-linked warmth factor
  var warmth = 0;
  function updateWarmth() {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    warmth = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
  }
  window.addEventListener('scroll', updateWarmth, { passive: true });
  updateWarmth();

  // --- Draw loop ---
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Target particle count increases with scroll depth
    var targetCount = Math.floor(BASE_COUNT + (MAX_COUNT - BASE_COUNT) * warmth);

    // Spawn new particles if below target
    while (particles.length < targetCount) {
      particles.push(createParticle());
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life++;

      if (p.life >= p.maxLife) {
        // Respawn
        particles[i] = createParticle();
        continue;
      }

      // Movement with wobble
      p.x += p.vx + Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmp;
      p.y += p.vy;

      // Opacity: fade in quickly, hold, fade out
      var lifeRatio = p.life / p.maxLife;
      var alpha;
      if (lifeRatio < 0.1) {
        alpha = lifeRatio / 0.1;
      } else if (lifeRatio < 0.7) {
        alpha = 1;
      } else {
        alpha = 1 - (lifeRatio - 0.7) / 0.3;
      }

      // Size shrinks slightly over life
      var currentSize = p.size * (1 - lifeRatio * 0.3);

      // Warmth-linked base opacity (more visible when scrolled down)
      var baseAlpha = 0.25 + warmth * 0.35;
      alpha *= baseAlpha;

      if (alpha < 0.01) continue;

      var color = 'hsla(' + p.hue + ',' + p.sat + '%,' + p.lit + '%,';

      // Layer 1: outer glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = color + (alpha * 0.15) + ')';
      ctx.fill();

      // Layer 2: core
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = color + (alpha * 0.7) + ')';
      ctx.fill();

      // Layer 3: bright center dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ',' + Math.min(100, p.sat + 15) + '%,' + Math.min(95, p.lit + 25) + '%,' + alpha + ')';
      ctx.fill();
    }

    // Trim excess particles if we scrolled back up
    while (particles.length > targetCount + 10) {
      particles.pop();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
