// Tiny fetch helper + escaping
export const esc = s => String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
export const timeAgo = iso => {
  if(!iso) return "";
  const t = Date.parse(iso), d = Math.max(0, Date.now()-t);
  const m = Math.floor(d/60000), h = Math.floor(m/60), D = Math.floor(h/24);
  if(m<1) return "now"; if(m<60) return `${m}m`; if(h<24) return `${h}h`; return `${D}d`;
};

export function makePoster(cfg){
  const headers = {"Content-Type":"application/json"};
  if (cfg.authToken) headers[cfg.authHeader] = cfg.authToken;
  if (cfg.appKey) headers["X-App-Key"] = cfg.appKey;

  return function postJSON(url, body){
    if (!url) throw new Error("Missing listUrl");
    return fetch(url, {
      method:"POST",
      headers,
      body: JSON.stringify({ locationId: cfg.locationId, ...body }),
    }).then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); });
  };
}
