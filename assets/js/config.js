/* BEGIN FILE: assets/js/config.js */
export function getConfig() {
  const url = new URL(window.location.href);
  const qp  = (k, d) => url.searchParams.get(k) ?? d;

  // Also allow auth params in the URL hash (not sent as referrer)
  const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const hp   = (k, d) => hash.get(k) ?? d;

  // Prefer query param, fall back to hash (so you can use ...#authToken=... safely)
  const authHeader = qp("authHeader", hp("authHeader", "Authorization"));
  const authToken  = qp("authToken",  hp("authToken",  ""));

  // listUrl can be absolute (https://...) or relative (/api/list)
  const listUrl = qp("listUrl", "/conversations/list");

  // Optional: pass-through context (e.g., location scoping)
  const locationId = qp("locationId", hp("locationId", ""));

  return {
    apiBase: qp("api", ""),      // not used if listUrl is absolute
    listUrl,
    authHeader,
    authToken,
    locationId,

    // UI defaults
    pageSize: Number(qp("pageSize", 20)),
    defaultTab: qp("tab", "unread"),
    defaultChannel: qp("channel", "sms"),

    // Enable mock with ?mock=1 (kept for local testing)
    useMock: qp("mock", "0") === "1",
  };
}
/* END FILE: assets/js/config.js */
