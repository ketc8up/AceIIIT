// circular-testimonials.js
// Vanilla JS port of the CircularTestimonials React component
// Matches the AceIIIT design system

(function () {
  const members = [
    {
      name: "Uman Debnath",
      designation: "Mentor · IIIT Hyderabad CS Dual Degree · UGEE AIR 2",
      quote:
        "The UGEE isn't just another entrance exam — it's a completely different kind of test. What you need is the right preparation system, and that's exactly what we've built at AceIIIT. (Alumnus of Ramakrishna Mission Vidyalaya Viveknagar, UGEE AIR 2, SAT 1550, JEE Adv AIR 8230, IOQM Score 43, NSEC Top 359 Nationally).",
      src: "assets/images/uman.jpg",
    },
    {
      name: "Priyanshu Sekhar De",
      designation: "Mentor · IIIT Hyderabad CS Dual Degree · UGEE AIR 176",
      quote:
        "I came from a JEE background and didn't know anything specific about UGEE until 3 months before the exam. With the right strategy and resources, cracking it is very achievable. That's exactly why we created AceIIIT. (JBNSTS Junior Scholar, UGEE AIR 176, JEE Adv AIR 7880, JEE Main AIR 4945, WBJEE AIR 203).",
      src: "assets/images/priyanshu.jpg",
    },
    {
      name: "Arkaprava Jana",
      designation: "Technical Lead · IIIT Hyderabad CS Dual Degree",
      quote:
        "Building AceIIIT is about creating a platform that truly serves students. (Alumnus of Ramakrishna Mission Vidyalaya Narendrapur, WB Board Madhyamik State 9th Rank Holder, and JBNSTS Junior Scholar · Dec 2023).",
      src: "assets/images/arkaprava.jpg",
    },
  ];

  let active = 0;
  let autoplayTimer = null;
  const total = members.length;

  function calculateGap(width) {
    const minWidth = 900;
    const maxWidth = 1400;
    const minGap = 55;
    const maxGap = 82;
    // Phones show a smaller photo: keep the side cards' peek proportional.
    if (width < 250) return width * 0.2;
    if (width <= minWidth) return minGap;
    if (width >= maxWidth) return maxGap;
    return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
  }

  function getTransform(index, containerWidth) {
    const gap = calculateGap(containerWidth);
    const stickUp = gap * 0.75;
    const isActive = index === active;
    const isLeft = (active - 1 + total) % total === index;
    const isRight = (active + 1) % total === index;

    if (isActive) {
      return { transform: "translateX(0) translateY(0) scale(1) rotateY(0deg)", opacity: "1", zIndex: "3", pointerEvents: "auto" };
    }
    if (isLeft) {
      return { transform: `translateX(-${gap}px) translateY(-${stickUp}px) scale(0.84) rotateY(15deg)`, opacity: "1", zIndex: "2", pointerEvents: "auto" };
    }
    if (isRight) {
      return { transform: `translateX(${gap}px) translateY(-${stickUp}px) scale(0.84) rotateY(-15deg)`, opacity: "1", zIndex: "2", pointerEvents: "auto" };
    }
    return { transform: "scale(0.7) translateY(30px)", opacity: "0", zIndex: "1", pointerEvents: "none" };
  }

  function applyTransforms() {
    const imgs = document.querySelectorAll(".ctc-img");
    const container = document.querySelector(".ctc-images");
    if (!container) return;
    const w = container.offsetWidth;
    imgs.forEach((img, i) => {
      const s = getTransform(i, w);
      img.style.transform = s.transform;
      img.style.opacity = s.opacity;
      img.style.zIndex = s.zIndex;
      img.style.pointerEvents = s.pointerEvents;
    });
  }

  function animateWords(text) {
    const el = document.querySelector(".ctc-quote");
    if (!el) return;
    const words = text.split(" ");
    el.innerHTML = words
      .map((w, i) => `<span class="ctc-word" style="animation-delay:${i * 0.028}s">${w}&nbsp;</span>`)
      .join("");
    // Force reflow then add class to trigger animation
    el.querySelectorAll(".ctc-word").forEach((span) => {
      span.classList.add("ctc-word-anim");
    });
  }

  function updateContent() {
    const m = members[active];
    const nameEl = document.querySelector(".ctc-name");
    const desigEl = document.querySelector(".ctc-designation");

    if (nameEl) {
      nameEl.style.opacity = "0";
      nameEl.style.transform = "translateY(12px)";
      setTimeout(() => {
        nameEl.textContent = m.name;
        nameEl.style.opacity = "1";
        nameEl.style.transform = "translateY(0)";
      }, 160);
    }
    if (desigEl) {
      desigEl.style.opacity = "0";
      setTimeout(() => {
        desigEl.textContent = m.designation;
        desigEl.style.opacity = "1";
      }, 200);
    }
    animateWords(m.quote);
    // Update dots
    document.querySelectorAll(".ctc-dot").forEach((d, i) => {
      d.classList.toggle("ctc-dot--active", i === active);
    });
  }

  function goTo(index) {
    active = (index + total) % total;
    applyTransforms();
    updateContent();
    stopAutoplay();
    startAutoplay();
  }

  function next() { goTo(active + 1); }
  function prev() { goTo(active - 1); }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = false; // hovered or focused — the reader is looking at a slide

  function startAutoplay() {
    if (reduceMotion || paused) return;
    autoplayTimer = setInterval(next, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function init() {
    const section = document.getElementById("ctcSection");
    if (!section) return;

    // Render images
    const imgContainer = section.querySelector(".ctc-images");
    if (imgContainer) {
      imgContainer.innerHTML = members.map((m, i) =>
        `<img src="${m.src}" alt="${m.name}" class="ctc-img" data-index="${i}" />`
      ).join("");
    }

    // Render dots
    const dotsEl = section.querySelector(".ctc-dots");
    if (dotsEl) {
      dotsEl.innerHTML = members.map((_, i) =>
        `<button class="ctc-dot${i === 0 ? " ctc-dot--active" : ""}" aria-label="Go to slide ${i + 1}" data-dot="${i}"></button>`
      ).join("");
      dotsEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".ctc-dot");
        if (btn) goTo(parseInt(btn.dataset.dot));
      });
    }

    // Nav buttons
    section.querySelector(".ctc-btn-prev")?.addEventListener("click", prev);
    section.querySelector(".ctc-btn-next")?.addEventListener("click", next);

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (!section.matches(":hover") && !section.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    // Pause rotation while the reader is hovering or tabbing through the section.
    // Phones always keep sliding: a tap there counts as "hover" and never ends.
    const phone = window.matchMedia("(max-width: 767.98px)");
    const pause = () => { if (phone.matches) return; paused = true; stopAutoplay(); };
    const resume = () => { paused = false; stopAutoplay(); startAutoplay(); };
    section.addEventListener("mouseenter", pause);
    section.addEventListener("mouseleave", resume);
    section.addEventListener("focusin", pause);
    section.addEventListener("focusout", (e) => {
      if (!section.contains(e.relatedTarget)) resume();
    });
    phone.addEventListener("change", (e) => { if (e.matches && paused) resume(); });

    // Responsive
    window.addEventListener("resize", applyTransforms);

    // Click side images to navigate
    if (imgContainer) {
      imgContainer.addEventListener("click", (e) => {
        const img = e.target.closest(".ctc-img");
        if (!img) return;
        const idx = parseInt(img.dataset.index);
        if (idx !== active) goTo(idx);
      });
    }

    applyTransforms();
    updateContent();
    startAutoplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
