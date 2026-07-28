/**
 * Cookie consent banner gating Google Analytics storage via Consent Mode.
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

  const banner = document.createElement("div");
  banner.className = "cookie-consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <p class="cookie-consent__text">
      This site uses cookies for basic visitor analytics (page views, country-level location).
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Learn more</a>
    </p>
    <div class="cookie-consent__actions">
      <button type="button" class="cookie-consent__decline">Decline</button>
      <button type="button" class="cookie-consent__accept">Accept</button>
    </div>
  `;

  document.body.appendChild(banner);

  banner
    .querySelector(".cookie-consent__accept")
    .addEventListener("click", () => {
      localStorage.setItem(KEY, "granted");
      gtag("consent", "update", { analytics_storage: "granted" });
      banner.remove();
    });

  banner
    .querySelector(".cookie-consent__decline")
    .addEventListener("click", () => {
      localStorage.setItem(KEY, "denied");
      banner.remove();
    });
})();
