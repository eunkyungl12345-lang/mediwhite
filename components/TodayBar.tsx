import Link from "next/link";
import { getNews, getQuotes } from "@/lib/news";
import { fortune } from "@/lib/fortune";
import { memo } from "@/lib/memo";
/** 모든 화면 상단: 오늘의 운세 점수 + 시세 + 헤드라인 흐름 */
export default async function TodayBar({ birth }: { birth?: { date: string | null; time: string | null; name: string | null } | null }) {
  const [quotes, news] = await Promise.all([memo("tb-quotes", 10 * 60_000, getQuotes).catch(() => []), memo("tb-news", 30 * 60_000, getNews).catch(() => null)]);
  const heads = news ? [...news.global.slice(0, 2), ...news.stock.slice(0, 1), ...news.macro.slice(0, 1), ...news.coin.slice(0, 1), ...news.med.slice(0, 1)] : [];
  const f = birth?.date ? fortune(birth.date, birth.time, birth.name, new Date()) : null;
  const items = [...quotes.slice(1).map(q => <span key={q.name} className={"tb-q " + (q.pct > 0 ? "up" : q.pct < 0 ? "down" : "")}>{q.name} <b>{q.price >= 1000 ? Math.round(q.price).toLocaleString() : q.price.toFixed(2)}</b> {q.pct > 0 ? "▲" : q.pct < 0 ? "▼" : ""}{Math.abs(q.pct).toFixed(1)}%</span>), ...heads.map((h, i) => <span key={"h" + i} className="tb-h">📰 {h.title}</span>)];
  return (
    <div className="tb">
      <Link href="/fortune" className="tb-ft">🔮 {f ? <>운세 <b>{f.score}</b>점</> : "오늘의 운세"}</Link>
      {quotes[0] && <Link href="/news" className={"tb-pin " + (quotes[0].pct > 0 ? "up" : quotes[0].pct < 0 ? "down" : "")}>{quotes[0].name} {quotes[0].pct > 0 ? "▲" : quotes[0].pct < 0 ? "▼" : ""}{Math.abs(quotes[0].pct).toFixed(1)}%</Link>}
      <Link href="/news" className="tb-run" aria-label="오늘의 핫뉴스"><div className="tb-track">{items}{items}</div></Link>
    </div>
  );
}
