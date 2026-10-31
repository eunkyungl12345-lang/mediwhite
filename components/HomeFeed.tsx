"use client";
import Link from "next/link";
import { useState } from "react";
import BlueBadge from "./BlueBadge";
type P = { id: string; title: string; icon: string; dept?: string; nick?: string; badge?: boolean; cat: string; time: string; views: number; nc: number; nr: number; fresh: boolean };
/** 홈 피드: 상단 칩(최신·인기·우리 직종·공지)으로 바로 게시판 보기 */
type N = { title: string; link: string; source: string; icon: string };
export default function HomeFeed({ latest, hot, mine, notices, news, dept, moreMine }: { latest: P[]; hot: P[]; mine: P[]; notices: P[]; news: N[]; dept: string; moreMine: string }) {
  const tabs: [string, string, string, P[], string][] = [["new", "🕒", "최신", latest, "/board?sort=new"], ["hot", "🔥", "인기", hot, "/board?sort=best"], ["mine", "🏷️", dept, mine, moreMine], ["notice", "📢", "공지", notices, "/board?cat=%EA%B3%B5%EC%A7%80"], ["news", "📰", "뉴스", [], "/news"]];
  const [t, setT] = useState("new"); const cur = tabs.find(x => x[0] === t)!;
  return <>
    <div className="hchips" role="tablist">{tabs.map(([k, ic, n]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}><span>{ic}</span>{n}</button>)}</div>
    <section className="hf">
      {t === "news" ? (news.length ? news.map((n, i) => <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="hf-row"><div className="hf-title"><span className="hf-ico">{n.icon}</span><span>{n.title}</span></div><div className="hf-meta"><span>{n.source}</span><span>새 창에서 열려요</span></div></a>) : <div className="h-empty">뉴스를 불러오지 못했어요.</div>) : cur[3].length ? cur[3].map(p => <Link key={p.id} href={`/board/${p.id}`} className="hf-row">
        <div className="hf-title"><span className="hf-ico">{p.icon}</span><span>{p.title}</span>{p.fresh && <span className="n-badge">N</span>}</div>
        <div className="hf-meta"><span>{p.dept ? `[${p.dept}]` : ""}{p.nick ?? "탈퇴"}{p.badge && <BlueBadge size={11} className="bb" />}</span><span>{p.time}</span><span>조회 {p.views}</span>{p.nc > 0 && <span>💬 {p.nc}</span>}{p.nr > 0 && <span>👍 {p.nr}</span>}<span className="hf-cat">{p.cat}</span></div>
      </Link>) : <div className="h-empty">아직 글이 없어요. <Link href="/board/new">첫 글 쓰기 →</Link></div>}
      <Link href={cur[4]} className="hf-more">{t === "news" ? "정치·연예·스포츠·의료 뉴스 더보기 →" : `${cur[2]} 글 더보기 →`}</Link>
    </section>
  </>;
}
