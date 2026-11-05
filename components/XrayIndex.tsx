"use client";
import Link from "next/link";
import { useState } from "react";
import { XVIEWS, XRAY, XRAY_PARTS } from "@/lib/xrayAll";
export default function XrayIndex() {
  const [part, setPart] = useState("전체"), [q, setQ] = useState(""), k = q.trim().toLowerCase();
  const exams = XRAY.map((x, ei) => ({ x, vs: XVIEWS.filter(v => v.ei === ei) })).filter(({ x, vs }) => (part === "전체" || x.part === part) && (!k || [x.name, x.en, ...vs.map(v => `${v.view.v} ${v.d?.title ?? ""} ${v.d?.proj ?? ""}`)].join(" ").toLowerCase().includes(k)));
  return <div className="xi">
    <input className="xg-search" value={q} onChange={e => setQ(e.target.value)} placeholder="검색 (예: C-spine, 요추, mortise, waters)" />
    <div className="topics scroll">{["전체", ...XRAY_PARTS].map(p => <button key={p} type="button" className={"topic" + (part === p ? " on" : "")} onClick={() => setPart(p)}>{p}</button>)}</div>
    {XRAY_PARTS.filter(p => exams.some(e => e.x.part === p)).map(p => <section key={p} className="xi-g"><h3>{p}</h3>
      {exams.filter(e => e.x.part === p).map(({ x, vs }) => <div key={x.name} className="xi-ex"><b>{x.name} <small>{x.en}</small></b>
        <div className="xi-vs">{vs.map(v => <Link key={v.slug} href={`/study/xray/${v.slug}`}>{v.view.v}</Link>)}</div></div>)}</section>)}
    {!exams.length && <p className="muted">검색 결과가 없어요.</p>}
  </div>;
}
