const TZ = "Asia/Seoul";
const parts = (d: Date) => { const p = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).formatToParts(d); const g = (t: string) => p.find(x => x.type === t)?.value ?? ""; return { y: g("year"), m: g("month"), d: g("day"), ap: g("dayPeriod"), h: g("hour"), mi: g("minute") }; };
/** 서버/클라이언트 어디서 렌더해도 같은 문자열 (한국 시간 고정) */
export function fmt(ts: string | number) {
  const a = parts(new Date(ts)), n = parts(new Date());
  const hm = `${a.ap} ${a.h}:${a.mi}`;
  return a.y === n.y && a.m === n.m && a.d === n.d ? hm : `${a.m}/${a.d} ${hm}`;
}
/** 상대 시간: 방금 · N분 전 · N시간 전 · 하루 전 · N일 전 · 그 뒤로는 M/D */
export function ago(ts: string | number) {
  const d = Date.now() - new Date(ts).getTime(), m = Math.floor(d / 60000);
  if (m < 1) return "방금"; if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24); if (day === 1) return "하루 전"; if (day < 7) return `${day}일 전`;
  const a = parts(new Date(ts)); return `${a.m}/${a.d}`;
}
