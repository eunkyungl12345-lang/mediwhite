"use client";
import { useState } from "react";
import { TERM_CATS } from "@/lib/terms";
export default function TermSearch() {
  const [q, setQ] = useState(""), n = q.trim().toLowerCase();
  const cats = TERM_CATS.map(c => ({ ...c, items: c.items.filter(([a, b, k]) => !n || `${a} ${b} ${k}`.toLowerCase().includes(n)) })).filter(c => c.items.length);
  return <div className="tm"><input className="tm-q" value={q} onChange={e => setQ(e.target.value)} placeholder="약어나 뜻으로 찾기 (예: NPO, 금식)" />
    {cats.length ? cats.map(c => <section key={c.k} className="tm-sec"><h3>{c.icon} {c.name}</h3>{c.items.map(([a, b, k]) => <div key={a} className="tm-row"><b>{a}</b><div><span>{k}</span><small>{b}</small></div></div>)}</section>)
      : <p className="muted">‘{q}’ 은(는) 아직 사전에 없어요. 자료 요청 게시판에 물어보세요.</p>}</div>;
}
