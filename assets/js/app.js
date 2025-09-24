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
  // When mock=1, ignore the real URL and load static JSON
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
const view = bindListView(root, (row)=> {
  // TODO: wire thread fetch here
  console.log("open thread", row.id);
});

// --- UI helpers: spinner + empty state ---
function ensureSpinner(){
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
  // assumes view.els.list is the scrollable list container wrapper
  const host = view?.els?.list?.parentElement || document.body;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.appendChild(el);
}
function showSpinner(show=true){
  ensureSpinner();
  const el = document.getElementById("list-loading");
  if (el) el.style.display = show ? "flex" : "none";
}

function renderEmpty(show=true, message="No conversations found"){
  const id = "list-empty";
  let el = document.getElementById(id);
  if (!el){
    el = document.createElement("div");
    el.id = id;
    el.className = "text-sm text-[var(--muted)] px-4 py-6";
    (view?.els?.list || document.body).appendChild(el);
  }
  el.textContent = message;
  el.style.display = show ? "block" : "none";
}

// BEGIN load() with spinner + append + empty handling
function load(pageArg, opts = { append: false }){
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
    locationId: cfg.locationId || null
  })
  .then(data=>{
    state.page       = data.page || pageArg;
    state.totalPages = Math.max(1, data.totalPages || Math.ceil((data.total||0)/(data.perPage||cfg.pageSize)));
    state.total      = Number.isFinite(data.total) ? data.total : (data.items||[]).length;

    const newItems = Array.isArray(data.items) ? data.items : [];
    state.items = opts.append ? state.items.concat(newItems) : newItems;

    view.renderItems(state.items);

    const unread = data.countsByChannel
      ? Object.values(data.countsByChannel).reduce((a,b)=>a+b,0)
      : state.items.length;
    view.setUnreadBadge(unread);
    view.setPager({ page: state.page, totalPages: state.totalPages, total: state.total });

    state.empty = state.items.length === 0;
    renderEmpty(state.empty);
  })
  .catch(err=>{
    console.error(err);
    // No pop-up; show gentle empty
    state.items = [];
    state.empty = true;
    view.renderItems([]);
    view.setPager({ page: 1, totalPages: 1, total: 0 });
    renderEmpty(true, "No conversations found");
  })
  .finally(()=>{
    state.loading = false;
    showSpinner(false);
  });
}
// END load()

// OPTIONAL: IntersectionObserver infinite scroll
function attachInfiniteScroll(){
  if (!view?.els?.list) return;

  const sentinelId = "infinite-sentinel";
  if (!document.getElementById(sentinelId)){
    const sentinel = document.createElement("div");
    sentinel.id = sentinelId;
    sentinel.style.height = "1px";
    view.els.list.appendChild(sentinel);
  }
  const sentinel = document.getElementById(sentinelId);

  const io = new IntersectionObserver((entries)=>{
    const hit = entries.some(e => e.isIntersecting);
    if (!hit) return;
    if (state.loading) return;
    if (state.page >= state.totalPages) return;
    load(state.page + 1, { append: true });
  }, {
    root: view.els.list,
    rootMargin: "0px 0px 400px 0px",
    threshold: 0
  });

  io.observe(sentinel);
}

// BEGIN Events (reset items on filter/search)
view.els.tabs.forEach(el=>{
  el.addEventListener("click", ()=>{
    state.tab = el.dataset.tab;
    view.activeTabTo(state.tab);
    state.page = 1;
    state.items = [];
    load(state.page, { append: false });
  });
});

view.els.channel.addEventListener("change", e=>{
  state.channel = e.target.value;
  state.page = 1;
  state.items = [];
  load(state.page, { append: false });
});

let t;
view.els.search.addEventListener("input", e=>{
  clearTimeout(t);
  t = setTimeout(()=>{
    state.q = (e.target.value || "").trim();
    state.page = 1;
    state.items = [];
    load(state.page, { append: false });
  }, 250);
});
// END Events

// Pager buttons
view.els.prev.onclick    = ()=> { if(state.page > 1)               load(--state.page, { append: false }); };
view.els.next.onclick    = ()=> { if(state.page < state.totalPages) load(++state.page, { append: true  }); };
view.els.refresh.onclick = ()=> load(state.page, { append: false });

// First paint
view.activeTabTo(state.tab);
view.els.channel.value = state.channel;
attachInfiniteScroll();   // comment out if you only want buttons
load(1);
/* END FILE: assets/js/app.js */
