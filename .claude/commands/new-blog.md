You are helping Aoy Phongsakoun add a new blog post to his static portfolio site.

The user's input is: $ARGUMENTS

## Step 1 — Parse the request

Extract from the user's input:
- TOPIC — what the post is about
- TAG — category (Flutter, AI/ML, Security, Fintech, Career, Engineering, etc.)
- DATE — use today's date (2026-05-26) unless specified
- COVER_URL — HTTPS image URL if provided; otherwise use placeholder `https://res.cloudinary.com/duswpvmeh/image/upload/PLACEHOLDER/cover.jpg`
- TARGET_LENGTH — default to "medium" (8 sections) unless user says short or long
- Any extra notes or links

## Step 2 — Read existing data

Read `blogs/data.json` to get ALL existing post IDs so you do not duplicate them.
Read `blogs/preview.json` to know the current total and preview list.

## Step 3 — Generate the blog post JSON

Generate ONE valid blog post object following this exact schema:

```json
{
  "id": "kebab-case-slug",
  "tag": "Category",
  "title": "Article title",
  "excerpt": "1–2 sentence summary, max 220 chars, no line breaks",
  "date": "YYYY-MM-DD",
  "readTime": "N min read",
  "cover": "https://...",
  "images": ["https://..."],
  "content": "blogs/{id}/content.html",
  "sections": [
    { "title": "Section heading", "body": "Section content" }
  ]
}
```

### Rules for the `body` field (renderer supports these):
- `**text**` → bold
- `` `code` `` → inline code
- ` ```lang ... ``` ` → syntax-highlighted code block (supported: python, bash, sh, dart, sql, javascript, js, json, html, yaml, powershell)
- `- item` → bullet list
- `:::callout tip\n...\n:::` → tip/warning callout
- `:::steps\n1) ...\n:::` → numbered steps
- `:::table\n| Col | Col |\n:::` → markdown table
- Separate paragraphs with `\n\n`
- NO HTML tags in body

### Content quality rules:
- Minimum 6 sections, recommend 8–10 for medium
- Technically accurate — no fake commands or repos
- First-person tone when sharing experience
- End with "What's Next" or "References" section
- Code blocks must be copy-pasteable

### Author context:
- Aoy Phongsakoun — software engineer (fintech, mobile, full-stack, AI/ML)
- Audience: developers and engineering students in Laos / Southeast Asia
- Language: English

## Step 4 — Insert into blogs/data.json

Read the current `blogs/data.json`. Prepend the new post as the FIRST item in the array (newest first). Write the updated file back.

After writing, validate with:
```bash
python3 -m json.tool blogs/data.json > /dev/null && echo "JSON OK"
```

If validation fails, fix the JSON and retry.

## Step 5 — Update blogs/preview.json

Read `blogs/preview.json`. Add the new post as the FIRST item in `preview` array (no `sections`, no `content` field — only: `id`, `tag`, `title`, `excerpt`, `date`, `readTime`, `cover`). Keep the preview list to 4–5 posts max (remove the oldest if needed). Update `total` to the new count. Write the file.

## Step 6 — Regenerate share pages

Run:
```bash
node scripts/generate-blog-share-pages.mjs
```

## Step 7 — Report to user

Tell the user:
- The post `id` and `title` that was added
- Whether a placeholder cover URL was used (so they know to replace it)
- The new total post count
- The share page path: `post/{id}/index.html`
- Reminder to test at: `http://localhost:8080/blogs.html?id={id}`
