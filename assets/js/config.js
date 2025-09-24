// Parse URL params and expose defaults used across the app
export function getConfig() {
  const p = new URLSearchParams(location.search);
  return {
    listUrl:   p.get("listUrl") || "",
    locationId: p.get("locationId") || "",
    authHeader: p.get("authHeader") || "Authorization",
    authToken: p.get("authToken") || "",
    appKey:    p.get("appKey") || "",               // optional X-App-Key
    pageSize: +(p.get("pageSize") || 10),
    defaultTab: "unread",
    defaultChannel: "sms",
  };
}
