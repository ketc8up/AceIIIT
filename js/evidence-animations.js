document.addEventListener('DOMContentLoaded', () => {
  const pieces = document.querySelectorAll('.editorial-reveal');
  
  if (pieces.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    });

    pieces.forEach(piece => {
      observer.observe(piece);
    });
  } else {
    // Reveal everything if reduced motion is preferred
    pieces.forEach(piece => {
      piece.classList.add('is-revealed');
    });
  }
});
