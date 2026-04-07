const SHEET_URL = "https://script.google.com/macros/s/AKfycbyeDFY-ieQ9SXRh1NtxKvMY5TQnFBvmSiAW8HySxZ4Vcsia95h2zmamWgkiXdTV_VsIFQ/exec";

const COURSE_CONFIG = {
  notes: {
    cardId: "cc1",
    checkId: "ck1",
    payId: "p499",
    course: "Notes Only",
    courseLabel: "Notes Only - Study Material",
    amount: "499",
    fee: "\u20b9499"
  },
  full: {
    cardId: "cc2",
    checkId: "ck2",
    payId: "p1499",
    course: "Class + Notes",
    courseLabel: "Class + Notes",
    amount: "1499",
    fee: "\u20b91,499"
  },
  mock: {
    cardId: "cc3",
    checkId: "ck3",
    payId: "pMock",
    course: "Mock Test Pack",
    courseLabel: "Mock Test Pack",
    amount: "599",
    fee: "\u20b9599"
  }
};

const PAYMENT_UPI = {
  id: "arka24apj@oksbi",
  courses: {
    notes: {
      amount: "499.00",
      note: "Notes Only - Study Material",
      qrImageId: "notesQrImage",
      upiIdTextId: "notesUpiIdText",
      upiAmountTextId: "notesUpiAmountText",
      payLinkId: "notesPayLink"
    },
    full: {
      amount: "1499.00",
      note: "Class + Notes",
      qrImageId: "fullQrImage",
      upiIdTextId: "fullUpiIdText",
      upiAmountTextId: "fullUpiAmountText",
      payLinkId: "fullPayLink"
    },
    mock: {
      amount: "599.00",
      note: "Mock Test Pack",
      qrImageId: "mockQrImageBlock",
      upiIdTextId: "mockUpiIdTextBlock",
      upiAmountTextId: "mockUpiAmountTextBlock",
      payLinkId: "mockPayLinkBlock"
    }
  }
};

const state = {
  currentStep: 1,
  selectedCourseKey: ""
};

document.addEventListener("DOMContentLoaded", () => {
  initializeStepFlow();
  hydratePaymentCards();
  bindEvents();
  initReveal();
  initInteractiveMotion();
  setDots(1);
});

function initializeStepFlow() {
  state.currentStep = 1;
  state.selectedCourseKey = "";

  byId("s1").hidden = false;
  byId("s2").hidden = true;
  byId("s3").hidden = true;
  byId("succ").classList.remove("show", "is-visible");
  byId("succ").hidden = true;
}

function bindEvents() {
  byId("toStep2").addEventListener("click", () => go(2));
  byId("toStep1").addEventListener("click", () => go(1));
  byId("toStep3").addEventListener("click", () => go(3));
  byId("backToStep2").addEventListener("click", () => go(2));
  byId("sub").addEventListener("click", submit);

  Object.keys(COURSE_CONFIG).forEach((key) => {
    byId(COURSE_CONFIG[key].cardId).addEventListener("click", () => pick(key));
  });

  const drop = byId("drop");
  const fileInput = byId("ss");

  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  drop.addEventListener("dragover", onDragOver);
  drop.addEventListener("dragleave", onDragLeave);
  drop.addEventListener("drop", onDropFile);
  fileInput.addEventListener("change", onFileChange);

  const txnInput = byId("txnId");
  txnInput.addEventListener("input", () => {
    txnInput.value = txnInput.value.replace(/\D/g, "").slice(0, 12);
  });
}

function hydratePaymentCards() {
  Object.keys(PAYMENT_UPI.courses).forEach((key) => {
    const config = PAYMENT_UPI.courses[key];
    const upiUri = buildUpiUri(config.amount, config.note);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(upiUri)}`;

    const qrImage = byId(config.qrImageId);
    if (qrImage) {
      qrImage.src = qrSrc;
      qrImage.alt = `${config.note} UPI QR`;
    }

    const upiIdText = byId(config.upiIdTextId);
    if (upiIdText) {
      upiIdText.textContent = PAYMENT_UPI.id;
    }

    const upiAmountText = byId(config.upiAmountTextId);
    if (upiAmountText) {
      upiAmountText.textContent = `\u20b9${config.amount}`;
    }

    const payLink = byId(config.payLinkId);
    if (payLink) {
      payLink.href = upiUri;
    }
  });
}

function buildUpiUri(amount, note) {
  const params = new URLSearchParams({
    pa: PAYMENT_UPI.id,
    pn: "AceIIIT",
    am: amount,
    cu: "INR",
    tn: note
  });

  return `upi://pay?${params.toString()}`;
}

function byId(id) {
  return document.getElementById(id);
}

function valueOf(id) {
  const element = byId(id);
  return element ? element.value.trim() : "";
}

function validTxnId(id) {
  return /^\d{12}$/.test(String(id || ""));
}

function setDots(step) {
  [1, 2, 3].forEach((index) => {
    const dot = byId(`d${index}`);
    if (!dot) {
      return;
    }

    dot.className = `pdot${index < step ? " done" : index === step ? " on" : ""}`;
  });

  byId("ptxt").textContent = `0${step} / 03`;
}

function go(step) {
  clearError(state.currentStep);

  if (state.currentStep === 1 && step > 1) {
    if (!valueOf("fullName")) {
      return showError(1, "Please enter your full name.");
    }
    if (!valueOf("phone")) {
      return showError(1, "Please enter your phone number.");
    }
    if (!valueOf("email") || !valueOf("email").includes("@")) {
      return showError(1, "Please enter a valid email address.");
    }
  }

  if (state.currentStep === 2 && step > 2) {
    if (!state.selectedCourseKey) {
      return showError(2, "Please select a course.");
    }
    if (!valueOf("txnId")) {
      return showError(2, "Please enter your UPI Transaction ID.");
    }
    if (!validTxnId(valueOf("txnId"))) {
      return showError(2, "UPI Transaction ID must be exactly 12 digits.");
    }
    if (!byId("ss").files[0]) {
      return showError(2, "Please upload your payment screenshot.");
    }
  }

  byId(`s${state.currentStep}`).hidden = true;
  state.currentStep = step;
  const nextStep = byId(`s${step}`);
  nextStep.hidden = false;
  nextStep.classList.add("is-visible");
  byId("succ").hidden = true;
  byId("succ").classList.remove("show");
  setDots(step);

  if (step === 3) {
    buildReview();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function pick(key) {
  state.selectedCourseKey = key;

  Object.keys(COURSE_CONFIG).forEach((courseKey) => {
    const config = COURSE_CONFIG[courseKey];
    const isSelected = courseKey === key;
    byId(config.cardId).classList.toggle("sel", isSelected);
    byId(config.checkId).textContent = isSelected ? "\u2713" : "";
    byId(config.payId).classList.toggle("show", isSelected);
    byId(config.payId).classList.add("is-visible");
  });

  byId("txnwrap").style.display = "block";
}

function getSelectedCourse() {
  return COURSE_CONFIG[state.selectedCourseKey] || null;
}

function showError(step, message) {
  const errorBox = byId(`e${step}`);
  errorBox.textContent = message;
  errorBox.className = "err show";
}

function clearError(step) {
  const errorBox = byId(`e${step}`);
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.className = "err";
  }
}

function buildReview() {
  const selected = getSelectedCourse();
  const rows = [
    ["Name", valueOf("fullName")],
    ["Phone", valueOf("phone")],
    ["Email", valueOf("email")],
    ["City", valueOf("city") || "-"],
    ["Course", selected ? selected.courseLabel : "-"],
    ["Amount", selected ? selected.fee : "-"],
    ["Txn ID", valueOf("txnId")],
    ["Status", "Pending Verification"]
  ];

  byId("rgrid").innerHTML = rows.map(([label, value]) => {
    const modifier = label === "Amount" ? " gold" : label === "Status" ? " ok" : "";
    return `<div class="rc"><div class="rcl">${label}</div><div class="rcv${modifier}">${escapeHtml(value)}</div></div>`;
  }).join("");
}

function onDragOver(event) {
  event.preventDefault();
  byId("drop").classList.add("over");
}

function onDragLeave() {
  byId("drop").classList.remove("over");
}

function onDropFile(event) {
  event.preventDefault();
  byId("drop").classList.remove("over");
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    byId("ss").files = event.dataTransfer.files;
    showFileName(file.name);
  }
}

function onFileChange(event) {
  if (event.target.files[0]) {
    showFileName(event.target.files[0].name);
  }
}

function showFileName(name) {
  byId("fn").textContent = name;
  byId("fok").style.display = "flex";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submit() {
  const selected = getSelectedCourse();

  if (!selected) {
    showError(2, "Please select a course.");
    go(2);
    return;
  }

  if (!validTxnId(valueOf("txnId"))) {
    showError(2, "UPI Transaction ID must be exactly 12 digits.");
    byId("s1").hidden = true;
    byId("s3").hidden = true;
    byId("s2").hidden = false;
    state.currentStep = 2;
    setDots(2);
    return;
  }

  const submitButton = byId("sub");
  const spinner = byId("spin");
  const submitText = byId("subtxt");
  submitButton.disabled = true;
  spinner.style.display = "block";
  submitText.textContent = "SUBMITTING...";
  clearError(3);

  const file = byId("ss").files[0];
  let screenshotBase64 = "";

  if (file) {
    screenshotBase64 = await fileToBase64(file);
  }

  const payload = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    fullName: valueOf("fullName"),
    phone: valueOf("phone"),
    email: valueOf("email"),
    city: valueOf("city"),
    age: valueOf("age"),
    course: selected.course,
    amount: selected.amount,
    transactionId: valueOf("txnId"),
    screenshotFileName: file?.name || "",
    screenshotBase64,
    lastQuestion: valueOf("lastQ"),
    status: "Pending Verification"
  };

  try {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status !== "success") {
      showError(3, data.message || (data.status === "duplicate"
        ? "This UPI Transaction ID has already been used."
        : "Submission failed. Please try again."));
      resetSubmitButton();
      return;
    }
  } catch (error) {
    showError(3, "Submission failed. Please check your connection or Apps Script deployment.");
    resetSubmitButton();
    return;
  }

  [1, 2, 3].forEach((index) => {
    byId(`s${index}`).hidden = true;
  });

  const successSection = byId("succ");
  successSection.hidden = false;
  successSection.classList.add("show", "is-visible");
  byId("sname").textContent = valueOf("fullName").split(" ")[0].toUpperCase();

  const rows = [
    ["Name", payload.fullName],
    ["Course", selected.courseLabel],
    ["Amount", selected.fee],
    ["Txn ID", payload.transactionId],
    ["Email", payload.email],
    ["Status", "Pending Verification"]
  ];

  byId("sgrid").innerHTML = rows.map(([label, value]) => {
    const modifier = label === "Amount" ? " gold" : label === "Status" ? " ok" : "";
    return `<div class="rc"><div class="rcl">${label}</div><div class="rcv${modifier}">${escapeHtml(value)}</div></div>`;
  }).join("");

  byId("ptxt").textContent = "DONE";
  [1, 2, 3].forEach((index) => {
    const dot = byId(`d${index}`);
    if (dot) {
      dot.className = "pdot done";
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  function resetSubmitButton() {
    submitButton.disabled = false;
    spinner.style.display = "none";
    submitText.textContent = "CONFIRM ENROLLMENT";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initReveal() {
  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item, index) => {
    item.style.setProperty("--delay", `${Math.min(index * 70, 280)}ms`);
    observer.observe(item);
  });
}

function initInteractiveMotion() {
  const tiltItems = [...document.querySelectorAll("[data-tilt]")];

  tiltItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = ((px - 0.5) * 10).toFixed(2);
      const rotateX = ((0.5 - py) * 10).toFixed(2);

      item.style.setProperty("--tilt-x", `${rotateX}deg`);
      item.style.setProperty("--tilt-y", `${rotateY}deg`);
      item.classList.add("is-tilting");
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--tilt-x", "0deg");
      item.style.setProperty("--tilt-y", "0deg");
      item.classList.remove("is-tilting");
    });
  });
}
