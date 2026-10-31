"use client";
import Link from "next/link";
import { useState } from "react";
import BlueBadge from "./BlueBadge";
type P = { id: string; title: string; icon: string; dept?: string; nick?: string; badge?: boolean; cat: string; time: string; views: number; nc: number; nr: number; fresh: boolean };
/** 홈 피드: 최신 · 인기 · 우리 직종 탭 */
export default function HomeFeed({ latest, hot, mine, dept, moreMine }: { latest: P[]; hot: P[]; mine: P[]; dept: string; moreMine: string }) {
  const tabs: [string, string, P[], string][] = [["new", "최신글", latest, "/board?sort=new"], ["hot", "인기글", hot, "/board?sort=best"], ["mine", `${dept}`, mine, moreMine]];
  const [t, setT] = useState("new"); const cur = tabs.find(x => x[0] === t)!;
  return <section className="h-card hf">
    <div className="hf-tabs" role="tablist">{tabs.map(([k, n]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}>{n}</button>)}</div>
    {cur[2].length ? cur[2].map(p => <Link key={p.id} href={`/board/${p.id}`} className="hf-row">
      <div className="hf-title"><span className="hf-ico">{p.icon}</span>{p.title}{p.fresh && <span className="n-badge">N</span>}</div>
      <div className="hf-meta"><span>{p.dept ? `[${p.dept}]` : ""}{p.nick ?? "탈퇴"}{p.badge && <BlueBadge size={11} className="bb" />}</span><span>{p.time}</span><span>조회 {p.views}</span>{p.nc > 0 && <span>💬 {p.nc}</span>}{p.nr > 0 && <span>👍 {p.nr}</span>}<span className="hf-cat">{p.cat}</span></div>
    </Link>) : <div className="h-empty">아직 글이 없어요. <Link href="/board/new">첫 글 쓰기 →</Link></div>}
    <Link href={cur[3]} className="hf-more">더보기 →</Link>
  </section>;
}
