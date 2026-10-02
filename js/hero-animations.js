document.addEventListener('DOMContentLoaded', () => {
  const options = document.querySelectorAll('.preview-option');
  if (options.length === 0) return;

  const timerEl = document.querySelector('.preview-timer');
  let secondsLeft = 6137; // 01:42:17 in seconds
  let timerInterval;

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    timerInterval = setInterval(() => {
      secondsLeft--;
      if (timerEl) {
        timerEl.textContent = formatTime(secondsLeft);
      }
    }, 1000);
  };

  startTimer();

  // Simulate user interacting with the mock UI
  let currentIndex = 0;
  const selectNextOption = () => {
    options.forEach(opt => opt.classList.remove('selected'));
    options[currentIndex].classList.add('selected');
    
    // Move to random next option after 2-4 seconds
    currentIndex = Math.floor(Math.random() * options.length);
    setTimeout(selectNextOption, 2000 + Math.random() * 2000);
  };

  // Start interaction after a short delay
  setTimeout(selectNextOption, 1500);

  // Dynamic Year Updater
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // If we are past June (month index 5), the target UGEE exam is next year.
  const targetYear = currentMonth > 5 ? currentYear + 1 : currentYear;
  document.querySelectorAll('.dynamic-year').forEach(el => {
    el.textContent = targetYear;
  });
});

// Sticky header scroll enhancement
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }, { passive: true });
}
