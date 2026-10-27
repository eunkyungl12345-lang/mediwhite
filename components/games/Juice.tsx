"use client";
import { useState } from "react";
import { sound } from "@/lib/juice";
/** 최고 기록 표시 + 음소거 토글 — 모든 게임 상단 공통 */
export function BestLine({ best, cur, unit = "점" }: { best: number; cur: number; unit?: string }) {
  const [m, setM] = useState(sound.muted);
  const diff = best - cur;
  return <span className="bestline">최고 <b>{best}{unit}</b>{best > 0 && cur > 0 && <span style={{ color: diff > 0 ? "var(--muted)" : "var(--scrub)" }}>{diff > 0 ? `(-${diff})` : "NEW!"}</span>}<button type="button" className="mute-btn" onClick={() => setM(sound.toggle())} aria-label="효과음">{m ? "🔇" : "🔊"}</button></span>;
}
export function RecordFlash() { return <div className="rec-flash">NEW RECORD!</div>; }
