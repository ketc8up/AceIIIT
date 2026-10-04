/**
 * method-journey.js — "Why ACEIIIT" scroll-driven journey.
 *
 * Desktop (≥1025px): the horizontal artwork — the red journey fills left→right
 * and the five stage images reveal at fixed thresholds (unchanged behaviour).
 *
 * Phones & portrait tablets (≤1024px): the same illustrations on one vertical
 * rail. A red spine (drawn here, styled like the desktop journey line) draws
 * top→bottom with scroll, led by a glowing tip; each stage reveals as the line
 * nears it and its number lights up as the tip passes, and the line finally
 * turns into an arrow that "writes" the sign-off. Scrolling back up reverses
 * everything, exactly like desktop.
 */
(function () {
  'use strict';

  const horizontal = document.querySelector('[data-aceiiit-method]');
  const vertical = document.querySelector('[data-method-vertical]');
  if (!horizontal && !vertical) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stacked = window.matchMedia('(max-width: 1024px)');

  /* ── Desktop: horizontal journey ─────────────────────────────────────── */
  const journey = horizontal ? horizontal.querySelector('[data-method-journey]') : null;
  const hStages = horizontal ? [...horizontal.querySelectorAll('[data-method-stage]')] : [];
  const thresholds = [0.035, 0.28, 0.52, 0.74, 0.88];

  function updateHorizontal() {
    const startY = window.innerHeight * 0.75;
    const rect = horizontal.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (startY - rect.top) / startY));
    if (journey) journey.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
    hStages.forEach((stage, i) => {
      stage.classList.toggle('is-visible', reduce || progress >= thresholds[i]);
    });
  }

  /* ── Phones: vertical journey ────────────────────────────────────────── */
  const spine = vertical ? vertical.querySelector('[data-method-spine]') : null;
  const vStages = vertical ? [...vertical.querySelectorAll('.method-v__stage')] : [];
  const vStart = vertical ? vertical.querySelector('.method-v__start') : null;
  const vEnd = vertical ? vertical.querySelector('.method-v__end') : null;
  const RAIL_X = 22; // stations sit here, at the inner edge of the 48px rail column
  const SWING = 24;  // how far the wave swings out between stations (into the gutter)
  // geo: { total, samples: [{len, x, y, d}], route, clip, turn, tip, marks, reveals, reached, … }
  let geo = null;

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  // Half a sine wave between two extremes: vertical tangents at both ends, so
  // consecutive halves join smoothly — the vertical twin of the desktop wave.
  function halfWave(x0, y0, x1, y1) {
    const h = (y1 - y0) * 0.55;
    return `C ${x0} ${y0 + h} ${x1} ${y1 - h} ${x1} ${y1}`;
  }

  // Position of a child relative to the vertical container (unaffected by the
  // reveal transforms, which only sit on the illustration and text).
  function relTop(node, base) {
    return node.getBoundingClientRect().top - base;
  }

  function buildSpine() {
    if (!spine || !vStages.length) return;
    const box = vertical.getBoundingClientRect();
    const height = vertical.offsetHeight;
    const width = vertical.offsetWidth;
    if (!height || !width) return;

    const cx = RAIL_X;
    const crestX = cx - SWING;
    // Stations: the start glow beside the wordmark, then each stage's number.
    // Start glow level with the logo at the top of the start block.
    const startLogo = vStart ? vStart.querySelector('.method-v__logo') || vStart : null;
    const startY = startLogo ? relTop(startLogo, box.top) + startLogo.offsetHeight / 2 : 6;
    const stops = vStages.map((li) => {
      const num = li.querySelector('.method-v__num');
      return relTop(num, box.top) + num.offsetHeight / 2;
    });
    // The line curves right into an arrow pointing at the sign-off.
    const endImg = vEnd ? vEnd.querySelector('img') : null;
    const endBox = endImg ? endImg.getBoundingClientRect() : null;
    const endY = endBox ? endBox.top - box.top + endBox.height * 0.42 : height - 10;
    const tipX = endBox ? endBox.left - box.left - 12 : width / 2;

    // Like the desktop line, every station sits at the bottom of a trough and
    // the line swings out in one full arc between stations:
    // start → 01 → 02 → 03 ⇢ (dashed) 04 → one long sweep up into the arrow.
    const points = [[cx, startY], ...stops.map((y) => [cx, y])];
    const segs = [];
    for (let i = 1; i < points.length; i++) {
      const y0 = points[i - 1][1];
      const y1 = points[i][1];
      const ym = (y0 + y1) / 2;
      const dashed = vStages[i - 1].hasAttribute('data-dashed-before');
      segs.push({ d: `${halfWave(cx, y0, crestX, ym)} ${halfWave(crestX, ym, cx, y1)}`, from: [cx, y0], dashed });
    }
    // Ending, in the same rhythm as the wave above it: one more matching arc
    // out of station 04 to a crest, then two joined curves — down into a wide,
    // shallow bowl and rising gently into the arrow.
    const last = points[points.length - 1];
    const gap = (stops[stops.length - 1] - stops[0]) / Math.max(1, stops.length - 1);
    const rise = 14; // the arrow climbs this much out of the bowl
    const bowlY = endY + rise;
    // Crest height: like the arcs above (≈ half a gap), nudged so the drop from
    // the crest into the bowl is only a little taller than its sideways run.
    const runMax = (tipX - crestX) * 0.68;
    const turnY = Math.min(last[1] + gap / 2, Math.max(last[1] + gap * 0.35, bowlY - runMax * 1.15));
    segs.push({ d: halfWave(cx, last[1], crestX, turnY), from: last, dashed: false });
    // Down into the bowl as a quarter-ellipse: the sideways run is close to the
    // drop and both handles use the circle ratio (0.55), so the turn is spread
    // evenly instead of bunching into a corner at the bottom.
    const dropA = bowlY - turnY;
    const runA = Math.min(runMax, dropA * 1.05);
    const bowl = [crestX + runA, bowlY];
    const a1 = [crestX, turnY + dropA * 0.55];
    const a2 = [bowl[0] - runA * 0.55, bowlY];
    // Out of the bowl, level with a2 (smooth join), easing up into the arrow.
    const runB = tipX - bowl[0];
    const b1 = [bowl[0] + runB * 0.45, bowlY];
    const c2 = [tipX - runB * 0.35, endY + rise * 0.45];
    const turnD = `C ${a1[0]} ${a1[1]} ${a2[0]} ${a2[1]} ${bowl[0]} ${bowl[1]} ` +
      `C ${b1[0]} ${b1[1]} ${c2[0]} ${c2[1]} ${tipX} ${endY}`;
    const fullD = `M ${points[0][0]} ${points[0][1]} ` + segs.map((sg) => sg.d).join(' ') + ' ' + turnD;

    spine.setAttribute('viewBox', `0 0 ${width} ${height}`);
    spine.setAttribute('width', width);
    spine.setAttribute('height', height);
    spine.textContent = '';

    // Reveal: the line runs straight down until the final turn, so a clip
    // rectangle following the tip reveals exactly what has been drawn; the turn
    // into the arrow then draws by length (dash offset).
    const defs = el('defs', {});
    const glow = el('radialGradient', { id: 'method-v-glow' });
    glow.appendChild(el('stop', { offset: '0%', 'stop-color': 'currentColor', 'stop-opacity': '0.55' }));
    glow.appendChild(el('stop', { offset: '100%', 'stop-color': 'currentColor', 'stop-opacity': '0' }));
    defs.appendChild(glow);
    const clipPath = el('clipPath', { id: 'method-v-clip', clipPathUnits: 'userSpaceOnUse' });
    const clip = el('rect', { x: -60, y: 0, width: width + 120, height: 0 });
    clipPath.appendChild(clip);
    defs.appendChild(clipPath);
    // Unrendered copy of the whole route, used only for measuring.
    const routePath = el('path', { d: fullD, fill: 'none' });
    defs.appendChild(routePath);
    spine.appendChild(defs);

    const line = el('g', { class: 'method-v__line' });
    const down = el('g', { 'clip-path': 'url(#method-v-clip)' });
    segs.forEach((sg) => down.appendChild(el('path', { d: `M ${sg.from[0]} ${sg.from[1]} ${sg.d}`, class: sg.dashed ? 'is-dashed' : '' })));
    line.appendChild(down);
    const turn = el('path', { d: `M ${crestX} ${turnY} ${turnD}` });
    line.appendChild(turn);
    spine.appendChild(line);

    const total = routePath.getTotalLength();
    const turnTotal = turn.getTotalLength();
    turn.setAttribute('stroke-dasharray', `${turnTotal} ${turnTotal + 20}`);
    turn.setAttribute('stroke-dashoffset', turnTotal);

    // Sample the path once. `d` is the scroll distance that draws up to each
    // sample: its y while the line runs down, then y plus part of the distance
    // travelled along the final sweep, so the arrow arrives without a long scroll.
    const samples = [];
    const turnLen = (() => {
      // first length at which the path reaches turnY
      let lo = 0, hi = total;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (routePath.getPointAtLength(mid).y < turnY) lo = mid; else hi = mid;
      }
      return hi;
    })();
    for (let len = 0; ; len = Math.min(total, len + 3)) {
      const pt = routePath.getPointAtLength(len);
      const d = len <= turnLen ? pt.y : turnY + (len - turnLen) * 0.55;
      samples.push({ len, x: pt.x, y: pt.y, d });
      if (len >= total) break;
    }
    const lenAtY = (y) => {
      const sm = samples.find((p) => p.y >= y - 0.5 && p.len <= turnLen + 1);
      return sm ? sm.len : total;
    };

    // Start glow, station dots and the arrowhead appear as the line reaches them.
    const marks = [];
    const start = el('g', { class: 'method-v__mark' });
    start.appendChild(el('circle', { cx, cy: startY, r: 14, fill: 'url(#method-v-glow)' }));
    start.appendChild(el('circle', { cx, cy: startY, r: 4.5, class: 'method-v__dot' }));
    spine.appendChild(start);
    marks.push({ node: start, len: 0 });
    stops.forEach((y) => {
      const g = el('g', { class: 'method-v__mark' });
      g.appendChild(el('circle', { cx, cy: y, r: 11, fill: 'url(#method-v-glow)' }));
      g.appendChild(el('circle', { cx, cy: y, r: 4.5, class: 'method-v__dot' }));
      spine.appendChild(g);
      marks.push({ node: g, len: lenAtY(y) });
    });
    const arrow = el('g', { class: 'method-v__mark' });
    // Arrowhead follows the direction the sweep arrives in.
    const ux = tipX - c2[0], uy = endY - c2[1], ul = Math.hypot(ux, uy) || 1;
    const dx = ux / ul, dy = uy / ul;
    const wing = (side) => `${tipX - 9 * dx + side * 5.5 * -dy} ${endY - 9 * dy + side * 5.5 * dx}`;
    arrow.appendChild(el('path', { d: `M ${wing(1)} L ${tipX} ${endY} L ${wing(-1)}`, class: 'method-v__arrow' }));
    spine.appendChild(arrow);
    marks.push({ node: arrow, len: total - 1 });

    // The travelling tip: a soft halo with a bright core.
    const tip = el('g', { class: 'method-v__tip' });
    tip.appendChild(el('circle', { cx: 0, cy: 0, r: 13, fill: 'url(#method-v-glow)' }));
    tip.appendChild(el('circle', { cx: 0, cy: 0, r: 4, class: 'method-v__dot' }));
    spine.appendChild(tip);

    // A stage starts revealing as the line nears its illustration, and its
    // number lights up when the tip reaches the station beside it.
    const reveals = vStages.map((li) => relTop(li, box.top) - 24);
    const startReveal = vStart ? relTop(vStart, box.top) - 40 : 0;

    // The sign-off starts writing itself while the arrow is still sweeping in.
    const endReveal = turnLen + turnTotal * 0.4;

    geo = { height, total, samples, route: routePath, clip, turn, turnLen, turnY, turnTotal, tip, marks, reveals, reached: stops, startReveal, endReveal };
  }

  function updateVertical() {
    if (!geo) buildSpine();
    if (!geo) return;
    const rect = vertical.getBoundingClientRect();
    // The fill tip sits at 75% of the viewport height (the desktop start line).
    const fill = reduce ? Infinity : window.innerHeight * 0.75 - rect.top;

    // Drawn length for this scroll distance (samples are ordered by d).
    const sm = geo.samples;
    let len;
    if (fill <= sm[0].d) len = 0;
    else if (fill >= sm[sm.length - 1].d) len = geo.total;
    else {
      let i = 1;
      while (sm[i].d < fill) i++;
      const a = sm[i - 1], b = sm[i];
      len = a.len + (b.len - a.len) * ((fill - a.d) / ((b.d - a.d) || 1));
    }
    const pt = geo.route.getPointAtLength(len);
    if (len <= geo.turnLen) {
      geo.clip.setAttribute('height', len > 0 ? pt.y : 0);
      geo.turn.setAttribute('stroke-dashoffset', geo.turnTotal);
    } else {
      geo.clip.setAttribute('height', geo.turnY + 1);
      geo.turn.setAttribute('stroke-dashoffset', Math.max(0, geo.turnTotal - (len - geo.turnLen)));
    }

    const moving = len > 0.5 && len < geo.total - 0.5;
    geo.tip.classList.toggle('is-visible', moving && !reduce);
    if (moving) geo.tip.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    geo.marks.forEach((m) => m.node.classList.toggle('is-visible', len >= m.len - 1 && (len > 0 || reduce)));
    if (vStart) vStart.classList.toggle('is-visible', fill >= geo.startReveal);
    vStages.forEach((li, i) => {
      li.classList.toggle('is-visible', fill >= geo.reveals[i]);
      li.classList.toggle('is-reached', fill >= geo.reached[i] - 2);
    });
    if (vEnd) vEnd.classList.toggle('is-visible', len >= geo.endReveal);
  }

  /* ── Shared scroll loop ──────────────────────────────────────────────── */
  let queued = false;
  let near = true;

  function update() {
    queued = false;
    if (stacked.matches) {
      if (vertical) updateVertical();
    } else if (horizontal) {
      updateHorizontal();
    }
  }

  function requestUpdate() {
    if (near && !queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }

  // Only do work while the section is near the viewport.
  const section = (vertical || horizontal).closest('section') || vertical || horizontal;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      near = entries[0].isIntersecting;
      if (near) requestUpdate();
    }, { rootMargin: '50% 0px 50% 0px' }).observe(section);
  }

  function relayout() {
    geo = null;
    near = true;
    requestUpdate();
  }

  // Mobile browsers fire resize while the URL bar collapses; only a width
  // change can move the stages, so ignore height-only resizes.
  let lastWidth = window.innerWidth;
  function onResize() {
    if (window.innerWidth === lastWidth) return requestUpdate();
    lastWidth = window.innerWidth;
    relayout();
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', onResize);
  stacked.addEventListener('change', relayout);
  // Images are lazy; redraw the spine once each one has its real size.
  if (vertical) {
    vertical.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', relayout, { once: true });
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  update();
})();
