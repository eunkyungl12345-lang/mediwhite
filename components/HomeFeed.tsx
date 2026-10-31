"use client";
import Link from "next/link";
import { useState } from "react";
import BlueBadge from "./BlueBadge";
import HomeNews from "./HomeNews";
type P = { id: string; title: string; icon: string; dept?: string; nick?: string; badge?: boolean; cat: string; time: string; views: number; nc: number; nr: number; fresh: boolean };
/** 홈 피드: 상단 칩(최신·인기·우리 직종·공지)으로 바로 게시판 보기 */
type N = { title: string; link: string; source: string; at: number };
export default function HomeFeed({ latest, recent, hot, mine, notices, news, newsTabs, quotes, dept, moreMine }: { latest: P[]; recent: P[]; hot: P[]; mine: P[]; notices: P[]; news: Record<string, N[]>; newsTabs: { key: string; name: string }[]; quotes: any[]; dept: string; moreMine: string }) {
  const tabs: [string, string, string, P[], string][] = [["all", "✨", "전체글", latest, "/board"], ["hot", "🔥", "인기", hot, "/board?sort=best"], ["new", "🕒", "최신", recent, "/board?sort=new"], ["mine", "🏷️", dept, mine, moreMine], ["notice", "📢", "공지", notices, "/board?cat=%EA%B3%B5%EC%A7%80"], ["news", "📰", "뉴스", [], "/news"]];
  const [t, setT] = useState("all"); const cur = tabs.find(x => x[0] === t)!;
  return <>
    <div className="hchips" role="tablist">{tabs.map(([k, ic, n]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}><span>{ic}</span>{n}</button>)}</div>
    <section className="hf">
      {t === "news" ? <HomeNews news={news} tabs={newsTabs} quotes={quotes} /> : cur[3].length ? cur[3].map(p => <Link key={p.id} href={`/board/${p.id}`} className="hf-row">
        <div className="hf-title"><span className="hf-ico">{p.icon}</span><span>{p.title}</span>{p.fresh && <span className="n-badge">N</span>}</div>
        <div className="hf-meta"><span>{p.dept ? `[${p.dept}]` : ""}{p.nick ?? "탈퇴"}{p.badge && <BlueBadge size={11} className="bb" />}</span><span>{p.time}</span><span>조회 {p.views}</span>{p.nc > 0 && <span>💬 {p.nc}</span>}{p.nr > 0 && <span>👍 {p.nr}</span>}<span className="hf-cat">{p.cat}</span></div>
      </Link>) : <div className="h-empty">아직 글이 없어요. <Link href="/board/new">첫 글 쓰기 →</Link></div>}
      {t !== "news" && <Link href={cur[4]} className="hf-more">{cur[2]} 글 더보기 →</Link>}
    </section>
  </>;
}
