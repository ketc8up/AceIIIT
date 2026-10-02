document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const curtain = document.createElement("div");
  curtain.className = "theme-curtain";
  document.body.appendChild(curtain);

  const duration = 550;
  const easing = "cubic-bezier(0.76, 0, 0.24, 1)";
  curtain.style.transition = `transform ${duration}ms ${easing}`;

  let isAnimating = false;

  const TOKENS = {
    light: { pageBg: "#f3ecdf" }, // Matches var(--paper)
    dark: { pageBg: "#0e0e0e" }   // Matches var(--paper) in dark mode
  };

  // Check current theme
  let currentTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  
  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark");
    toggleBtn.innerHTML = getSunIcon();
  } else {
    toggleBtn.innerHTML = getMoonIcon();
  }

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isAnimating) return;
    isAnimating = true;

    const nextTheme = currentTheme === "light" ? "dark" : "light";
    curtain.style.background = TOKENS[nextTheme].pageBg;
    
    // Phase 1: falling
    curtain.style.transform = "scaleY(1)";

    setTimeout(() => {
      // Phase 2: swap theme
      currentTheme = nextTheme;
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        toggleBtn.innerHTML = getSunIcon();
      } else {
        document.documentElement.classList.remove("dark");
        toggleBtn.innerHTML = getMoonIcon();
      }
      localStorage.setItem("theme", nextTheme);

      // Phase 3: rising
      curtain.style.transform = "scaleY(0)";
      
      setTimeout(() => {
        isAnimating = false;
      }, duration + 60);
    }, duration);
  });

  function getMoonIcon() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>`;
  }

  function getSunIcon() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>`;
  }
});
