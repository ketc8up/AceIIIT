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
const COUPONS = {
  "UGEE10":   { type: "percent",  value: 10, label: "10% off" },
  "FIRST200":  { type: "flat",    value: 200, label: "₹200 off" },
  "EARLYBIRD": { type: "percent", value: 15, label: "15% off" }
};

// ── STATE ─────────────────────────────────────────────────────────────────
let selected = [];
let subtotal  = 0;
let discount  = 0;
let appliedCoupon = null;

// ── STEP MANAGEMENT ───────────────────────────────────────────────────────
const sections   = ["details", "payment", "confirm"];
const stepEls    = sections.map(s => document.getElementById("step-indicator-" + s));
const sectionEls = sections.map(s => document.getElementById("section-" + s));

function goToStep(index) {
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
function loadCourses() {
  selected = [];
  
  let stored = null;
  try {
    stored = sessionStorage.getItem("aceiiit_selected_courses");
  } catch(e) {}
  
  if (!stored || stored === "[]") {
    try {
      stored = localStorage.getItem("aceiiit_selected_courses");
    } catch(e) {}
  }

  if (stored && stored !== "[]") {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        selected = parsed;
      } else {
        selected = COURSES.map(c => c.id);
      }
    } catch(e) {
      selected = COURSES.map(c => c.id);
    }
  } else {
    // Default fallback if nothing was ever cached
    selected = COURSES.map(c => c.id);
  }

  subtotal = 0;
  
  // Failsafe in case anything weird happened
  if (!Array.isArray(selected)) selected = COURSES.map(c => c.id);

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

  const effectiveSubtotal = subtotal;
  const gst   = Math.round(effectiveSubtotal * 0.18);
  const grand = effectiveSubtotal + gst - discount;

  document.getElementById("co-subtotal").textContent = "₹" + effectiveSubtotal;
  document.getElementById("co-gst").textContent      = "₹" + gst;
  document.getElementById("co-grand").textContent    = "₹" + grand;
  
  const payAmountEl = document.getElementById("pay-amount");
  if (payAmountEl) {
    payAmountEl.textContent = grand;
  }
  
  const qrEl = document.getElementById("payment-qr");
  if (qrEl) {
    qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi%3A%2F%2Fpay%3Fpa%3Daceiiit%40upi%26pn%3DAceIIIT%26am%3D${grand}%26cu%3DINR`;
  }
  const qrAmtText = document.getElementById("qr-amount-text");
  if (qrAmtText) {
    qrAmtText.textContent = "₹" + grand;
  }

  // Confirmation items removed for minimal UI

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
document.getElementById("applyCoupon").addEventListener("click", function () {
  const code   = document.getElementById("couponCode").value.trim().toUpperCase();
  const status = document.getElementById("coupon-status");
  if (!code) { status.textContent = ""; return; }

  if (COUPONS[code]) {
    const coup = COUPONS[code];
    appliedCoupon = code;
    if (coup.type === "percent") {
      discount = Math.round(subtotal * coup.value / 100);
    } else {
      discount = Math.min(coup.value, subtotal);
    }
    status.innerHTML = `✓ "${code}" applied — ${coup.label} <a href="javascript:void(0)" onclick="window.removeCoupon()" style="color: #ef4444; margin-left: 10px; text-decoration: underline; font-size: 0.9em;">Remove</a>`;
    status.className = "co-coupon-status success";
  } else {
    discount = 0;
    appliedCoupon = null;
    status.textContent = "Invalid coupon code";
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
const receiptInput = document.getElementById("receipt");
if (receiptInput) {
  receiptInput.addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return; // Only process images

    const utrLoading = document.getElementById("utr-loading");
    const utrInput = document.getElementById("utr");
    const utrError = document.getElementById("utr-error");
    
    if (utrLoading) utrLoading.style.display = "inline";
    if (utrError) {
      utrError.style.display = "none";
      utrError.textContent = "";
    }

    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      // Look for a 12-digit number (common for UPI UTRs)
      const match = text.match(/\b\d{12}\b/);
      if (match) {
        utrInput.value = match[0];
        // Visual feedback
        utrInput.style.transition = "border-color 0.3s, background-color 0.3s";
        utrInput.style.borderColor = "var(--green, #22c55e)";
        utrInput.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
        setTimeout(() => {
          utrInput.style.borderColor = "";
          utrInput.style.backgroundColor = "";
        }, 1500);
      } else {
        // No match found
        if (utrError) {
          utrError.textContent = "Could not find a 12-digit UTR in the image. Please enter it manually.";
          utrError.style.display = "block";
        }
      }
    } catch (error) {
      console.error("OCR failed:", error);
      if (utrError) {
        utrError.textContent = "Auto-read failed. Please enter the UTR manually.";
        utrError.style.display = "block";
      }
    } finally {
      if (utrLoading) utrLoading.style.display = "none";
    }
  });
}

// ── PHONE — digits only ───────────────────────────────────────────────────
const phoneInput = document.getElementById("phone");
if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });
}

// ── STEP NAV ──────────────────────────────────────────────────────────────
let globalAuthToken = null;

document.getElementById("detailsForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateDetails()) return;

  const btn = document.getElementById("btn-to-payment");
  const email = document.getElementById("email").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const otpContainer = document.getElementById("otp-field-container");
  const otpInput = document.getElementById("otp");

  if (otpContainer.style.display === "none") {
    btn.innerHTML = 'Sending OTP...';
    btn.disabled = true;
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json();
        setError("email", err.error || "Failed to send OTP");
        btn.innerHTML = 'Continue to Payment';
        btn.disabled = false;
        return;
      }
      otpContainer.style.display = "block";
      btn.innerHTML = 'Verify OTP & Continue';
      btn.disabled = false;
      document.getElementById("email").disabled = true;
    } catch (err) {
      setError("email", "Network error");
      btn.innerHTML = 'Continue to Payment';
      btn.disabled = false;
    }
    return;
  }

  const resendBtn = document.getElementById("btn-resend-otp");
  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.dataset.bound = "true";
    resendBtn.addEventListener("click", async function() {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: document.getElementById("email").value.trim() })
        });
        if (res.ok) {
          resendBtn.textContent = "Sent!";
          setTimeout(() => {
            resendBtn.textContent = "Resend Code";
            resendBtn.disabled = false;
          }, 30000);
        } else {
          resendBtn.textContent = "Failed";
          resendBtn.disabled = false;
        }
      } catch (err) {
        resendBtn.textContent = "Error";
        resendBtn.disabled = false;
      }
    });
  }

  const otp = otpInput.value.trim();
  if (!otp || otp.length !== 6) {
    setError("otp", "Please enter the 6-digit OTP");
    return;
  }

  btn.innerHTML = 'Verifying...';
  btn.disabled = true;
  try {
    const authRes = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, phone, otp })
    });
    if (!authRes.ok) {
      const err = await authRes.json();
      setError("otp", err.error || "Invalid OTP");
      btn.innerHTML = 'Verify OTP & Continue';
      btn.disabled = false;
      return;
    }
    const { token } = await authRes.json();
    globalAuthToken = token;
    
    btn.innerHTML = 'Verify OTP & Continue';
    btn.disabled = false;
    
    goToStep(1);
  } catch(e) {
    setError("otp", "Network error");
    btn.innerHTML = 'Verify OTP & Continue';
    btn.disabled = false;
  }
});

document.getElementById("btn-to-payment").addEventListener("click", function () {
  document.getElementById("detailsForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
});

document.getElementById("btn-back-details").addEventListener("click", function () {
  goToStep(0);
});

document.getElementById("btn-pay-now").addEventListener("click", async function () {
  const btn = this;
  btn.disabled = true;
  btn.innerHTML = '<span>Processing…</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

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
      body: formData
    });
    
    if (!uploadRes.ok) {
       const errData = await uploadRes.json();
       throw new Error(errData.error || "Failed to upload receipt.");
    }
    const { receiptReference } = await uploadRes.json();

    // 3. Create Order
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
       const errData = await orderRes.json();
       throw new Error(errData.error || "Failed to create order.");
    }
    const orderData = await orderRes.json();

    // 4. Submit Payment
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    // Generate receipt PDF silently
    btn.innerHTML = '<span>Generating Receipt...</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    const receiptPdfBase64 = await window.generateReceiptBase64(
      orderData.orderNumber,
      firstName + " " + lastName,
      email,
      utr,
      selected,
      subtotal,
      discount,
      appliedCoupon
    );
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
       const errData = await payRes.json();
       throw new Error(errData.error || "Failed to submit payment.");
    }

    // Set confirmation data
    document.getElementById("confirm-email").textContent = email;
    document.getElementById("confirm-ref").textContent   = orderData.orderNumber;
    
    // Update local summary logic to show real DB totals if needed, but the UI flow expects renderSummary()
    renderSummary();
    goToStep(2);

    // Clear session on success
    try { 
      sessionStorage.removeItem("aceiiit_selected_courses"); 
      localStorage.removeItem("aceiiit_selected_courses"); 
    } catch (e) {}

  } catch (error) {
    alert(error.message);
    btn.disabled = false;
    btn.innerHTML = '<span id="pay-btn-label">Submit Details</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  }
});


// ── INIT ──────────────────────────────────────────────────────────────────
loadCourses();
goToStep(0);

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
window.generateReceiptPDF = async function() {
  const btn = document.getElementById("btn-download-receipt");
  if (btn) btn.innerHTML = "Generating PDF...";

  if (typeof window.html2pdf === 'undefined') {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const name = document.getElementById("firstName").value.trim() + " " + document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const ref = document.getElementById("confirm-ref").textContent;
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const utr = document.getElementById("utr").value.trim() || "N/A";

  let itemsHtml = "";
  selected.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (c) {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #333; font-size: 14px;">${c.title} <span style="font-size:10px; color:#888; margin-left:8px;">${c.tag}</span></td>
          <td style="padding: 12px 0; text-align: right; color: #333; font-size: 14px;">₹${c.price}</td>
        </tr>`;
    }
  });

  const effectiveSubtotal = subtotal;
  const gst = Math.round(effectiveSubtotal * 0.18);
  const grand = effectiveSubtotal + gst - discount;
  
  let discountRow = "";
  if (discount > 0) {
    discountRow = `
      <tr>
        <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">Discount (${appliedCoupon})</td>
        <td style="padding: 8px 0; text-align: right; color: #ef4444; font-size: 14px;">-₹${discount}</td>
      </tr>`;
  }

  const receipt = document.createElement("div");
  receipt.innerHTML = `
    <div style="padding: 40px; font-family: 'Inter', sans-serif; background: #fff; color: #000; width: 800px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 34px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;"><span style="color: #111;">Ace</span><span style="color: #cda852;">IIIT</span></h1>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">The Ultimate UGEE Prep</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 24px; color: #111; letter-spacing: 1px;">RECEIPT</h2>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Order # ${ref}</p>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Date: ${date}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Billed To:</h3>
          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333;">${name}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">${email}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details:</h3>
          <p style="margin: 0 0 4px; font-size: 14px; color: #333;">Method: UPI</p>
          <p style="margin: 0; color: #666; font-size: 14px;">UTR: ${utr}</p>
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
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${effectiveSubtotal}</td>
            </tr>
            ${discountRow}
            <tr>
              <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">GST (18%)</td>
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${gst}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right; padding-right: 20px;">Total Paid</td>
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right;">₹${grand}</td>
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

  const opt = {
    margin:       0,
    filename:     `AceIIIT_Receipt_${ref}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(receipt).save();
  } catch(e) {
    console.error("PDF generation failed", e);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    if (btn) btn.innerHTML = "Download Receipt";
  }
};

window.generateReceiptBase64 = async function(ref, name, email, utr, selectedItems, subtotal, discount, appliedCoupon) {
  if (typeof window.html2pdf === 'undefined') {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  let itemsHtml = "";
  selectedItems.forEach(id => {
    const c = COURSES.find(x => x.id === id);
    if (c) {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #333; font-size: 14px;">${c.title} <span style="font-size:10px; color:#888; margin-left:8px;">${c.tag}</span></td>
          <td style="padding: 12px 0; text-align: right; color: #333; font-size: 14px;">₹${c.price}</td>
        </tr>`;
    }
  });

  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst - discount;
  
  let discountRow = "";
  if (discount > 0) {
    discountRow = `
      <tr>
        <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">Discount (${appliedCoupon})</td>
        <td style="padding: 8px 0; text-align: right; color: #ef4444; font-size: 14px;">-₹${discount}</td>
      </tr>`;
  }

  const receipt = document.createElement("div");
  receipt.innerHTML = `
    <div style="padding: 40px; font-family: 'Inter', sans-serif; background: #fff; color: #000; width: 800px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 34px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;"><span style="color: #111;">Ace</span><span style="color: #cda852;">IIIT</span></h1>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">The Ultimate UGEE Prep</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 24px; color: #111; letter-spacing: 1px;">RECEIPT</h2>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Order # ${ref}</p>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Date: ${date}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Billed To:</h3>
          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333;">${name}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">${email}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details:</h3>
          <p style="margin: 0 0 4px; font-size: 14px; color: #333;">Method: UPI</p>
          <p style="margin: 0; color: #666; font-size: 14px;">UTR: ${utr}</p>
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
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${subtotal}</td>
            </tr>
            ${discountRow}
            <tr>
              <td style="padding: 8px 0; color: #666; text-align: right; padding-right: 20px; font-size: 14px;">GST (18%)</td>
              <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">₹${gst}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right; padding-right: 20px;">Total Paid</td>
              <td style="padding: 16px 0 12px; font-weight: bold; font-size: 18px; color: #111; text-align: right;">₹${grand}</td>
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

  const opt = {
    margin:       0,
    filename:     `AceIIIT_Receipt_${ref}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    const pdfStr = await html2pdf().set(opt).from(receipt).outputPdf('datauristring');
    return pdfStr;
  } catch(e) {
    console.error("PDF generation for email failed", e);
    return null;
  }
};
