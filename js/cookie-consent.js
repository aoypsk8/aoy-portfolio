/**
 * Full-screen cookie consent overlay gating Google Analytics storage via Consent Mode.
 * gtag() is defined inline in <head> before this script loads.
 */
(function () {
  const KEY = "cookie-consent";
  const stored = localStorage.getItem(KEY);

  if (typeof window.gtag !== "function") return;

  if (stored === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }

  if (stored === "denied") return;

  const overlay = document.createElement("div");
  overlay.className = "cookie-consent-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Cookie consent");
  overlay.innerHTML = `
    <div class="cookie-consent">
      <h2 class="cookie-consent__title">Cookies &amp; privacy</h2>
      <p class="cookie-consent__text">
        This site uses cookies for basic visitor analytics (page views, country-level location).
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Learn more</a>
      </p>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__decline">Decline</button>
        <button type="button" class="cookie-consent__accept">Accept</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  document.body.classList.add("custom-cursor-disabled");

  function dismiss(choice) {
    localStorage.setItem(KEY, choice);
    if (choice === "granted") {
      gtag("consent", "update", { analytics_storage: "granted" });
    }
    overlay.remove();
    document.body.style.overflow = "";
    document.body.classList.remove("custom-cursor-disabled");
  }

  overlay
    .querySelector(".cookie-consent__accept")
    .addEventListener("click", () => dismiss("granted"));

  overlay
    .querySelector(".cookie-consent__decline")
    .addEventListener("click", () => dismiss("denied"));
})();
