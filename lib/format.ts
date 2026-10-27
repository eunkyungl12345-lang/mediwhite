const TZ = "Asia/Seoul";
const parts = (d: Date) => { const p = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).formatToParts(d); const g = (t: string) => p.find(x => x.type === t)?.value ?? ""; return { y: g("year"), m: g("month"), d: g("day"), ap: g("dayPeriod"), h: g("hour"), mi: g("minute") }; };
/** 서버/클라이언트 어디서 렌더해도 같은 문자열 (한국 시간 고정) */
export function fmt(ts: string | number) {
  const a = parts(new Date(ts)), n = parts(new Date());
  const hm = `${a.ap} ${a.h}:${a.mi}`;
  return a.y === n.y && a.m === n.m && a.d === n.d ? hm : `${a.m}/${a.d} ${hm}`;
}
