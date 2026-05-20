# Aoy Portfolio

Personal portfolio website for **Aoy Phongsakoun** focused on software engineering, fintech products, and project highlights.

## Preview

- [Portfolio Screenshot (PDF)](./screencapture-aoypsk8-github-io-aoy-portfolio-2026-05-19-14_57_05.pdf)

## Highlights

- Responsive portfolio landing page with hero, experience, projects, education, blog, and contact sections.
- Floating CV button with preview modal and direct download.
- Activities and blog pages with JSON-driven card rendering and modal previews.
- Custom cursor animation (desktop) shared across pages.
- SEO/social metadata (Open Graph, Twitter card, canonical, JSON-LD).

## Sharing blog posts (Facebook / LinkedIn)

Social crawlers read **static** Open Graph tags in HTML. They do not run `blogs.html?id=...` JavaScript, and they cannot reach `http://127.0.0.1`.

1. Deploy the site to a public HTTPS URL (e.g. GitHub Pages).
2. Share the **share URL** for each post (not the query-string reader URL):
   - `https://aoypsk8.github.io/aoy-portfolio/post/docker-for-beginners-2026/`
3. After adding or editing posts in `blogs/data.json`, regenerate share pages:
   ```bash
   node scripts/generate-blog-share-pages.mjs
   ```
4. Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to scrape and refresh the cache.

Reader URL (for humans): `blogs.html?id=docker-for-beginners-2026` — cover meta is updated in the browser via `js/blog-social-meta.js`, but Facebook needs `/post/{id}/`.

**Example (SQL article):** share  
`https://aoypsk8.github.io/aoy-portfolio/post/basic-sql-commands-2026/`  
not  
`https://aoypsk8.github.io/aoy-portfolio/blogs.html?id=basic-sql-commands-2026`

After updating a post cover in `blogs/data.json`, run `node scripts/generate-blog-share-pages.mjs` and deploy so `/post/{id}/` picks up the new `og:image`.

## Troubleshooting

- **Blog/Activities cards not loading:** Make sure you are running via local server, not direct file path.
- **Facebook preview shows wrong image:** Share `/post/{slug}/`, ensure `cover` is a public HTTPS image (e.g. Cloudinary), then re-scrape in Sharing Debugger.
- **CV preview not showing in some browsers:** Use the fallback `Download CV` or open in a new tab.
- **Custom cursor issues in modal:** CV modal temporarily disables custom cursor for reliable interaction.

