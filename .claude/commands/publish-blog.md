Regenerate all static blog share pages for Aoy Phongsakoun's portfolio.

## What this does

Runs the share page generator script that creates `/post/{id}/index.html` for every post in `blogs/data.json`. These pages are needed so Facebook, LinkedIn, and other social platforms can read Open Graph meta tags when sharing a blog post link.

Run this after:
- Changing a blog post's cover image URL
- Changing a blog post's title or excerpt
- Adding a new blog post (if you didn't use /new-blog)

## Steps

1. Validate JSON first:
```bash
python3 -m json.tool blogs/data.json > /dev/null && echo "OK"
```
If this fails, tell the user which file has a JSON error and stop.

2. Run the generator:
```bash
node scripts/generate-blog-share-pages.mjs
```

3. List the generated pages:
```bash
ls post/
```

4. Report: tell the user how many share pages were generated and list them.
