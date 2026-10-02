/* ==========================================================================
   ACE BUCKET — SVG Bucket Component (translated from bucket.tsx)
   Interactive course selection + animated chip cycling + lid close
   ========================================================================== */
(function () {
  'use strict';

  /* ── Course data ── */
  const COURSES = [
    {
      id: 'class-notes',
      icon: '🎓',
      tag: 'FULL COURSE',
      title: 'Class + Notes',
      desc: 'Live classes with UGEE faculty + complete notes bundle',
      price: 1499,
    },
    {
      id: 'mock-tests',
      icon: '📝',
      tag: 'MOCK TESTS',
      title: 'Paid Mock Series',
      desc: '2 free on signup + 4 full-length UGEE mocks with analytics',
      price: 599,
    },
    {
      id: 'interview',
      icon: '🎙️',
      tag: 'INTERVIEW PREP',
      title: 'Interview Guidance',
      desc: 'PI prep, portfolio review, SOP + mock interviews',
      price: 699,
    },
  ];

  const BONUS = {
    id: 'study-material',
    icon: '📚',
    title: 'Study Material',
    desc: 'Complete topic-wise PDF notes — free from AceIIIT',
    price: 0,
  };

  /* ── SVG bucket template (translated from bucket.tsx) ──
     655×352 viewBox, AceIIIT palette applied                */
  const BUCKET_SVG = `
    <!-- Realistic 3D SVG Cardboard Box -->
    <div class="scene" style="perspective: 1500px; width: 100%; height: 100%; position: absolute; inset: 0; z-index: 10;">
      <svg id="aceiiit-cardboard-box-animation" width="100%" height="100%" viewBox="0 0 655 352" 
           style="overflow:visible; transform-style: preserve-3d; pointer-events: none;">
        
        <g id="box-scene" style="transform-style: preserve-3d; transform: translate(327px, 210px) rotateX(60deg) rotateZ(35deg); transition: transform 0.4s ease-out;">
          
          <g id="box-body" style="transform-style: preserve-3d;">
            <!-- Bottom -->
            <rect x="-100" y="-120" width="200" height="240" fill="#dfd3c3" />
            <!-- Back Face -->
            <g style="transform-origin: 0px -120px; transform: rotateX(-90deg);">
              <rect x="-100" y="-150" width="200" height="150" fill="#d1c2ab" />
            </g>
            <!-- Front Face -->
            <g style="transform-origin: 0px 120px; transform: rotateX(90deg);">
              <rect x="-100" y="0" width="200" height="150" fill="#fffaf0" />
            </g>
            <!-- Left Face -->
            <g style="transform-origin: -100px 0px; transform: rotateY(-90deg);">
              <rect x="-150" y="-120" width="150" height="240" fill="#e8dcce" />
            </g>
            <!-- Right Face -->
            <g style="transform-origin: 100px 0px; transform: rotateY(90deg);">
              <rect x="0" y="-120" width="150" height="240" fill="#f4efe6" />
            </g>
          </g>

          <!-- Contents / Chips -->
          <g id="contents" style="transform: translateZ(20px); transition: transform 0.3s cubic-bezier(.22,.75,.2,1);">
            <foreignObject x="-100" y="-120" width="200" height="240">
              <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div class="bucket-chip-area" style="position: relative; z-index: 10; transform: rotateZ(-35deg) rotateX(-60deg) translateY(-20px) scale(1.1); pointer-events: auto;">
                  <div class="bucket-chip-stage"></div>
                </div>
              </div>
            </foreignObject>
          </g>

          <!-- Flaps -->
          <g id="flap-back" style="transform-style: preserve-3d; transform-origin: 0px -120px; transform: translateZ(150px) rotateX(30deg); transition: transform 0.6s cubic-bezier(.22,.75,.2,1);">
            <rect x="-100" y="-220" width="200" height="100" fill="#d0b470" />
          </g>
          <g id="flap-left" style="transform-style: preserve-3d; transform-origin: -100px 0px; transform: translateZ(150px) rotateY(30deg); transition: transform 0.55s cubic-bezier(.22,.75,.2,1);">
            <rect x="-200" y="-120" width="100" height="240" fill="#e0c788" />
          </g>
          <g id="flap-right" style="transform-style: preserve-3d; transform-origin: 100px 0px; transform: translateZ(150px) rotateY(-30deg); transition: transform 0.55s cubic-bezier(.22,.75,.2,1);">
            <rect x="100" y="-120" width="100" height="240" fill="#d5ba75" />
          </g>
          <g id="flap-front" style="transform-style: preserve-3d; transform-origin: 0px 120px; transform: translateZ(150px) rotateX(-30deg); transition: transform 0.6s cubic-bezier(.22,.75,.2,1);">
            <rect x="-100" y="120" width="200" height="100" fill="#c5a028" />
          </g>
          <g id="box-lid" style="transform-style: preserve-3d; transform-origin: 0px -120px; transform: translateZ(150px) rotateX(40deg); transition: transform 0.75s cubic-bezier(.22,.75,.2,1);">
            <rect x="-102" y="-362" width="204" height="242" fill="#dcae3d" />
            <!-- Tuck tab -->
            <g style="transform-origin: 0px -362px; transform: rotateX(-90deg);">
              <rect x="-100" y="-412" width="200" height="50" fill="#b38a22" />
            </g>
          </g>

          <!-- Straps -->
          <g id="strap-left" style="transform-origin: -50px 120px; transform: translateZ(151px) scaleY(0); transition: transform 0.45s ease;">
            <rect x="-80" y="105" width="40" height="30" fill="rgba(255,255,255,0.75)" />
          </g>
          <g id="strap-right" style="transform-origin: 50px 120px; transform: translateZ(151px) scaleY(0); transition: transform 0.4s ease;">
            <rect x="40" y="105" width="40" height="30" fill="rgba(255,255,255,0.75)" />
          </g>

        </g>
      </svg>
    </div>

    <!-- === LAYER 2: Empty label === -->
    <div class="bucket-empty-label" style="z-index: 25; transform: translateY(40px);">
      <span class="bucket-empty-icon">📦</span>
      <span class="bucket-empty-text">Select courses<br>to fill your box</span>
    </div>

    <!-- === LAYER 3: Course counter badge === -->
    <div class="bucket-counter" id="pkg-counter" style="z-index: 30; transform: translate(50px, -20px);">0</div>
  `;

  /* ── State ── */
  let selectedIds = new Set();
  let packingState = 'idle'; // idle, packing, packed, checkout-ready
  let chipCycleTimer = null;
  let chipIndex = 0;
  let currentChipEl = null;

  /* ── DOM refs (populated by buildHTML) ── */
  let wrapperEl, chipStageEl, counterEl;
  let summaryRowsEl, summaryEmptyEl, summaryTotalEl;
  let continueBtn;
  let cardEls = {};
  let paymentOverlay;
  let flapFront, flapBack, flapLeft, flapRight, boxLid, strapLeft, strapRight, contentsEl, boxScene;
  let bonusNoticeEl;

  /* ── Init ── */
  function init() {
    const section = document.getElementById('packages');
    if (!section) return;
    buildHTML(section);
    bindEvents();
    setupObserver(section);
  }

  /* ════════════════════════════════════════
     BUILD HTML
     ════════════════════════════════════════ */
  function buildHTML(section) {
    const container = section.querySelector('.pkg-container');
    if (!container) return;

    container.innerHTML = `
      <div class="pkg-top-bar">
        <div>05 / CHOOSE YOUR PREPARATION</div>
        <div class="pkg-top-line"></div>
      </div>

      <div class="pkg-header">
        <h2 class="pkg-headline">Pack your<br>preparation.</h2>
        <p class="pkg-sub">Select what you need — study material is dropped in the box free, on us.</p>
      </div>

      <div class="pkg-studio">

        <!-- Left: course cards -->
        <div class="pkg-cards-left">
          <div class="pkg-cards-label">Select your courses</div>
          <div class="pkg-cards-grid" id="pkg-cards-grid"></div>

          <!-- Bonus notice -->
          <div class="pkg-bonus-notice" id="pkg-bonus-notice">
            <div class="bonus-icon">🎁</div>
            <div class="bonus-text">
              <span class="bonus-title">Study Material — Free</span>
              <span class="bonus-desc">Complete notes auto-added at checkout. Compliments of AceIIIT.</span>
            </div>
            <div class="bonus-badge">FREE</div>
          </div>
        </div>

        <!-- Right: SVG bucket + summary -->
        <div class="pkg-box-column" id="pkg-box-column">

          <!-- SVG Bucket (from bucket.tsx) -->
          <div class="ace-bucket-wrapper" id="ace-bucket-wrapper">
            ${BUCKET_SVG}
          </div>

          <!-- Summary -->
          <div class="pkg-summary" id="pkg-summary">
            <div class="pkg-summary-empty" id="pkg-summary-empty">No courses selected</div>
            <div id="pkg-summary-rows"></div>
            <div class="pkg-summary-row is-total" id="pkg-summary-total" style="display:none">
              <span>Total</span>
              <span class="pkg-summary-total-val" id="pkg-total-val">₹0</span>
            </div>
          </div>

          <!-- Continue -->
          <button class="pkg-continue-btn" id="pkg-continue-btn" disabled>
            <span id="pkg-btn-label">Select a course to continue</span>
            <span class="btn-arrow-icon">→</span>
          </button>

          <div class="pkg-box-hint">Study material drops in free at checkout ✦</div>
        </div>
      </div>
    `;

    /* Build course cards */
    const grid = container.querySelector('#pkg-cards-grid');
    COURSES.forEach(course => {
      const card = document.createElement('div');
      card.className = 'pkg-course-card';
      card.dataset.id = course.id;
      card.innerHTML = `
        <div class="card-checkbox">
          <svg viewBox="0 0 12 10" fill="none" stroke="#1a150f" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1,5 4,8 11,1"/>
          </svg>
        </div>
        <div class="card-icon-badge">${course.icon}</div>
        <div class="card-content">
          <div class="card-tag">${course.tag}</div>
          <div class="card-title">${course.title}</div>
          <div class="card-desc">${course.desc}</div>
        </div>
        <div class="card-price-tag">
          <div class="card-price-amount">₹${course.price}</div>
          <div class="card-price-period">one-time</div>
        </div>
      `;
      grid.appendChild(card);
      cardEls[course.id] = card;
    });

    /* Grab refs */
    wrapperEl     = container.querySelector('#ace-bucket-wrapper');
    chipStageEl   = container.querySelector('.bucket-chip-stage');
    counterEl     = container.querySelector('#pkg-counter');
    summaryRowsEl = container.querySelector('#pkg-summary-rows');
    summaryEmptyEl= container.querySelector('#pkg-summary-empty');
    summaryTotalEl= container.querySelector('#pkg-summary-total');
    continueBtn   = container.querySelector('#pkg-continue-btn');
    bonusNoticeEl = container.querySelector('#pkg-bonus-notice');
    flapFront = container.querySelector('#flap-front');
    flapBack = container.querySelector('#flap-back');
    flapLeft = container.querySelector('#flap-left');
    flapRight = container.querySelector('#flap-right');
    boxLid = container.querySelector('#box-lid');
    strapLeft = container.querySelector('#strap-left');
    strapRight = container.querySelector('#strap-right');
    contentsEl = container.querySelector('#contents');
    boxScene = container.querySelector('#box-scene');

    buildPaymentOverlay();
  }

  /* ════════════════════════════════════════
     CHIP CYCLING (like AnimatePresence in bucket.tsx)
     Shows selected course chips one at a time, cycling every 2s
     ════════════════════════════════════════ */
  function getSelectedList() {
    return COURSES.filter(c => selectedIds.has(c.id));
  }

  function buildChipEl(course) {
    const chip = document.createElement('div');
    chip.className = 'bucket-chip';
    chip.innerHTML = `
      <div class="chip-icon-wrap">${course.icon}</div>
      <div class="chip-text">
        <div class="chip-title">${course.title}</div>
        <div class="chip-price">₹${course.price}</div>
      </div>
    `;
    return chip;
  }

  function showChip(course, dir = 'enter') {
    /* Remove old chip */
    if (currentChipEl) {
      const old = currentChipEl;
      old.classList.remove('chip-enter');
      old.classList.add('chip-exit');
      setTimeout(() => old.remove(), 500);
      currentChipEl = null;
    }

    if (!course) return;

    /* Create new chip */
    const chip = buildChipEl(course);
    chip.classList.add('chip-enter');
    chipStageEl.appendChild(chip);
    currentChipEl = chip;
  }

  function startCycling() {
    stopCycling();
    const list = getSelectedList();
    if (list.length === 0) { showChip(null); return; }

    chipIndex = chipIndex % list.length;
    showChip(list[chipIndex]);

    if (list.length > 1) {
      chipCycleTimer = setInterval(() => {
        const lst = getSelectedList();
        if (lst.length === 0) { stopCycling(); return; }
        chipIndex = (chipIndex + 1) % lst.length;
        showChip(lst[chipIndex]);
      }, 2000);
    }
  }

  function stopCycling() {
    if (chipCycleTimer) { clearInterval(chipCycleTimer); chipCycleTimer = null; }
  }

  /* ════════════════════════════════════════
     SELECT / DESELECT
     ════════════════════════════════════════ */
  function dropChipOnSelect(course) {
    if (!chipStageEl) return;
    const chip = buildChipEl(course);
    chip.classList.add('chip-drop');
    chipStageEl.appendChild(chip);

    setTimeout(() => {
      if (chip.parentNode) chip.remove();
    }, 600);
  }

  function select(id) {
    selectedIds.add(id);
    cardEls[id].classList.add('is-selected');
    updateBox();
    updateSummary();
    updateButton();
    startCycling();
    
    // Animate a chip dropping into the box
    const course = COURSES.find(c => c.id === id);
    if (course) dropChipOnSelect(course);
  }

  function deselect(id) {
    selectedIds.delete(id);
    cardEls[id].classList.remove('is-selected');
    updateBox();
    updateSummary();
    updateButton();
    chipIndex = 0;
    startCycling();
  }

  function updateBox() {
    const has = selectedIds.size > 0;
    wrapperEl.classList.toggle('has-items', has);
    counterEl.textContent = selectedIds.size;
  }

  /* ════════════════════════════════════════
     SUMMARY
     ════════════════════════════════════════ */
  function updateSummary() {
    summaryRowsEl.innerHTML = '';

    if (selectedIds.size === 0) {
      summaryEmptyEl.style.display = 'block';
      summaryTotalEl.style.display = 'none';
      return;
    }

    summaryEmptyEl.style.display = 'none';
    let total = 0;

    selectedIds.forEach(id => {
      const c = COURSES.find(x => x.id === id);
      if (!c) return;
      total += c.price;
      const row = document.createElement('div');
      row.className = 'pkg-summary-row';
      row.innerHTML = `<span>${c.icon} ${c.title}</span><span>₹${c.price}</span>`;
      summaryRowsEl.appendChild(row);
    });

    /* Bonus row */
    const bonusRow = document.createElement('div');
    bonusRow.className = 'pkg-summary-row pkg-summary-bonus';
    bonusRow.innerHTML = `<span>${BONUS.icon} ${BONUS.title}</span><span class="bonus-free-tag">FREE</span>`;
    summaryRowsEl.appendChild(bonusRow);

    summaryTotalEl.style.display = 'flex';
    document.getElementById('pkg-total-val').textContent = '₹' + total;
  }

  function updateButton() {
    const lbl = document.getElementById('pkg-btn-label');
    if (selectedIds.size === 0) {
      continueBtn.disabled = true;
      lbl.textContent = 'Select a course to continue';
    } else {
      continueBtn.disabled = false;
      lbl.textContent = `Continue — ₹${getTotalPrice()}`;
    }
  }

  function getTotalPrice() {
    let t = 0;
    selectedIds.forEach(id => { const c = COURSES.find(x => x.id === id); if(c) t += c.price; });
    return t;
  }

  /* ════════════════════════════════════════
     EVENTS
     ════════════════════════════════════════ */
  function bindEvents() {
    Object.values(cardEls).forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        selectedIds.has(id) ? deselect(id) : select(id);
      });
    });

    continueBtn.addEventListener('click', () => {
      if (continueBtn.disabled || packingState !== 'idle') return;
      triggerPackSequence();
    });
  }

  /* ════════════════════════════════════════
     PACKING SEQUENCE
     ════════════════════════════════════════ */
  function triggerPackSequence() {
    if (packingState !== 'idle') return;
    packingState = 'packing';
    continueBtn.disabled = true;
    stopCycling();

    const lbl = document.getElementById('pkg-btn-label');
    lbl.textContent = 'Packing your order…';

    if (bonusNoticeEl) {
      bonusNoticeEl.classList.remove('is-pulsing');
      void bonusNoticeEl.offsetWidth;
      bonusNoticeEl.classList.add('is-pulsing');
    }

    /* REDUCED MOTION */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyFinalPackedState();
      finalizeCheckout();
      return;
    }

    /* 0.00–0.30: Contents settle */
    if (contentsEl) contentsEl.style.transform = 'translateZ(5px) scale(0.95)';

    /* 0.30–0.90: Back flap closes */
    setTimeout(() => {
      if (flapBack) flapBack.style.transform = 'translateZ(150px) rotateX(180deg)';
    }, 300);

    /* 0.80–1.35: Left flap closes */
    setTimeout(() => {
      if (flapLeft) flapLeft.style.transform = 'translateZ(150px) rotateY(180deg)';
    }, 800);

    /* 1.15–1.70: Right flap closes */
    setTimeout(() => {
      if (flapRight) flapRight.style.transform = 'translateZ(150px) rotateY(-180deg)';
    }, 1150);

    /* 1.55–2.15: Front flap closes */
    setTimeout(() => {
      if (flapFront) flapFront.style.transform = 'translateZ(150px) rotateX(-180deg)';
    }, 1550);

    /* 2.05–2.80: Main lid closes */
    setTimeout(() => {
      if (boxLid) boxLid.style.transform = 'translateZ(150px) rotateX(180deg)';
    }, 2050);

    /* 2.70–3.15: Left strap secures */
    setTimeout(() => {
      if (strapLeft) strapLeft.style.transform = 'translateZ(151px) scaleY(1)';
    }, 2700);

    /* 3.00–3.40: Right strap secures */
    setTimeout(() => {
      if (strapRight) strapRight.style.transform = 'translateZ(151px) scaleY(1)';
    }, 3000);

    /* 3.40–3.70: Final settle */
    setTimeout(() => {
      if (boxScene) {
        boxScene.style.transition = 'transform 0.4s ease-out';
        boxScene.style.transform = 'translate(327px, 220px) rotateX(55deg) rotateZ(30deg) translateY(10px)';
      }
    }, 3400);

    /* 3.70+: Packed state */
    setTimeout(() => {
      packingState = 'packed';
      finalizeCheckout();
    }, 3700);
  }

  function applyFinalPackedState() {
    if (contentsEl) contentsEl.style.transform = 'translateZ(5px) scale(0.95)';
    if (flapBack) flapBack.style.transform = 'translateZ(150px) rotateX(180deg)';
    if (flapLeft) flapLeft.style.transform = 'translateZ(150px) rotateY(180deg)';
    if (flapRight) flapRight.style.transform = 'translateZ(150px) rotateY(-180deg)';
    if (flapFront) flapFront.style.transform = 'translateZ(150px) rotateX(-180deg)';
    if (boxLid) boxLid.style.transform = 'translateZ(150px) rotateX(180deg)';
    if (strapLeft) strapLeft.style.transform = 'translateZ(151px) scaleY(1)';
    if (strapRight) strapRight.style.transform = 'translateZ(151px) scaleY(1)';
    if (boxScene) boxScene.style.transform = 'translate(327px, 220px) rotateX(55deg) rotateZ(30deg) translateY(10px)';
    packingState = 'packed';
  }

  function finalizeCheckout() {
    const lbl = document.getElementById('pkg-btn-label');
    lbl.textContent = 'Packed ✓';
    packingState = 'checkout-ready';
    
    setTimeout(() => {
      openPaymentModal();
    }, 600);
  }

  function openLid() {
    packingState = 'idle';
    if (boxScene) boxScene.style.transform = 'translate(327px, 210px) rotateX(60deg) rotateZ(35deg)';
    if (strapLeft) strapLeft.style.transform = 'translateZ(151px) scaleY(0)';
    if (strapRight) strapRight.style.transform = 'translateZ(151px) scaleY(0)';
    if (boxLid) boxLid.style.transform = 'translateZ(150px) rotateX(40deg)';
    if (flapFront) flapFront.style.transform = 'translateZ(150px) rotateX(-30deg)';
    if (flapRight) flapRight.style.transform = 'translateZ(150px) rotateY(-30deg)';
    if (flapLeft) flapLeft.style.transform = 'translateZ(150px) rotateY(30deg)';
    if (flapBack) flapBack.style.transform = 'translateZ(150px) rotateX(30deg)';
    if (contentsEl) contentsEl.style.transform = 'translateZ(20px)';
  }

  /* ════════════════════════════════════════
     PAYMENT MODAL
     ════════════════════════════════════════ */
  function buildPaymentOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'payment-overlay';
    overlay.id = 'payment-overlay';
    overlay.innerHTML = `
      <div class="payment-backdrop" id="payment-backdrop"></div>
      <div class="payment-modal">
        <div class="payment-modal-header">
          <div>
            <div class="payment-modal-eyebrow">Your Preparation Box</div>
            <div class="payment-modal-title">Order Summary</div>
          </div>
          <button class="payment-modal-close" id="payment-close" aria-label="Close">✕</button>
        </div>

        <div class="payment-items-list" id="payment-items-list"></div>

        <!-- Bonus -->
        <div class="payment-bonus-row">
          <div class="payment-bonus-left">
            <span class="payment-bonus-icon">🎁</span>
            <div>
              <div class="payment-bonus-title">Study Material</div>
              <div class="payment-bonus-sub">Complete notes — compliments of AceIIIT</div>
            </div>
          </div>
          <span class="payment-bonus-price">FREE</span>
        </div>

        <div class="payment-divider"></div>

        <div class="payment-total-row">
          <span class="payment-total-label">Total Due</span>
          <span class="payment-total-amount" id="payment-total-amount">₹0</span>
        </div>

        <button class="payment-upi-btn" id="payment-upi-btn">
          <span>🔒</span>
          <span id="payment-btn-text">Pay Now</span>
        </button>

        <div class="payment-secure-note">Secured by Razorpay · SSL Encrypted · No hidden charges</div>
      </div>
    `;
    document.body.appendChild(overlay);
    paymentOverlay = overlay;

    overlay.querySelector('#payment-backdrop').addEventListener('click', closePaymentModal);
    overlay.querySelector('#payment-close').addEventListener('click', closePaymentModal);
    overlay.querySelector('#payment-upi-btn').addEventListener('click', handlePayment);
  }

  function openPaymentModal() {
    const list = paymentOverlay.querySelector('#payment-items-list');
    list.innerHTML = '';
    let total = 0;

    selectedIds.forEach(id => {
      const c = COURSES.find(x => x.id === id);
      if (!c) return;
      total += c.price;
      const row = document.createElement('div');
      row.className = 'payment-item-row';
      row.innerHTML = `
        <span class="payment-item-name"><span>${c.icon}</span><span>${c.title}</span></span>
        <span class="payment-item-price">₹${c.price}</span>
      `;
      list.appendChild(row);
    });

    paymentOverlay.querySelector('#payment-total-amount').textContent = '₹' + total;
    paymentOverlay.querySelector('#payment-btn-text').textContent = `Pay ₹${total}`;
    paymentOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePaymentModal() {
    paymentOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    openLid();
    chipIndex = 0;
    setTimeout(() => startCycling(), 750);
    updateButton();
  }

  function handlePayment() {
    alert(`Redirecting to payment gateway for ₹${getTotalPrice()}…\n\n(Payment integration coming soon)`);
  }

  /* ════════════════════════════════════════
     INTERSECTION OBSERVER
     ════════════════════════════════════════ */
  function setupObserver(section) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    observer.observe(section);
  }

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
