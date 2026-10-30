"use client";
import { useState } from "react";
import { XRAY, XRAY_PARTS } from "@/lib/xrayGuide";
import XrayFig from "./XrayFig";
export default function XrayGuide() {
  const [part, setPart] = useState<string>("전체"), [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null);
  const k = q.trim().toLowerCase();
  const list = XRAY.filter(x => (part === "전체" || x.part === part) && (!k || [x.name, x.en, ...x.views.flatMap(v => [v.v, v.pos, v.cr])].join(" ").toLowerCase().includes(k)));
  const parts = part === "전체" ? XRAY_PARTS.filter(p => list.some(x => x.part === p)) : [part];
  return (
    <div className="xg">
      <input className="xg-search" value={q} onChange={e => setQ(e.target.value)} placeholder="검색 (예: 요추, waters, mortise, 15°)" />
      <div className="topics scroll">{["전체", ...XRAY_PARTS].map(p => <button key={p} type="button" className={"topic" + (part === p ? " on" : "")} onClick={() => setPart(p)}>{p}</button>)}</div>
      <div className="xg-list">
        {parts.map(p => <div key={p} className="xg-group">
          <div className="xg-gh">{p}<span>{list.filter(x => x.part === p).length}</span></div>
          {list.filter(x => x.part === p).map(x => { const on = open === x.name || !!k; return (
            <div key={x.name} className={"xg-item" + (on ? " on" : "")}>
              <button type="button" className="xg-head" onClick={() => setOpen(open === x.name ? null : x.name)}>
                <b>{x.name} <small>{x.en}</small></b><span className="xg-arr">{on ? "▲" : "▼"}</span>
                <span className="xg-views">{x.views.map(v => <i key={v.v}>{v.v}</i>)}</span>
              </button>
              {on && <div className="xg-body">
                {(x.sid || x.breath) && <div className="xg-meta">{x.sid && <span>SID {x.sid}</span>}{x.breath && <span>호흡 · {x.breath}</span>}</div>}
                {x.views.map(v => (
                  <div key={v.v} className="xg-view">
                    <div className="xg-vh">{v.v}</div>
                    {v.fig && <XrayFig name={v.fig} />}
                    <div><span className="xg-k">자세</span>{v.pos}</div>
                    <div><span className="xg-k">CR</span>{v.cr}</div>
                  </div>
                ))}
                {x.check && <div><span className="xg-k">평가 기준</span><ul>{x.check.map(c => <li key={c}>{c}</li>)}</ul></div>}
                {x.tip && <div className="xg-tip">💡 {x.tip}</div>}
                {x.views.some(v => v.v.includes("BOTH")) && <div className="muted" style={{ fontSize: 12 }}>BOTH = 좌·우(또는 내·외측) 양쪽을 각각 촬영해요.</div>}
              </div>}
            </div>); })}
        </div>)}
        {!list.length && <div className="muted">검색 결과가 없어요.</div>}
      </div>
    </div>
  );
}
