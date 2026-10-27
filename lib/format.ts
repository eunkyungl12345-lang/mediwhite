export function fmt(ts: string | number) {
  const d = new Date(ts), n = new Date();
  const hm = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" });
  const sameDay = d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) === n.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}
