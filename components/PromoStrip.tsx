"use client";
import { useState, useTransition } from "react";
import { cheer } from "@/lib/cheer.actions";
import Insignia from "./Insignia";
type P = { id: number; dept: string; nick: string; rank: string; index: number; n: number; mine: boolean; me: boolean; ago: string };
/** 🎖️ 진급 신고식 — 최근 7일 진급자, 축하 버튼(+XP 양쪽) */
export default function PromoStrip({ items }: { items: P[] }) {
  const [st, setSt] = useState<Record<number, { n: number; mine: boolean }>>(Object.fromEntries(items.map(i => [i.id, { n: i.n, mine: i.mine }])));
  const [p, start] = useTransition(), [msg, setMsg] = useState("");
  if (!items.length) return null;
  return <section className="pm">
    <div className="pm-head">🎖️ 진급 신고식 <small className="muted">축하하면 나 +3 · 진급자 +5 XP</small>{msg && <small className="error">{msg}</small>}</div>
    <div className="pm-strip">{items.map(i => { const c = st[i.id]; return <div key={i.id} className={"pm-card" + (i.me ? " me" : "")}>
      <span className={`ins t${i.index >= 18 ? 5 : i.index >= 15 ? 4 : i.index >= 12 ? 3 : i.index >= 9 ? 2 : i.index >= 5 ? 1 : 0}`}><Insignia index={i.index} size={22} /></span>
      <div className="pm-body"><b>[{i.dept}]{i.nick}</b><span>{i.rank} 진급! <small className="muted">{i.ago}</small></span></div>
      {i.me ? <span className="pm-n">🎉 {c.n}</span> : <button type="button" className={"pm-btn" + (c.mine ? " done" : "")} disabled={p || c.mine} onClick={() => start(async () => { const r: any = await cheer(i.id); if (r.error) { setMsg(r.error); setTimeout(() => setMsg(""), 3000); return; } setSt(s => ({ ...s, [i.id]: { n: r.count, mine: true } })); })}>{c.mine ? `🎉 ${c.n}` : `축하 🎉${c.n ? " " + c.n : ""}`}</button>}
    </div>; })}</div>
  </section>;
}
