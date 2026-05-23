const INTERVIEW_SHEET_URL = "https://script.google.com/macros/s/AKfycbw46TfuEjQ5Bibi-te1WGfXLN9304roWXc-JZq5EhFl2XUJjcO55_9YyG7QYuhnvu_yRw/exec";

const state = {
  currentStep: 1
};

document.addEventListener("DOMContentLoaded", () => {
  initializeStepFlow();
  bindEvents();
  initReveal();
  setDots(1);
});

function initializeStepFlow() {
  state.currentStep = 1;
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

  const drop = byId("drop");
  const fileInput = byId("scorecardFile");

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

  byId("phone").addEventListener("input", () => {
    byId("phone").value = byId("phone").value.replace(/\D/g, "").slice(0, 10);
  });

  ["suprScore", "reapScore"].forEach((id) => {
    byId(id).addEventListener("input", () => {
      byId(id).value = byId(id).value.replace(/[^\d.]/g, "");
    });
  });
}

function byId(id) {
  return document.getElementById(id);
}

function valueOf(id) {
  const element = byId(id);
  return element ? element.value.trim() : "";
}

function validEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function validPhone(value) {
  return /^\d{10}$/.test(String(value || "").trim());
}

function validScore(value) {
  return /^\d+(\.\d+)?$/.test(String(value || "").trim());
}

function setDots(step) {
  [1, 2, 3].forEach((index) => {
    const dot = byId(`d${index}`);
    if (!dot) return;
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
    if (!validPhone(valueOf("phone"))) {
      return showError(1, "Please enter a valid 10-digit phone number.");
    }
    if (!validEmail(valueOf("email"))) {
      return showError(1, "Please enter a valid email address.");
    }
    if (!valueOf("city")) {
      return showError(1, "Please enter your city.");
    }
    if (!valueOf("age")) {
      return showError(1, "Please enter your age.");
    }
  }

  if (state.currentStep === 2 && step > 2) {
    if (!validScore(valueOf("suprScore"))) {
      return showError(2, "Please enter a valid SUPR score.");
    }
    if (!validScore(valueOf("reapScore"))) {
      return showError(2, "Please enter a valid REAP score.");
    }
    if (!byId("scorecardFile").files[0]) {
      return showError(2, "Please upload your scorecard image.");
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

function showError(step, message) {
  const errorBox = byId(`e${step}`);
  errorBox.textContent = message;
  errorBox.className = "err show";
}

function clearError(step) {
  const errorBox = byId(`e${step}`);
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.className = "err";
}

function buildReview() {
  const rows = [
    ["Name", valueOf("fullName")],
    ["Phone", valueOf("phone")],
    ["Email", valueOf("email")],
    ["City", valueOf("city")],
    ["Age", valueOf("age")],
    ["SUPR", valueOf("suprScore")],
    ["REAP", valueOf("reapScore")],
    ["Program", "Mock Interviews Cohort"],
    ["Status", "Under Review"]
  ];

  byId("rgrid").innerHTML = rows.map(([label, value]) => {
    const modifier = label === "Status" ? " ok" : "";
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
    byId("scorecardFile").files = event.dataTransfer.files;
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
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submit() {
  if (!validScore(valueOf("suprScore")) || !validScore(valueOf("reapScore"))) {
    showError(2, "Please go back and verify your SUPR and REAP scores.");
    byId("s1").hidden = true;
    byId("s3").hidden = true;
    byId("s2").hidden = false;
    state.currentStep = 2;
    setDots(2);
    return;
  }

  if (!INTERVIEW_SHEET_URL || INTERVIEW_SHEET_URL.includes("PASTE_YOUR_INTERVIEW_APPS_SCRIPT_URL_HERE")) {
    showError(3, "Backend URL not configured yet. Please deploy the interview Apps Script and update INTERVIEW_SHEET_URL in assets/js/interview-application.js.");
    return;
  }

  const submitButton = byId("sub");
  const spinner = byId("spin");
  const submitText = byId("subtxt");

  submitButton.disabled = true;
  spinner.style.display = "block";
  submitText.textContent = "SUBMITTING...";
  clearError(3);

  const file = byId("scorecardFile").files[0];
  let scorecardBase64 = "";

  if (file) {
    scorecardBase64 = await fileToBase64(file);
  }

  const payload = {
    applicationType: "interview-prep",
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    fullName: valueOf("fullName"),
    phone: valueOf("phone"),
    email: valueOf("email"),
    city: valueOf("city"),
    age: valueOf("age"),
    suprScore: valueOf("suprScore"),
    reapScore: valueOf("reapScore"),
    scorecardFileName: file?.name || "",
    scorecardMimeType: file?.type || "",
    scorecardBase64,
    lastQuestion: valueOf("lastQ"),
    status: "Under Review"
  };

  try {
    const response = await fetch(INTERVIEW_SHEET_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status !== "success") {
      showError(3, data.message || "Submission failed. Please try again.");
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
    ["SUPR", payload.suprScore],
    ["REAP", payload.reapScore],
    ["Email", payload.email],
    ["Status", "Under Review"]
  ];

  byId("sgrid").innerHTML = rows.map(([label, value]) => {
    const modifier = label === "Status" ? " ok" : "";
    return `<div class="rc"><div class="rcl">${label}</div><div class="rcv${modifier}">${escapeHtml(value)}</div></div>`;
  }).join("");

  byId("ptxt").textContent = "DONE";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetSubmitButton() {
  byId("sub").disabled = false;
  byId("spin").style.display = "none";
  byId("subtxt").textContent = "SUBMIT APPLICATION";
}

function initReveal() {
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!revealElements.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
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
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
    observer.observe(element);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
