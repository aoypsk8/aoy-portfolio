(function initCustomCursor() {
  const canUse =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canUse) return;

  const wrap = document.getElementById("cursorWrap");
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  const icon = document.getElementById("cursorIcon");
  if (!wrap || !dot || !ring || !icon) return;

  document.body.classList.add("custom-cursor-active");

  let mx = -100;
  let my = -100;
  let rx = -100;
  let ry = -100;
  let visible = false;

  const root = document.documentElement;
  const setMouse = () => {
    root.style.setProperty("--mx", mx + "px");
    root.style.setProperty("--my", my + "px");
    root.style.setProperty("--rx", rx + "px");
    root.style.setProperty("--ry", ry + "px");
  };

  document.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        document.body.classList.remove("custom-cursor-hidden");
      }
      setMouse();
    },
    { passive: true },
  );

  document.addEventListener("mouseleave", () => {
    document.body.classList.add("custom-cursor-hidden");
    visible = false;
  });

  document.addEventListener("mouseenter", () => {
    if (visible) document.body.classList.remove("custom-cursor-hidden");
  });

  const lerp = (a, b, t) => a + (b - a) * t;
  function tick() {
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    setMouse();
    requestAnimationFrame(tick);
  }
  tick();

  const hoverSel =
    "a, button, .btn, .navCta, .pf, .ct-link, .eu-card, .lang-card, .pj, .sk-tag, .num-block, .logo-wrap, .logo, .navToggle, .mm-cta, #btt, label, [role='button'], .act-card, .blog-card, .act-gallery-nav, .blog-modal-close, .act-modal-close, .blog-code-copy, .blog-share-copy";
  const textSel =
    "p, .hero-desc, .about-body, .exp-points li, .pj-desc, .ct-sub, h1, h2, h3, .s-title, .about-intro, .blog-excerpt, .blog-modal-body";

  document.addEventListener("mouseover", (e) => {
    const t = e.target;
    if (t.closest(hoverSel)) document.body.classList.add("cursor-hover");
    else document.body.classList.remove("cursor-hover");

    if (t.closest(textSel) && !t.closest(hoverSel))
      document.body.classList.add("cursor-text");
    else document.body.classList.remove("cursor-text");
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.add("cursor-click");
    const ripple = document.createElement("div");
    ripple.className = "cursor-ripple";
    ripple.style.left = mx + "px";
    ripple.style.top = my + "px";
    document.body.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  document.addEventListener("mouseup", () =>
    document.body.classList.remove("cursor-click"),
  );
})();
