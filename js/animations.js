const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js-ready");

function addRevealHooks() {
  const revealGroups = [
    { selector: ".photo-card", direction: "reveal-left" },
    { selector: ".body-section", direction: "reveal-left" },
    { selector: ".inside-item" },
    { selector: ".countdown-bar" },
    { selector: ".referral-strip" },
    {
      selector: ".schedule-col",
      direction: (_, index) => (index % 2 === 0 ? "reveal-left" : "reveal-right")
    },
    { selector: ".price-bar" },
    { selector: ".enroll-section" },
    { selector: ".cta-section", direction: "reveal-right" },
    { selector: ".footer" },
    {
      selector: ".mock-faq-item",
      direction: (_, index) => (index % 2 === 0 ? "reveal-left" : "reveal-right")
    },
    { selector: ".mentor-section-header" },
    {
      selector: ".mentor-col",
      direction: (_, index) => (index % 2 === 0 ? "reveal-left" : "reveal-right")
    },
    { selector: ".mentor-footer-strip" }
  ];

  const revealElements = [];

  revealGroups.forEach(({ selector, direction }) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.classList.add("reveal-on-scroll");

      const directionClass =
        typeof direction === "function" ? direction(el, index) : direction;

      if (directionClass) {
        el.classList.add(directionClass);
      }

      el.style.transitionDelay = `${Math.min(index * 110, 260)}ms`;
      revealElements.push(el);
    });
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((el) => el.classList.add("is-visible"));
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
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

function initReadingProgress() {
  const progressBar = document.querySelector(".reading-progress-bar");
  if (!progressBar) return;

  let frame = 0;

  const update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const progress =
      scrollable <= 0 ? 1 : Math.min(Math.max(window.scrollY / scrollable, 0), 1);

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

function initHeroNav() {
  const nav = document.querySelector("[data-mobile-nav]");
  const menuToggle = nav?.querySelector(".hero-menu-toggle");
  const menuLinks = Array.from(nav?.querySelectorAll(".hero-nav-links a") || []);
  const links = Array.from(document.querySelectorAll(".hero-nav-link[href^='#']"));
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
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    const syncMenuToViewport = () => {
      if (!mobileQuery.matches) {
        closeMenu();
      }
    };

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncMenuToViewport);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(syncMenuToViewport);
    }
  }

  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter((section, index, all) => section && all.indexOf(section) === index);

  if (!sections.length) return;

  const setActiveLink = (id) => {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.getAttribute("href")?.slice(1);
      if (id) {
        setActiveLink(id);
      }

      if (mobileQuery.matches) {
        closeMenu();
      }
    });
  });

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

function initTypewriterHeadline() {
  const headline = document.querySelector(".typewriter-headline");
  if (!headline) return;

  const segments = Array.from(headline.querySelectorAll("[data-type-line]"));
  const lines = Array.from(headline.querySelectorAll(".type-line"));
  const struckWords = Array.from(headline.querySelectorAll(".struck"));

  const revealAll = () => {
    segments.forEach((segment) => {
      segment.textContent = segment.dataset.typeLine || "";
      segment.closest(".type-line")?.classList.add("is-complete");
      segment.closest(".struck")?.classList.add("is-complete");
    });
    headline.classList.add("is-typed");
  };

  if (prefersReducedMotion) {
    revealAll();
    return;
  }

  segments.forEach((segment) => {
    segment.textContent = "";
    segment.classList.remove("is-active-segment");
  });

  struckWords.forEach((word) => {
    word.classList.remove("is-complete");
  });

  lines.forEach((line) => {
    line.classList.remove("is-active", "is-complete");
  });

  let segmentIndex = 0;

  const activateLine = (line) => {
    lines.forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === line);
    });
  };

  const activateSegment = (activeSegment) => {
    segments.forEach((candidate) => {
      candidate.classList.toggle("is-active-segment", candidate === activeSegment);
    });
  };

  const finishLine = (line) => {
    if (!line) return;
    line.classList.remove("is-active");
    line.classList.add("is-complete");
  };

  const typeSegment = () => {
    if (segmentIndex >= segments.length) {
      lines.forEach((line) => line.classList.remove("is-active"));
      headline.classList.add("is-typed");
      return;
    }

    const segment = segments[segmentIndex];
    const line = segment.closest(".type-line");
    const struck = segment.closest(".struck");
    const text = segment.dataset.typeLine || "";
    let charIndex = 0;

    activateLine(line);
    activateSegment(segment);

    const typeNextCharacter = () => {
      charIndex += 1;
      segment.textContent = text.slice(0, charIndex);

      if (charIndex < text.length) {
        window.setTimeout(typeNextCharacter, 45 + Math.random() * 35);
        return;
      }

      if (struck) {
        struck.classList.add("is-complete");
      }

      activateSegment(null);
      const nextSegment = segments[segmentIndex + 1];
      const lineComplete =
        !nextSegment || nextSegment.closest(".type-line") !== line;

      if (lineComplete) {
        finishLine(line);
      }

      segmentIndex += 1;
      window.setTimeout(typeSegment, lineComplete ? 100 : 35);
    };

    window.setTimeout(typeNextCharacter, 60);
  };

  window.setTimeout(typeSegment, 420);
}

function initMockShowcase() {
  const showcase = document.querySelector("[data-mock-showcase]");
  if (!showcase) return;

  const track = showcase.querySelector(".mock-showcase-track");
  const slides = Array.from(showcase.querySelectorAll(".mock-showcase-slide"));
  const dots = Array.from(showcase.querySelectorAll(".mock-showcase-dots span"));
  const caption = showcase.querySelector("[data-mock-caption]");

  if (!track || slides.length <= 1) return;

  let activeIndex = 0;
  let intervalId = 0;

  const setActiveSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });

    if (caption) {
      caption.textContent = slides[activeIndex].dataset.mockTitle || "";
    }
  };

  const startAutoPlay = () => {
    if (prefersReducedMotion) return;
    window.clearInterval(intervalId);
    intervalId = window.setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, 3400);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setActiveSlide(index);
      startAutoPlay();
    });
  });

  showcase.addEventListener("mouseenter", () => {
    window.clearInterval(intervalId);
  });

  showcase.addEventListener("mouseleave", () => {
    startAutoPlay();
  });

  setActiveSlide(0);
  startAutoPlay();
}

function animateFloatingEnroll() {
  const floatingEnroll = document.querySelector(".floating-enroll");
  if (!floatingEnroll) return;

  const syncVisibility = () => {
    const show = window.scrollY > Math.max(120, window.innerHeight * 0.18);
    floatingEnroll.classList.toggle("is-visible", show);
    floatingEnroll.classList.toggle("is-hidden", !show);
  };

  syncVisibility();
  window.addEventListener("scroll", syncVisibility, { passive: true });
}

function animateParallax() {
  const parallaxNodes = document.querySelectorAll("[data-parallax='slow']");
  if (!parallaxNodes.length || prefersReducedMotion) return;

  let frame = 0;

  const update = () => {
    const offset = Math.round(window.scrollY * -0.08);
    parallaxNodes.forEach((el) => {
      el.style.setProperty("--parallax-shift", `${offset}px`);
    });
    frame = 0;
  };

  update();

  window.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    },
    { passive: true }
  );
}

function animateScheduleRows() {
  const rows = Array.from(document.querySelectorAll(".cal-date-row"));
  if (!rows.length || prefersReducedMotion) return;

  let activeIndex = -1;

  const cycle = () => {
    if (activeIndex >= 0) {
      rows[activeIndex].classList.remove("is-active");
    }

    activeIndex = (activeIndex + 1) % rows.length;
    rows[activeIndex].classList.add("is-active");
  };

  cycle();
  window.setInterval(cycle, 1400);
}

function initTiltEffects() {
  const tiltTargets = Array.from(
    document.querySelectorAll(
      ".photo-card, .inside-item, .countdown-bar, .referral-strip, .schedule-col, .price-bar, .enroll-section, .mentor-col, .cta-badge"
    )
  );

  if (!tiltTargets.length || prefersReducedMotion) return;

  tiltTargets.forEach((el) => {
    const maxTilt = el.classList.contains("cta-badge") ? 7 : 4.5;

    const resetTilt = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;

      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const tiltY = (px - 0.5) * maxTilt * 2;
      const tiltX = (0.5 - py) * maxTilt * 2;

      el.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    });

    el.addEventListener("pointerleave", resetTilt);
    el.addEventListener("pointercancel", resetTilt);
  });
}

addRevealHooks();
initReadingProgress();
initHeroNav();
initTypewriterHeadline();
initMockShowcase();
animateFloatingEnroll();
animateParallax();
animateScheduleRows();
initTiltEffects();
