/* BEGIN FILE: assets/js/app.js */
import { getConfig } from "./config.js";
import { makePoster } from "./api.js";
import { bindListView } from "./listView.js";
// widgets (already uploaded)
import "../widgets/spinner.js";
import "../widgets/toast.js";
import "../widgets/infiniteList.js";

// Config + network poster (mock switch)
const cfg = getConfig();
const postJSON = cfg.useMock
  ? async (_url, _body) => (await fetch("./assets/mock/list.json")).json()
  : makePoster(cfg);

// ---- App state ----
const state = {
  tab: cfg.defaultTab,
  channel: cfg.defaultChannel,
  q: "",
  page: 1,
  totalPages: 1,
  total: 0,
  loading: false,
  items: [],
  empty: false,
};

const root = document;
const view = bindListView(root, (row) => {
  // TODO: wire thread fetch here (openThread(row.id))
  console.log("open thread", row.id);
});

// --- UI helpers: spinner + empty state ---
function ensureSpinner() {
  if (document.getElementById("list-loading")) return;
  const el = document.createElement("div");
  el.id = "list-loading";
  el.style.position = "absolute";
  el.style.inset = "0";
  el.style.display = "none";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.background = "rgba(0,0,0,0.25)";
  el.innerHTML = `<div class="animate-pulse px-3 py-1.5 rounded-lg border bg-[var(--bg-2)]">Loading…</div>`;
  const host = view?.els?.list?.parentElement || document.body;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.appendChild(el);
}
function showSpinner(show = true) {
  ensureSpinner();
  const el = document.getElementById("list-loading");
  if (el) el.style.display = show ? "flex" : "none";
}
function renderEmpty(show = true, message = "No conversations found") {
  const id = "list-empty";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "text-sm text-[var(--muted)] px-4 py-6";
    (view?.els?.list || document.body).appendChild(el);
  }
  el.textContent = message;
  el.style.display = show ? "block" : "none";
}

// --- helpers: dedupe on append + sync URL ---
function mergeItems(oldItems, newItems) {
  const seen = new Set(oldItems.map((i) => i.id));
  const merged = oldItems.slice();
  for (const it of newItems) if (!seen.has(it.id)) { seen.add(it.id); merged.push(it); }
  return merged;
}
function syncURL() {
  const u = new URL(location.href);
  u.searchParams.set("tab", state.tab);
  u.searchParams.set("channel", state.channel);
  u.searchParams.set("q", state.q);
  history.replaceState(null, "", u);
}

// --- infinite scroll: persistent sentinel & single observer ---
let io = null;
let sentinel = null;
function ensureInfiniteScroll(hasMore) {
  if (!view?.els?.list) return;

  // (re)create sentinel
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.id = "infinite-sentinel";
    sentinel.style.height = "1px";
  }
  // renderItems may wipe children; always re-append to the list
  if (sentinel.parentElement !== view.els.list) {
    view.els.list.appendChild(sentinel);
  }

  // create observer once
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        if (state.loading) return;
        if (state.page >= state.totalPages) return;
        load(state.page + 1, { append: true });
      },
      {
        // If your list is not the scroll container, change root to null.
        root: view.els.list,
        rootMargin: "0px 0px 400px 0px",
        threshold: 0,
      }
    );
    io.observe(sentinel);
  }

  // show/hide sentinel based on hasMore
  sentinel.style.display = hasMore ? "block" : "none";
}

// BEGIN load() with spinner + append + empty handling
function load(pageArg, opts = { append: false }) {
  if (state.loading) return;
  state.loading = true;
  showSpinner(true);
  renderEmpty(false);

  postJSON(cfg.listUrl, {
    tab: state.tab,
    channel: state.channel,
    q: state.q,
    page: pageArg,
    pageSize: cfg.pageSize,
    locationId: cfg.locationId || null,
  })
    .then((data) => {
      state.page = data.page || pageArg;
      state.totalPages = Math.max(1, data.totalPages || Math.ceil((data.total || 0) / (data.perPage || cfg.pageSize)));
      state.total = Number.isFinite(data.total) ? data.total : (data.items || []).length;

      const newItems = Array.isArray(data.items) ? data.items : [];
      state.items = opts.append ? mergeItems(state.items, newItems) : newItems;

      view.renderItems(state.items);

      const unread = data.countsByChannel
        ? Object.values(data.countsByChannel).reduce((a, b) => a + b, 0)
        : state.items.length;
      view.setUnreadBadge(unread);
      view.setPager({ page: state.page, totalPages: state.totalPages, total: state.total });

      // Control buttons
      if (view?.els?.next) view.els.next.disabled = !data.hasMore;
      if (view?.els?.prev) view.els.prev.disabled = state.page <= 1;

      // Keep sentinel alive after each render
      ensureInfiniteScroll(Boolean(data.hasMore));

      state.empty = state.items.length === 0;
      renderEmpty(state.empty);
    })
    .catch((err) => {
      console.error(err);
      state.items = [];
      state.empty = true;
      view.renderItems([]);
      view.setPager({ page: 1, totalPages: 1, total: 0 });
      if (view?.els?.next) view.els.next.disabled = true;
      if (view?.els?.prev) view.els.prev.disabled = true;
      ensureInfiniteScroll(false);
      renderEmpty(true, "No conversations found");
    })
    .finally(() => {
      state.loading = false;
      showSpinner(false);
    });
}
// END load()

// BEGIN Events (reset items on filter/search)
view.els.tabs.forEach((el) => {
  el.addEventListener("click", () => {
    state.tab = el.dataset.tab;
    view.activeTabTo(state.tab);
    state.page = 1;
    state.items = [];
    syncURL();
    load(state.page, { append: false });
  });
});

view.els.channel.addEventListener("change", (e) => {
  state.channel = e.target.value;
  state.page = 1;
  state.items = [];
  syncURL();
  load(state.page, { append: false });
});

let t;
view.els.search.addEventListener("input", (e) => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.q = (e.target.value || "").trim();
    state.page = 1;
    state.items = [];
    syncURL();
    load(state.page, { append: false });
  }, 250);
});
// END Events

// Pager buttons
view.els.prev.onclick = () => { if (state.page > 1) load(--state.page, { append: false }); };
view.els.next.onclick = () => { if (state.page < state.totalPages) load(++state.page, { append: true }); };
view.els.refresh.onclick = () => load(state.page, { append: false });

// First paint
view.activeTabTo(state.tab);
view.els.channel.value = state.channel;
load(1);
/* END FILE: assets/js/app.js */
