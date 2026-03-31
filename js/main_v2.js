/**
 * RevOnc Website — main.js
 * Built to match Bright Biotech-style interaction patterns:
 *  - "Menu +" overlay toggle
 *  - Left dot nav (side-nav) with scroll spy
 *  - Up/down arrows to navigate panels
 *  - Nav background on scroll
 *  - Spline integration helpers
 */

'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. MENU OVERLAY — "Menu +" toggle (Bright Biotech style)
   ============================================================ */
(function initMenu() {
  const btn = $('#menuBtn');
  const overlay = $('#menuOverlay');
  const plus = $('#menuPlus');
  if (!btn || !overlay) return;

  const open = () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => {
    overlay.classList.contains('open') ? close() : open();
  });

  // Close on nav link click and scroll to target
  $$('.menu-overlay__link', overlay).forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      // Allow external links (other pages) to navigate normally
      if (!href.startsWith('#')) {
        close();
        return;
      }
      e.preventDefault();
      close();
      const target = document.querySelector(href);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 150);
      }
    });
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();


/* ============================================================
   2. NAV — add bg class after first scroll
   ============================================================ */
(function initNavBg() {
  const nav = $('#nav');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('bg--visible', window.scrollY > 40);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ============================================================
   3. SIDE-NAV DOT SCROLL SPY + arrows
   ============================================================ */
(function initSectionSpy() {
  const panels = $$('.panel[data-panel]');
  if (!panels.length) return;

  // IntersectionObserver scroll spy — tracks current section on body
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.body.dataset.section = entry.target.dataset.panel ?? '0';
        }
      });
    },
    { threshold: 0.45 }
  );

  panels.forEach(p => observer.observe(p));
})();


/* ============================================================
   4. SMOOTH ANCHOR SCROLL with nav-height offset
   ============================================================ */
(function initAnchorScroll() {
  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '76',
    10
  );

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   5. ORB SYSTEM — subtle mouse parallax on hero
   ============================================================ */
(function initHeroParallax() {
  const hero = $('.panel--hero');
  const orb = $('.hero-object');
  if (!hero || !orb) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let rafId = null;

  hero.addEventListener('mousemove', e => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      orb.style.transform = `translate(${dx * 20}px, ${dy * 12}px)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    orb.style.transform = 'translate(0, 0)';
  });
})();


/* ============================================================
   6. PROOF CARDS — staggered reveal on scroll
   ============================================================ */
(function initReveal() {
  const targets = $$('.proof-card, .org-card, .step-row, .stat-item, .orb-badge, .contact-center, .panel__label, .panel__main, .panel__aside');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.65s ${0.08 * (i % 6)}s cubic-bezier(0.22,1,0.36,1), transform 0.65s ${0.08 * (i % 6)}s cubic-bezier(0.22,1,0.36,1)`;
    observer.observe(el);
  });

  // Immediate reveal for hero elements
  $$('.hero-stack, .hero-object').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = '';
  });
})();


/* ============================================================
   7. SPLINE INTEGRATION HELPERS
   ============================================================ */

/**
 * loadSpline(slotId, sceneUrl)
 *
 * Call this when your Spline scenes are ready:
 *
 *   loadSpline('#spline-hero', 'https://prod.spline.design/YOURSCENEID/scene.splinecode');
 *   loadSpline('#spline-app',  'https://prod.spline.design/YOURSCENEID/scene.splinecode');
 *
 * Add in <head> before calling:
 *   <script type="module" src="https://unpkg.com/@splinetool/viewer/build/spline-viewer.js"></script>
 *
 * Slot IDs:
 *   #spline-hero  → Full hero background / centered object (replaces orb system)
 *   #spline-app   → App phone mockup 3D (How it works section)
 */
window.loadSpline = function (slotSelector, sceneUrl, opts = {}) {
  const slot = document.querySelector(slotSelector);
  if (!slot) { console.warn('[RevOnc Spline] Slot not found:', slotSelector); return; }

  const viewer = document.createElement('spline-viewer');
  viewer.setAttribute('url', sceneUrl);
  viewer.style.cssText = opts.style || 'position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;';

  if (opts.replace) {
    slot.innerHTML = '';
  }

  slot.appendChild(viewer);
  console.info('[RevOnc Spline] Loaded:', slotSelector, '→', sceneUrl);
};


/* ============================================================
   8. KEYBOARD ACCESSIBILITY — focus trap in overlay menu
   ============================================================ */
(function initFocusTrap() {
  const overlay = $('#menuOverlay');
  const menuBtn = $('#menuBtn');
  if (!overlay || !menuBtn) return;

  const focusable = () => $$('a, button', overlay).filter(el => !el.disabled);

  overlay.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const items = focusable();
    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();


/* ============================================================
   9. GLOBAL DROOMPAD — Winding path through the page
   The path scrolls with the page and weaves between content.
   JS dynamically generates SVG path coordinates based on
   actual panel positions so the path goes through empty space.
   ============================================================ */
(function initDroompad() {
  const pathEl = $('#dpPath');
  const trailEl = $('#dpTrail');
  const headEl = $('#dpHead');
  const moodEl = $('#dpMood');
  const dpEl = $('#dp');
  const svgEl = $('#dpSvg');
  const particlesEl = $('#dpParticles');

  if (!pathEl || !svgEl || !dpEl) return;

  const STONE_COUNT = 5;
  const stones = [];
  const icons = [];
  for (let i = 0; i < STONE_COUNT; i++) {
    stones.push($('#dpStone' + i));
    icons.push($('#dpStoneIcon' + i));
  }

  // ---- SVG icons for stone states ----
  const checkSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const playSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21"/></svg>';
  const lockSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
  const starSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  let pathLen = 0;

  // ---- Stone positions along path (0–1) ----
  // DO NOT CHANGE — manually tuned to avoid overlapping section text/images
  const stonePositions = [0.04, 0.24, 0.42, 0.62, 0.96];

  // ---- Mathematically perfect S-curve anchors (pctX, pctY of page) ----
  // Only key turning points — cubic beziers with vertical tangents create
  // perfectly smooth, consistent curves between them. No hand-drawn noise.
  const ANCHORS = [
    { x: 0.110, y: 0.08 },    // A0 — start (left)
    { x: 0.105, y: 0.16 },    // A1 — hold left before first curve
    { x: 0.420, y: 0.375 },   // A2 — right peak 1
    { x: 0.148, y: 0.510 },   // A3 — left trough 1
    { x: 0.474, y: 0.675 },   // A4 — right peak 2
    { x: 0.130, y: 0.840 },   // A5 — left trough 2
    { x: 0.127, y: 0.970 },   // A6 — end (left)
  ];

  // ---- Build perfectly smooth SVG path ----
  function buildPath() {
    const vw = window.innerWidth;
    const docH = document.documentElement.scrollHeight;

    // Size dp container + SVG to full document height
    dpEl.style.height = docH + 'px';
    svgEl.setAttribute('viewBox', '0 0 ' + vw + ' ' + docH);

    // Convert anchor percentages to pixel coordinates
    const pts = ANCHORS.map(a => ({ x: a.x * vw, y: a.y * docH }));

    // Build path: each segment uses cubic bezier with vertical tangents
    // at each anchor point — guarantees perfectly symmetric S-curves
    let d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dy = b.y - a.y;

      // Control points: straight down from A, straight up from B
      // The 0.42 factor gives a natural, wide S-shape
      var tension = 0.42;

      // First segment (A0→A1) is nearly vertical — use lower tension
      if (i === 0) tension = 0.3;
      // Last segment (A5→A6) is nearly vertical — lower tension too
      if (i === pts.length - 2) tension = 0.3;

      var cp1x = a.x;
      var cp1y = a.y + dy * tension;
      var cp2x = b.x;
      var cp2y = b.y - dy * tension;

      d += ' C ' +
        cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) + ', ' +
        cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) + ', ' +
        b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    }

    pathEl.setAttribute('d', d);
    trailEl.setAttribute('d', d);

    // Recalculate path length for animations
    pathLen = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = pathLen;
    pathEl.style.strokeDashoffset = pathLen;

    positionStones();
  }

  // ---- Position stones along the path (page coordinates) ----
  function positionStones() {
    if (pathLen <= 0) return;
    stonePositions.forEach((t, i) => {
      if (!stones[i]) return;
      const pt = pathEl.getPointAtLength(t * pathLen);
      stones[i].style.left = pt.x + 'px';
      stones[i].style.top = pt.y + 'px';
    });
  }

  // Particles now handled by full-page-sparks.js (canvas-based)

  // ---- Main scroll handler ----
  function onScroll() {
    if (pathLen <= 0) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    const maxScroll = docH - winH;
    if (maxScroll <= 0) return;

    // Sync path head to viewport: path draws as the viewport reaches each section
    // Path starts at ANCHORS[0].y and ends at ANCHORS[last].y of the page
    var yStart = ANCHORS[0].y * docH;
    var yEnd = ANCHORS[ANCHORS.length - 1].y * docH;
    var pathRange = yEnd - yStart;

    // Path head should be at ~75% of the viewport (slightly below center)
    var viewTarget = scrollY + winH * 0.75;
    var progress = Math.max(0, Math.min(1, (viewTarget - yStart) / pathRange));

    // Draw path (stroke reveals with scroll)
    pathEl.style.strokeDashoffset = (pathLen * (1 - progress)).toFixed(1);

    // Move glowing head along the path
    if (headEl) {
      const headPos = pathEl.getPointAtLength(progress * pathLen);
      headEl.setAttribute('cx', headPos.x.toFixed(1));
      headEl.setAttribute('cy', headPos.y.toFixed(1));
      headEl.style.opacity = progress > 0.01 && progress < 0.99 ? '1' : '0';
    }

    // Current step (0-4)
    const stepProgress = progress * STONE_COUNT;
    let currentStep = Math.floor(stepProgress);
    if (currentStep >= STONE_COUNT) currentStep = STONE_COUNT - 1;

    // Update stone states
    stones.forEach((stone, idx) => {
      if (!stone) return;
      const threshold = stonePositions[idx];
      stone.classList.toggle('visible', progress >= threshold - 0.04);

      let state;
      if (idx < currentStep) state = 'completed';
      else if (idx === currentStep) state = 'current';
      else state = 'locked';

      if (stone.dataset.state !== state) {
        stone.dataset.state = state;
        stone.classList.remove('dp__stone--completed', 'dp__stone--current', 'dp__stone--locked');
        stone.classList.add('dp__stone--' + state);
        if (icons[idx]) {
          if (state === 'completed') icons[idx].innerHTML = checkSvg;
          else if (state === 'current') icons[idx].innerHTML = playSvg;
          else if (idx === STONE_COUNT - 1) icons[idx].innerHTML = starSvg;
          else icons[idx].innerHTML = lockSvg;
        }
      }
    });

    // ---- PROGRESSIVE WARMTH ----
    const mood = Math.pow(progress, 0.5);

    if (moodEl) {
      moodEl.style.opacity = (mood * 0.8).toFixed(3);
    }

    if (particlesEl) {
      particlesEl.style.opacity = (0.3 + mood * 0.7).toFixed(3);
    }
  }

  // ---- Initialize ----
  // Wait for layout to settle, then build
  requestAnimationFrame(() => {
    buildPath();
    onScroll();
  });

  // Rebuild on resize (panel positions change)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildPath();
      onScroll();
    }, 150);
  });

  window.addEventListener('scroll', () => {
    requestAnimationFrame(onScroll);
  }, { passive: true });
})();


/* ============================================================
   10. STICKY CTA BAR — appears after scrolling past hero
   ============================================================ */
(function initStickyCta() {
  const bar = $('#stickyCta');
  const hero = $('#panel-0');
  if (!bar || !hero) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      bar.classList.toggle('visible', !entry.isIntersecting);
    });
  }, { threshold: 0.1 });

  observer.observe(hero);
})();


/* ============================================================
   11. NAV SCROLL SPY — highlight active section link
   ============================================================ */
(function initNavSpy() {
  const links = $$('.nav__link[data-section]');
  if (!links.length) return;

  const sections = links.map(link => {
    const id = link.dataset.section;
    return { link, el: document.getElementById(id) };
  }).filter(s => s.el);

  // Track which section is most visible
  var currentId = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentId = entry.target.id;
      }
    });
    // Update active link
    links.forEach(l => l.classList.remove('active'));
    if (currentId) {
      const match = sections.find(s => s.el.id === currentId);
      if (match) match.link.classList.add('active');
    }
  }, { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s.el));
})();


/* ============================================================
   12. STAT COUNTER ANIMATION — numbers count up on scroll
   ============================================================ */
(function initCountUp() {
  const items = $$('[data-count]');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = (el.dataset.count.includes('.')) ? el.dataset.count.split('.')[1].length : 0;
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = target * eased;
        el.textContent = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  items.forEach(el => observer.observe(el));
})();

