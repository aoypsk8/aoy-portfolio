/**
 * Skeleton placeholders for data-driven grids (events, blogs).
 * ใช้ร่วมกับ events.js / blogs.js ระหว่างรอ fetch JSON
 */
(function () {
  function actCardSkeleton(index) {
    return `
      <div class="act-card act-card--skeleton" aria-hidden="true" style="animation-delay:${(index % 8) * 0.06}s">
        <div class="act-img-wrap"><span class="sk-block"></span></div>
        <div class="act-body">
          <span class="sk-line sk-line--tag"></span>
          <span class="sk-line sk-line--title"></span>
          <span class="sk-line sk-line--meta"></span>
        </div>
      </div>`;
  }

  function blogCardSkeleton(index) {
    return `
      <div class="blog-card blog-card--skeleton" aria-hidden="true" style="animation-delay:${(index % 8) * 0.06}s">
        <div class="blog-cover"><span class="sk-block"></span></div>
        <div class="blog-body">
          <span class="sk-line sk-line--tag"></span>
          <span class="sk-line sk-line--title"></span>
          <span class="sk-line sk-line--excerpt"></span>
          <span class="sk-line sk-line--excerpt-short"></span>
          <span class="sk-line sk-line--meta"></span>
        </div>
      </div>`;
  }

  function blogBodySkeletonHtml() {
    return `
      <div class="blog-body-skeleton" aria-hidden="true">
        <span class="sk-line sk-line--heading"></span>
        <span class="sk-line sk-line--para"></span>
        <span class="sk-line sk-line--para-mid"></span>
        <span class="sk-line sk-line--para-short"></span>
        <span class="sk-block sk-block--code"></span>
        <span class="sk-line sk-line--heading"></span>
        <span class="sk-line sk-line--para"></span>
        <span class="sk-line sk-line--para-mid"></span>
        <span class="sk-line sk-line--para"></span>
        <span class="sk-line sk-line--para-short"></span>
      </div>`;
  }

  function blogFullPageSkeletonHtml() {
    return `
      <article class="blog-full-article blog-full-skeleton" aria-busy="true">
        <span class="sk-line sk-line--meta" style="width:8rem;margin-bottom:1rem"></span>
        <span class="sk-line sk-line--tag"></span>
        <span class="sk-line sk-line--title" style="height:2rem;margin:0.75rem 0"></span>
        <span class="sk-line sk-line--title-short"></span>
        <span class="sk-line sk-line--excerpt" style="margin-top:0.75rem"></span>
        <span class="sk-line sk-line--excerpt-short"></span>
        <div class="blog-full-cover sk-block"></div>
        <section class="blog-full-body">${blogBodySkeletonHtml()}</section>
      </article>`;
  }

  function setGridLoading(grid, loading) {
    if (!grid) return;
    grid.classList.toggle("grid-is-loading", loading);
    if (loading) {
      grid.setAttribute("aria-busy", "true");
    } else {
      grid.removeAttribute("aria-busy");
    }
  }

  function renderActSkeletons(grid, count) {
    if (!grid || count < 1) return;
    const n = Math.min(Math.max(count, 1), 12);
    grid.innerHTML = Array.from({ length: n }, (_, i) => actCardSkeleton(i)).join("");
    setGridLoading(grid, true);
  }

  function renderBlogSkeletons(grid, count) {
    if (!grid || count < 1) return;
    const n = Math.min(Math.max(count, 1), 12);
    grid.innerHTML = Array.from({ length: n }, (_, i) => blogCardSkeleton(i)).join("");
    setGridLoading(grid, true);
  }

  window.GridSkeleton = {
    actCardSkeleton,
    blogCardSkeleton,
    blogBodySkeletonHtml,
    blogFullPageSkeletonHtml,
    renderActSkeletons,
    renderBlogSkeletons,
    setGridLoading,
  };
})();
