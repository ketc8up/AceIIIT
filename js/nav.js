/**
 * nav.js — mobile navigation for the shared site header.
 *
 * Progressive enhancement: on phones the hamburger (a morphing two-stroke icon)
 * opens a curved menu panel that slides in from the right. The panel is built
 * from the page's own `ul.nav-links` (and footer social links), so every page
 * gets the same menu. Desktop never shows the toggle or the panel, so its
 * layout and behaviour are untouched.
 */
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = header && header.querySelector('.site-nav');
  const list = nav && nav.querySelector('.nav-links');
  if (!list) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const mobile = window.matchMedia('(max-width: 767.98px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Toggle: one stroke folds from the top/bottom bars into an X ───────── */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-controls', 'site-menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML =
    '<svg class="nav-toggle-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path class="nav-toggle-morph" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"/>' +
    '<path d="M7 16 27 16"/></svg>';
  nav.appendChild(toggle);

  /* ── Panel ─────────────────────────────────────────────────────────────── */
  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  menu.id = 'site-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Site menu');

  // Curved leading edge: bulges out while the panel travels, settles flat.
  const curve = document.createElementNS(SVG_NS, 'svg');
  curve.setAttribute('class', 'nav-menu-curve');
  curve.setAttribute('aria-hidden', 'true');
  curve.setAttribute('focusable', 'false');
  const curvePath = document.createElementNS(SVG_NS, 'path');
  curve.appendChild(curvePath);
  menu.appendChild(curve);

  const inner = document.createElement('div');
  inner.className = 'nav-menu-inner';

  const sourceLinks = [...list.querySelectorAll('a')];
  const eyebrow = document.createElement('p');
  eyebrow.className = 'nav-menu-eyebrow';
  eyebrow.innerHTML = '<span>Navigation</span><span>' + String(sourceLinks.length).padStart(2, '0') + '</span>';
  inner.appendChild(eyebrow);

  const here = location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1');
  const menuList = document.createElement('ul');
  menuList.className = 'nav-menu-links';
  sourceLinks.forEach((src, i) => {
    const label = src.textContent.trim();
    const li = document.createElement('li');
    li.style.setProperty('--i', i);
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    const path = new URL(a.href, location.href).pathname.replace(/(.)\/$/, '$1');
    if (path === here && !new URL(a.href, location.href).hash) a.setAttribute('aria-current', 'page');

    const num = document.createElement('span');
    num.className = 'nav-menu-num';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = String(i + 1).padStart(2, '0');

    const word = document.createElement('span');
    word.className = 'nav-menu-word';
    word.setAttribute('aria-hidden', 'true');
    [...label].forEach((ch, c) => {
      const s = document.createElement('span');
      s.className = 'nav-menu-ch';
      s.style.setProperty('--c', c);
      s.textContent = ch === ' ' ? ' ' : ch;
      word.appendChild(s);
    });

    const sr = document.createElement('span');
    sr.className = 'nav-menu-sr';
    sr.textContent = label;

    const arrow = document.createElement('span');
    arrow.className = 'nav-menu-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    a.append(num, word, sr, arrow);
    li.appendChild(a);
    menuList.appendChild(li);
  });
  inner.appendChild(menuList);

  // Footer: the page's real social links (placeholders with href="#" skipped).
  const socials = [...document.querySelectorAll('.footer-socials .social-link')]
    .filter((s) => s.getAttribute('href') && s.getAttribute('href') !== '#');
  const foot = document.createElement('div');
  foot.className = 'nav-menu-foot';
  foot.innerHTML = '<span class="nav-menu-tag">Built by IIIT Hyderabad students</span>';
  if (socials.length) {
    const row = document.createElement('div');
    row.className = 'nav-menu-socials';
    socials.forEach((s) => row.appendChild(s.cloneNode(true)));
    foot.appendChild(row);
  }
  inner.appendChild(foot);
  menu.appendChild(inner);

  document.body.append(scrim, menu);

  /* ── Curve animation (SVG path `d` isn't animatable in every browser) ──── */
  // cubic-bezier(0.76, 0, 0.24, 1) — the panel's own easing.
  function ease(t) {
    const x1 = 0.76, y1 = 0, x2 = 0.24, y2 = 1;
    const bx = (u) => 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u;
    const by = (u) => 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
    let lo = 0, hi = 1, u = t;
    for (let k = 0; k < 20; k++) {
      u = (lo + hi) / 2;
      if (bx(u) < t) lo = u; else hi = u;
    }
    return by(u);
  }

  let bend = -100; // quadratic control x: -100 = full bulge, 100 = flat
  let curveAnim = 0;

  function drawCurve() {
    const h = window.innerHeight;
    curve.setAttribute('viewBox', `0 0 100 ${h}`);
    curvePath.setAttribute('d', `M100 0 L200 0 L200 ${h} L100 ${h} Q${bend} ${h / 2} 100 0`);
  }

  function animateCurve(to, duration) {
    cancelAnimationFrame(curveAnim);
    if (reduce.matches) {
      bend = to;
      drawCurve();
      return;
    }
    const from = bend;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      bend = from + (to - from) * ease(t);
      drawCurve();
      if (t < 1) curveAnim = requestAnimationFrame(step);
    };
    curveAnim = requestAnimationFrame(step);
  }

  drawCurve();

  /* ── Open / close ──────────────────────────────────────────────────────── */
  const focusables = () => [toggle, ...menu.querySelectorAll('a')];
  const isOpen = () => header.classList.contains('nav-open');

  function setOpen(open, restoreFocus) {
    header.classList.toggle('nav-open', open);
    menu.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('nav-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    animateCurve(open ? 100 : -100, open ? 1000 : 800);
    if (open) {
      // Wait a frame so the panel is no longer visibility:hidden (unfocusable).
      requestAnimationFrame(() => {
        const first = menu.querySelector('.nav-menu-links a');
        if (first && isOpen()) first.focus({ preventScroll: true });
      });
    } else if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen(), true));
  scrim.addEventListener('click', () => setOpen(false, true));

  // Following a link (including same-page anchors) closes the menu.
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && isOpen()) setOpen(false, false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false, true);
      return;
    }
    // Keep Tab focus inside the open menu (toggle + menu links).
    if (e.key === 'Tab') {
      const items = focusables();
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  });

  window.addEventListener('resize', drawCurve);

  // Rotating to a desktop-width viewport should never leave the page locked.
  mobile.addEventListener('change', (e) => {
    if (!e.matches && isOpen()) setOpen(false, false);
  });
})();
