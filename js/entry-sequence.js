// Links to a section (e.g. /#packages from a "Buy" or "Get Started" button) skip the intro:
// the visitor came for that section. Runs before first paint (this script is in <head>), so the
// intro layers never flash; plain visits to the home page still get the intro.
const ENTRY_TARGET_ID = /^#[A-Za-z][\w-]*$/.test(window.location.hash) ? window.location.hash.slice(1) : '';
if (ENTRY_TARGET_ID) document.documentElement.classList.add('skip-intro');

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

  if (ENTRY_TARGET_ID) {
    const target = document.getElementById(ENTRY_TARGET_ID);
    if (target) {
      skipCinematic();
      try { sessionStorage.setItem('aceiiit_seen_cinematic', 'true'); } catch (e) {}
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
      return;
    }
    document.documentElement.classList.remove('skip-intro');
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
