export function setupInfiniteScroll(container, fetchMore) {
  const sentinel = document.createElement("div");
  sentinel.className = "scroll-sentinel";
  container.appendChild(sentinel);

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fetchMore();
    }
  });

  observer.observe(sentinel);
}
