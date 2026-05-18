DROP YOUR FILES HERE
--------------------
cover.jpg     — shown on the grid card
content.html  — article body (HTML fragments, loaded in the popup)

Then update blogs/data.json with:
  - "title"    : post title
  - "excerpt"  : short description shown on the card
  - "date"     : ISO date "YYYY-MM-DD"
  - "readTime" : e.g. "5 min read"
  - "tag"      : label (Flutter, React, Fintech, etc.)
  - "cover"    : path to cover image
  - "content"  : path to content.html (optional; defaults to blogs/{id}/content.html)
