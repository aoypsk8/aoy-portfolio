/**
 * Activities & Events  load JSON, render cards, gallery modal
 * Configure via window.__EVENTS_CONFIG__ before this script runs.
 */
(function () {
  const cfg = window.__EVENTS_CONFIG__ || {};
  const actGrid = document.getElementById(cfg.gridId || "actGrid");
  if (!actGrid) return;

  const actModal = document.getElementById("actModal");
  const modalClose = document.getElementById("actModalClose");
  const modalTag = document.getElementById("actModalTag");
  const modalTitle = document.getElementById("actModalTitle");
  const modalDesc = document.getElementById("actModalDesc");
  const modalMeta = document.getElementById("actModalMeta");
  const galleryImg = document.getElementById("actGalleryImg");
  const galleryCounter = document.getElementById("actGalleryCounter");
  const thumbsWrap = document.getElementById("actThumbs");
  const prevBtn = document.getElementById("actGalleryPrev");
  const nextBtn = document.getElementById("actGalleryNext");

  if (!actModal || !modalClose) return;

  let currentImages = [];
  let currentIndex = 0;

  const revealIO =
    window.__eventsRevealIO ||
    new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("on");
        });
      },
      { threshold: 0.12 }
    );
  window.__eventsRevealIO = revealIO;

  function observeReveal(el, delayIndex) {
    el.classList.add("reveal");
    revealIO.observe(el);
    el.style.transitionDelay = (delayIndex % 4) * 0.07 + "s";
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("on");
    });
  }

  function showImage(index) {
    currentIndex = index;
    galleryImg.style.opacity = "0";
    setTimeout(() => {
      galleryImg.src = currentImages[index];
      galleryImg.style.opacity = "1";
    }, 150);
    galleryCounter.textContent = `${index + 1} / ${currentImages.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === currentImages.length - 1;
    thumbsWrap.querySelectorAll(".act-thumb").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
  }

  function openModal(event) {
    modalTag.textContent = event.tag;
    modalTitle.textContent = event.title;
    modalDesc.textContent = event.description;
    modalMeta.textContent = `${event.date} \u00b7 ${event.location}`;
    currentImages =
      event.images && event.images.length
        ? event.images
        : event.cover
          ? [event.cover]
          : [];

    thumbsWrap.innerHTML = "";
    if (!currentImages.length) {
      galleryImg.src = "";
      galleryImg.style.opacity = "1";
      galleryCounter.textContent = "";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      actModal.classList.add("open");
      document.body.style.overflow = "hidden";
      return;
    }

    currentImages.forEach((src, i) => {
      const thumb = document.createElement("div");
      thumb.className = "act-thumb";
      thumb.innerHTML = `<img src="${src}" alt="Photo ${i + 1}" loading="lazy">`;
      thumb.addEventListener("click", () => showImage(i));
      thumbsWrap.appendChild(thumb);
    });

    showImage(0);
    actModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    actModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) showImage(currentIndex - 1);
  });
  nextBtn.addEventListener("click", () => {
    if (currentIndex < currentImages.length - 1) showImage(currentIndex + 1);
  });
  modalClose.addEventListener("click", closeModal);
  actModal.addEventListener("click", (e) => {
    if (e.target === actModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!actModal.classList.contains("open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft" && currentIndex > 0) showImage(currentIndex - 1);
    if (e.key === "ArrowRight" && currentIndex < currentImages.length - 1)
      showImage(currentIndex + 1);
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCard(ev, index) {
    const card = document.createElement("div");
    card.className = "act-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="act-img-wrap">
        <img src="${escapeHtml(ev.cover)}" alt="${escapeHtml(ev.title)}" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'act-img-placeholder\\'><svg width=\\'40\\' height=\\'40\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' viewBox=\\'0 0 24 24\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><path d=\\'M3 9h18M9 21V9\\'/></svg><span>No image yet</span></div>'" />
      </div>
      <div class="act-body">
        <span class="act-event-tag">${escapeHtml(ev.tag)}</span>
        <p class="act-title">${escapeHtml(ev.title)}</p>
        <p class="act-meta">${escapeHtml(ev.date)} \u00b7 ${escapeHtml(ev.location)}</p>
      </div>`;
    card.addEventListener("click", () => openModal(ev));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(ev);
      }
    });
    actGrid.appendChild(card);
    observeReveal(card, index);
  }

  function appendSeeMoreCard(label, totalHint) {
    const href = cfg.seeMoreHref || "activities.html";
    const more = document.createElement("a");
    more.href = href;
    more.className = "act-card act-card-more";
    const hint =
      totalHint != null
        ? `<p class="act-more-hint">${totalHint} events total</p>`
        : "";
    more.innerHTML = `
      <div class="act-more-inner">
        <span class="act-more-icon" aria-hidden="true"></span>
        <p class="act-more-label">${escapeHtml(label || "See more")}</p>
        <p class="act-more-sub">View full gallery</p>
        ${hint}
      </div>`;
    actGrid.appendChild(more);
    observeReveal(more, 3);
  }

  function parsePayload(data) {
    if (Array.isArray(data)) return { events: data, total: cfg.totalCount };
    return {
      events: data.preview || data.items || data.events || [],
      total: data.total ?? data.totalCount ?? cfg.totalCount,
    };
  }

  function defaultSkeletonCount() {
    return cfg.seeMoreHref ? 6 : 8;
  }

  function showGridSkeleton() {
    const n = cfg.skeletonCount ?? defaultSkeletonCount();
    if (window.GridSkeleton) {
      window.GridSkeleton.renderActSkeletons(actGrid, n);
    } else {
      actGrid.setAttribute("aria-busy", "true");
    }
  }

  function renderCards(events, total) {
    if (window.GridSkeleton) window.GridSkeleton.setGridLoading(actGrid, false);
    actGrid.innerHTML = "";
    if (!events.length && !cfg.seeMoreHref) {
      actGrid.innerHTML =
        '<p class="act-empty">No events yet. Add entries to events/data.json.</p>';
      return;
    }
    events.forEach((ev, i) => buildCard(ev, i));
    if (cfg.seeMoreHref) {
      appendSeeMoreCard(cfg.seeMoreLabel, total);
    }
  }

  const dataUrl = cfg.dataUrl || "events/data.json";
  showGridSkeleton();
  fetch(dataUrl)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then((data) => {
      const { events, total } = parsePayload(data);
      renderCards(events, total);
    })
    .catch(() => {
      if (window.GridSkeleton) window.GridSkeleton.setGridLoading(actGrid, false);
      actGrid.innerHTML =
        '<p class="act-empty">Could not load events. Serve the site with a local web server (e.g. python3 -m http.server).</p>';
    });
})();
