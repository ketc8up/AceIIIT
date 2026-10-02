// app.js - the page: course list, summary card, buttons. Talks to box.js.

const courses = [
  { id: "class", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20.0002 15C20.0002 16.8638 20.0002 17.7956 19.6957 18.5307C19.2897 19.5108 18.511 20.2895 17.5309 20.6955C16.7958 21 15.8639 21 14.0002 21H11.0002C7.22898 21 5.34334 21 4.17177 19.8284C3.00019 18.6568 3.00021 16.7712 3.00024 12.9999L3.0003 6.99983C3.00032 4.79078 4.79112 3 7.00017 3C7.00017 3 7.00017 3 7.00017 3L14.0002 3C14.0002 3 14.0002 3 14.0002 3C16.2093 3 18.0001 4.79086 18.0002 6.99999V7.5L21.0002 7L20.5002 11.2692V11.2692C20.5002 11.2692 20.5002 11.2692 20.5002 11.2692L20.0002 15Z"/><path d="M10.4339 12.4689L10.0002 8.5L14.0002 10L18.0002 8.5L17.5666 12.4689C17.5252 12.8007 17.3213 13.0899 17.0141 13.2219C16.3281 13.5165 15.0433 14 14.0002 14C12.9572 14 11.6724 13.5165 10.9864 13.2219C10.6792 13.0899 10.4753 12.8007 10.4339 12.4689Z" fill="var(--surface-soft)" opacity="0.6"/><path d="M7.00017 3L14.0002 4L21.0002 7L14.0002 10L7.00017 7L7.00017 3Z" fill="var(--surface-soft)" opacity="0.5"/></svg>', tag: "FULL COURSE", title: "Class + Notes", price: 1499, desc: "Live classes with UGEE faculty + complete notes bundle" },
  { id: "mock", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7 4.75C6.0572 4.75 5.5858 4.75 5.2929 4.4571C5 4.1642 5 3.6928 5 2.75V2.25C4.0572 2.25 3.5858 2.25 3.2929 2.5429C3 2.8358 3 3.3072 3 4.25V18.75C3 19.6928 3 20.1642 3.2929 20.4571C3.5858 20.75 4.0572 20.75 5 20.75H11.25V19.5C11.25 18.5268 11.6109 17.6295 12.2322 16.9393L17.453 11.7185C17.9127 11.2588 18.5 10.9952 19.1212 10.9365C19.0787 9.4835 18.9556 8.5693 18.7071 7.9571C18.4142 7.25 17.8284 6.6642 16.6569 5.4927L15.5429 4.3787C14.3714 3.2072 13.7856 2.6214 13.0784 2.3285C12.3712 2.0356 11.5808 2.0356 10 2.0356V2.75C10 3.6928 10 4.1642 9.7071 4.4571C9.4142 4.75 8.9428 4.75 8 4.75H7Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 2C7.5 1.5858 7.8358 1.25 8.25 1.25H13.75C14.1642 1.25 14.5 1.5858 14.5 2C14.5 2.4142 14.1642 2.75 13.75 2.75H8.25C7.8358 2.75 7.5 2.4142 7.5 2Z"/><path d="M12.7532 18.6754C12.2709 19.1576 12 19.8117 12 20.4937V22H13.5063C14.1883 22 14.8423 21.7291 15.3246 21.2468L20.5454 16.026C20.8365 15.7349 21 15.3402 21 14.9286C21 14.517 20.8365 14.1222 20.5454 13.8311L20.1689 13.4546C19.8778 13.1635 19.483 13 19.0714 13C18.6598 13 18.2651 13.1635 17.974 13.4546L12.7532 18.6754Z"/></svg>', tag: "MOCK TESTS", title: "Paid Mock Series", price: 599, desc: "2 free on signup + 4 full-length UGEE mocks with analytics", popular: true },
  { id: "interview", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.7562 3.08819C5.3157 3.1926 4.09545 3.24481 3.13007 4.21745C2.16469 5.19009 2.12282 6.37683 2.03909 8.7503C2.01346 9.47679 2 10.2292 2 11C2 11.7708 2.01346 12.5232 2.03909 13.2497C2.12282 15.6232 2.16469 16.8099 3.13007 17.7825C4.09545 18.7552 5.31569 18.8074 7.75619 18.9118C7.83715 18.9153 7.91842 18.9186 8 18.9219V21.2701C8 21.6732 8.32679 22 8.72991 22C8.90419 22 9.07273 21.9376 9.20503 21.8242L11.3845 19.9553C11.9325 19.4855 12.2064 19.2506 12.532 19.1266C12.8576 19.0026 13.2282 18.9955 13.9693 18.9815C14.7498 18.9667 15.5098 18.9432 16.2437 18.9118C18.6843 18.8074 19.9046 18.7552 20.8699 17.7826C21.8353 16.8099 21.9163 15.6232 22 13.2497C21.9163 12.5232 22 12.5232 22 11C22 10.5 21.9163 9.47679 21.9609 8.7503C21.9163 8.7503 21.9163 8.7503 21.5 7.5C21.1 6.5 20.4737 6.80327 19.5 8C19.5 7.44772 19.9651 7.01856 20.4737 6.80327C21.3707 6.4236 22 5.53529 22 4.5C22 3.11929 20.8807 2 19.5 2C18.1193 2 17 3.11929 17 4.5V3.01851C16.3565 3.00631 15.6991 3 15.0307 3C13.5516 3 12.1259 3.0309 10.787 3.08819H7.7562Z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="19.5" cy="11" r="1"/></svg>', tag: "INTERVIEW PREP", title: "Interview Guidance", price: 699, desc: "PI prep, portfolio review, SOP + mock interviews" }
];

const listDiv = document.getElementById("courseList");
const summaryDiv = document.getElementById("summary");
const continueBtn = document.getElementById("continueBtn");
const mobileContinueBtn = document.getElementById("mobileContinueBtn");
const mobileCount = document.getElementById("mobileCount");
const mobileTotal = document.getElementById("mobileTotal");
const boxCaption = document.getElementById("boxCaption");

let selected = [];
let rows = {};
let currentTotal = 0;

// Restore from local storage
try {
  const stored = localStorage.getItem("aceiiit_selected_courses");
  if (stored) {
    selected = JSON.parse(stored);
  }
} catch (e) {}

for (let i = 0; i < courses.length; i++) {
  const c = courses[i];
  const row = document.createElement("div");
  row.className = "course";
  row.setAttribute("role", "checkbox");
  row.setAttribute("aria-checked", selected.indexOf(c.id) !== -1 ? "true" : "false");
  row.setAttribute("tabindex", "0");
  
  let tagHtml = c.tag;
  if (c.popular) {
    tagHtml += '<span class="popular-badge">MOST POPULAR</span>';
  }
  
  row.innerHTML =
    '<div class="check">✓</div>' +
    '<div class="icon">' + c.icon + '</div>' +
    '<div class="mid"><div class="tag">' + tagHtml + '</div><div class="name">' + c.title + '</div><div class="desc">' + c.desc + '</div></div>' +
    '<div class="cost"><b>₹' + c.price + '</b><div>ONE-TIME</div></div>';
    
  if (selected.indexOf(c.id) !== -1) {
    row.classList.add("on");
  }
  
  row.addEventListener("click", function () {
    const boxMode = window.BoxDemo.getBoxMode();
    if (boxMode !== "open") {
      if (boxMode === "closed") {
        window.BoxDemo.reopenBox();
        setLocked(false);
        updateSummary();
      }
      return;
    }
    toggleCourse(c);
  });
  
  row.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const boxMode = window.BoxDemo.getBoxMode();
      if (boxMode !== "open") {
        if (boxMode === "closed") {
          window.BoxDemo.reopenBox();
          setLocked(false);
          updateSummary();
        }
        return;
      }
      toggleCourse(c);
    }
  });
  
  listDiv.appendChild(row);
  rows[c.id] = row;
}

// Add dashed study material row
const dashedRow = document.createElement("div");
dashedRow.className = "dashed-bonus-row";
dashedRow.innerHTML = "<span>📚 Study Material — included free with any course</span><span class=\"pill\">FREE</span>";
listDiv.appendChild(dashedRow);


function animateTotal(start, end, duration) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    updateTotalDOM(end);
    return;
  }
  
  const startTime = performance.now();
  function update(time) {
    let elapsed = time - startTime;
    if (elapsed > duration) elapsed = duration;
    const current = Math.round(start + (end - start) * (elapsed / duration));
    updateTotalDOM(current);
    if (elapsed < duration) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function updateTotalDOM(val) {
  const totSpans = summaryDiv.querySelectorAll(".total span:last-child");
  if (totSpans.length > 0) totSpans[0].textContent = "₹" + val;
  mobileTotal.textContent = "₹" + val;
}

function toggleCourse(c) {
  const index = selected.indexOf(c.id);
  if (index === -1) {
    selected.push(c.id);
    rows[c.id].classList.add("on");
    rows[c.id].setAttribute("aria-checked", "true");
    window.BoxDemo.addToBox(c.id, c.tag.replace(/<[^>]*>?/gm, ''), c.title, "₹" + c.price, false, 0);
    if (selected.length === 1) {
      window.BoxDemo.addToBox("study", "BONUS", "Study Material", "", true, 0.5);
    }
  } else {
    selected.splice(index, 1);
    rows[c.id].classList.remove("on");
    rows[c.id].setAttribute("aria-checked", "false");
    window.BoxDemo.removeFromBox(c.id);
    if (selected.length === 0) {
      window.BoxDemo.removeFromBox("study");
    }
  }
  updateSummary();
  saveSession();
  
  const badge = document.getElementById("badge");
  if (badge && selected.length > 0) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
    }
  }
}

function saveSession() {
  try {
    localStorage.setItem("aceiiit_selected_courses", JSON.stringify(selected));
  } catch (e) {}
}

function updateSummary() {
  let newTotal = 0;
  let html = "";
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    if (selected.indexOf(c.id) !== -1) {
      newTotal += c.price;
      html += '<div class="row"><span>' + c.icon + ' ' + c.title + '</span><span>₹' + c.price + '</span></div>';
    }
  }
  if (selected.length > 0) {
    html += '<div class="row free"><span>📚 Study Material</span><span class="pill">FREE</span></div>';
    if (boxCaption) boxCaption.classList.add("hidden");
  } else {
    html = '<div class="row">No courses selected yet</div>';
    if (boxCaption) boxCaption.classList.remove("hidden");
  }
  html += '<div class="total"><span>Total</span><span>₹<span class="total-num">' + currentTotal + '</span></span></div>';
  summaryDiv.innerHTML = html;

  const badge = document.getElementById("badge");
  if (badge) {
    badge.textContent = selected.length;
    // Visibility is controlled by box.js (.badge-visible class) — only show when count > 0
    badge.style.visibility = selected.length > 0 ? "visible" : "hidden";
  }

  mobileCount.textContent = selected.length + (selected.length === 1 ? " item" : " items");
  
  const canContinue = selected.length > 0;
  continueBtn.disabled = !canContinue;
  mobileContinueBtn.disabled = !canContinue;
  
  if (canContinue) {
    continueBtn.textContent = "CONTINUE — ₹" + newTotal + " →";
    continueBtn.setAttribute("aria-label", "Continue, total is ₹" + newTotal);
  } else {
    continueBtn.textContent = "CONTINUE →";
    continueBtn.setAttribute("aria-label", "Continue");
  }
  
  if (currentTotal !== newTotal) {
    animateTotal(currentTotal, newTotal, 300);
    currentTotal = newTotal;
  } else {
    updateTotalDOM(newTotal);
  }
}

function setLocked(locked) {
  for (const id in rows) {
    if (locked) {
      rows[id].classList.add("locked");
    } else {
      rows[id].classList.remove("locked");
    }
  }
  continueBtn.disabled = locked || selected.length === 0;
  mobileContinueBtn.disabled = locked || selected.length === 0;
}

function handleCheckout() {
  if (window.BoxDemo.getBoxMode() !== "open") return;
  setLocked(true);
  continueBtn.textContent = "PACKING YOUR ORDER...";
  mobileContinueBtn.textContent = "PACKING...";
  
  // Align page to show the packing animation properly
  const packagesSec = document.getElementById("packages");
  if (packagesSec) {
    packagesSec.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.BoxDemo.checkoutBox(function () {
    continueBtn.textContent = "ORDER PACKED ✓";
    mobileContinueBtn.textContent = "PACKED ✓";
    // Real checkout flow
    try {
      sessionStorage.setItem("aceiiit_selected_courses", JSON.stringify(selected));
    } catch (e) {
      console.warn("sessionStorage failed:", e);
    }
    window.location.href = "checkout.html";
  });
}

continueBtn.addEventListener("click", handleCheckout);
mobileContinueBtn.addEventListener("click", handleCheckout);

// Start once logo is loaded
const logoImage = new Image();
logoImage.onload = function () {
  const stage = document.getElementById("stage");
  window.BoxDemo.initBox(stage, logoImage, function () {
    setLocked(false);
  });
  
  if (selected.length > 0) {
    selected.forEach(id => {
      const c = courses.find(x => x.id === id);
      if (c) window.BoxDemo.addToBox(c.id, c.tag.replace(/<[^>]*>?/gm, ''), c.title, "₹" + c.price, false, 0);
    });
    window.BoxDemo.addToBox("study", "BONUS", "Study Material", "", true, 0.1); 
  }
  
  updateSummary();
};
logoImage.src = LOGO_SRC;

window.selectCourse = function(id) {
  const c = courses.find(x => x.id === id);
  if (c && selected.indexOf(c.id) === -1) {
    toggleCourse(c);
  }
};
