// BEGIN getConfig (replace entire function)
export function getConfig() {
  // URL params override (e.g., ?mock=1&api=https://your.api)
  const url = new URL(window.location.href);
  const qp  = (k, d) => url.searchParams.get(k) ?? d;

  return {
    apiBase: qp("api", ""),          // real API base if you have one
    useMock: qp("mock", "0") === "1",// mock mode toggle
    pageSize: Number(qp("pageSize", 20)),
    defaultTab: qp("tab", "unread"),
    defaultChannel: qp("channel", "sms"),
  };
}
// END getConfig
