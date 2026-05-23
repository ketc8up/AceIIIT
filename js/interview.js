const interviewPrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initInterviewReadingProgress();
  initInterviewNav();
  initInterviewReveal();
});

function initInterviewReadingProgress() {
  const progressBar = document.querySelector(".reading-progress-bar");
  if (!progressBar) return;

  let frame = 0;

  const update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const progress = scrollable <= 0 ? 1 : Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    progressBar.style.transform = `scaleX(${progress})`;
    frame = 0;
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initInterviewNav() {
  const nav = document.querySelector("[data-mobile-nav]");
  const menuToggle = nav?.querySelector(".hero-menu-toggle");
  const menuLinks = Array.from(nav?.querySelectorAll(".hero-nav-links a") || []);
  const pageLinks = Array.from(document.querySelectorAll(".hero-nav-link[href^='#']"));
  const mobileQuery = window.matchMedia("(max-width: 820px)");

  const closeMenu = () => {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  };

  const setMenuState = (open) => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMenuState(!nav.classList.contains("is-open"));
    });

    document.addEventListener("click", (event) => {
      if (!mobileQuery.matches || !nav.classList.contains("is-open")) return;
      if (nav.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    menuLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  if (!pageLinks.length) return;

  const sections = pageLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActiveLink = (id) => {
    pageLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  let frame = 0;

  const updateActiveSection = () => {
    const offset = Math.min(window.innerHeight * 0.22, 180);
    let activeId = sections[0].id;

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top - offset <= 0) {
        activeId = section.id;
      }
    });

    setActiveLink(activeId);
    frame = 0;
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateActiveSection);
  };

  updateActiveSection();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initInterviewReveal() {
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!revealElements.length) return;

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
  });

  if (interviewPrefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}
