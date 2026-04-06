const EXAM_TARGET = new Date("2026-05-02T00:00:00+05:30");

const countdownState = new Map();

function pulseNumber(el) {
  if (!el) return;
  el.classList.remove("tick");
  void el.offsetWidth;
  el.classList.add("tick");
}

function setCountdownValue(id, value, { pad = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  const nextValue = pad ? String(Math.max(0, value)).padStart(2, "0") : String(Math.max(0, value));
  const previousValue = countdownState.get(id);

  if (previousValue !== nextValue) {
    el.textContent = nextValue;
    pulseNumber(el);
    countdownState.set(id, nextValue);
  }
}

function updateCountdown() {
  const now = new Date();
  const diff = EXAM_TARGET - now;

  if (diff <= 0) {
    setCountdownValue("cd-days", 0);
    setCountdownValue("cd-hours", 0);
    setCountdownValue("cd-mins", 0);
    setCountdownValue("cd-secs", 0);
    setCountdownValue("days-num", 0, { pad: false });
    return;
  }

  const days = Math.floor(diff / 864e5);
  const hours = Math.floor((diff % 864e5) / 36e5);
  const mins = Math.floor((diff % 36e5) / 6e4);
  const secs = Math.floor((diff % 6e4) / 1e3);

  setCountdownValue("cd-days", days);
  setCountdownValue("cd-hours", hours);
  setCountdownValue("cd-mins", mins);
  setCountdownValue("cd-secs", secs);
  setCountdownValue("days-num", days, { pad: false });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
