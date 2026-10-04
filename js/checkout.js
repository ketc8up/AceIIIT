/**
 * checkout.js — AceIIIT Checkout Logic
 * Reads selected courses from sessionStorage, drives multi-step form,
 * validates inputs, handles coupons, and shows animated confirmation.
 */

// ── KNOWN COURSES (mirror of app.js) ─────────────────────────────────────
const COURSES = [
  { id: "class",     icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20.0002 15C20.0002 16.8638 20.0002 17.7956 19.6957 18.5307C19.2897 19.5108 18.511 20.2895 17.5309 20.6955C16.7958 21 15.8639 21 14.0002 21H11.0002C7.22898 21 5.34334 21 4.17177 19.8284C3.00019 18.6568 3.00021 16.7712 3.00024 12.9999L3.0003 6.99983C3.00032 4.79078 4.79112 3 7.00017 3C7.00017 3 7.00017 3 7.00017 3L14.0002 3C14.0002 3 14.0002 3 14.0002 3C16.2093 3 18.0001 4.79086 18.0002 6.99999V7.5L21.0002 7L20.5002 11.2692V11.2692C20.5002 11.2692 20.5002 11.2692 20.5002 11.2692L20.0002 15Z"/><path d="M10.4339 12.4689L10.0002 8.5L14.0002 10L18.0002 8.5L17.5666 12.4689C17.5252 12.8007 17.3213 13.0899 17.0141 13.2219C16.3281 13.5165 15.0433 14 14.0002 14C12.9572 14 11.6724 13.5165 10.9864 13.2219C10.6792 13.0899 10.4753 12.8007 10.4339 12.4689Z" fill="var(--surface-soft)" opacity="0.6"/><path d="M7.00017 3L14.0002 4L21.0002 7L14.0002 10L7.00017 7L7.00017 3Z" fill="var(--surface-soft)" opacity="0.5"/></svg>', tag: "FULL COURSE",   title: "Class + Notes",       price: 1499 },
  { id: "mock",      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7 4.75C6.0572 4.75 5.5858 4.75 5.2929 4.4571C5 4.1642 5 3.6928 5 2.75V2.25C4.0572 2.25 3.5858 2.25 3.2929 2.5429C3 2.8358 3 3.3072 3 4.25V18.75C3 19.6928 3 20.1642 3.2929 20.4571C3.5858 20.75 4.0572 20.75 5 20.75H11.25V19.5C11.25 18.5268 11.6109 17.6295 12.2322 16.9393L17.453 11.7185C17.9127 11.2588 18.5 10.9952 19.1212 10.9365C19.0787 9.4835 18.9556 8.5693 18.7071 7.9571C18.4142 7.25 17.8284 6.6642 16.6569 5.4927L15.5429 4.3787C14.3714 3.2072 13.7856 2.6214 13.0784 2.3285C12.3712 2.0356 11.5808 2.0356 10 2.0356V2.75C10 3.6928 10 4.1642 9.7071 4.4571C9.4142 4.75 8.9428 4.75 8 4.75H7Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 2C7.5 1.5858 7.8358 1.25 8.25 1.25H13.75C14.1642 1.25 14.5 1.5858 14.5 2C14.5 2.4142 14.1642 2.75 13.75 2.75H8.25C7.8358 2.75 7.5 2.4142 7.5 2Z"/><path d="M12.7532 18.6754C12.2709 19.1576 12 19.8117 12 20.4937V22H13.5063C14.1883 22 14.8423 21.7291 15.3246 21.2468L20.5454 16.026C20.8365 15.7349 21 15.3402 21 14.9286C21 14.517 20.8365 14.1222 20.5454 13.8311L20.1689 13.4546C19.8778 13.1635 19.483 13 19.0714 13C18.6598 13 18.2651 13.1635 17.974 13.4546L12.7532 18.6754Z"/></svg>', tag: "MOCK TESTS",    title: "Paid Mock Series",     price: 599  },
  { id: "interview", icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.7562 3.08819C5.3157 3.1926 4.09545 3.24481 3.13007 4.21745C2.16469 5.19009 2.12282 6.37683 2.03909 8.7503C2.01346 9.47679 2 10.2292 2 11C2 11.7708 2.01346 12.5232 2.03909 13.2497C2.12282 15.6232 2.16469 16.8099 3.13007 17.7825C4.09545 18.7552 5.31569 18.8074 7.75619 18.9118C7.83715 18.9153 7.91842 18.9186 8 18.9219V21.2701C8 21.6732 8.32679 22 8.72991 22C8.90419 22 9.07273 21.9376 9.20503 21.8242L11.3845 19.9553C11.9325 19.4855 12.2064 19.2506 12.532 19.1266C12.8576 19.0026 13.2282 18.9955 13.9693 18.9815C14.7498 18.9667 15.5098 18.9432 16.2437 18.9118C18.6843 18.8074 19.9046 18.7552 20.8699 17.7826C21.8353 16.8099 21.9163 15.6232 22 13.2497C21.9163 12.5232 22 12.5232 22 11C22 10.5 21.9163 9.47679 21.9609 8.7503C21.9163 8.7503 21.9163 8.7503 21.5 7.5C21.1 6.5 20.4737 6.80327 19.5 8C19.5 7.44772 19.9651 7.01856 20.4737 6.80327C21.3707 6.4236 22 5.53529 22 4.5C22 3.11929 20.8807 2 19.5 2C18.1193 2 17 3.11929 17 4.5V3.01851C16.3565 3.00631 15.6991 3 15.0307 3C13.5516 3 12.1259 3.0309 10.787 3.08819H7.7562Z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="19.5" cy="11" r="1"/></svg>', tag: "INTERVIEW PREP", title: "Interview Guidance",  price: 699  }
];

// ── VALID COUPONS ─────────────────────────────────────────────────────────

// ── STATE ─────────────────────────────────────────────────────────────────
let selected = [];
let subtotal  = 0;
let discount  = 0;
let appliedCoupon = null;
let lastReceipt = null; // server-confirmed order data for the Download Receipt button

// Mirrors CommerceService.createOrder: GST is rounded per item, then scaled
// down proportionally when a discount applies (GST on the discounted price).
const GST_RATE = 18;
function computeTotals(ids, discount) {
  let subtotal = 0, tax = 0;
  ids.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (!c) return;
    subtotal += c.price;
    tax += Math.round(c.price * GST_RATE / 100);
  });
  if (subtotal > 0) tax = Math.round(tax * (subtotal - discount) / subtotal);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

// ── STEP MANAGEMENT ───────────────────────────────────────────────────────
const sections   = ["details", "payment", "confirm"];
const stepEls    = sections.map(s => document.getElementById("step-indicator-" + s));
const sectionEls = sections.map(s => document.getElementById("section-" + s));

let currentStep = 0;

function goToStep(index) {
  currentStep = index;
  sectionEls.forEach((el, i) => {
    el.classList.toggle("co-section--hidden", i !== index);
    if (i !== index && !el.classList.contains("co-section--hidden")) {
      el.style.animation = "none";
    }
  });
  stepEls.forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i < index)  el.classList.add("done");
    if (i === index) el.classList.add("active");
  });
  // Update the step-num of done steps with a checkmark
  stepEls.forEach((el, i) => {
    const numEl = el.querySelector(".co-step-num");
    if (i < index) {
      numEl.innerHTML = "✓";
    } else {
      numEl.textContent = i + 1;
    }
  });

  const couponWrap = document.querySelector(".co-coupon-wrap");
  if (couponWrap) {
    couponWrap.style.display = index === 0 ? "flex" : "none";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── LOAD SELECTED COURSES ─────────────────────────────────────────────────
// localStorage is written on every toggle on the homepage, so it is the
// source of truth; sessionStorage is only a fallback (e.g. storage-restricted
// browsers where the pack step still managed to write it).
function readStoredSelection() {
  const keys = [
    () => localStorage.getItem("aceiiit_selected_courses"),
    () => sessionStorage.getItem("aceiiit_selected_courses")
  ];
  for (const read of keys) {
    let raw = null;
    try { raw = read(); } catch (e) {}
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

function loadCourses() {
  const known = new Set(COURSES.map(c => c.id));
  selected = [...new Set(readStoredSelection())].filter(id => known.has(id));

  subtotal = 0;
  selected.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (c) subtotal += c.price;
  });

  renderSummary();
}

function renderSummary() {
  // Left panel summary items
  const itemsEl = document.getElementById("co-summary-items");
  itemsEl.innerHTML = "";

  const isEmpty = selected.length === 0;
  document.getElementById("co-summary-panel").classList.toggle("is-empty", isEmpty);
  const toPaymentBtn = document.getElementById("btn-to-payment");
  if (toPaymentBtn) toPaymentBtn.disabled = isEmpty;
  if (isEmpty) {
    itemsEl.innerHTML = `
      <div class="co-summary-empty">
        <span>No courses selected yet.</span>
        <a href="/#packages" class="co-summary-empty-link">Choose your courses &rarr;</a>
      </div>`;
  }
  selected.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (!c) return;
    const div = document.createElement("div");
    div.className = "co-summary-item";
    div.innerHTML = `
      <div class="co-summary-item-left">
        <div class="co-summary-item-icon">${c.icon}</div>
        <div class="co-summary-item-text">
          <span class="co-summary-item-name">${c.title}</span>
          <span class="co-summary-item-tag">${c.tag}</span>
        </div>
      </div>
      <span class="co-summary-item-price">₹${c.price}</span>`;
    itemsEl.appendChild(div);
  });

  const totals = computeTotals(selected, discount);
  const gst   = totals.tax;
  const grand = totals.total;

  document.getElementById("co-subtotal").textContent = "₹" + totals.subtotal;
  document.getElementById("co-gst").textContent      = "₹" + gst;
  document.getElementById("co-grand").textContent    = "₹" + grand;

  const discountRow = document.getElementById("co-discount-row");
  if (discountRow) {
    discountRow.hidden = discount <= 0;
    document.getElementById("co-discount").textContent = "−₹" + discount;
    document.getElementById("co-discount-label").textContent = appliedCoupon ? `Discount (${appliedCoupon})` : "Discount";
  }
  const mobileTotal = document.getElementById("co-summary-toggle-total");
  if (mobileTotal) mobileTotal.textContent = "₹" + grand;
  
  const payAmountEl = document.getElementById("pay-amount");
  if (payAmountEl) {
    payAmountEl.textContent = grand;
  }
  
  const qrEl = document.getElementById("payment-qr");
  if (qrEl) {
    qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi%3A%2F%2Fpay%3Fpa%3Daceiiit%40upi%26pn%3DAceIIIT%26am%3D${grand}%26cu%3DINR`;
  }
  updateUpiLinks(grand);

  const qrAmtText = document.getElementById("qr-amount-text");
  if (qrAmtText) {
    qrAmtText.textContent = "₹" + grand;
  }

  // Confirmation items removed for minimal UI

}

// ── ONE-TAP UPI ───────────────────────────────────────────────────────────
// On phones, "Pay now" opens the installed UPI app with the payee and amount
// filled in (same details as the QR). Android gets the system chooser for the
// main button and package-targeted intents for the app tiles; iOS has no UPI
// chooser, so its tiles use each app's own URL scheme. Payment confirmation is
// still the UTR + screenshot, so on return we point the user to that step.
const UPI_PAYEE = { pa: "aceiiit@upi", pn: "AceIIIT" };
const UPI_APPS = {
  gpay:    { android: "com.google.android.apps.nbu.paisa.user", ios: "gpay://upi/pay" },
  phonepe: { android: "com.phonepe.app",                        ios: "phonepe://pay" },
  paytm:   { android: "net.one97.paytm",                        ios: "paytmmp://pay" }
};
const UA = navigator.userAgent;
const isAndroid = /Android/i.test(UA);
const isIOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const upiEl = document.getElementById("co-upi-pay");
if (upiEl && (isAndroid || isIOS)) upiEl.hidden = false;

function upiQuery(amount) {
  const params = { ...UPI_PAYEE, am: amount.toFixed(2), cu: "INR", tn: "AceIIIT course purchase" };
  return Object.entries(params)
    .map(([k, v]) => k + "=" + encodeURIComponent(v).replace(/%40/g, "@"))
    .join("&");
}

function updateUpiLinks(amount) {
  if (!upiEl) return;
  const q = upiQuery(amount);
  document.getElementById("co-upi-btn").href = "upi://pay?" + q;
  upiEl.querySelectorAll("[data-upi-amount]").forEach(el => {
    el.textContent = "₹" + amount.toLocaleString("en-IN");
  });
  upiEl.querySelectorAll("[data-upi-app]").forEach(a => {
    const app = UPI_APPS[a.dataset.upiApp];
    a.href = isAndroid
      ? `intent://pay?${q}#Intent;scheme=upi;package=${app.android};end`
      : isIOS ? `${app.ios}?${q}` : "upi://pay?" + q;
  });
}

function showUpiStatus(message, { warn = false, upload = false } = {}) {
  const box = document.getElementById("co-upi-status");
  document.getElementById("co-upi-status-text").textContent = message;
  document.getElementById("co-upi-upload").hidden = !upload;
  box.classList.toggle("is-warn", warn);
  box.hidden = false;
}

function hideUpiStatus() {
  const box = document.getElementById("co-upi-status");
  if (box) box.hidden = true;
}

let upiLaunchedAt = 0;   // set when a UPI link is tapped
let upiLeftPage = false; // the UPI app actually came to the foreground

if (upiEl) {
  upiEl.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");
    if (!link) return;
    upiLaunchedAt = Date.now();
    upiLeftPage = false;
    hideUpiStatus();
    // App tiles have no chooser: if nothing opened, the app likely isn't installed.
    if (link.dataset.upiApp) {
      const launchedAt = upiLaunchedAt;
      setTimeout(() => {
        if (upiLaunchedAt === launchedAt && !upiLeftPage && !document.hidden) {
          showUpiStatus("Couldn't open that app — it may not be installed. Try another UPI app, or scan the QR code below from another phone.", { warn: true });
        }
      }, 2500);
    }
  });

  document.getElementById("co-upi-upload").addEventListener("click", function () {
    const receipt = document.getElementById("receipt");
    receipt.scrollIntoView({ behavior: "smooth", block: "center" });
    receipt.click();
  });

  document.addEventListener("visibilitychange", function () {
    if (!upiLaunchedAt) return;
    if (document.hidden) {
      upiLeftPage = true;
    } else if (upiLeftPage) {
      upiLaunchedAt = 0;
      upiLeftPage = false;
      showUpiStatus("Paid? Upload the payment screenshot and we'll read the UTR for you.", { upload: true });
    }
  });
}

// ── VALIDATION ────────────────────────────────────────────────────────────
function setError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const errEl = document.getElementById("err-" + fieldId);
  if (!input || !errEl) return;
  if (msg) {
    input.classList.add("co-input--error");
    errEl.textContent = msg;
  } else {
    input.classList.remove("co-input--error");
    errEl.textContent = "";
  }
}

function clearErrors() {
  ["firstName","lastName","email","phone"].forEach(id => setError(id, ""));
}


// Error message from a failed API response. Falls back to the HTTP status when
// the body isn't JSON (e.g. an HTML 404/502 page from a proxy or dev server),
// so the user sees what actually failed rather than a generic "Network error".
async function apiError(res, fallback) {
  try {
    const data = await res.json();
    if (data && data.error) return data.error;
  } catch (e) {}
  return fallback + " (" + res.status + ")";
}

function validateDetails() {
  let ok = true;
  clearErrors();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const email     = document.getElementById("email").value.trim();
  const phone     = document.getElementById("phone").value.trim();

  if (!firstName) { setError("firstName", "First name is required"); ok = false; }
  if (!lastName)  { setError("lastName",  "Last name is required");  ok = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Please enter a valid email address"); ok = false;
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    setError("phone", "Enter a valid 10-digit phone number"); ok = false;
  }

  return ok;
}

// ── COUPON ────────────────────────────────────────────────────────────────
document.getElementById("applyCoupon").addEventListener("click", async function () {
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  const status = document.getElementById("coupon-status");
  if (!code) { status.textContent = ""; return; }

  status.innerHTML = "Validating...";
  status.className = "co-coupon-status";

  try {
    const res = await fetch(`/api/coupons/${code}`);
    if (!res.ok) throw new Error("Invalid coupon code");
    const coup = await res.json();
    
    let eligibleSubtotal = subtotal;
    if (coup.productRestriction) {
       if (!selected.includes(coup.productRestriction)) {
          throw new Error("Coupon is not valid for the selected products");
       }
       const restrictedCourse = COURSES.find(c => c.id === coup.productRestriction);
       if (restrictedCourse) {
         eligibleSubtotal = restrictedCourse.price;
       }
    }

    appliedCoupon = code;
    if (coup.type === "PERCENTAGE") {
      discount = Math.round(eligibleSubtotal * coup.value / 100);
    } else {
      discount = Math.min(coup.value, eligibleSubtotal);
    }
    const label = coup.type === "PERCENTAGE" ? `${coup.value}% off` : `₹${coup.value} off`;
    status.innerHTML = `✓ "${code}" applied — ${label} <a href="javascript:void(0)" onclick="window.removeCoupon()" style="color: #ef4444; margin-left: 10px; text-decoration: underline; font-size: 0.9em;">Remove</a>`;
    status.className = "co-coupon-status success";
  } catch (err) {
    discount = 0;
    appliedCoupon = null;
    status.textContent = err.message || "Invalid coupon code";
    status.className = "co-coupon-status error";
  }
  renderSummary();
});

window.removeCoupon = function() {
  discount = 0;
  appliedCoupon = null;
  const status = document.getElementById("coupon-status");
  if (status) {
    status.textContent = "";
    status.className = "co-coupon-status";
  }
  const input = document.getElementById("couponCode");
  if (input) input.value = "";
  renderSummary();
};


// ── OCR FOR UTR ───────────────────────────────────────────────────────────
// Reading a screenshot takes a few seconds (longer on first use while the
// language data downloads), so a progress card covers the payment step until
// the UTR is filled in or the user chooses to type it.
const OCR_SLOW_MS = 20000;
const OCR_SUCCESS_HOLD_MS = 1400;

const ocrEl = document.getElementById("co-ocr");
const ocrCard = {
  title: document.getElementById("co-ocr-title"),
  text: document.getElementById("co-ocr-text"),
  utr: document.getElementById("co-ocr-utr"),
  scan: document.getElementById("co-ocr-scan"),
  note: document.getElementById("co-ocr-note"),
  manual: document.getElementById("co-ocr-manual"),
  steps: ocrEl ? ocrEl.querySelectorAll(".co-ocr-steps li") : []
};
let ocrRun = 0;          // bumps on every new read or cancel; stale results are ignored
let ocrWorker = null;
let ocrPayWasDisabled = false;

function setOcrStep(active) {
  const order = ["added", "scan", "fill"];
  const at = order.indexOf(active);
  ocrCard.steps.forEach((li, i) => {
    li.classList.toggle("is-done", i < at || active === "done");
    li.classList.toggle("is-active", i === at);
  });
}

function openOcrCard() {
  ocrEl.dataset.state = "scanning";
  ocrCard.title.textContent = "Reading your payment screenshot";
  ocrCard.text.textContent = "We're finding the 12-digit UTR number for you, so you don't have to type it.";
  ocrCard.utr.hidden = true;
  ocrCard.scan.textContent = "Scanning the image…";
  ocrCard.note.textContent = "Takes about 5–10 seconds. Please don't close this page.";
  ocrCard.manual.hidden = true;
  setOcrStep("scan");

  const utrInput = document.getElementById("utr");
  const payBtn = document.getElementById("btn-pay-now");
  if (!ocrEl.hidden) return; // already open (new file picked mid-read)
  ocrPayWasDisabled = payBtn.disabled;
  utrInput.disabled = true;
  payBtn.disabled = true;
  ocrEl.hidden = false;
  ocrEl.querySelector(".co-ocr-card").focus();
}

function closeOcrCard() {
  if (!ocrEl || ocrEl.hidden) return;
  ocrEl.hidden = true;
  document.getElementById("utr").disabled = false;
  document.getElementById("btn-pay-now").disabled = ocrPayWasDisabled;
  endBusy(); // the read is over (filled in, or the user chose to type it)
}

// Back pressed mid-read: stop OCR without touching history (Back already did).
function cancelOcr() {
  ocrRun++;
  stopOcrWorker();
  if (ocrEl && !ocrEl.hidden) {
    ocrEl.hidden = true;
    document.getElementById("utr").disabled = false;
  }
}

function stopOcrWorker() {
  if (ocrWorker) {
    ocrWorker.terminate().catch(() => {});
    ocrWorker = null;
  }
}

function showOcrFailure(message) {
  ocrEl.dataset.state = "failed";
  ocrCard.title.textContent = "We couldn't read the UTR clearly";
  ocrCard.text.textContent = "No problem — just type the 12-digit number from your payment app.";
  ocrCard.manual.hidden = false;
  ocrCard.manual.focus();
  const utrError = document.getElementById("utr-error");
  if (utrError) {
    utrError.textContent = message;
    utrError.style.display = "block";
  }
}

function enterUtrManually() {
  ocrRun++;          // abandon any read still in flight
  stopOcrWorker();
  closeOcrCard();
  document.getElementById("utr").focus();
}

async function readUtrFromScreenshot(file) {
  const run = ++ocrRun;
  hideUpiStatus();
  stopOcrWorker();
  const utrInput = document.getElementById("utr");
  const utrError = document.getElementById("utr-error");
  if (utrError) {
    utrError.style.display = "none";
    utrError.textContent = "";
  }

  if (!busy) beginBusy(resetPaymentStep);
  openOcrCard();
  const slowTimer = setTimeout(() => {
    if (run !== ocrRun || ocrEl.dataset.state !== "scanning") return;
    ocrCard.note.textContent = "Still working… large screenshots take a bit longer.";
    ocrCard.manual.hidden = false;
  }, OCR_SLOW_MS);

  let worker = null;
  try {
    worker = await Tesseract.createWorker("eng", 1, {
      logger: m => {
        if (run === ocrRun && m.status === "recognizing text") {
          ocrCard.scan.textContent = `Scanning the image… ${Math.round(m.progress * 100)}%`;
        }
      }
    });
    if (run !== ocrRun) return;
    ocrWorker = worker;

    const { data } = await worker.recognize(file);
    if (run !== ocrRun) return;

    // Look for a 12-digit number (common for UPI UTRs)
    const match = (data.text || "").match(/\b\d{12}\b/);
    if (!match) {
      showOcrFailure("Could not find a 12-digit UTR in the image. Please enter it manually.");
      return;
    }

    setOcrStep("fill");
    utrInput.value = match[0];
    ocrEl.dataset.state = "success";
    setOcrStep("done");
    ocrCard.title.textContent = "UTR found";
    ocrCard.text.textContent = "Please check it matches your payment app.";
    ocrCard.utr.textContent = match[0].replace(/(\d{4})(?=\d)/g, "$1 ");
    ocrCard.utr.hidden = false;
    ocrCard.note.textContent = "";

    setTimeout(() => {
      if (run !== ocrRun) return;
      closeOcrCard();
      utrInput.classList.add("co-input--filled");
      setTimeout(() => utrInput.classList.remove("co-input--filled"), 1500);
    }, OCR_SUCCESS_HOLD_MS);
  } catch (error) {
    console.error("OCR failed:", error);
    if (run === ocrRun) showOcrFailure("Auto-read failed. Please enter the UTR manually.");
  } finally {
    clearTimeout(slowTimer);
    if (worker) {
      if (ocrWorker === worker) ocrWorker = null;
      worker.terminate().catch(() => {});
    }
  }
}

if (ocrEl) {
  ocrCard.manual.addEventListener("click", enterUtrManually);
  ocrEl.addEventListener("keydown", e => {
    if (e.key === "Escape" && !ocrCard.manual.hidden) enterUtrManually();
  });
}

const receiptInput = document.getElementById("receipt");
if (receiptInput) {
  receiptInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return; // Only process images
    readUtrFromScreenshot(file);
  });
}

// ── PHONE — digits only ───────────────────────────────────────────────────
const phoneInput = document.getElementById("phone");
if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });
}

// ── BACK BUTTON / STEP HISTORY ────────────────────────────────────────────
// Each visible step (details, payment, confirm) is a browser-history entry, so
// Back always moves exactly one step and that step has to be done again.
// While a step is busy (sending/verifying OTP, reading the screenshot,
// submitting details) an extra "busy" entry absorbs Back instead: the work is
// cancelled and the user stays on that step, which starts over. Once the order
// is being created Back is held until the submission settles, so a half-made
// order can never be left behind or duplicated.
const DETAILS_BTN_HTML = document.getElementById("btn-to-payment").innerHTML;
const PAY_BTN_HTML = document.getElementById("btn-pay-now").innerHTML;
let busy = null;      // { controller, onCancel, locked }
let skipPops = 0;     // popstates caused by our own history.back() calls
let resendTimer = null;

function beginBusy(onCancel) {
  const controller = new AbortController();
  busy = { controller, onCancel, locked: false };
  history.pushState({ coStep: currentStep, busy: true }, "");
  return controller.signal;
}

// Finish the running process: move on to `nextStep`, or (no argument) stay on
// the current step and drop the busy entry so Back works normally again.
function endBusy(nextStep) {
  if (!busy) return;
  busy = null;
  if (nextStep !== undefined) {
    history.replaceState({ coStep: nextStep }, "");
    goToStep(nextStep);
  } else {
    skipPops++;
    history.back();
  }
}

function resetDetailsStep() {
  globalAuthToken = null;
  clearTimeout(resendTimer);
  document.getElementById("otp-field-container").style.display = "none";
  document.getElementById("otp").value = "";
  document.getElementById("email").disabled = false;
  clearErrors();
  setError("otp", "");
  const btn = document.getElementById("btn-to-payment");
  btn.innerHTML = DETAILS_BTN_HTML;
  btn.disabled = selected.length === 0;
  const resendBtn = document.getElementById("btn-resend-otp");
  if (resendBtn) {
    resendBtn.textContent = "Resend Code";
    resendBtn.disabled = false;
  }
}

function resetPaymentStep() {
  cancelOcr();
  hideUpiStatus();
  const utrInput = document.getElementById("utr");
  utrInput.value = "";
  utrInput.disabled = false;
  utrInput.classList.remove("co-input--filled");
  const receipt = document.getElementById("receipt");
  if (receipt) receipt.value = "";
  const removeBtn = document.getElementById("btn-remove-receipt");
  if (removeBtn) removeBtn.style.display = "none";
  const utrError = document.getElementById("utr-error");
  if (utrError) {
    utrError.style.display = "none";
    utrError.textContent = "";
  }
  const payBtn = document.getElementById("btn-pay-now");
  payBtn.innerHTML = PAY_BTN_HTML;
  payBtn.disabled = false;
}

window.addEventListener("popstate", function (e) {
  if (skipPops > 0) { skipPops--; return; }
  const state = e.state || {};
  const target = typeof state.coStep === "number" ? state.coStep : 0;

  if (busy) {
    if (busy.locked) {
      history.pushState({ coStep: currentStep, busy: true }, "");
      alert("Your payment is being submitted. Please wait a few seconds — going back now could create a duplicate order.");
      return;
    }
    // Back mid-process: stop it and redo this step.
    const cancelled = busy;
    busy = null;
    cancelled.controller.abort();
    cancelled.onCancel();
    return;
  }

  // Forward into a finished process's entry, or into a later step: not allowed.
  if (state.busy || target > currentStep) {
    skipPops++;
    history.back();
    return;
  }
  if (target === currentStep) return;

  // The order is placed; never step back into payment.
  if (currentStep === 2) {
    location.replace("/");
    return;
  }

  // Back one step: the step landed on (and everything after it) is redone.
  resetPaymentStep();
  if (target === 0) resetDetailsStep();
  goToStep(target);
});

window.addEventListener("beforeunload", function (e) {
  if (busy && busy.locked) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// ── STEP NAV ──────────────────────────────────────────────────────────────
let globalAuthToken = null;

document.getElementById("detailsForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (selected.length === 0) return;
  if (!validateDetails()) return;

  const btn = document.getElementById("btn-to-payment");
  const email = document.getElementById("email").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const otpContainer = document.getElementById("otp-field-container");
  const otpInput = document.getElementById("otp");

  if (busy) return;

  if (otpContainer.style.display === "none") {
    const signal = beginBusy(resetDetailsStep);
    btn.innerHTML = 'Sending OTP...';
    btn.disabled = true;
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal
      });
      if (!res.ok) {
        setError("email", await apiError(res, "Failed to send OTP"));
        btn.innerHTML = DETAILS_BTN_HTML;
        btn.disabled = false;
        endBusy();
        return;
      }
      otpContainer.style.display = "block";
      btn.innerHTML = 'Verify OTP & Continue';
      btn.disabled = false;
      document.getElementById("email").disabled = true;
      endBusy();
    } catch (err) {
      if (signal.aborted) return; // Back pressed: the step was already reset
      setError("email", "Network error");
      btn.innerHTML = DETAILS_BTN_HTML;
      btn.disabled = false;
      endBusy();
    }
    return;
  }

  const resendBtn = document.getElementById("btn-resend-otp");
  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.dataset.bound = "true";
    resendBtn.addEventListener("click", async function() {
      if (busy) return;
      const signal = beginBusy(resetDetailsStep);
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: document.getElementById("email").value.trim() }),
          signal
        });
        if (res.ok) {
          resendBtn.textContent = "Sent!";
          resendTimer = setTimeout(() => {
            resendBtn.textContent = "Resend Code";
            resendBtn.disabled = false;
          }, 30000);
        } else {
          resendBtn.textContent = "Failed";
          resendBtn.disabled = false;
        }
        endBusy();
      } catch (err) {
        if (signal.aborted) return;
        resendBtn.textContent = "Error";
        resendBtn.disabled = false;
        endBusy();
      }
    });
  }

  const otp = otpInput.value.trim();
  if (!otp || otp.length !== 6) {
    setError("otp", "Please enter the 6-digit OTP");
    return;
  }

  const signal = beginBusy(resetDetailsStep);
  btn.innerHTML = 'Verifying...';
  btn.disabled = true;
  try {
    const authRes = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, phone, otp }),
      signal
    });
    if (!authRes.ok) {
      setError("otp", await apiError(authRes, "Invalid OTP"));
      btn.innerHTML = 'Verify OTP & Continue';
      btn.disabled = false;
      endBusy();
      return;
    }
    const { token } = await authRes.json();
    globalAuthToken = token;
    
    btn.innerHTML = 'Verify OTP & Continue';
    btn.disabled = false;
    
    endBusy(1);
  } catch(e) {
    if (signal.aborted) return;
    setError("otp", "Network error");
    btn.innerHTML = 'Verify OTP & Continue';
    btn.disabled = false;
    endBusy();
  }
});

document.getElementById("btn-to-payment").addEventListener("click", function () {
  document.getElementById("detailsForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
});

// In-page Back behaves exactly like the browser's Back button.
document.getElementById("btn-back-details").addEventListener("click", function () {
  history.back();
});

document.getElementById("btn-pay-now").addEventListener("click", async function () {
  if (busy) return;
  const btn = this;
  btn.disabled = true;
  btn.innerHTML = '<span>Processing…</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

  let signal = null;
  try {
    // Collect Details
    const firstName = document.getElementById("firstName").value.trim();
    const lastName  = document.getElementById("lastName").value.trim();
    const email     = document.getElementById("email").value.trim();
    const phone     = document.getElementById("phone").value.trim();
    const utr       = document.getElementById("utr") ? document.getElementById("utr").value.trim() : null;

    if (!utr) {
      alert("Please enter a valid 12-digit UTR to verify your payment.");
      btn.disabled = false;
      btn.innerHTML = '<span>Submit Details</span>';
      return;
    }

    // 1. Use the pre-verified Guest Token
    if (!globalAuthToken) {
      throw new Error("Please go back and verify your email first.");
    }
    const token = globalAuthToken;
    signal = beginBusy(resetPaymentStep);

    // 2. Upload Receipt
    const receiptInput = document.getElementById("receipt");
    if (!receiptInput || !receiptInput.files[0]) {
      throw new Error("Please upload a payment screenshot.");
    }
    
    const formData = new FormData();
    formData.append("receipt", receiptInput.files[0]);
    
    const uploadRes = await fetch("/api/receipts/upload", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData,
      signal
    });
    
    if (!uploadRes.ok) {
       throw new Error(await apiError(uploadRes, "Failed to upload receipt."));
    }
    const { receiptReference } = await uploadRes.json();
    if (signal.aborted) return;

    // 3. Create Order — from here the order exists server-side, so Back is
    // held until the submission settles instead of leaving a half-made order.
    busy.locked = true;
    const items = selected.map(id => ({ productId: id, quantity: 1 }));
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ items, couponCode: appliedCoupon })
    });
    
    if (!orderRes.ok) {
       throw new Error(await apiError(orderRes, "Failed to create order."));
    }
    const orderData = await orderRes.json();

    // 4. Submit Payment
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    // Generate receipt PDF silently
    btn.innerHTML = '<span>Generating Receipt...</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    lastReceipt = {
      orderNumber: orderData.orderNumber,
      name: firstName + " " + lastName,
      email,
      utr,
      coupon: appliedCoupon,
      date: new Date(orderData.createdAt || Date.now()),
      items: (orderData.items || []).map(it => ({
        title: it.productName,
        tag: (COURSES.find(c => c.id === it.productId) || {}).tag || "",
        amount: it.unitPrice * it.quantity
      })),
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      tax: orderData.tax,
      total: orderData.total
    };
    const receiptPdfBase64 = await window.generateReceiptBase64(lastReceipt);
    btn.innerHTML = '<span>Processing Payment...</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

    const payRes = await fetch("/api/payments", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ 
        orderId: orderData.id, 
        utr, 
        receiptReference, 
        idempotencyKey,
        receiptPdfBase64
      })
    });
    
    if (!payRes.ok) {
       throw new Error(await apiError(payRes, "Failed to submit payment."));
    }

    // Set confirmation data
    document.getElementById("confirm-email").textContent = email;
    document.getElementById("confirm-ref").textContent   = orderData.orderNumber;
    
    // Update local summary logic to show real DB totals if needed, but the UI flow expects renderSummary()
    renderSummary();
    endBusy(2);

    // Clear session on success
    try { 
      sessionStorage.removeItem("aceiiit_selected_courses"); 
      localStorage.removeItem("aceiiit_selected_courses"); 
    } catch (e) {}

  } catch (error) {
    if (signal && signal.aborted) return; // Back pressed: the step was already reset
    endBusy();
    alert(error.message);
    btn.disabled = false;
    btn.innerHTML = '<span id="pay-btn-label">Submit Details</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  }
});


// ── MOBILE SUMMARY TOGGLE ─────────────────────────────────────────────────
// The toggle is only displayed on small screens (see checkout.css); on wider
// screens the summary body is always visible regardless of this state.
const summaryToggle = document.getElementById("co-summary-toggle");
if (summaryToggle) {
  summaryToggle.addEventListener("click", function () {
    const open = this.getAttribute("aria-expanded") !== "true";
    this.setAttribute("aria-expanded", String(open));
    document.getElementById("co-summary-panel").classList.toggle("is-open", open);
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────
loadCourses();
goToStep(0);
history.replaceState({ coStep: 0 }, "");

// Re-read the selection when the page is restored from the back/forward cache
// (e.g. user went back to the homepage, changed courses, and returned).
window.addEventListener("pageshow", function (e) {
  if (e.persisted) {
    loadCourses();
    if (appliedCoupon) window.removeCoupon();
  }
});

// ── FILE UPLOAD LOGIC ──────────────────────────────────────────────────────
const btnRemoveReceipt = document.getElementById("btn-remove-receipt");

if (receiptInput && btnRemoveReceipt) {
  receiptInput.addEventListener("change", function() {
    if (this.files && this.files.length > 0) {
      btnRemoveReceipt.style.display = "flex";
    } else {
      btnRemoveReceipt.style.display = "none";
    }
  });

  btnRemoveReceipt.addEventListener("click", function() {
    receiptInput.value = ""; // Clear the file
    btnRemoveReceipt.style.display = "none";
    const utrInput = document.getElementById("utr");
    if (utrInput) {
      utrInput.value = "";
    }
    const utrError = document.getElementById("utr-error");
    if (utrError) {
      utrError.style.display = "none";
    }
  });
}

// ── GENERATE PDF RECEIPT ──────────────────────────────────────────────────
let html2pdfReady = null;
function loadHtml2pdf() {
  if (typeof window.html2pdf !== 'undefined') return Promise.resolve();
  if (!html2pdfReady) {
    html2pdfReady = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = resolve;
      script.onerror = () => { html2pdfReady = null; reject(new Error("Failed to load PDF library")); };
      document.head.appendChild(script);
    });
  }
  return html2pdfReady;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function buildReceiptHtml(data) {
  const date = data.date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const itemsHtml = data.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #333; font-size: 14px;">${esc(item.title)} <span style="font-size:10px; color:#888; margin-left:8px;">${esc(item.tag)}</span></td>
          <td style="padding: 12px 0; text-align: right; color: #333; font-size: 14px;">₹${item.amount}</td>
        </tr>`).join("");

  const discountRow = data.discount > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">Discount${data.coupon ? ` (${esc(data.coupon)})` : ""}</td>
              <td style="padding: 8px 0; text-align: right; color: #ef4444; font-size: 14px;">-₹${data.discount}</td>
            </tr>` : "";

  return `
    <div style="padding: 40px; font-family: 'Inter', sans-serif; background: #fff; color: #000; width: 800px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 34px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;"><span style="color: #111;">Ace</span><span style="color: #cda852;">IIIT</span></h1>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">The Ultimate UGEE Prep</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 24px; color: #111; letter-spacing: 1px;">RECEIPT</h2>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Order # ${esc(data.orderNumber)}</p>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Date: ${date}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Billed To:</h3>
          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333;">${esc(data.name)}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">${esc(data.email)}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details:</h3>
          <p style="margin: 0 0 4px; font-size: 14px; color: #333;">Method: UPI</p>
          <p style="margin: 0; color: #666; font-size: 14px;">UTR: ${esc(data.utr || "N/A")}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="border-bottom: 2px solid #333;">
            <th style="padding: 12px 0; text-align: left; font-size: 12px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
            <th style="padding: 12px 0; text-align: right; font-size: 12px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <table style="width: 300px; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${data.subtotal}</td>
            </tr>
            ${discountRow}
            <tr>
              <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">GST (${GST_RATE}%)</td>
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${data.tax}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right; padding-right: 20px;">Total Paid</td>
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right;">₹${data.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 0 0 4px;">Thank you for choosing AceIIIT!</p>
        <p style="margin: 0;">This is a computer-generated receipt and does not require a signature.</p>
      </div>
    </div>
  `;
}

// Hand html2pdf the markup as a string so it builds and positions the node in
// its own render container. Passing an element parked off-screen (left:-9999px)
// made html2pdf clone that offset too, which rendered a blank page.
// The html2pdf worker is itself thenable, so `finish` must run on it before
// anything awaits it.
async function renderReceipt(data, finish) {
  await loadHtml2pdf();
  const worker = html2pdf().set({
    margin:       0,
    filename:     `AceIIIT_Receipt_${data.orderNumber}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(buildReceiptHtml(data), 'string');
  return finish(worker);
}

window.generateReceiptPDF = async function() {
  if (!lastReceipt) return;
  const btn = document.getElementById("btn-download-receipt");
  if (btn) btn.innerHTML = "Generating PDF...";
  try {
    await renderReceipt(lastReceipt, w => w.save());
  } catch(e) {
    console.error("PDF generation failed", e);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    if (btn) btn.innerHTML = "Download Receipt";
  }
};

window.generateReceiptBase64 = async function(data) {
  try {
    return await renderReceipt(data, w => w.outputPdf('datauristring'));
  } catch(e) {
    console.error("PDF generation for email failed", e);
    return null;
  }
};
