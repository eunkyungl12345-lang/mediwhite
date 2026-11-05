"use client";
import { useState, useTransition } from "react";
import { setPromo } from "@/lib/growth.actions";
/** 관리자: 오픈 기념 무료 열람 마감일 */
export default function AdminPromo({ cur }: { cur: string }) {
  const [v, setV] = useState(cur), [p, start] = useTransition(), [ok, setOk] = useState("");
  return <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}><input type="date" value={v} onChange={e => setV(e.target.value)} style={{ width: "auto" }} />
    <button className="btn" disabled={p} onClick={() => start(async () => { await setPromo(v); setOk("저장됐어요"); })}>마감일 저장</button>
    <button className="btn ghost" disabled={p} onClick={() => start(async () => { await setPromo(""); setV(""); setOk("오픈 기념을 껐어요"); })}>끄기</button><small className="muted">{ok || "이 날까지 모든 회원이 체크 없이 전부 열람 + 배너 노출"}</small></div>;
}
