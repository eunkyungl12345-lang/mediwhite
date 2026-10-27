"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
/** 코드블루 CPR — 110bpm 박자에 맞춰 탭. 30초(≈55회) 동안 정확도 점수. */
const BPM = 110, DUR = 30;
export default function Cpr({ ranks }: { ranks: Row[] }) {
  const [state, setState] = useState<"idle" | "count" | "run" | "done">("idle");
  const [score, setScore] = useState(0); const [hits, setHits] = useState({ perfect: 0, good: 0, miss: 0 }); const [fb, setFb] = useState(""); const [left, setLeft] = useState(DUR); const [pulse, setPulse] = useState(0);
  const g = useRef({ t0: 0, beat: 60000 / BPM, lastTapBeat: -1, raf: 0, timer: 0 as any, score: 0, p: 0, gd: 0, m: 0 });
  const audio = useRef<AudioContext | null>(null);
  const tick = (freq = 880, len = .05) => { try { const a = audio.current ?? (audio.current = new (window.AudioContext || (window as any).webkitAudioContext)()); const o = a.createOscillator(), gn = a.createGain(); o.frequency.value = freq; gn.gain.value = .08; o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + len); } catch {} };
  useEffect(() => () => { cancelAnimationFrame(g.current.raf); clearInterval(g.current.timer); }, []);
  const start = () => { setState("count"); setScore(0); setHits({ perfect: 0, good: 0, miss: 0 }); g.current.score = 0; g.current.p = g.current.gd = g.current.m = 0; let n = 3; setFb("3"); tick(660);
    const c = setInterval(() => { n--; if (n > 0) { setFb(String(n)); tick(660); } else { clearInterval(c); run(); } }, 700); };
  const run = () => { const s = g.current; s.t0 = performance.now(); s.lastTapBeat = -1; setState("run"); setFb("시작!"); setLeft(DUR);
    let lastBeat = -1;
    const loop = (t: number) => { const el = t - s.t0; const b = Math.floor(el / s.beat); if (b !== lastBeat) { lastBeat = b; setPulse(b); tick(880, .04); }
      // 놓친 박자: 한 박자 지났는데 탭 없음
      if (b - 1 > s.lastTapBeat && b - 1 >= 0 && lastBeat >= 1 && s.lastTapBeat < b - 1) { /* 아래 interval에서 계산 */ }
      setLeft(Math.max(0, Math.ceil(DUR - el / 1000)));
      if (el >= DUR * 1000) { finish(); return; } s.raf = requestAnimationFrame(loop); };
    s.raf = requestAnimationFrame(loop); };
  const finish = () => { const s = g.current; cancelAnimationFrame(s.raf); const totalBeats = Math.round(DUR * BPM / 60); const miss = Math.max(0, totalBeats - s.p - s.gd); s.m = miss; setHits({ perfect: s.p, good: s.gd, miss }); const final = Math.round(s.score); setScore(final); setState("done"); setFb(final >= 900 ? "완벽한 리듬! 환자 ROSC 🎉" : final >= 600 ? "좋아요, 안정적인 압박" : "박자가 흔들려요. 메트로놈에 귀 기울여요"); saveScore("cpr", final).catch(() => {}); };
  const tap = () => { const s = g.current; if (state !== "run") { if (state === "idle" || state === "done") start(); return; }
    const el = performance.now() - s.t0; const nearest = Math.round(el / s.beat); if (nearest === s.lastTapBeat) { setFb("너무 빨라요 (더블탭)"); s.score = Math.max(0, s.score - 5); return; }
    const off = Math.abs(el - nearest * s.beat); s.lastTapBeat = nearest;
    if (off < 70) { s.p++; s.score += 20; setFb("PERFECT"); } else if (off < 140) { s.gd++; s.score += 10; setFb("GOOD"); } else { s.score = Math.max(0, s.score - 2); setFb(el - nearest * s.beat > 0 ? "늦었어요" : "빨랐어요"); }
    setScore(Math.round(s.score)); };
  return (
    <div className="card">
      <div><h3>코드블루 CPR</h3><div className="muted">메트로놈(분당 110회)에 맞춰 30초 동안 탭하세요. 박자 정확도로 점수 — PERFECT 20점, GOOD 10점, 최대 1,100점. 소리를 켜면 쉬워요. 600·900점 퀘스트.</div></div>
      <div className="def-bar"><span className="def-sun">❤️ {score}점</span><span className="muted">{state === "run" ? `${left}초` : state === "done" ? `P ${hits.perfect} · G ${hits.good} · 놓침 ${hits.miss}` : ""}</span></div>
      <button type="button" className={"cpr-pad" + (state === "run" ? (pulse % 2 ? " a" : " b") : "")} onPointerDown={e => { e.preventDefault(); tap(); }}>
        <span className="cpr-heart">{state === "run" ? "🫀" : state === "done" ? "✅" : "🫀"}</span>
        <span className="cpr-fb">{state === "idle" ? "터치해서 시작" : state === "done" ? "다시 하려면 터치" : fb}</span>
      </button>
      <Board title="CPR 명예의 전당" rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
