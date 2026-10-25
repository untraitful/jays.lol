(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionOK = () => !reduceMQ.matches;

  /* ---------- Theme toggle ---------- */
  const themeBtn = document.querySelector('.theme');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (darkMQ.matches ? 'dark' : 'light');
  const labelTheme = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeBtn.setAttribute('aria-label', `Switch to ${next} theme`);
    themeBtn.innerHTML = next === 'dark'
      ? '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M4.2 19.8 7 17M17 7l2.8-2.8" stroke="currentColor" stroke-width="2"/></svg>';
  };
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    document.dispatchEvent(new Event('themechange'));
    try { localStorage.setItem('theme', next); } catch (e) {}
    labelTheme();
  });
  darkMQ.addEventListener('change', () => { labelTheme(); document.dispatchEvent(new Event('themechange')); });
  labelTheme();

  /* ---------- Nav: active link ---------- */
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const linked = navLinks.map(a => document.querySelector(a.getAttribute('href')));

  let navTick = false;
  const updateNav = () => {
    navTick = false;
    // Active section: the last linked section whose top has passed 40% of the viewport
    const line = innerHeight * 0.4;
    let active = -1;
    linked.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) active = i; });
    // At the very bottom, the last section is active
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) active = linked.length - 1;
    navLinks.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const queueNav = () => { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } };
  addEventListener('scroll', queueNav, { passive: true });
  addEventListener('resize', queueNav);
  updateNav();

  /* ---------- Hero canvas: switch activity LEDs, the cursor is traffic ---------- */
  const canvas = document.querySelector('.hero__leds');
  const hero = document.querySelector('.hero');
  const ctx = canvas.getContext('2d');
  let leds = [], cols = 0, rows = 0, cell = 22, W = 0, H = 0, dpr = 1, quiet = [];
  const quietEls = [...hero.querySelectorAll('.hero__hello, .hero__line, .hero__tag, .hero__actions')];
  const pointer = { x: -9999, y: -9999, active: false, moved: 0 };
  let heroVisible = true, raf = 0, last = 0;

  // LED colour follows the theme's ink (--led on :root)
  let LED = '0,0,0';
  const readLed = () => { LED = getComputedStyle(root).getPropertyValue('--led').trim().split(/[\s,]+/).join(','); };
  readLed();

  const build = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W < 600 ? 18 : 24;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    // Keep the LEDs dark behind the words so the text stays readable
    quiet = quietEls.map((el) => {
      const q = el.getBoundingClientRect();
      return { x0: q.left - r.left - 12, y0: q.top - r.top - 12, x1: q.right - r.left + 12, y1: q.bottom - r.top + 12 };
    });
    leds = new Array(cols * rows);
    for (let i = 0; i < leds.length; i++) {
      const cx = (i % cols) * cell + cell / 2, cy = Math.floor(i / cols) * cell + cell / 2;
      const hush = quiet.some(q => cx > q.x0 && cx < q.x1 && cy > q.y0 && cy < q.y1);
      leds[i] = { level: 0, green: Math.random() < 0.18, rate: 0.0006 + Math.random() * 0.002, gain: hush ? 0.12 : 1 };
    }
  };

  const draw = (dt) => {
    ctx.clearRect(0, 0, W, H);
    const size = cell * 0.26;
    const radius = Math.max(140, W * 0.12);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const led = leds[y * cols + x];
        const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
        // Idle blinking, like a quiet switch
        if (Math.random() < led.rate * dt) led.level = Math.max(led.level, 0.35 + Math.random() * 0.4);
        // Traffic near the cursor
        if (pointer.active) {
          const dx = cx - pointer.x, dy = cy - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < radius) {
            const near = 1 - d / radius;
            if (Math.random() < near * 0.012 * dt * (0.4 + pointer.moved)) led.level = 1;
          }
        }
        led.level = Math.max(0, led.level - dt * 0.0018);
        const a = (0.09 + led.level * 0.75) * led.gain;
        const s = size + led.level * size * 0.6;
        ctx.fillStyle = led.level > 0.02 ? `rgba(${LED},${led.green ? a * 0.5 : a})` : `rgba(${LED},${0.08 * led.gain})`;
        ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      }
    }
    pointer.moved *= 0.92;
  };

  const loop = (t) => {
    const dt = Math.min(64, t - (last || t));
    last = t;
    draw(dt);
    raf = heroVisible && !document.hidden && motionOK() ? requestAnimationFrame(loop) : 0;
  };
  const start = () => { if (!raf && heroVisible && !document.hidden && motionOK()) { last = 0; raf = requestAnimationFrame(loop); } };
  const stillFrame = () => {
    // Reduced motion: one quiet frame with a few lit LEDs, no animation
    leds.forEach(l => { l.level = Math.random() < 0.08 ? 0.6 : 0; });
    draw(0);
  };

  build();
  if (motionOK()) start(); else stillFrame();
  if (document.fonts) document.fonts.ready.then(() => { build(); if (!motionOK()) stillFrame(); });

  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; start(); }).observe(hero);
  document.addEventListener('visibilitychange', start);
  document.addEventListener('themechange', () => { readLed(); if (!motionOK()) stillFrame(); });
  reduceMQ.addEventListener('change', () => { if (motionOK()) start(); else { cancelAnimationFrame(raf); raf = 0; stillFrame(); } });
  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { build(); if (!motionOK()) stillFrame(); }, 150);
  });

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    pointer.moved = Math.min(3, pointer.moved + Math.hypot(nx - pointer.x, ny - pointer.y) / 60);
    pointer.x = nx; pointer.y = ny; pointer.active = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; });

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector('.glow');
  if (finePointer.matches && motionOK()) {
    let gx = 0, gy = 0, tx = 0, ty = 0, gRaf = 0;
    const follow = () => {
      gx += (tx - gx) * 0.18; gy += (ty - gy) * 0.18;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      gRaf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-on');
      if (!gRaf) gRaf = requestAnimationFrame(follow);
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer.matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        if (!motionOK()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Projects carousel ---------- */
  const track = document.querySelector('.track');
  const list = track.querySelector('.track__list');
  const cards = [...list.children];
  const prev = document.querySelector('.ctl[data-dir="-1"]');
  const next = document.querySelector('.ctl[data-dir="1"]');
  const bar = document.querySelector('.progress__bar');

  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(list).columnGap || 0);

  const syncCarousel = () => {
    const max = maxScroll();
    const x = track.scrollLeft;
    prev.disabled = x <= 2;
    next.disabled = x >= max - 2;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, x / max)) : 1);
  };
  let carTick = false;
  track.addEventListener('scroll', () => {
    if (!carTick) { carTick = true; requestAnimationFrame(() => { carTick = false; syncCarousel(); }); }
  }, { passive: true });
  addEventListener('resize', syncCarousel);
  syncCarousel();

  const behavior = () => (motionOK() ? 'smooth' : 'auto');
  const go = (dir) => track.scrollBy({ left: dir * step(), behavior: behavior() });
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: behavior() }); }
    else if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: maxScroll(), behavior: behavior() }); }
  });

  // Mouse drag. Touch and pens use native scrolling with snap.
  let drag = null, suppressClick = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId, lastX: e.clientX, v: 0 };
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      track.setPointerCapture(e.pointerId);
      track.classList.add('is-dragging');
    }
    if (drag.moved) {
      drag.v = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      track.scrollLeft = drag.left - dx;
    }
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const wasMoved = drag.moved, v = drag.v;
    drag = null;
    if (!wasMoved) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    track.classList.remove('is-dragging');
    // Snap to the nearest card, nudged in the direction of the throw
    const s = step();
    const target = Math.round((track.scrollLeft - v * 4) / s) * s;
    track.scrollTo({ left: Math.max(0, Math.min(maxScroll(), target)), behavior: behavior() });
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  // A drag must never become a click on a link inside a card
  track.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);
  track.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---------- Card tilt + spotlight ---------- */
  if (finePointer.matches) {
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        if (!motionOK() || track.classList.contains('is-dragging')) return;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
        card.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.querySelector('.copy');
  const copyStatus = document.querySelector('.copy__status');
  const email = document.getElementById('email').textContent.trim();
  let copyT;
  copyBtn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; }
    catch (e) {
      // Fallback for insecure contexts (file://, plain http)
      const ta = document.createElement('textarea');
      ta.value = email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (err) {}
      ta.remove();
    }
    copyStatus.textContent = ok ? 'Copied to clipboard' : 'Select the address above to copy it';
    copyBtn.textContent = ok ? 'Copied' : 'Copy email';
    clearTimeout(copyT);
    copyT = setTimeout(() => { copyStatus.textContent = ''; copyBtn.textContent = 'Copy email'; }, 2400);
  });

  /* ---------- Footer year ---------- */
  document.querySelector('.year').textContent = new Date().getFullYear();
})();
