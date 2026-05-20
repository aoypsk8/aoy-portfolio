/**
 * Open Graph / Twitter meta สำหรับบทความ (เบราว์เซอร์ + canonical)
 * Facebook ใช้หน้า static ที่ /post/{id}/ — ดู scripts/generate-blog-share-pages.mjs
 */
(function (global) {
  const DEFAULT_SITE = "https://aoypsk8.github.io/aoy-portfolio";

  function getSiteUrl(cfg) {
    return String((cfg && cfg.siteUrl) || DEFAULT_SITE).replace(/\/$/, "");
  }

  /** รูป cover ต้องเป็น URL แบบ absolute สำหรับ og:image */
  function absoluteImageUrl(siteUrl, cover, postId) {
    if (!cover || cover === "PLACEHOLDER") {
      return `${siteUrl}/blogs/${postId}-cover.svg`;
    }
    if (/^https?:\/\//i.test(cover)) return cover;
    return `${siteUrl}/${String(cover).replace(/^\//, "")}`;
  }

  /** URL ที่แชร์บน Facebook / LinkedIn (มี OG ใน HTML คงที่) */
  function sharePageUrl(siteUrl, postId) {
    return `${siteUrl}/post/${encodeURIComponent(postId)}/`;
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function apply(post, cfg) {
    cfg = cfg || global.__BLOGS_CONFIG__ || {};
    const site = getSiteUrl(cfg);
    const image = absoluteImageUrl(site, post.cover, post.id);
    const shareUrl = sharePageUrl(site, post.id);
    const desc = post.excerpt || "";

    document.title = `${post.title} — Aoy Phongsakoun`;

    upsertMeta("property", "og:type", "article");
    upsertMeta("property", "og:title", post.title);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:url", shareUrl);
    if (post.date) upsertMeta("property", "article:published_time", post.date);

    upsertMeta("name", "description", desc);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", post.title);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = shareUrl;
  }

  global.BlogSocialMeta = {
    apply,
    sharePageUrl,
    absoluteImageUrl,
    getSiteUrl,
  };
})(window);
