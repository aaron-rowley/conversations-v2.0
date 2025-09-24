/* BEGIN FILE: assets/js/api.js */
// Tiny helpers
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

/**
 * Returns a poster that:
 *  - Builds headers (Content-Type + optional auth header)
 *  - Resolves relative/absolute listUrl
 *  - POSTs JSON and parses JSON response (4xx/5xx throw)
 */
export function makePoster(cfg) {
  const base = (cfg.apiBase || "").replace(/\/+$/, "");
  const buildUrl = (u) => {
    if (!u) return "";
    // absolute?
    if (/^https?:\/\//i.test(u)) return u;
    if (base) return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
    return u;
  };

  return async function postJSON(url, body) {
    const endpoint = buildUrl(url);
    const headers = { "Content-Type": "application/json" };

    // Only add auth header if provided
    if (cfg.authHeader && cfg.authToken) {
      headers[cfg.authHeader] = cfg.authToken;
    }

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
