# Aoy Portfolio

Personal portfolio website for **Aoy Phongsakoun** focused on software engineering, fintech products, and project highlights.

## Highlights

- Responsive portfolio landing page with hero, experience, projects, education, blog, and contact sections.
- Floating CV button with preview modal and direct download.
- Activities and blog pages with JSON-driven card rendering and modal previews.
- Custom cursor animation (desktop) shared across pages.
- SEO/social metadata (Open Graph, Twitter card, canonical, JSON-LD).

## Project Structure

```text
aoy-portfolio/
??? index.html
??? activities.html
??? blogs.html
??? styles/
?   ??? main.css
?   ??? cv-modal.css
??? css/
?   ??? activities-page.css
?   ??? blogs-page.css
?   ??? custom-cursor.css
??? js/
?   ??? events.js
?   ??? blogs.js
?   ??? custom-cursor.js
??? events/
?   ??? data.json
?   ??? preview.json
??? blogs/
?   ??? data.json
?   ??? preview.json
?   ??? <post-id>/content.html
??? images/
    ??? favicon.svg
```

## Run Locally

Use a local web server (important for loading JSON with `fetch`):

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`

## Content Management

### 1) Update CV link

Edit `CV_URL` in `index.html` (script section near CV modal logic), and update the download anchor in the CV modal if needed.

### 2) Update blog cards

- Preview on homepage: `blogs/preview.json`
- Full list for blogs page/modal: `blogs/data.json`
- Optional full post HTML: `blogs/<post-id>/content.html`

### 3) Update activities/events

- Preview on homepage: `events/preview.json`
- Full list for activities page: `events/data.json`

## Styling Notes

- Global styles: `styles/main.css`
- CV floating button + modal: `styles/cv-modal.css`
- Activities page: `css/activities-page.css`
- Blogs page: `css/blogs-page.css`
- Shared custom cursor styles: `css/custom-cursor.css`

## Deployment

This project is static and can be deployed to:

- GitHub Pages
- Netlify
- Vercel (static)

For GitHub Pages, ensure canonical/OG URLs in `index.html` match your live domain.

## Troubleshooting

- **Blog/Activities cards not loading:** Make sure you are running via local server, not direct file path.
- **CV preview not showing in some browsers:** Use the fallback `Download CV` or open in a new tab.
- **Custom cursor issues in modal:** CV modal temporarily disables custom cursor for reliable interaction.

