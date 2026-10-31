"use client";
import Link from "next/link";
import { useState } from "react";
type N = { title: string; link: string; source: string; at: number };
type Q = { name: string; price: number; pct: number; unit?: string };
const ago = (t: number) => { if (!t) return ""; const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
/** 홈 뉴스 칩 안: 지수 타일 + 카테고리 칩 + 순위 리스트 (핫뉴스 페이지 축소판) */
export default function HomeNews({ news, tabs, quotes }: { news: Record<string, N[]>; tabs: { key: string; name: string }[]; quotes: Q[] }) {
  const [k, setK] = useState(tabs[0]?.key ?? "global"); const list = (news[k] ?? []).slice(0, 8);
  return <div className="hn">
    {quotes.length > 0 && <div className="nw-ticker hn-q">{quotes.map(q => <div key={q.name} className={"nw-q " + (q.pct >= 0 ? "up" : "down")}><span>{q.name}</span><b>{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{q.unit ?? ""}</b><i>{q.pct >= 0 ? "▲" : "▼"} {Math.abs(q.pct).toFixed(2)}%</i></div>)}</div>}
    <div className="hn-tabs">{tabs.map(t => <button key={t.key} type="button" aria-pressed={k === t.key} onClick={() => setK(t.key)}>{t.name}</button>)}</div>
    <div className="hn-list">{list.length ? list.map((n, i) => <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="nw-item"><span className="nw-rank">{i + 1}</span><span className="nw-t">{n.title}</span><span className="nw-m">{n.source}{n.at ? ` · ${ago(n.at)}` : ""}</span></a>) : <div className="h-empty">뉴스를 불러오지 못했어요.</div>}</div>
    <Link href={`/news?t=${k}`} className="hf-more">📰 핫뉴스 전체 보기 →</Link>
  </div>;
}
