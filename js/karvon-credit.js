/**
 * karvon-credit.js — the "Powered by KARVON.STUDIO" credit in the footer.
 * The KARVON mark's facets loop continuously (assemble, hold, scatter), but only
 * while the credit is on screen. Without this script the mark simply shows assembled.
 */
(function () {
  'use strict';

  var credits = document.querySelectorAll('.karvon-credit');
  if (!credits.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-in', entry.isIntersecting);
    });
  }, { threshold: 0.2 });

  credits.forEach(function (credit) {
    credit.classList.add('is-armed');
    io.observe(credit);
  });
})();
