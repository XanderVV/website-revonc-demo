/* ============================================================
   HERO SPARKS — Tiny light particles rising from the logo
   Pure Canvas 2D, no dependencies
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('heroSparks');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Reduced motion check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hi-DPI support
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H;

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Spark particles ---
  var SPARK_COUNT = 35;
  var sparks = [];

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createSpark() {
    // Spawn near center (where the logo is), slight horizontal spread
    var cx = W / 2;
    var cy = H / 2 - 10;

    // 60% teal, 25% bright green, 15% orange
    var roll = Math.random();
    var hue, sat, lit;
    if (roll < 0.60) {
      hue = 174; sat = 75; lit = randomBetween(55, 70);  // teal
    } else if (roll < 0.85) {
      hue = 145; sat = 65; lit = randomBetween(55, 70);  // green (matching logo)
    } else {
      hue = 26; sat = 90; lit = randomBetween(55, 65);   // orange
    }

    return {
      x: cx + randomBetween(-35, 35),
      y: cy + randomBetween(-20, 30),
      vx: randomBetween(-0.3, 0.3),
      vy: randomBetween(-0.6, -1.5),
      size: randomBetween(1.2, 3),
      maxLife: randomBetween(80, 160),
      life: 0,
      hue: hue,
      sat: sat,
      lit: lit,
      wobbleSpeed: randomBetween(0.02, 0.05),
      wobbleAmp: randomBetween(0.3, 1.0),
      wobbleOffset: randomBetween(0, Math.PI * 2),
      delay: randomBetween(0, 60)  // stagger start
    };
  }

  // Initialize
  for (var i = 0; i < SPARK_COUNT; i++) {
    var s = createSpark();
    s.life = Math.floor(randomBetween(0, s.maxLife));  // stagger phase
    sparks.push(s);
  }

  // --- Animation loop ---
  function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < sparks.length; i++) {
      var s = sparks[i];

      // Delay before starting
      if (s.delay > 0) {
        s.delay--;
        continue;
      }

      s.life++;

      // Recycle when dead
      if (s.life >= s.maxLife) {
        sparks[i] = createSpark();
        continue;
      }

      // Movement
      var wobble = Math.sin(s.life * s.wobbleSpeed + s.wobbleOffset) * s.wobbleAmp;
      s.x += s.vx + wobble * 0.1;
      s.y += s.vy;

      // Slight deceleration upward
      s.vy *= 0.998;

      // Opacity: fade in quickly, hold, fade out
      var lifeRatio = s.life / s.maxLife;
      var alpha;
      if (lifeRatio < 0.15) {
        alpha = lifeRatio / 0.15;  // fade in
      } else if (lifeRatio > 0.7) {
        alpha = (1 - lifeRatio) / 0.3;  // fade out
      } else {
        alpha = 1;
      }
      alpha *= 0.7;  // overall brightness cap

      // Size decreases slightly as it rises
      var size = s.size * (1 - lifeRatio * 0.3);

      // Draw spark with soft glow
      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer glow
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + s.hue + ',' + s.sat + '%,' + s.lit + '%,0.15)';
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + s.hue + ',' + s.sat + '%,' + s.lit + '%,0.9)';
      ctx.fill();

      // Bright center dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + s.hue + ',' + (s.sat - 20) + '%,' + Math.min(s.lit + 25, 95) + '%,1)';
      ctx.fill();

      ctx.restore();
    }
  }

  animate();
})();
