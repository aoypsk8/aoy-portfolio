(function () {
  function ensureLoadingHost(img) {
    const host = img.parentElement;
    if (!host) return null;

    host.classList.add("img-load-host");
    const hasSpinner = Array.from(host.children).some(
      (el) => el.classList && el.classList.contains("img-load-spinner")
    );
    if (!hasSpinner) {
      const spinner = document.createElement("span");
      spinner.className = "img-load-spinner";
      spinner.setAttribute("aria-hidden", "true");
      host.appendChild(spinner);
    }
    return host;
  }

  function markLoaded(img) {
    img.classList.add("is-loaded");
    const host = img.parentElement;
    if (host) host.classList.remove("is-img-loading");
  }

  function prepareImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");

    const host = ensureLoadingHost(img);
    if (host) host.classList.add("is-img-loading");

    if (!img.classList.contains("img-skeleton")) {
      img.classList.add("img-skeleton");
    }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded(img);
      return;
    }

    img.addEventListener("load", () => markLoaded(img), { once: true });
    img.addEventListener("error", () => markLoaded(img), { once: true });
  }

  function scan(root) {
    if (!root) return;
    if (root instanceof HTMLImageElement) {
      prepareImage(root);
      return;
    }
    root.querySelectorAll?.("img").forEach(prepareImage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scan(document));
  } else {
    scan(document);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) scan(node);
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
