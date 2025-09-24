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

const state = {
  tab: cfg.defaultTab,
  channel: cfg.defaultChannel,
  q: "",
  page: 1,
  totalPages: 1,
  loading: false,
  items: [],         // 👈 keep an in-memory list for appending
};

const root = document;
const view = bindListView(root, (row)=> {
  // TODO: wire thread fetch here
  console.log("open thread", row.id);
});

// BEGIN load() with append support
function load(pageArg, opts = { append: false }){
  if (state.loading) return;
  state.loading = true;

  postJSON(cfg.listUrl, {
    tab: state.tab,
    channel: state.channel,
    q: state.q,
    page: pageArg,
    pageSize: cfg.pageSize,
    locationId: cfg.locationId || null
  })
  .then(data=>{
    state.page = data.page || pageArg;
    state.totalPages = Math.max(1, data.totalPages || Math.ceil((data.total||0)/(data.perPage||cfg.pageSize)));

    const newItems = Array.isArray(data.items) ? data.items : [];
    state.items = opts.append ? state.items.concat(newItems) : newItems;

    view.renderItems(state.items);

    const unread = data.countsByChannel
      ? Object.values(data.countsByChannel).reduce((a,b)=>a+b,0)
      : state.items.length;
    view.setUnreadBadge(unread);
    view.setPager({ page: state.page, totalPages: state.totalPages, total: data.total||state.items.length });
  })
  .catch(err=>{
    console.error(err);
    alert("Load failed: " + (err.message || "error"));
  })
  .finally(()=> state.loading = false);
}
// END load()


// BEGIN Events (replace entire block)
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

view.els.prev.onclick  = ()=> { if(state.page > 1)                load(--state.page); };
view.els.next.onclick  = ()=> { if(state.page < state.totalPages)  load(++state.page); };
view.els.refresh.onclick = ()=> load(state.page);

// First paint
view.activeTabTo(state.tab);
view.els.channel.value = state.channel;
load(1);
/* END FILE: assets/js/app.js */
