/**
 * resources.js
 * Implements the drag-driven tactile physical deck for the ACEIIIT Resources Section.
 */

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.resources-section');
  const deck = document.querySelector('#res-deck');
  
  if (!section || !deck) return;
  
  const items = Array.from(deck.querySelectorAll('.res-deck-item'));
  const tabs = Array.from(document.querySelectorAll('.res-tab-state'));
  
  let currentIndex = 0;
  const maxIndex = items.length - 1;
  
  // Drag State
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let startTime = 0;
  
  // We need to keep a reference to the currently active card for dragging
  let activeCardElement = null;
  
  let isHovered = false;

  // --- AUTOPLAY STATE ---
  let autoplayTimer = null;
  const AUTOPLAY_DELAY = 3000; // 3 seconds

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setTimeout(() => {
      if (!isDragging && !isHovered && activeCardElement) {
        // Automatically throw left and advance
        activeCardElement.setAttribute('data-state', 'passed-left');
        currentIndex = (currentIndex < maxIndex) ? currentIndex + 1 : 0;
        renderState();
        startAutoplay(); // Schedule next
      } else if (isHovered || isDragging) {
        // If hovered or dragging when the timer fires, just reschedule
        startAutoplay();
      }
    }, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // --- STATE RENDERER ---
  function renderState() {
    let stackCounter = 1;
    items.forEach((item) => {
      const idx = parseInt(item.getAttribute('data-index'), 10);
      
      // Clear any manual drag styles
      item.style.transform = '';
      item.classList.remove('dragging');
      
      if (idx > currentIndex) {
        // Still in stack
        item.setAttribute('data-state', 'stack');
        item.setAttribute('data-relative-index', stackCounter.toString());
        stackCounter++;
      } else if (idx === currentIndex) {
        // Currently active
        item.setAttribute('data-state', 'active');
        item.removeAttribute('data-relative-index');
        activeCardElement = item;
      } else {
        // Passed (maintain its thrown direction if it has one)
        const currentState = item.getAttribute('data-state');
        if (currentState !== 'passed-left' && currentState !== 'passed-right') {
          item.setAttribute('data-state', 'passed-left');
        }
        item.removeAttribute('data-relative-index');
      }
    });

    // Update Tabs
    tabs.forEach((tab, idx) => {
      if (idx === currentIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // --- DRAG / SWIPE PHYSICS ---
  deck.addEventListener('pointerdown', (e) => {
    if (!activeCardElement || e.button !== 0) return;
    
    stopAutoplay(); // Pause autoplay while interacting
    
    isDragging = true;
    startX = e.clientX;
    currentX = startX;
    startTime = performance.now();
    
    activeCardElement.classList.add('dragging');
    deck.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('pointermove', (e) => {
    if (!isDragging || !activeCardElement) return;
    
    currentX = e.clientX;
    const deltaX = (currentX - startX) / 0.65;
    
    const rotate = deltaX * 0.05; 
    activeCardElement.style.transform = `translate3d(${deltaX}px, -30px, 40px) rotateZ(${rotate}deg) scale(1.05)`;
  });

  document.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    deck.style.cursor = 'grab';
    
    const deltaX = (currentX - startX) / 0.65;
    const deltaTime = performance.now() - startTime;
    const velocity = Math.abs(deltaX) / deltaTime; 
    
    const SWIPE_THRESHOLD = 100; 
    const VELOCITY_THRESHOLD = 0.5;
    
    if (deltaX < -SWIPE_THRESHOLD || (deltaX < 0 && velocity > VELOCITY_THRESHOLD)) {
      // Swiped Left -> Throw left and advance
      activeCardElement.setAttribute('data-state', 'passed-left');
      currentIndex = (currentIndex < maxIndex) ? currentIndex + 1 : 0;
    } else if (deltaX > SWIPE_THRESHOLD || (deltaX > 0 && velocity > VELOCITY_THRESHOLD)) {
      // Swiped Right -> Throw right and advance
      activeCardElement.setAttribute('data-state', 'passed-right');
      currentIndex = (currentIndex < maxIndex) ? currentIndex + 1 : 0;
    }
    
    if (activeCardElement) {
      activeCardElement.classList.remove('dragging');
      activeCardElement.style.transform = ''; 
    }
    
    renderState();
    startAutoplay(); // Resume autoplay after interaction
  });

  // Set initial cursor
  deck.style.cursor = 'grab';
  
  // Pause autoplay on hover, resume on leave
  deck.addEventListener('pointerenter', () => {
    isHovered = true;
    stopAutoplay();
  });
  deck.addEventListener('pointerleave', () => {
    isHovered = false;
    if (!isDragging) {
      startAutoplay();
    }
  });
  
  // --- HOVER PARALLAX (Only applied if not dragging) ---
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;

    deck.addEventListener('mouseleave', () => { 
      targetRotateX = 0;
      targetRotateY = 0;
    });

    deck.addEventListener('mousemove', (e) => {
      if (isDragging) return; // Disable parallax while physically dragging the card
      
      const rect = deck.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const normalizedX = (e.clientX - centerX) / (rect.width / 2);
      const normalizedY = (e.clientY - centerY) / (rect.height / 2);
      
      targetRotateX = -normalizedY * 1.5; 
      targetRotateY = normalizedX * 1.5;
    });

    function animateParallax() {
      currentRotateX += (targetRotateX - currentRotateX) * 0.1;
      currentRotateY += (targetRotateY - currentRotateY) * 0.1;

      // Only apply to the deck if we aren't dragging
      if (!isDragging) {
        deck.style.transform = `
          rotateX(${currentRotateX}deg)
          rotateY(${currentRotateY}deg)
        `;
      }
      
      requestAnimationFrame(animateParallax);
    }
    animateParallax();
  }

  // Initialize
  renderState();
  startAutoplay();
});
