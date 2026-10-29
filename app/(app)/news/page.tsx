import Link from "next/link";
import { getNews, getQuotes, NEWS_TABS } from "@/lib/news";
export const revalidate = 900;
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
export default async function NewsPage({ searchParams }: { searchParams: { t?: string } }) {
  const [news, quotes] = await Promise.all([getNews(), getQuotes()]);
  const tab = (NEWS_TABS.find(x => x.key === searchParams.t) ?? NEWS_TABS[0]).key;
  const list = news[tab].slice(0, 25);
  const kst = new Date(Date.now() + 9 * 3600000);
  return (
    <div className="news">
      <div className="card" style={{ gap: 8 }}>
        <div className="bar"><h3 style={{ margin: 0 }}>📰 오늘의 핫뉴스</h3><span className="muted" style={{ fontSize: 12 }}>{kst.getUTCMonth() + 1}월 {kst.getUTCDate()}일 · 30분마다 갱신</span></div>
        {quotes.length > 0 && <div className="nw-ticker">{quotes.map(q => <div key={q.name} className={"nw-q " + (q.pct > 0 ? "up" : q.pct < 0 ? "down" : "")}><span>{q.name}</span><b>{q.price >= 1000 ? Math.round(q.price).toLocaleString() : q.price.toFixed(2)}{q.unit}</b><i>{q.pct > 0 ? "▲" : q.pct < 0 ? "▼" : "–"} {Math.abs(q.pct).toFixed(2)}%</i></div>)}</div>}
        <div className="cats nw-tabs">{NEWS_TABS.map(x => <Link key={x.key} href={`/news?t=${x.key}`} className="cats-btn" aria-pressed={tab === x.key}>{x.name}</Link>)}</div>
      </div>
      <div className="card nw-list">
        {tab === "hira" && <div className="muted" style={{ fontSize: 12, paddingBottom: 6 }}>건강보험심사평가원 공지(고시·급여기준·평가 안내)와 보도자료 최신 글이에요. 1시간마다 갱신돼요.</div>}
        {list.length ? list.map((n, i) => <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="nw-item"><span className="nw-rank">{i + 1}</span><span className="nw-t">{n.title}</span><span className="nw-m">{n.source}{n.at ? ` · ${n.source.startsWith("심평원") ? new Date(n.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" }) : ago(n.at)}` : ""}</span></a>)
          : <div className="muted">지금은 소식을 불러오지 못했어요. 잠시 후 다시 확인해주세요.</div>}
        <div className="muted" style={{ fontSize: 11 }}>기사 제목과 링크만 모아 보여드려요. 원문은 각 언론사 사이트에서 열려요. 시세는 지연될 수 있어요(투자 판단의 근거로 쓰지 마세요).</div>
      </div>
    </div>
  );
}
