/**
 * Blog ù load JSON, render cards, article modal
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

  /** ?????? + ???????? ù ??? span ?????????????????? (::before) ??????????????? */
  function blogMetaHtml(post) {
    return `<span>${escapeHtml(fmtDate(post.date))}</span><span>${escapeHtml(post.readTime)}</span>`;
  }

  function setBlogMeta(el, post) {
    if (!el) return;
    el.innerHTML = blogMetaHtml(post);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const BLOG_TAG_THEMES = { DevOps: "devops", Git: "git", Database: "database" };

  function blogTagClass(tag) {
    const theme = BLOG_TAG_THEMES[tag];
    return theme ? ` blog-tag--${theme}` : "";
  }

  function blogCoverClass(tag) {
    const theme = BLOG_TAG_THEMES[tag];
    return theme ? `blog-cover blog-cover--${theme}` : "blog-cover";
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
    out = out.replace(/[?????????]/g, "");
    return out;
  }

  const CODE_LANG_LABELS = {
    bash: "Terminal",
    sh: "Terminal",
    shell: "Terminal",
    python: "Python",
    py: "Python",
    dart: "Dart",
    dockerfile: "Dockerfile",
    sql: "SQL",
    text: "Output",
    yaml: "Docker Compose",
    yml: "YAML",
    json: "JSON",
    powershell: "PowerShell",
  };

  function codeLangLabel(lang) {
    const key = String(lang || "bash").toLowerCase();
    return CODE_LANG_LABELS[key] || key.toUpperCase();
  }

  function isPlaceholderAsset(url) {
    return !url || String(url).includes("PLACEHOLDER");
  }

  function formatParagraphHtml(line) {
    return formatInlineText(linkifyText(escapeHtml(line)).replace(/\n/g, "<br>"));
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

  function highlightDockerfile(code) {
    let text = escapeCodeHtml(code);
    text = text.replace(/#.*/gm, '<span class="tok-comment">$&</span>');
    text = text.replace(
      /\b(FROM|RUN|COPY|ADD|WORKDIR|EXPOSE|CMD|ENTRYPOINT|ENV|ARG|USER|LABEL|VOLUME|HEALTHCHECK)\b/g,
      '<span class="tok-keyword">$1</span>'
    );
    return text;
  }

  function highlightSql(code) {
    let text = escapeCodeHtml(code);
    const slots = [];
    const stash = (regex, cls) => {
      text = text.replace(regex, (m) => {
        const id = `__tok_${slots.length}__`;
        slots.push(`<span class="tok-${cls}">${m}</span>`);
        return id;
      });
    };

    stash(/--[^\n]*/g, "comment");
    stash(/'(?:''|[^'])*'/g, "string");

    const sqlKeywords =
      /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AND|OR|NOT|IN|INTO|VALUES|SET|CREATE|TABLE|PRIMARY|KEY|INT|VARCHAR|ORDER|BY|ASC|DESC|LIMIT|BETWEEN|LIKE|TRUNCATE|NULL|AS|DISTINCT|GROUP|HAVING|INDEX|FOREIGN|ALTER|DROP|ADD|COMMIT|ROLLBACK|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END)\b/gi;
    text = text.replace(sqlKeywords, (m) => `<span class="tok-keyword">${m}</span>`);
    text = text.replace(/\b\d+\b/g, '<span class="tok-number">$&</span>');

    slots.forEach((slot, i) => {
      text = text.replace(`__tok_${i}__`, slot);
    });
    return text;
  }

  function highlightCode(code, lang) {
    const normalized = String(lang || "").toLowerCase();
    if (normalized === "python" || normalized === "py") return highlightPython(code);
    if (normalized === "bash" || normalized === "sh" || normalized === "shell") return highlightBash(code);
    if (normalized === "dockerfile") return highlightDockerfile(code);
    if (normalized === "sql") return highlightSql(code);
    return escapeCodeHtml(code);
  }

  function encodeCodeAttr(code) {
    return escapeHtml(String(code)).replace(/"/g, "&quot;");
  }

  /** ????????????? ù ?????????? clipboard API ????????? */
  async function copyTextToClipboard(text) {
    const value = String(text ?? "");
    if (!value) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      /* fallback ???????? */
    }
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function getCodeFromBlock(block) {
    const codeEl = block?.querySelector("code");
    if (!codeEl) return "";
    if (codeEl.dataset.codeSource) return codeEl.dataset.codeSource;
    return codeEl.textContent || "";
  }

  function buildCodeBlockHtml(code, lang) {
    const normalized = String(lang || "bash").toLowerCase();
    const highlighted = highlightCode(code, normalized);
    const label = codeLangLabel(normalized);
    return `
        <div class="blog-code-block">
          <div class="blog-code-header">
            <span>${escapeHtml(label)}</span>
            <button type="button" class="blog-code-copy" aria-label="Copy code to clipboard" title="Copy code">Copy</button>
          </div>
          <pre><code class="lang-${escapeHtml(normalized)}" data-code-source="${encodeCodeAttr(code)}">${highlighted}</code></pre>
        </div>
      `;
  }

  function bindCodeCopyButtons(root) {
    if (!root) return;
    root.querySelectorAll(".blog-code-copy").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", async () => {
        const block = btn.closest(".blog-code-block");
        const raw = getCodeFromBlock(block);
        const ok = await copyTextToClipboard(raw);
        btn.textContent = ok ? "Copied" : "Failed";
        btn.classList.toggle("is-copied", ok);
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("is-copied");
        }, 1600);
      });
    });
  }

  /** ??? <pre> ???????????? Copy (???? content.html ??????) */
  function wrapOrphanPreBlocks(root) {
    if (!root) return;
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.closest(".blog-code-block")) return;
      const codeEl = pre.querySelector("code");
      const raw = (codeEl || pre).textContent || "";
      if (!raw.trim()) return;
      const langMatch = (codeEl?.className || "").match(/lang-([a-z0-9_-]+)/i);
      const lang = langMatch?.[1] || pre.getAttribute("data-lang") || "text";
      const tmp = document.createElement("div");
      tmp.innerHTML = buildCodeBlockHtml(raw, lang).trim();
      const block = tmp.firstElementChild;
      if (block) pre.replaceWith(block);
    });
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
    const rawImages =
      post.images && post.images.length
        ? post.images
        : post.cover
          ? [post.cover]
          : [];
    blogImages = rawImages.filter((src) => !isPlaceholderAsset(src));
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

  function renderBulletList(lines, compact) {
    const cls = compact ? "blog-ul blog-ul--compact" : "blog-ul";
    const items = lines
      .map((line) => {
        const text = line.replace(/^-\s+/, "").trim();
        return `<li>${formatParagraphHtml(text)}</li>`;
      })
      .join("");
    return `<ul class="${cls}">${items}</ul>`;
  }

  function renderSpecialBlock(para) {
    const trimmed = para.trim();
    if (trimmed.startsWith(":::callout")) {
      const match = trimmed.match(/^:::callout\s+(\w+)\n([\s\S]*?):::\s*$/);
      if (!match) return "";
      const type = match[1].toLowerCase();
      const body = match[2].trim();
      const label = type === "warn" ? "Watch out" : "Tip";
      return `<div class="blog-callout blog-callout--${escapeHtml(type)}"><span class="blog-callout-label">${label}</span><p>${formatParagraphHtml(body)}</p></div>`;
    }
    if (trimmed.startsWith(":::compare")) {
      const inner = trimmed.replace(/^:::compare\n?/, "").replace(/\n:::\s*$/, "").trim();
      const rows = inner.split("\n").filter(Boolean);
      const cards = rows
        .map((row, i) => {
          const [title, ...rest] = row.split("|");
          const desc = rest.join("|").trim();
          const tone = i === 1 ? "good" : "bad";
          return `<div class="blog-compare-card blog-compare-card--${tone}"><div class="blog-compare-title">${formatParagraphHtml((title || "").replace(/^\*\*|\*\*$/g, "").trim())}</div><p>${formatParagraphHtml(desc)}</p></div>`;
        })
        .join("");
      return `<div class="blog-compare">${cards}</div>`;
    }
    if (trimmed.startsWith(":::analogy")) {
      const inner = trimmed.replace(/^:::analogy\n?/, "").replace(/\n:::\s*$/, "").trim();
      const lines = inner.split("\n").map((l) => l.trim()).filter(Boolean);
      let intro = "";
      const bullets = [];
      lines.forEach((line) => {
        if (line.startsWith("- ")) bullets.push(line.replace(/^-\s+/, ""));
        else if (!intro) intro = line;
      });
      const introHtml = intro ? `<p class="blog-analogy-intro">${formatParagraphHtml(intro)}</p>` : "";
      const listHtml = bullets.length
        ? `<ul class="blog-ul blog-ul--compact">${bullets.map((b) => `<li>${formatParagraphHtml(b)}</li>`).join("")}</ul>`
        : "";
      return `<div class="blog-analogy">${introHtml}${listHtml}</div>`;
    }
    if (trimmed.startsWith(":::reminders")) {
      const inner = trimmed.replace(/^:::reminders\n?/, "").replace(/\n:::\s*$/, "").trim();
      const items = inner
        .split("\n")
        .filter(Boolean)
        .map((row, i) => {
          const [title, ...rest] = row.split("|");
          const desc = rest.join("|").trim();
          const num = String(i + 1).padStart(2, "0");
          return `<div class="blog-reminder-item"><span class="blog-reminder-num">${num}</span><div><strong>${formatParagraphHtml((title || "").replace(/^\*\*|\*\*$/g, "").trim())}</strong><p>${formatParagraphHtml(desc)}</p></div></div>`;
        })
        .join("");
      return `<div class="blog-reminders">${items}</div>`;
    }
    if (trimmed.startsWith(":::defs")) {
      const inner = trimmed.replace(/^:::defs\n?/, "").replace(/\n:::\s*$/, "").trim();
      const items = inner
        .split("\n")
        .filter(Boolean)
        .map((row) => {
          const [term, ...rest] = row.split("|");
          const desc = rest.join("|").trim();
          const termHtml = formatParagraphHtml((term || "").replace(/^\*\*|\*\*$/g, "").trim());
          return `<div class="blog-def-item"><strong>${termHtml}</strong><p>${formatParagraphHtml(desc)}</p></div>`;
        })
        .join("");
      return `<div class="blog-def-list">${items}</div>`;
    }
    if (trimmed.startsWith(":::steps")) {
      const inner = trimmed.replace(/^:::steps\n?/, "").replace(/\n:::\s*$/, "").trim();
      const items = inner
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const text = line.replace(/^\d+\)\s*/, "").trim();
          return `<li>${formatParagraphHtml(text)}</li>`;
        })
        .join("");
      return `<ol class="blog-learning-path">${items}</ol>`;
    }
    return "";
  }

  function renderParagraphs(text) {
    const paragraphs = text.trim().split(/\n{2,}/);
    const parts = [];
    paragraphs.forEach((para) => {
      const trimmed = para.trim();
      if (!trimmed) return;
      if (trimmed.startsWith(":::")) {
        const block = renderSpecialBlock(trimmed);
        if (block) {
          parts.push(block);
          return;
        }
      }
      const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines.every((l) => l.startsWith("- "))) {
        parts.push(renderBulletList(lines, lines.length > 5));
        return;
      }
      if (/^Credit:/i.test(trimmed)) {
        parts.push(`<p class="blog-credit">${formatParagraphHtml(trimmed)}</p>`);
        return;
      }
      parts.push(`<p>${formatParagraphHtml(trimmed)}</p>`);
    });
    return parts.join("");
  }

  function renderBodyHtml(body) {
    const source = String(body || "");
    const parts = [];
    const codeFence = /```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeFence.exec(source)) !== null) {
      const plainText = source.slice(lastIndex, match.index);
      if (plainText.trim()) parts.push(renderParagraphs(plainText));

      const lang = match[1] || "bash";
      const code = (match[2] || "").trim();
      parts.push(buildCodeBlockHtml(code, lang));
      lastIndex = codeFence.lastIndex;
    }

    const tail = source.slice(lastIndex);
    if (tail.trim()) parts.push(renderParagraphs(tail));

    return parts.join("");
  }

  function renderSectionsHtml(sections) {
    return sections
      .map((s, i) => {
        const idx = String(i + 1).padStart(2, "0");
        return `
      <section class="blog-section">
        <h2 class="blog-section-title"><span class="blog-section-idx">${idx}</span>${escapeHtml(s.title)}</h2>
        ${renderBodyHtml(s.body)}
      </section>
    `;
      })
      .join("");
  }

  function enhanceArticleBody(root) {
    if (!root) return;
    wrapOrphanPreBlocks(root);
    bindCodeCopyButtons(root);
  }

  function loadBlogBody(post) {
    if (!modalAvailable) return;
    if (post.sections && post.sections.length) {
      blogModalBody.innerHTML = renderSectionsHtml(post.sections);
      enhanceArticleBody(blogModalBody);
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
        enhanceArticleBody(blogModalBody);
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
      enhanceArticleBody(targetEl);
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
        enhanceArticleBody(targetEl);
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
    blogModalTag.className = "blog-tag" + blogTagClass(post.tag);
    blogModalTitle.textContent = post.title;
    blogModalDesc.textContent = post.excerpt;
    setBlogMeta(blogModalMeta, post);
    blogModalBody.innerHTML = window.GridSkeleton
      ? window.GridSkeleton.blogBodySkeletonHtml()
      : '<p class="blog-modal-loading">Loading\u2026</p>';

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
    const tagClass = blogTagClass(post.tag);
    const coverClass = blogCoverClass(post.tag);
    const coverSrc = isPlaceholderAsset(post.cover)
      ? `blogs/${post.id}-cover.svg`
      : post.cover;
    card.innerHTML = `
      <div class="${coverClass}">
        <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(post.title)}" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'blog-cover-placeholder blog-cover-placeholder--devops\\'><span>No cover yet</span></div>'" />
        <div class="blog-cover-overlay"><span class="blog-cover-hint">Read article \u2192</span></div>
      </div>
      <div class="blog-body">
        <span class="blog-tag${tagClass}">${escapeHtml(post.tag)}</span>
        <p class="blog-title">${escapeHtml(post.title)}</p>
        <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="blog-meta">${blogMetaHtml(post)}</div>
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

  function defaultSkeletonCount() {
    return cfg.seeMoreHref ? 4 : 8;
  }

  function showGridSkeleton() {
    const n = cfg.skeletonCount ?? defaultSkeletonCount();
    if (window.GridSkeleton) {
      window.GridSkeleton.renderBlogSkeletons(blogGrid, n);
    } else {
      blogGrid.setAttribute("aria-busy", "true");
    }
  }

  function renderPosts(posts, total) {
    if (window.GridSkeleton) window.GridSkeleton.setGridLoading(blogGrid, false);
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
    if (window.BlogSocialMeta) window.BlogSocialMeta.apply(post, cfg);
    blogGrid.classList.add("blog-grid--single");
    const bodyPlaceholder = window.GridSkeleton
      ? window.GridSkeleton.blogBodySkeletonHtml()
      : '<p class="blog-modal-loading">Loading\u2026</p>';
    const tagClass = blogTagClass(post.tag);
    const coverSrc = post.cover
      ? isPlaceholderAsset(post.cover)
        ? `blogs/${post.id}-cover.svg`
        : post.cover
      : "";
    blogGrid.innerHTML = `
      <article class="blog-full-article">
        <a class="blog-full-back" href="blogs.html">&larr; Back to all blogs</a>
        <header class="blog-full-head">
          <span class="blog-tag${tagClass}">${escapeHtml(post.tag)}</span>
          <h1 class="blog-full-title">${escapeHtml(post.title)}</h1>
          <p class="blog-full-meta">${blogMetaHtml(post)}</p>
          <p class="blog-full-desc">${escapeHtml(post.excerpt)}</p>
        </header>
        ${coverSrc ? `<img class="blog-full-cover" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(post.title)}" loading="lazy" />` : ""}
        <section class="blog-full-body" id="blogFullBody">
          ${bodyPlaceholder}
        </section>
      </article>
    `;
    const bodyEl = document.getElementById("blogFullBody");
    if (bodyEl) loadPostBodyToElement(post, bodyEl);
  }

  function renderFullPageSkeleton() {
    blogGrid.classList.add("blog-grid--single");
    blogGrid.innerHTML = window.GridSkeleton
      ? window.GridSkeleton.blogFullPageSkeletonHtml()
      : '<p class="blog-modal-loading">Loading\u2026</p>';
    blogGrid.setAttribute("aria-busy", "true");
  }

  const dataUrl = cfg.dataUrl || "blogs/data.json";

  if (articleId) {
    renderFullPageSkeleton();
  } else {
    showGridSkeleton();
  }

  fetch(dataUrl)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then((data) => {
      const { posts, total } = parsePayload(data);
      if (articleId) {
        const target = posts.find((p) => p.id === articleId);
        blogGrid.removeAttribute("aria-busy");
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
      if (window.GridSkeleton) window.GridSkeleton.setGridLoading(blogGrid, false);
      blogGrid.removeAttribute("aria-busy");
      blogGrid.innerHTML =
        '<p class="blog-empty">Could not load blogs. Serve the site with a local web server (e.g. python3 -m http.server).</p>';
    });
})();
