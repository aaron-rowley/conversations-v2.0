/* BEGIN FILE: assets/js/api.js */
export const esc = s => String(s ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export const timeAgo = (iso) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, diff|0)}s`;
  if (diff < 3600) return `${(diff/60|0)}m`;
  if (diff < 86400) return `${(diff/3600|0)}h`;
  return `${(diff/86400|0)}d`;
};

export function makePoster(cfg) {
  const base = (cfg.apiBase || "").replace(/\/+$/, "");
  const buildUrl = (u) => /^https?:\/\//i.test(u) ? u : (base ? `${base}${u.startsWith("/")?"":"/"}${u}` : u);

  return async function postJSON(url, body) {
    const endpoint = buildUrl(url);
    const headers = { "Content-Type": "application/json" };

    if (cfg.authHeader && cfg.authToken) headers[cfg.authHeader] = cfg.authToken;
    if (cfg.locationHeader && cfg.locationId) headers[cfg.locationHeader] = cfg.locationId;

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(()=> "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? "- "+text.slice(0,200) : ""}`.trim());
    }
    return res.json();
  };
}
/* END FILE: assets/js/api.js */
