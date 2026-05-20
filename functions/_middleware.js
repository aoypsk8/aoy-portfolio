/**
 * Cloudflare Pages: inject Open Graph สำหรับ blogs.html?id=...
 * (GitHub Pages เฉย ๆ ไม่รันไฟล์นี้ — ต้อง deploy ผ่าน Cloudflare Pages)
 */
const SITE_ORIGIN = "https://aoypsk8.github.io";
const REPO_BASE = "/aoy-portfolio";

function absoluteImageUrl(cover, postId, origin, base) {
  if (!cover || String(cover).includes("PLACEHOLDER")) {
    return `${origin}${base}/blogs/${postId}-cover.svg`;
  }
  if (/^https?:\/\//i.test(cover)) return cover;
  return `${origin}${base}/${String(cover).replace(/^\//, "")}`;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectArticleOg(html, post, pageUrl, imageUrl) {
  const title = escapeAttr(post.title);
  const desc = escapeAttr(post.excerpt || "");
  const image = escapeAttr(imageUrl);
  const shareUrl = escapeAttr(
    `${SITE_ORIGIN}${REPO_BASE}/post/${encodeURIComponent(post.id)}/`
  );

  const stripOg = (input) =>
    input.replace(/\s*<meta\s+(?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/gi, "");

  let out = stripOg(html);
  const block = `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Aoy Phongsakoun" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />
  `;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title} — Aoy Phongsakoun</title>`);
  return out.replace(/<\/head>/i, `${block}</head>`);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isBlogPage = /\/blogs\.html$/i.test(url.pathname);
  const articleId = url.searchParams.get("id");

  if (!isBlogPage || !articleId) {
    return context.next();
  }

  try {
    const dataRes = await context.env.ASSETS.fetch(
      new URL(`${REPO_BASE}/blogs/data.json`, SITE_ORIGIN).toString()
    );
    if (!dataRes.ok) return context.next();

    const posts = await dataRes.json();
    const post = Array.isArray(posts)
      ? posts.find((p) => p.id === articleId)
      : null;
    if (!post) return context.next();

    const pageRes = await context.env.ASSETS.fetch(context.request);
    if (!pageRes.ok) return context.next();

    const html = await pageRes.text();
    const imageUrl = absoluteImageUrl(post.cover, post.id, SITE_ORIGIN, REPO_BASE);
    const modified = injectArticleOg(html, post, url.toString(), imageUrl);

    return new Response(modified, {
      status: pageRes.status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return context.next();
  }
}
