/**
 * Blog ï¿½ load JSON, render cards, article modal
 * Configure via window.__BLOGS_CONFIG__ before this script runs.
 */
(function () {
  const cfg = window.__BLOGS_CONFIG__ || {};
  const blogGrid = document.getElementById(cfg.gridId || "blogGrid");
  if (!blogGrid) return;
  const openMode = cfg.openMode || "modal"; // "modal" | "page"
  const articlePagePath = cfg.articlePagePath || "blogs.html";
  const articleId = new URLSearchParams(window.location.search).get("id");

  const blogModal = document.getElementById("blogModal");
  const blogModalClose = document.getElementById("blogModalClose");
  const blogModalTag = document.getElementById("blogModalTag");
  const blogModalTitle = document.getElementById("blogModalTitle");
  const blogModalDesc = document.getElementById("blogModalDesc");
  const blogModalMeta = document.getElementById("blogModalMeta");
  const blogGalleryWrap = document.getElementById("blogGalleryWrap");
  const blogGalleryImg = document.getElementById("blogGalleryImg");
  const blogGalleryCounter = document.getElementById("blogGalleryCounter");
  const blogThumbs = document.getElementById("blogThumbs");
  const blogGalleryPrev = document.getElementById("blogGalleryPrev");
  const blogGalleryNext = document.getElementById("blogGalleryNext");
  const blogModalBody = document.getElementById("blogModalBody");
  const modalAvailable = !!blogModal && !!blogModalClose;

  let blogImages = [];
  let blogImageIndex = 0;
  let fullPostsCache = null;

  const revealIO =
    window.__blogsRevealIO ||
    new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("on");
        });
      },
      { threshold: 0.12 }
    );
  window.__blogsRevealIO = revealIO;

  function observeReveal(el, delayIndex) {
    el.classList.add("reveal");
    revealIO.observe(el);
    el.style.transitionDelay = (delayIndex % 4) * 0.07 + "s";
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("on");
    });
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeCodeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function linkifyText(text) {
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    return text.replace(urlRegex, (url) => {
      const safeUrl = escapeHtml(url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
    });
  }

  function formatInlineText(text) {
    let out = text;
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/(^|<br>)(\d+\)\s)/g, '$1<span class="blog-list-num">$2</span>');
    out = out.replace(/(^|<br>)(-\s)/g, '$1<span class="blog-list-bullet">$2</span>');
    return out;
  }

  function highlightPython(code) {
    let text = escapeCodeHtml(code);
    const slots = [];
    const stash = (regex, cls) => {
      text = text.replace(regex, (m) => {
        const id = `__tok_${slots.length}__`;
        slots.push(`<span class="tok-${cls}">${m}</span>`);
        return id;
      });
    };

    // ?????????: comment/string ???????????????? keyword
    stash(/#.*/gm, "comment");
    stash(/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, "string");

    const pyKeywords =
      /\b(def|class|return|if|elif|else|for|while|try|except|finally|raise|import|from|as|with|pass|break|continue|lambda|yield|True|False|None|and|or|not|in|is|global|nonlocal|assert|async|await)\b/g;
    text = text.replace(pyKeywords, `<span class="tok-keyword">$1</span>`);
    text = text.replace(/\b(self|print|len|range|dict|list|set|tuple|str|int|float|bool|sum|min|max|map|filter|open|enumerate|zip)\b/g, `<span class="tok-builtin">$1</span>`);
    text = text.replace(/\b\d+(?:\.\d+)?\b/g, `<span class="tok-number">$&</span>`);

    slots.forEach((slot, i) => {
      text = text.replace(`__tok_${i}__`, slot);
    });
    return text;
  }

  function highlightBash(code) {
    let text = escapeCodeHtml(code);
    const slots = [];
    const stash = (regex, cls) => {
      text = text.replace(regex, (m) => {
        const id = `__tok_${slots.length}__`;
        slots.push(`<span class="tok-${cls}">${m}</span>`);
        return id;
      });
    };

    stash(/#.*/gm, "comment");
    stash(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "string");

    const shKeywords =
      /\b(if|then|else|fi|for|while|do|done|case|esac|function|in|export|local|echo|cat|grep|awk|sed|curl|python|pip|chmod|chown|cd|ls|mkdir|rm|cp|mv)\b/g;
    text = text.replace(shKeywords, `<span class="tok-keyword">$1</span>`);
    text = text.replace(/\$(?:\{[^}]+\}|[A-Za-z_][A-Za-z0-9_]*)/g, `<span class="tok-var">$&</span>`);
    text = text.replace(/\b\d+\b/g, `<span class="tok-number">$&</span>`);

    slots.forEach((slot, i) => {
      text = text.replace(`__tok_${i}__`, slot);
    });
    return text;
  }

  function highlightCode(code, lang) {
    const normalized = String(lang || "").toLowerCase();
    if (normalized === "python" || normalized === "py") return highlightPython(code);
    if (normalized === "bash" || normalized === "sh" || normalized === "shell") return highlightBash(code);
    return escapeCodeHtml(code);
  }

  function closeBlogModal() {
    if (!modalAvailable) return;
    blogModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function showBlogImage(index) {
    if (!modalAvailable) return;
    blogImageIndex = index;
    blogGalleryImg.style.opacity = "0";
    setTimeout(() => {
      blogGalleryImg.src = blogImages[index];
      blogGalleryImg.alt = `${blogModalTitle.textContent} \u2014 image ${index + 1}`;
      blogGalleryImg.style.opacity = "1";
    }, 150);
    blogGalleryCounter.textContent = `${index + 1} / ${blogImages.length}`;
    blogGalleryPrev.disabled = index === 0;
    blogGalleryNext.disabled = index === blogImages.length - 1;
    blogThumbs.querySelectorAll(".act-thumb").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
  }

  function setupBlogGallery(post) {
    if (!modalAvailable) return;
    blogImages =
      post.images && post.images.length
        ? post.images
        : post.cover
          ? [post.cover]
          : [];
    blogThumbs.innerHTML = "";

    if (!blogImages.length) {
      blogGalleryWrap.classList.add("hidden");
      return;
    }

    blogGalleryWrap.classList.remove("hidden");
    blogImages.forEach((src, i) => {
      const thumb = document.createElement("div");
      thumb.className = "act-thumb";
      thumb.innerHTML = `<img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy">`;
      thumb.addEventListener("click", () => showBlogImage(i));
      blogThumbs.appendChild(thumb);
    });
    showBlogImage(0);
  }

  function renderBodyHtml(body) {
    const source = String(body || "");
    const parts = [];
    const codeFence = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    const renderParagraphs = (text) => {
      const paragraphs = text.trim().split(/\n{2,}/);
      paragraphs.forEach((para) => {
        const line = para.trim();
        const escaped = formatInlineText(
          linkifyText(escapeHtml(line)).replace(/\n/g, "<br>")
        );
        if (/^Credit:/i.test(line)) {
          parts.push(`<p class="blog-credit">${escaped}</p>`);
        } else {
          parts.push(`<p>${escaped}</p>`);
        }
      });
    };

    while ((match = codeFence.exec(source)) !== null) {
      const plainText = source.slice(lastIndex, match.index);
      if (plainText.trim()) {
        renderParagraphs(plainText);
      }

      const lang = (match[1] || "bash").toUpperCase();
      const code = (match[2] || "").trim();
      const highlighted = highlightCode(code, lang);
      parts.push(`
        <div class="blog-code-block">
          <div class="blog-code-header">${escapeHtml(lang)} Example</div>
          <pre><code class="lang-${lang.toLowerCase()}">${highlighted}</code></pre>
        </div>
      `);
      lastIndex = codeFence.lastIndex;
    }

    const tail = source.slice(lastIndex);
    if (tail.trim()) {
      renderParagraphs(tail);
    }

    return parts.join("");
  }

  function renderSectionsHtml(sections) {
    return sections
      .map(
        (s) => `
      <h2>${escapeHtml(s.title)}</h2>
      ${renderBodyHtml(s.body)}
    `
      )
      .join("");
  }

  function loadBlogBody(post) {
    if (!modalAvailable) return;
    if (post.sections && post.sections.length) {
      blogModalBody.innerHTML = renderSectionsHtml(post.sections);
      return;
    }

    const contentPath = post.content || `blogs/${post.id}/content.html`;
    fetch(contentPath)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.text();
      })
      .then((html) => {
        blogModalBody.innerHTML = html;
      })
      .catch(() => {
        blogModalBody.innerHTML = `
          <h2>Summary</h2>
          <p>${escapeHtml(post.excerpt)}</p>
          <p style="color:var(--ink3);font-family:var(--mono);font-size:.8rem">
            Add <code>sections</code> in data.json or <code>${escapeHtml(contentPath)}</code>
          </p>`;
      });
  }

  function loadPostBodyToElement(post, targetEl) {
    if (post.sections && post.sections.length) {
      targetEl.innerHTML = renderSectionsHtml(post.sections);
      return Promise.resolve();
    }
    const contentPath = post.content || `blogs/${post.id}/content.html`;
    return fetch(contentPath)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.text();
      })
      .then((html) => {
        targetEl.innerHTML = html;
      })
      .catch(() => {
        targetEl.innerHTML = `
          <h2>Summary</h2>
          <p>${escapeHtml(post.excerpt)}</p>
          <p style="color:var(--ink3);font-family:var(--mono);font-size:.8rem">
            Add <code>sections</code> in data.json or <code>${escapeHtml(contentPath)}</code>
          </p>`;
      });
  }

  // Load full post from data.json when preview omits sections
  function resolveFullPost(previewPost) {
    if (!cfg.lazyFullPost) return Promise.resolve(previewPost);
    if (previewPost.sections && previewPost.sections.length) {
      return Promise.resolve(previewPost);
    }

    const fullUrl = cfg.fullDataUrl || "blogs/data.json";
    const loadAll = fullPostsCache
      ? Promise.resolve(fullPostsCache)
      : fetch(fullUrl)
          .then((r) => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
          })
          .then((data) => {
            fullPostsCache = Array.isArray(data)
              ? data
              : data.preview || data.posts || [];
            return fullPostsCache;
          });

    return loadAll.then((all) => {
      const full = all.find((p) => p.id === previewPost.id);
      return full || previewPost;
    });
  }

  function openBlogModal(post) {
    if (!modalAvailable) return;
    blogModalTag.textContent = post.tag;
    blogModalTitle.textContent = post.title;
    blogModalDesc.textContent = post.excerpt;
    blogModalMeta.textContent = `${fmtDate(post.date)} \u00b7 ${post.readTime}`;
    blogModalBody.innerHTML = '<p class="blog-modal-loading">Loading\u2026</p>';

    setupBlogGallery(post);
    blogModal.classList.add("open");
    document.body.style.overflow = "hidden";

    resolveFullPost(post).then((full) => {
      setupBlogGallery(full);
      loadBlogBody(full);
    });
  }
  if (modalAvailable) {
    blogModalClose.addEventListener("click", closeBlogModal);
    blogModal.addEventListener("click", (e) => {
      if (e.target === blogModal) closeBlogModal();
    });
    blogGalleryPrev.addEventListener("click", () => {
      if (blogImageIndex > 0) showBlogImage(blogImageIndex - 1);
    });
    blogGalleryNext.addEventListener("click", () => {
      if (blogImageIndex < blogImages.length - 1) showBlogImage(blogImageIndex + 1);
    });
    document.addEventListener("keydown", (e) => {
      if (!blogModal.classList.contains("open")) return;
      if (e.key === "Escape") closeBlogModal();
      if (e.key === "ArrowLeft" && blogImageIndex > 0) showBlogImage(blogImageIndex - 1);
      if (e.key === "ArrowRight" && blogImageIndex < blogImages.length - 1)
        showBlogImage(blogImageIndex + 1);
    });
  }

  function openPost(post) {
    if (openMode === "page") {
      window.location.href = `${articlePagePath}?id=${encodeURIComponent(post.id)}`;
      return;
    }
    openBlogModal(post);
  }

  function buildCard(post, index) {
    const card = document.createElement("div");
    card.className = "blog-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.setAttribute("aria-label", post.title);
    card.innerHTML = `
      <div class="blog-cover">
        <img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)}" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'blog-cover-placeholder\\'><svg width=\\'40\\' height=\\'40\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' viewBox=\\'0 0 24 24\\'><path d=\\'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z\\'/><polyline points=\\'14 2 14 8 20 8\\'/></svg><span>No cover yet</span></div>'" />
        <div class="blog-cover-overlay"><span class="blog-cover-hint">Read article \u2192</span></div>
      </div>
      <div class="blog-body">
        <span class="blog-tag">${escapeHtml(post.tag)}</span>
        <p class="blog-title">${escapeHtml(post.title)}</p>
        <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="blog-meta">
          <span>${escapeHtml(fmtDate(post.date))}</span>
          <span>${escapeHtml(post.readTime)}</span>
        </div>
      </div>`;
    const coverEl = card.querySelector(".blog-cover");
    if (coverEl) {
      const overlay = coverEl.querySelector(".blog-cover-overlay");
      if (!overlay) {
        const o = document.createElement("div");
        o.className = "blog-cover-overlay";
        o.innerHTML = '<span class="blog-cover-hint">Read article \u2192</span>';
        coverEl.appendChild(o);
      }
    }
    card.addEventListener("click", () => openPost(post));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPost(post);
      }
    });
    blogGrid.appendChild(card);
    observeReveal(card, index);
  }

  function appendSeeMoreCard(label, totalHint) {
    const href = cfg.seeMoreHref || "blogs.html";
    const more = document.createElement("a");
    more.href = href;
    more.className = "blog-card blog-card-more";
    const hint =
      totalHint != null
        ? `<p class="blog-more-hint">${totalHint} articles total</p>`
        : "";
    more.innerHTML = `
      <div class="blog-more-inner">
        <span class="blog-more-icon" aria-hidden="true">\u2192</span>
        <p class="blog-more-label">${escapeHtml(label || "See more")}</p>
        <p class="blog-more-sub">Read all articles</p>
        ${hint}
      </div>`;
    blogGrid.appendChild(more);
    observeReveal(more, 3);
  }

  function parsePayload(data) {
    if (Array.isArray(data)) return { posts: data, total: cfg.totalCount };
    return {
      posts: data.preview || data.items || data.posts || [],
      total: data.total ?? data.totalCount ?? cfg.totalCount,
    };
  }

  function renderPosts(posts, total) {
    blogGrid.innerHTML = "";
    if (!posts.length && !cfg.seeMoreHref) {
      blogGrid.innerHTML =
        '<p class="blog-empty">No posts yet. Add entries to blogs/data.json.</p>';
      return;
    }
    posts.forEach((post, i) => buildCard(post, i));
    if (cfg.seeMoreHref) appendSeeMoreCard(cfg.seeMoreLabel, total);
  }

  function renderFullPagePost(post) {
    blogGrid.classList.add("blog-grid--single");
    blogGrid.innerHTML = `
      <article class="blog-full-article">
        <a class="blog-full-back" href="blogs.html">&larr; Back to all blogs</a>
        <header class="blog-full-head">
          <span class="blog-tag">${escapeHtml(post.tag)}</span>
          <h1 class="blog-full-title">${escapeHtml(post.title)}</h1>
          <p class="blog-full-meta">${escapeHtml(fmtDate(post.date))} · ${escapeHtml(post.readTime)}</p>
          <p class="blog-full-desc">${escapeHtml(post.excerpt)}</p>
        </header>
        ${post.cover ? `<img class="blog-full-cover" src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)}" loading="lazy" />` : ""}
        <section class="blog-full-body" id="blogFullBody">
          <p class="blog-modal-loading">Loading…</p>
        </section>
      </article>
    `;
    const bodyEl = document.getElementById("blogFullBody");
    if (bodyEl) loadPostBodyToElement(post, bodyEl);
  }

  const dataUrl = cfg.dataUrl || "blogs/data.json";
  fetch(dataUrl)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then((data) => {
      const { posts, total } = parsePayload(data);
      if (articleId) {
        const target = posts.find((p) => p.id === articleId);
        if (!target) {
          blogGrid.innerHTML = '<p class="blog-empty">Article not found.</p>';
          return;
        }
        resolveFullPost(target).then((full) => renderFullPagePost(full));
        return;
      }
      renderPosts(posts, total);
    })
    .catch(() => {
      blogGrid.innerHTML =
        '<p class="blog-empty">Could not load blogs. Serve the site with a local web server (e.g. python3 -m http.server).</p>';
    });
})();
