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
  const btn     = $('#menuBtn');
  const overlay = $('#menuOverlay');
  const plus    = $('#menuPlus');
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

  // Close on nav link click
  $$('.menu-overlay__link', overlay).forEach(link => {
    link.addEventListener('click', close);
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
(function initSideNav() {
  const dots      = $$('.side-nav__dot');
  const panels    = $$('.panel[data-panel]');
  const arrowUp   = $('#arrowUp');
  const arrowDown = $('#arrowDown');

  if (!dots.length || !panels.length) return;

  let current = 0;

  // Scroll to a panel index
  const scrollToPanel = (idx) => {
    const target = panels[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Update active dot
  const setActive = (idx) => {
    dots.forEach((d, i) => d.classList.toggle('side-nav__dot--active', i === idx));
    current = idx;
    document.body.dataset.section = String(idx);
  };

  // Dot clicks
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => scrollToPanel(i));
  });

  // Arrow buttons
  arrowUp?.addEventListener('click',   () => scrollToPanel(Math.max(0, current - 1)));
  arrowDown?.addEventListener('click', () => scrollToPanel(Math.min(panels.length - 1, current + 1)));

  // IntersectionObserver scroll spy
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.panel ?? '0', 10);
          setActive(idx);
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
  const orb  = $('.hero-object');
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
      orb.style.transform = `translate(calc(-50% + ${dx * 20}px), calc(-55% + ${dy * 12}px))`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    orb.style.transform = 'translate(-50%, -55%)';
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
          entry.target.style.opacity  = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  targets.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.65s ${0.08 * (i % 6)}s cubic-bezier(0.22,1,0.36,1), transform 0.65s ${0.08 * (i % 6)}s cubic-bezier(0.22,1,0.36,1)`;
    observer.observe(el);
  });

  // Immediate reveal for hero elements
  $$('.hero-headline, .hero-tagline, .hero-object').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = el === $('#spline-hero') ? 'translate(-50%,-55%)' : '';
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
  const overlay  = $('#menuOverlay');
  const menuBtn  = $('#menuBtn');
  if (!overlay || !menuBtn) return;

  const focusable = () => $$('a, button', overlay).filter(el => !el.disabled);

  overlay.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const items = focusable();
    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();


/* ============================================================
   9. DROOMPAD 3D SCROLL & PHONE MOCKUP LOGIC
   ============================================================ */
(function initDroompadScroll() {
  const section = $('#droompad');
  const path = $('.droompad-3d-path');
  const nodes = $$('.path-node');
  const steps = $$('.droompad-step');
  const phoneContent = $('#phoneContent');
  
  if (!section || !path || !phoneContent) return;

  // Phone content presets for each step
  const mockups = [
    { title: "Beweegdroom", xp: "+50 XP", desc: "Doel: 5 km wandelen", color: "var(--teal-300)" },
    { title: "Assessment", xp: "+100 XP", desc: "Status: Veilig starten", color: "var(--green-accent)" },
    { title: "Schema Week 1", xp: "+20 XP", desc: "Vandaag: Beenspieren (20m)", color: "var(--white)" },
    { title: "Streak Behaald!", xp: "+150 XP", desc: "🔥 3 dagen op rij!", color: "#f5c542" },
    { title: "Evaluatie", xp: "+50 XP", desc: "Feedback: 'Ging goed'", color: "var(--teal-400)" }
  ];

  let activeStepIndex = -1;

  const updateDroompad = () => {
    const rect = section.getBoundingClientRect();
    const windowH = window.innerHeight;
    
    // Calculate how far we've scrolled inside the section (0.0 to 1.0)
    // The section is 400vh tall.
    const startOffset = windowH; // When the top hits the bottom of the screen
    const totalDistance = rect.height - windowH; 
    
    // Calculate progress (0 when top is at top of screen, 1 when bottom is at bottom of screen)
    let progress = -rect.top / totalDistance;
    progress = Math.max(0, Math.min(1, progress));

    // Move the 3D path: translateY from 0 to 150vh (pulling it towards camera)
    // Add a slight perspective shift or scale.
    // Base transform was: rotateX(75deg) translateY(0) scale3d(1, 1, 1)
    const moveY = progress * 150; // vh
    path.style.transform = `rotateX(75deg) translateY(${moveY}vh) scale3d(1, 1, 1)`;

    // Determine current step index (0 to 4)
    let currentStepIndex = Math.floor(progress * 4.99); // 5 steps
    if (progress === 1) currentStepIndex = 4;

    // Highlight path nodes based on progress
    nodes.forEach((node, idx) => {
      node.classList.toggle('active', idx <= currentStepIndex);
    });

    // Handle step text cards highlighting
    steps.forEach((step, idx) => {
      const card = step.querySelector('.step-card');
      // If the scroll is near this step's tier, activate it
      card.classList.toggle('active', idx === currentStepIndex);
    });

    // Update phone dynamic content if step changed
    if (currentStepIndex !== activeStepIndex) {
      activeStepIndex = currentStepIndex;
      const m = mockups[activeStepIndex];
      phoneContent.innerHTML = `
        <div class="phone-mock-item" style="border-color:${m.color};">
          <div style="font-size:0.7rem; color:${m.color}; margin-bottom:4px; font-weight:800;">${m.title}</div>
          <div style="font-size:0.9rem; margin-bottom:4px;">${m.desc}</div>
          <div style="font-size:0.75rem; color:var(--white-55); font-weight:bold;">✨ ${m.xp}</div>
        </div>
      `;
    }
  };

  window.addEventListener('scroll', updateDroompad, { passive: true });
  updateDroompad(); // init
})();

