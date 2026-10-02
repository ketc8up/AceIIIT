export function initAceIIITMethod(section) {
  if (!section) return;

  const journey = section.querySelector('[data-method-journey]');
  const stages = [...section.querySelectorAll('[data-method-stage]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const thresholds = [0.035, 0.28, 0.52, 0.74, 0.88];

  function update() {
    const rect = section.getBoundingClientRect();
    const distance = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / distance));

    if (journey) {
      journey.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
    }

    stages.forEach((stage, index) => {
      stage.classList.toggle(
        'is-visible',
        reduce || progress >= thresholds[index]
      );
    });
  }

  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
}
