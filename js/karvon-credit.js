/**
 * karvon-credit.js — the "Powered by KARVON.STUDIO" credit in the footer.
 * The KARVON mark's facets snap together when the footer scrolls into view,
 * and replay on hover. Without this script the mark simply shows assembled.
 */
(function () {
  'use strict';

  var credits = document.querySelectorAll('.karvon-credit');
  if (!credits.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  credits.forEach(function (credit) {
    credit.classList.add('is-armed');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        credit.classList.add('is-in');
        io.disconnect();
      });
    }, { threshold: 0.6 });
    io.observe(credit);

    // replay on hover: scatter, then assemble again on the next frame
    credit.addEventListener('mouseenter', function () {
      credit.classList.remove('is-in');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { credit.classList.add('is-in'); });
      });
    });
  });
})();
