/* Caravan: small page behaviours. No libraries. */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var items = document.querySelectorAll(".reveal");

  function showAll() {
    for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
  }

  // Scroll fade-in. Skipped entirely when motion is reduced or the API is missing.
  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  for (var i = 0; i < items.length; i++) observer.observe(items[i]);

  // Printing shouldn't produce blank sections that were never scrolled into view.
  window.addEventListener("beforeprint", showAll);
})();
