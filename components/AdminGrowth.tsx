"use client";
import { useFormState } from "react-dom";
import { setFocus } from "@/lib/growth.actions";
import { useState } from "react";
import { JOB_REGIONS } from "@/lib/jobs";
import { SEOUL_GU } from "@/lib/district";
/** 관리자: 집중 지역 설정 */
export default function AdminFocus({ cur }: { cur: { region: string; label: string; goal: number; gus: string[] } | null }) {
  const [st, act] = useFormState(setFocus, undefined); const [r, setR] = useState(cur?.region ?? "");
  return <form action={act} className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
    <select name="region" value={r} onChange={e => setR(e.target.value)} style={{ width: "auto" }}><option value="">끄기</option>{JOB_REGIONS.map(r => <option key={r}>{r}</option>)}</select>
    <input name="label" defaultValue={cur?.label ?? ""} placeholder="보여줄 이름 (비우면 자동: 예 강남·서초)" maxLength={20} style={{ flex: 1, minWidth: 160 }} />
    <input name="goal" type="number" defaultValue={cur?.goal ?? 100} min={10} style={{ width: 80 }} />
    {r === "서울" && <div className="hc-chips multi" style={{ width: "100%" }}>{SEOUL_GU.map(g => <label key={g}><input type="checkbox" name="gu" value={g} defaultChecked={cur?.gus.includes(g)} /><span>{g}</span></label>)}</div>}
    <button className="btn">저장</button>{st?.ok && <span className="muted">{st.ok}</span>}{st?.error && <span className="error">{st.error}</span>}
  </form>;
}
