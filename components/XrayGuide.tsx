"use client";
import { useState } from "react";
import { XRAY, XRAY_PARTS } from "@/lib/xrayGuide";
import XrayFig from "./XrayFig";
export default function XrayGuide() {
  const [part, setPart] = useState<string>("전체"), [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null);
  const list = XRAY.filter(x => (part === "전체" || x.part === part) && (!q || (x.name + x.pos + x.cr).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="xg">
      <input className="xg-search" value={q} onChange={e => setQ(e.target.value)} placeholder="검색 (예: waters, 경추, 슬관절, 15°)" />
      <div className="topics scroll">{["전체", ...XRAY_PARTS].map(p => <button key={p} type="button" className={"topic" + (part === p ? " on" : "")} onClick={() => setPart(p)}>{p}</button>)}</div>
      <div className="xg-list">
        {list.map(x => { const on = open === x.name; return (
          <div key={x.name} className={"xg-item" + (on ? " on" : "")}>
            <button type="button" className="xg-head" onClick={() => setOpen(on ? null : x.name)}><span className="xg-part">{x.part}</span><b>{x.name}</b><span className="xg-cr">CR {x.cr}</span><span className="xg-arr">{on ? "▲" : "▼"}</span></button>
            {on && <div className="xg-body">
              <XrayFig name={x.name} />
              <div><span className="xg-k">자세</span>{x.pos}</div>
              <div><span className="xg-k">중심선(CR)</span>{x.cr}</div>
              {x.sid && <div><span className="xg-k">SID</span>{x.sid}</div>}
              {x.breath && <div><span className="xg-k">호흡</span>{x.breath}</div>}
              <div><span className="xg-k">평가 기준</span><ul>{x.check.map(c => <li key={c}>{c}</li>)}</ul></div>
              {x.tip && <div className="xg-tip">💡 {x.tip}</div>}
            </div>}
          </div>); })}
        {!list.length && <div className="muted">검색 결과가 없어요.</div>}
      </div>
    </div>
  );
}
