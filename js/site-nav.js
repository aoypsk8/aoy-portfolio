/**
 * Shared nav scroll bar, back-to-top, and mobile menu (index + subpages)
 */
(function () {
  const nav = document.getElementById("nav");
  const bar = document.getElementById("bar");
  const btt = document.getElementById("btt");
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  if (!nav) return;

  function closeMenu() {
    if (!navToggle || !mobileMenu) return;
    navToggle.classList.remove("open");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  window.addEventListener(
    "scroll",
    () => {
      const st = document.documentElement.scrollTop;
      const sh =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (bar) bar.style.width = sh > 0 ? (st / sh) * 100 + "%" : "0%";
      nav.classList.toggle("s", st > 60);
      if (btt) btt.classList.toggle("show", st > 500);
    },
    { passive: true }
  );

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open);
      mobileMenu.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    });

    mobileMenu.querySelectorAll("a").forEach((a, i) => {
      a.addEventListener("click", closeMenu);
      a.style.transitionDelay = `${0.05 + i * 0.04}s`;
    });
  }

  if (btt) {
    btt.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  nav.classList.toggle("s", window.scrollY > 60);
})();
