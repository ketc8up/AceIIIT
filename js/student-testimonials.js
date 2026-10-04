// student-testimonials.js
document.addEventListener('DOMContentLoaded', () => {
  const DATA = [
    { text: "The mentorship gave me clarity on what to prioritize in the last 30 days. The linguistics approach is unmatched.", name: "Aspirant 2024", img: "/assets/images/placeholders/student-01.svg", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { text: "AceIIIT's portal felt exactly like the real UGEE interface. No surprises on exam day, which removed so much anxiety.", name: "Selected Student", img: "/assets/images/placeholders/student-02.svg", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    { text: "The mocks matched the real UGEE pattern, and every solution explained the reasoning, not just the answer.", name: "UGEE Aspirant", img: "/assets/images/placeholders/student-03.svg", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
  ];

  const P = 131, TOP = 99, STEP = 3 * P;
  const $ = id => document.getElementById(id);
  
  if (!$('tm-sl')) return;

  const sl = $('tm-sl'), sc = $('tm-sc'), sr = $('tm-sr'), q = $('tm-q'), who = $('tm-who');
  let cur = 0, busy = false, autoTimer = null, isVideoPlaying = false;

  function startAuto() {
    clearInterval(autoTimer);
    if (!isVideoPlaying) {
      autoTimer = setInterval(() => go(1, false), 5000);
    }
  }

  function stopAuto() {
    clearInterval(autoTimer);
  }

  const avatar = n => "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
     <stop offset='0' stop-color='#d9d9d9'/><stop offset='1' stop-color='${['#8a8a8a','#a8a8a8','#6e6e6e'][n%3]}'/></linearGradient></defs>
     <rect width='120' height='120' fill='url(#g)'/><circle cx='60' cy='46' r='19' fill='#3a3a3a'/>
     <path d='M18 120c2-28 18-40 42-40s40 12 42 40z' fill='#2a2a2a'/></svg>`);

  function tiles(strip, offset, from, to){
    for(let k = from; k <= to; k++){
      const t = document.createElement('div'); t.className = 'tm-tile'; t.style.top = (offset + k * P) + 'px'; strip.append(t);
    }
  }
  tiles(sl, 36, -8, 8); tiles(sr, 36, -8, 8); tiles(sc, TOP, -8, 8);

  function openVideo(url) {
    if (!url) return;
    isVideoPlaying = true;
    stopAuto();
    let pip = document.getElementById('tm-pip');
    if (!pip) {
      pip = document.createElement('div');
      pip.id = 'tm-pip';
      pip.className = 'tm-pip-player';
      pip.innerHTML = `<button class="tm-pip-close" aria-label="Close player">&times;</button><iframe allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
      document.body.appendChild(pip);
      pip.querySelector('.tm-pip-close').onclick = () => {
        pip.style.opacity = 0;
        pip.style.transform = 'translateY(20px) scale(0.9)';
        setTimeout(() => { pip.remove(); isVideoPlaying = false; startAuto(); }, 300);
      };
    }
    pip.querySelector('iframe').src = `${url}?autoplay=1`;
    pip.style.opacity = 1;
    pip.style.transform = 'none';
  }

  function photo(n, top){
    const d = document.createElement('div'); d.className = 'tm-ph'; d.style.top = top + 'px';
    d.innerHTML = `<img alt="${DATA[n].name}" src="${DATA[n].img || avatar(n)}"><div class="tm-play"></div><i></i>`; 
    if (DATA[n].video) {
      d.onclick = () => openVideo(DATA[n].video);
    }
    return d;
  }

  function setText(n, animate){
    const words = DATA[n].text.split(' ');
    q.innerHTML = words.map((w, i) => `<span class="tm-w" style="--i:${i}">${w}</span>`).join(' ');
    if(!animate) {
      q.querySelectorAll('.tm-w').forEach(w => { 
        w.style.animation = 'none'; 
        w.style.opacity = '1'; 
        w.style.filter = 'none'; 
        w.style.transform = 'none'; 
      });
    }
    who.textContent = DATA[n].name;
    who.classList.remove('tm-in', 'tm-show'); void who.offsetWidth;
    if(animate){ who.style.setProperty('--d', (words.length * 42 + 250) + 'ms'); who.classList.add('tm-in'); }
    else who.classList.add('tm-show');
  }

  function go(dir, manual = true){
    if(busy) return; busy = true;
    if(manual) startAuto();
    const n = (cur + dir + DATA.length) % DATA.length;
    const old = sc.querySelector('.tm-ph');
    const inc = photo(n, TOP - dir * STEP); sc.append(inc);

    q.classList.add('tm-out'); who.classList.remove('tm-in', 'tm-show'); who.style.opacity = 0;
    
    // Fallbacks if CSS vars aren't perfectly applied at documentRoot
    let durStr = getComputedStyle(document.documentElement).getPropertyValue('--tm-dur').trim();
    if (!durStr) durStr = '900ms';
    let easeStr = getComputedStyle(document.documentElement).getPropertyValue('--tm-ease').trim();
    if (!easeStr) easeStr = 'cubic-bezier(.7,0,.2,1)';
    
    const opts = { duration: parseInt(durStr) || 900, easing: easeStr || 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' };
    
    const mv = (el, dist) => el.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dir * dist}px)` }], opts);
    const a = mv(sc, STEP), b = mv(sl, 2 * P), c = mv(sr, 4 * P);

    setTimeout(() => { q.classList.remove('tm-out'); who.style.opacity = ''; setText(n, true); }, opts.duration * .33);

    Promise.all([a.finished, b.finished, c.finished]).then(() => {
      old.remove(); inc.style.top = TOP + 'px';
      [a, b, c].forEach(x => x.cancel());
      cur = n; busy = false;
    });
  }

  sc.append(photo(0, TOP)); setText(0, false);
  $('tm-next').onclick = () => go(1, true);
  $('tm-prev').onclick = () => go(-1, true);

  const wrapper = document.getElementById('student-testimonials');
  // Phones always keep sliding: a tap there counts as "hover" and never ends.
  const phone = window.matchMedia('(max-width: 767.98px)');
  const pauseAuto = () => { if (!phone.matches) stopAuto(); };
  if (wrapper) {
    wrapper.addEventListener('mouseenter', pauseAuto);
    wrapper.addEventListener('mouseleave', startAuto);
    // Keyboard users: don't rotate the quote they are reading/tabbing through
    wrapper.addEventListener('focusin', pauseAuto);
    wrapper.addEventListener('focusout', (e) => {
      if (!wrapper.contains(e.relatedTarget)) startAuto();
    });
  }
  startAuto();
});
