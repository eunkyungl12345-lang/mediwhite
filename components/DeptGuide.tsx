"use client";
import { useState } from "react";
import { guideBySlug } from "@/lib/deptGuides";
export default function DeptGuide({ slug }: { slug: string }) {
  const g = guideBySlug(slug)!;
  const [cat, setCat] = useState("전체"), [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null);
  const k = q.trim().toLowerCase();
  const list = g.items.filter(x => (cat === "전체" || x.cat === cat) && (!k || [x.name, x.sub ?? "", ...x.rows.flat(), ...(x.check ?? []), x.tip ?? ""].join(" ").toLowerCase().includes(k)));
  return (
    <div className="xg">
      <input className="xg-search" value={q} onChange={e => setQ(e.target.value)} placeholder="검색 (예: 연차, Lachman, 수액)" />
      <div className="topics scroll">{["전체", ...g.cats].map(c => <button key={c} type="button" className={"topic" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="xg-list">
        {list.map(x => { const on = open === x.name || !!k; return (
          <div key={x.name} className={"xg-item" + (on ? " on" : "")}>
            <button type="button" className="xg-head" onClick={() => setOpen(open === x.name ? null : x.name)}><span className="xg-part">{x.cat}</span><b>{x.name}</b><span className="xg-cr">{x.sub ?? x.rows.map(r => r[0]).join(" · ")}</span><span className="xg-arr">{on ? "▲" : "▼"}</span></button>
            {on && <div className="xg-body">
              <table className="dg-tbl"><tbody>{x.rows.map(([a, b]) => <tr key={a}><th>{a}</th><td>{b}</td></tr>)}</tbody></table>
              {x.check && <div><span className="xg-k">체크</span><ul>{x.check.map(c => <li key={c}>{c}</li>)}</ul></div>}
              {x.tip && <div className="xg-tip">💡 {x.tip}</div>}
            </div>}
          </div>); })}
        {!list.length && <div className="muted">검색 결과가 없어요.</div>}
      </div>
    </div>
  );
}
