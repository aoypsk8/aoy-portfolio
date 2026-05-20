#!/usr/bin/env node
/**
 * สร้างหน้า /post/{id}/index.html ที่มี Open Graph คงที่
 * รันใหม่ทุกครั้งที่เพิ่ม/แก้บทความใน blogs/data.json:
 *   node scripts/generate-blog-share-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "blogs", "data.json");
const OUT_DIR = path.join(ROOT, "post");
const SITE_URL = (
  process.env.SITE_URL || "https://aoypsk8.github.io/aoy-portfolio"
).replace(/\/$/, "");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteImageUrl(cover, postId) {
  if (!cover || cover === "PLACEHOLDER") {
    return `${SITE_URL}/blogs/${postId}-cover.svg`;
  }
  if (/^https?:\/\//i.test(cover)) return cover;
  return `${SITE_URL}/${String(cover).replace(/^\//, "")}`;
}

function buildPage(post) {
  const shareUrl = `${SITE_URL}/post/${encodeURIComponent(post.id)}/`;
  const readUrl = `../../blogs.html?id=${encodeURIComponent(post.id)}`;
  const image = absoluteImageUrl(post.cover, post.id);
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt || "");
  const tag = escapeHtml(post.tag || "Blog");
  const date = post.date || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [image],
    datePublished: date || undefined,
    author: {
      "@type": "Person",
      name: "Aoy Phongsakoun",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Aoy Phongsakoun</title>
    <meta name="description" content="${excerpt}" />
    <link rel="canonical" href="${shareUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Aoy Phongsakoun" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${excerpt}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${shareUrl}" />
    ${
      date
        ? `<meta property="article:published_time" content="${escapeHtml(date)}" />`
        : ""
    }
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${excerpt}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background: #1a1816;
        color: #e8e4df;
        line-height: 1.5;
      }
      .wrap { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
      .tag {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #a89f94;
      }
      h1 { font-family: Lora, Georgia, serif; font-size: 1.75rem; margin: 0.5rem 0 1rem; }
      .cover {
        width: 100%;
        border-radius: 12px;
        margin: 1rem 0 1.25rem;
        display: block;
      }
      .excerpt { color: #c4bdb4; margin-bottom: 1.5rem; }
      .btn {
        display: inline-block;
        padding: 0.65rem 1.1rem;
        background: #c9a227;
        color: #1a1816;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
      }
      .meta { font-size: 0.875rem; color: #8f877c; margin-top: 1rem; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <p class="tag">${tag}</p>
      <h1>${title}</h1>
      <img class="cover" src="${escapeHtml(image)}" alt="${title}" width="1200" height="630" />
      <p class="excerpt">${excerpt}</p>
      <a class="btn" href="${readUrl}">Read full article →</a>
      <p class="meta">Aoy Phongsakoun · Blog</p>
    </main>
  </body>
</html>
`;
}

const raw = fs.readFileSync(DATA_PATH, "utf8");
const posts = JSON.parse(raw);
if (!Array.isArray(posts)) {
  console.error("blogs/data.json must be an array");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const post of posts) {
  if (!post.id) continue;
  const dir = path.join(OUT_DIR, post.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), buildPage(post), "utf8");
  count += 1;
  console.log(`post/${post.id}/index.html`);
}
console.log(`\nDone: ${count} share page(s). Site: ${SITE_URL}`);
