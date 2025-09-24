/* BEGIN FILE: assets/js/config.js */
export function getConfig() {
  const url  = new URL(window.location.href);
  const qp   = (k, d) => url.searchParams.get(k) ?? d;
  const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const hp   = (k, d) => hash.get(k) ?? d;

  const listUrl = qp("listUrl", "/conversations/list");

  // Read locationId from query or hash; trim to avoid stray spaces
  const locationId = (qp("locationId", hp("locationId", "")) || "").trim();

  // Optional: also allow sending location via a header
  const locationHeader = qp("locationHeader", hp("locationHeader", "")); // e.g. "X-Location-Id"

  // Auth header/token (can be in hash to avoid referrer leaks)
  const authHeader = qp("authHeader", hp("authHeader", "Authorization"));
  const authToken  = qp("authToken",  hp("authToken",  ""));

  return {
    apiBase: qp("api", ""),   // unused if listUrl is absolute
    listUrl,
    locationId,
    locationHeader,           // if set, we’ll mirror locationId in this header
    authHeader,
    authToken,

    pageSize: Number(qp("pageSize", 20)),
    defaultTab: qp("tab", "unread"),
    defaultChannel: qp("channel", "sms"),
    useMock: qp("mock", "0") === "1",
  };
}
/* END FILE: assets/js/config.js */
