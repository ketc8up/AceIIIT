document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.system-nav-item');
  const visuals = document.querySelectorAll('.system-visual');

  if (tabs.length > 0 && visuals.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all tabs and visuals
        tabs.forEach(t => t.classList.remove('active'));
        visuals.forEach(v => v.classList.remove('active'));

        // Add active to clicked tab
        tab.classList.add('active');

        // Find target visual and activate
        const targetId = tab.getAttribute('data-target');
        const targetVisual = document.getElementById(`visual-${targetId}`);
        
        if (targetVisual) {
          targetVisual.classList.add('active');
        }
      });
    });
  }

  // Why ACEIIIT Section Animation
  const whyElements = document.querySelectorAll('.why-anim-element');
  
  if (whyElements.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const whyObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    });

    whyElements.forEach(el => {
      whyObserver.observe(el);
    });
  } else {
    // If reduced motion is preferred or no intersection observer, just make them visible
    whyElements.forEach(el => el.classList.add('is-visible'));
  }
});
