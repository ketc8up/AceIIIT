document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.exp-step');
  const container = document.getElementById('experience-container');
  const playBtn = document.getElementById('exp-play-btn');

  if (steps.length === 0 || !container) return;

  const states = ['state-exam', 'state-submit', 'state-result', 'state-analysis'];
  let currentStateIndex = 0;
  let autoPlayInterval = null;

  function goToState(index) {
    if (index < 0 || index >= states.length) return;
    
    // Update step UI
    steps.forEach((step, i) => {
      if (i === index) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else if (i < index) {
        step.classList.remove('active');
        step.classList.add('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });

    // Update container classes
    container.classList.remove(...states);
    
    // We add a tiny delay to allow the browser to register the class removal if re-triggering the same animation, 
    // but here we are just switching states.
    container.classList.add(states[index]);
    currentStateIndex = index;
  }

  // Click handlers for manual navigation
  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      stopAutoPlay();
      goToState(index);
    });
  });

  function startAutoPlay() {
    if (autoPlayInterval) return;
    goToState(0); // Restart
    playBtn.classList.add('playing');
    
    let counter = 0;
    // We'll define specific timings for each state if we want, or a flat 3s interval.
    // Flat 3s interval is easier.
    autoPlayInterval = setInterval(() => {
      counter++;
      if (counter >= states.length) {
        stopAutoPlay();
      } else {
        goToState(counter);
      }
    }, 4000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    if(playBtn) playBtn.classList.remove('playing');
  }

  if(playBtn) {
    playBtn.addEventListener('click', () => {
      if (autoPlayInterval) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  // Initialize
  goToState(0);
});
