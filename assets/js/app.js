import { getConfig } from "./config.js";
import { makePoster } from "./api.js";
import { bindListView } from "./listView.js";
// widgets (already uploaded)
import "../widgets/spinner.js";
import "../widgets/toast.js";
import "../widgets/infiniteList.js";

const cfg = getConfig();
const postJSON = makePoster(cfg);

const state = {
  tab: cfg.defaultTab,
  channel: cfg.defaultChannel,
  q: "",
  page: 1,
  totalPages: 1,
  loading: false,
};

const root = document;
const view = bindListView(root, (row)=> {
  // TODO: wire thread fetch here
  console.log("open thread", row.id);
});

function load(pageArg){
  if(state.loading) return;
  state.loading = true;

  postJSON(cfg.listUrl, {
    tab: state.tab, channel: state.channel, q: state.q,
    page: pageArg, pageSize: cfg.pageSize
  }).then(data=>{
    state.page = data.page || pageArg;
    state.totalPages = Math.max(1, data.totalPages || Math.ceil((data.total||0)/(data.perPage||cfg.pageSize)));
    view.renderItems(data.items||[]);
    const unread = data.countsByChannel ? Object.values(data.countsByChannel).reduce((a,b)=>a+b,0) : (data.items||[]).length;
    view.setUnreadBadge(unread);
    view.setPager({ page: state.page, totalPages: state.totalPages, total: data.total||0 });
  }).catch(err=>{
    console.error(err);
    alert("Load failed: "+(err.message||"error"));
  }).finally(()=> state.loading = false);
}

// Events
view.els.tabs.forEach(el=>{
  el.addEventListener("click", ()=>{
    state.tab = el.dataset.tab;
    view.activeTabTo(state.tab);
    state.page = 1;
    load(state.page);
  });
});
view.els.channel.addEventListener("change", e=>{
  state.channel = e.target.value;
  state.page = 1;
  load(state.page);
});
let t; view.els.search.addEventListener("input", e=>{
  clearTimeout(t);
  t = setTimeout(()=>{ state.q = (e.target.value||"").trim(); state.page=1; load(state.page); }, 250);
});
view.els.prev.onclick = ()=> { if(state.page>1) load(--state.page); };
view.els.next.onclick = ()=> { if(state.page<state.totalPages) load(++state.page); };
view.els.refresh.onclick = ()=> load(state.page);

// First paint
view.activeTabTo(state.tab);
view.els.channel.value = state.channel;
load(1);
