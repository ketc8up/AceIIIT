  // Target: May 2 2026, 00:00 IST (UTC+5:30)
  const EXAM_TARGET = new Date('2026-05-02T00:00:00+05:30');

  function updateCountdown() {
    const now = new Date();
    const diff = EXAM_TARGET - now;

    const pad = n => String(Math.max(0, n)).padStart(2, '0');

    if (diff <= 0) {
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      const dn = document.getElementById('days-num');
      if (dn) dn.textContent = '0';
      return;
    }

    const days  = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const mins  = Math.floor((diff % 36e5)  / 6e4);
    const secs  = Math.floor((diff % 6e4)   / 1e3);

    const elD = document.getElementById('cd-days');
    const elH = document.getElementById('cd-hours');
    const elM = document.getElementById('cd-mins');
    const elS = document.getElementById('cd-secs');
    const elDN = document.getElementById('days-num');

    if (elD)  elD.textContent  = pad(days);
    if (elH)  elH.textContent  = pad(hours);
    if (elM)  elM.textContent  = pad(mins);
    if (elS)  elS.textContent  = pad(secs);
    if (elDN) elDN.textContent = days;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
