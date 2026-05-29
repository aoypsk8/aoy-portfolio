(function () {
  const path = location.pathname;
  const PAGE = path.endsWith('activities.html') ? 'activities'
             : path.endsWith('blogs.html')      ? 'blogs'
             : 'home';

  const base = PAGE === 'home' ? '' : 'index.html';

  const items = [
    { label: 'About',      href: base + '#about' },
    { label: 'Experience', href: base + '#experience' },
    { label: 'Skills',     href: base + '#skills' },
    { label: 'Projects',   href: base + '#projects' },
    { label: 'Education',  href: base + '#education' },
    { label: 'Activities', href: 'activities.html', page: 'activities' },
    { label: 'Blog',       href: 'blogs.html',      page: 'blogs' },
    { label: 'Contact',    href: base + '#contact' },
  ];

  function activeAttrs(item) {
    return item.page === PAGE ? ' class="active" aria-current="page"' : '';
  }

  const desktopLinks = items
    .map(item => `<li><a href="${item.href}"${activeAttrs(item)}>${item.label}</a></li>`)
    .join('');

  const mobileLinks = items
    .map(item => {
      const cls = 'mm-link' + (item.page === PAGE ? ' active' : '');
      const cur = item.page === PAGE ? ' aria-current="page"' : '';
      return `<a href="${item.href}" class="${cls}"${cur}>${item.label}</a>`;
    })
    .join('');

  const logoHref = PAGE === 'home' ? '#home' : 'index.html#home';

  const root = document.getElementById('nav-root');
  if (!root) return;

  root.insertAdjacentHTML('afterend',
    `<nav id="nav">
      <a class="logo-wrap" href="${logoHref}">
        <span class="logo-mark" aria-hidden="true">AP</span>
        <span class="logo">Aoy Phongsakoun</span>
      </a>
      <ul class="navLinks">${desktopLinks}</ul>
      <a class="navCta" href="mailto:aoypsk8@gmail.com">Say hello</a>
      <button class="navToggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="mobileMenu" id="mobileMenu" aria-hidden="true">
      ${mobileLinks}
      <a class="mm-cta" href="mailto:aoypsk8@gmail.com">Say hello →</a>
    </div>`
  );
  root.remove();
})();
