import { esc, timeAgo } from "./api.js";

export function bindListView(root, onRowClick){
  const els = {
    list: root.querySelector("#list"),
    page: root.querySelector("#page"),
    pages: root.querySelector("#pages"),
    total: root.querySelector("#total"),
    badgeUnread: root.querySelector("#badge-unread"),
    prev: root.querySelector("#prev"),
    next: root.querySelector("#next"),
    refresh: root.querySelector("#refresh"),
    search: root.querySelector("#search"),
    channel: root.querySelector("#channel"),
    tabs: Array.from(root.querySelectorAll(".tab")),
  };

  function renderItems(items){
    els.list.innerHTML = "";
    items.forEach(it=>{
      const initials = (it.initials || (it.name||"VQ").split(" ").slice(0,2).map(s=>s[0]?.toUpperCase()).join("")) || "VQ";
      const row = document.createElement("button");
      row.className = "w-full text-left px-4 py-3 transition flex gap-3 items-start hover:bg-[#161621]";
      row.innerHTML = `
        <div class="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-semibold" style="background:#202030">${esc(initials)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium truncate">${esc(it.name || "Conversation")}</div>
            <div class="text-[10px] text-[var(--muted)] whitespace-nowrap">${esc(it.lastMessageAgo || timeAgo(it.lastMessageAt))}</div>
          </div>
          <div class="text-sm text-[var(--muted)] truncate">${esc(it.previewShort || it.preview || "")}</div>
        </div>
        ${it.unreadCount ? `<span class="ml-2 text-[10px] px-2 py-0.5 rounded-full" style="background:var(--accent); color:var(--bg)">${it.unreadCount}</span>` : ""}
      `;
      row.addEventListener("click", ()=> onRowClick?.(it));
      els.list.appendChild(row);
    });
  }

  function setPager({page, totalPages, total}){
    els.page.textContent  = String(page);
    els.pages.textContent = String(Math.max(1,totalPages||1));
    els.total.textContent = String(total||0);
    els.prev.disabled = page<=1;
    els.next.disabled = page>=Math.max(1,totalPages||1);
  }

  function setUnreadBadge(count){
    els.badgeUnread.textContent = String(count ?? 0);
  }

  function activeTabTo(tabName){
    els.tabs.forEach(t=>t.classList.remove("ring-1","ring-[var(--accent)]"));
    els.tabs.find(t=>t.dataset.tab===tabName)?.classList.add("ring-1","ring-[var(--accent)]");
  }

  return { els, renderItems, setPager, setUnreadBadge, activeTabTo };
}

