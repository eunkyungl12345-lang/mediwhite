"use client";
import { useFormState } from "react-dom";
import { setFocus } from "@/lib/growth.actions";
import { JOB_REGIONS } from "@/lib/jobs";
/** 관리자: 집중 지역 설정 */
export default function AdminFocus({ cur }: { cur: { region: string; label: string; goal: number } | null }) {
  const [st, act] = useFormState(setFocus, undefined);
  return <form action={act} className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
    <select name="region" defaultValue={cur?.region ?? ""} style={{ width: "auto" }}><option value="">끄기</option>{JOB_REGIONS.map(r => <option key={r}>{r}</option>)}</select>
    <input name="label" defaultValue={cur?.label ?? ""} placeholder="보여줄 이름 (예: 강남·서울, 동탄·경기남부)" maxLength={20} style={{ flex: 1, minWidth: 160 }} />
    <input name="goal" type="number" defaultValue={cur?.goal ?? 100} min={10} style={{ width: 80 }} />
    <button className="btn">저장</button>{st?.ok && <span className="muted">{st.ok}</span>}{st?.error && <span className="error">{st.error}</span>}
  </form>;
}
