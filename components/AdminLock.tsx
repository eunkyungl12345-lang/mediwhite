"use client";
import { useTransition, useState } from "react";
import { setLockMode } from "@/lib/growth.actions";
/** 관리자: 열람 잠금 방식 */
export default function AdminLock({ cur }: { cur: string }) {
  const [m, setM] = useState(cur), [p, start] = useTransition();
  const O: [string, string, string][] = [["off", "🔓 모두 열람", "회원 적을 때"], ["free3", "🎁 병원 3곳까지 무료", "추천 · 그 뒤엔 체크해야"], ["on", "🔒 체크해야 열람", "데이터가 쌓이면"]];
  return <div className="hc-chips multi">{O.map(([k, n, d]) => <label key={k}><input type="radio" name="lock" checked={m === k} disabled={p} onChange={() => { setM(k); start(() => setLockMode(k)); }} /><span>{n} <small className="muted">{d}</small></span></label>)}</div>;
}
