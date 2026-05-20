# Blog JSON Generator — AI Prompt (Aoy Portfolio)

Copy everything inside the **MASTER PROMPT** block below into ChatGPT, Claude, Gemini, or any other AI.  
Paste the generated JSON into `blogs/data.json` (append as a new object in the array).  
Optionally update `blogs/preview.json` for the homepage.

---

## MASTER PROMPT (copy from here)

```text
You are a technical writer and JSON author for Aoy Phongsakoun's portfolio blog.

Your task: generate ONE valid blog post object as JSON for this static site. Output ONLY raw JSON (no markdown fences, no explanation before or after). The JSON must be a single object `{ ... }` that can be appended to an existing JSON array in `blogs/data.json`.

## Site context
- Author: Aoy Phongsakoun — software engineer (fintech, mobile, full-stack, AI/ML)
- Tone: professional, clear, practical, first-person when sharing experience
- Audience: developers and engineering students in Laos / Southeast Asia
- Language: English for blog content (titles, excerpt, sections)

## Required JSON schema (all top-level fields required unless marked optional)

{
  "id": "kebab-case-slug-unique",
  "tag": "Category label (e.g. Flutter, AI/ML, Security, Fintech, Career)",
  "title": "Article title",
  "excerpt": "1–2 sentences, max ~220 characters, shown on cards",
  "date": "YYYY-MM-DD",
  "readTime": "e.g. 8 min read",
  "cover": "https://full-url-to-cover-image.jpg",
  "images": ["https://url1", "https://url2"],
  "content": "blogs/{id}/content.html",
  "sections": [
    { "title": "Section heading", "body": "Section content string" }
  ]
}

### Field rules

1. **id**
   - Lowercase kebab-case only: `a-z`, `0-9`, hyphens
   - Must be unique, stable, URL-safe
   - Example: `my-topic-name-2026`

2. **tag**
   - Short category (1–2 words), Title Case or acronym (AI/ML, UX/UI)

3. **title**
   - Clear, specific, no trailing period

4. **excerpt**
   - Compelling summary for card UI; no line breaks

5. **date**
   - ISO date `YYYY-MM-DD` only

6. **readTime**
   - Format: `"N min read"` (estimate from word count)

7. **cover**
   - HTTPS URL to hero image (Cloudinary or other CDN)
   - If user did not provide a URL, use placeholder: `https://res.cloudinary.com/duswpvmeh/image/upload/PLACEHOLDER/cover.jpg` and tell user to replace in a comment field — but still output valid JSON

8. **images** (optional but recommended)
   - Array of gallery URLs; include `cover` as first or last item
   - Can be `[]` if only cover exists

9. **content**
   - Always: `blogs/{id}/content.html` (matches id)
   - Site can use `sections` instead of HTML file; keep this path for fallback

10. **sections** (required — primary article body)
    - Minimum 4 sections, recommended 6–10
    - Each section: `{ "title": string, "body": string }`
    - `body` is plain text with embedded Markdown-like formatting (see below)

### Section body formatting (renderer supports this)

Use `\n` for line breaks inside JSON strings.

- **Bold:** `**text**`
- **Inline code:** `` `command` ``
- **Numbered steps in prose:** `1) ...` `2) ...`
- **Bullet lines:** start line with `- `
- **Paragraphs:** separate with `\n\n`
- **Code blocks:** use fenced blocks exactly like this inside the string:

```python
code here
```

Supported fence languages: `python`, `bash`, `sh`, `shell`, `dart`, `json`, `powershell`

- **Credit line:** paragraph starting with `Credit:` (styled differently)
- **URLs:** plain `https://...` (auto-linked)
- Do NOT use HTML tags in body
- Escape JSON properly: `\"` for quotes, `\\n` is NOT needed if you use real newlines in the JSON string value

### Content quality rules

- Technically accurate; no fabricated commands or fake repos
- Include real commands, file paths, and expected outputs where relevant
- Each major section should teach one idea (setup, usage, pitfalls, summary)
- End with a section like "What's Next", "Call to Action", or "Reference" when appropriate
- Code blocks must be copy-pasteable and consistent with the topic

### Output constraints

- Output exactly ONE JSON object
- Valid JSON (no trailing commas, no comments)
- No wrapper array — user will add to `[ ... ]` manually
- Do not duplicate an existing id (user will provide existing ids if needed)

## User input (fill this when you use the prompt)

TOPIC: [describe the article subject]
TAG: [e.g. Flutter]
TARGET_LENGTH: [short 6 sections | medium 8 sections | long 10+ sections]
DATE: [YYYY-MM-DD or "today"]
COVER_URL: [optional HTTPS URL]
EXTRA_IMAGE_URLS: [optional comma-separated URLs]
EXISTING_IDS_TO_AVOID: building-lao-llm-gemma4, absolute-beginners-guide-flutter, blutter-flutter-reverse-engineering
NOTES: [any links, repos, steps, or Lao/English preferences]

Generate the blog post JSON now.
```

---

## Short prompt (quick new post)

```text
Generate one blog JSON object for Aoy Phongsakoun's portfolio (schema: id, tag, title, excerpt, date, readTime, cover, images[], content "blogs/{id}/content.html", sections[{title, body}]). Body supports **bold**, `code`, ```python blocks, bullets, Credit: lines. Output ONLY valid JSON object, no markdown wrapper.

TOPIC: [your topic]
TAG: [category]
DATE: [YYYY-MM-DD]
COVER_URL: [url or leave empty]
```

---

## After the AI generates JSON

### 1) Add to `blogs/data.json`

Open `blogs/data.json`. Inside the outer `[ ... ]` array, add a comma after the last post, then paste the new object.

Validate JSON:

```bash
python3 -m json.tool blogs/data.json > /dev/null && echo "OK"
```

### 2) Update `blogs/preview.json` (homepage cards)

```json
{
  "total": 4,
  "preview": [
    { "id": "...", "tag": "...", "title": "...", "excerpt": "...", "date": "...", "readTime": "...", "cover": "..." }
  ]
}
```

- `total` = number of posts in `blogs/data.json`
- `preview` = 3–4 posts (lightweight fields only; no `sections` needed)
- Put newest or featured posts first

### 3) Test locally

```bash
cd /path/to/aoy-portfolio
python3 -m http.server 8080
```

Open `http://localhost:8080/blogs.html` and `http://localhost:8080/index.html#blog`.

---

## Reference: minimal valid post

```json
{
  "id": "example-post-2026",
  "tag": "Engineering",
  "title": "Example Post Title",
  "excerpt": "Short summary for the blog card.",
  "date": "2026-05-20",
  "readTime": "5 min read",
  "cover": "https://res.cloudinary.com/duswpvmeh/image/upload/v1779000000/blogs/example_cover.jpg",
  "images": [
    "https://res.cloudinary.com/duswpvmeh/image/upload/v1779000000/blogs/example_cover.jpg"
  ],
  "content": "blogs/example-post-2026/content.html",
  "sections": [
    {
      "title": "Introduction",
      "body": "Why this topic matters.\n\n**Goal:** explain one clear outcome."
    },
    {
      "title": "Setup",
      "body": "Install dependencies:\n```bash\nnpm install\n```"
    },
    {
      "title": "Reference",
      "body": "Official docs: https://example.com"
    }
  ]
}
```

---

## Reference: existing post IDs (do not duplicate)

| id | tag |
|----|-----|
| building-lao-llm-gemma4 | AI/ML |
| absolute-beginners-guide-flutter | Flutter |
| blutter-flutter-reverse-engineering | Security |

---

## Optional: generate `preview.json` snippet

Ask the AI in a second message:

```text
From the blog post you just created, output a minimal preview entry JSON object with only: id, tag, title, excerpt, date, readTime, cover. No sections. Then tell me the new total count if data.json will have N posts.
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Page shows "Could not load blogs" | Run via local server, not `file://` |
| JSON parse error | Check trailing commas, unescaped `"` in strings |
| Article empty | Ensure `sections` is non-empty array |
| Code blocks broken | Use `\`\`\`lang` on its own line inside body string |
| Gallery empty | Add URLs to `images` or at least `cover` |

---

*File: `blogs/BLOG_JSON_AI_PROMPT.md` — keep in repo for reuse.*
