(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const reveals = document.querySelectorAll('.manifesto-reveal');
    if (!reveals.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      reveals.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px"
    });

    reveals.forEach(el => observer.observe(el));
  });
})();
