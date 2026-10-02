document.addEventListener('DOMContentLoaded', () => {
  const paperLayer = document.getElementById('entry-layer-paper');
  const inkLayer = document.getElementById('entry-layer-ink');
  const svgLayer = document.getElementById('entry-layer-svg');
  const skipBtn = document.getElementById('entry-skip');
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeenCinematic = sessionStorage.getItem('aceiiit_seen_cinematic');

  const cleanupLayers = () => {
    if (paperLayer && paperLayer.parentNode) paperLayer.remove();
    if (inkLayer && inkLayer.parentNode) inkLayer.remove();
    if (svgLayer && svgLayer.parentNode) svgLayer.remove();
    if (skipBtn && skipBtn.parentNode) skipBtn.remove();
    document.body.className = document.body.className.replace(/\bstate-[^\s]+\b/g, '');
  };

  const playHeroEntrance = () => {
    cleanupLayers();
    document.body.classList.add('state-hero-animating');
    setTimeout(() => {
      document.body.classList.remove('state-hero-animating');
    }, 3000);
  };

  const skipCinematic = () => {
    cleanupLayers();
  };

  if (prefersReducedMotion) {
    skipCinematic();
    return;
  }

  // --- LOGIC FOR REFRESHES VS FIRST LOAD ---
  if (hasSeenCinematic) {
    // Show SVG Loader, remove Cinematic
    if (paperLayer) paperLayer.remove();
    if (inkLayer) inkLayer.remove();
    if (skipBtn) skipBtn.remove();
    
    // SVG Loader takes 3s
    setTimeout(() => {
      // Fade out SVG Layer
      if (svgLayer) {
        svgLayer.style.transition = "opacity 0.6s ease";
        svgLayer.style.opacity = "0";
        setTimeout(() => {
          playHeroEntrance();
        }, 600);
      } else {
        playHeroEntrance();
      }
    }, 3000);
    return;
  }

  // FIRST TIME SESSION: Play Cinematic Loader
  if (svgLayer) svgLayer.remove(); // Remove SVG loader
  sessionStorage.setItem('aceiiit_seen_cinematic', 'true');

  let currentState = '';
  let isSkipped = false;
  let sequenceTimeout = null;

  const setState = (newState) => {
    if (isSkipped) return;
    if (currentState) {
      document.body.classList.remove(`state-${currentState}`);
    }
    if (newState) {
      document.body.classList.add(`state-${newState}`);
    }
    currentState = newState;
  };

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      isSkipped = true;
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
      playHeroEntrance();
    });
  }

  const step = (duration, stateStr, callback) => {
    if (isSkipped) return;
    setState(stateStr);
    sequenceTimeout = setTimeout(() => {
      if (!isSkipped && callback) callback();
    }, duration);
  };

  const runSequence = () => {
    step(1000, 'entry-init', () => { // 1. Opening
      step(800, '', () => { // fade out
        step(800, 'word-1', () => { // 2. READY
          step(800, '', () => { // fade out
            step(800, 'word-2', () => { // 3. FOCUSED
              step(800, '', () => { // fade out
                step(800, 'word-3', () => { // 4. PREPARED
                  step(2800, 'ink-reveal', () => { // 5. Paper sweeps up
                    step(1200, 'statement', () => { // 6. Ink statement
                      step(2400, 'product', () => { // 7. Product fragments (extended hold time)
                        step(2600, 'hero-reveal', () => { // 8. Ink sweeps up
                          playHeroEntrance(); // 9. Finish
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  setTimeout(runSequence, 100);
});
