"use client";
import { useState } from "react";
import { sfx, haptic } from "@/lib/juice";

/** 컴퓨터와 오목 (혼자 연습). 나는 흑, 컴퓨터는 백 */
const N = 15;
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
function line(b: string[], i: number, c: string, dx: number, dy: number) {
  const x0 = i % N, y0 = Math.floor(i / N); let n = 1, open = 0;
  for (const s of [1, -1]) { let x = x0 + dx * s, y = y0 + dy * s; while (x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === c) { n++; x += dx * s; y += dy * s; } if (x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === "") open++; }
  return { n, open };
}
function val(n: number, open: number) {
  if (n >= 5) return 1e6;
  if (n === 4) return open === 2 ? 5e4 : open === 1 ? 6e3 : 0;
  if (n === 3) return open === 2 ? 5e3 : open === 1 ? 400 : 0;
  if (n === 2) return open === 2 ? 300 : open === 1 ? 40 : 0;
  return open === 2 ? 10 : 2;
}
function score(b: string[], i: number, c: string) { let s = 0; for (const [dx, dy] of DIRS) { const { n, open } = line(b, i, c, dx, dy); s += val(n, open); } return s; }
const wins = (b: string[], i: number, c: string) => DIRS.some(([dx, dy]) => line(b, i, c, dx, dy).n >= 5);
function aiMove(b: string[], level: number) {
  const cand: { i: number; s: number }[] = [];
  for (let i = 0; i < N * N; i++) {
    if (b[i]) continue;
    const x = i % N, y = Math.floor(i / N); let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && b[yy * N + xx]) { near = true; break; } }
    if (!near) continue;
    const s = score(b, i, "w") * 1.05 + score(b, i, "b") * (level === 0 ? .6 : 1);
    cand.push({ i, s: s + Math.random() * (level === 0 ? 400 : 5) });
  }
  if (!cand.length) return 112;
  cand.sort((a, z) => z.s - a.s);
  return level === 0 && Math.random() < .25 ? cand[Math.min(cand.length - 1, Math.floor(Math.random() * 3))].i : cand[0].i;
}

export default function OmokAI() {
  const [b, setB] = useState<string[]>(Array(N * N).fill("")), [last, setLast] = useState(-1), [over, setOver] = useState(""), [level, setLevel] = useState(1), [think, setThink] = useState(false);
  const reset = () => { setB(Array(N * N).fill("")); setLast(-1); setOver(""); };
  const place = (i: number) => {
    if (b[i] || over || think) return;
    const nb = b.slice(); nb[i] = "b"; setB(nb); setLast(i); sfx.tap(); haptic(8);
    if (wins(nb, i, "b")) { setOver("🎉 이겼어요!"); sfx.level(); haptic([30, 30, 80]); return; }
    setThink(true);
    setTimeout(() => { const j = aiMove(nb, level); const nb2 = nb.slice(); nb2[j] = "w"; setB(nb2); setLast(j); setThink(false); sfx.tap();
      if (wins(nb2, j, "w")) { setOver("🤖 컴퓨터 승리… 한 번 더!"); sfx.boom(); } else if (!nb2.includes("")) setOver("무승부!"); }, 350);
  };
  return (
    <div className="card" style={{ gap: 8 }}>
      <div className="bar"><h3 style={{ margin: 0 }}>🤖 컴퓨터와 한 판</h3><div className="om-mode">{["쉬움", "보통"].map((n, k) => <label key={n}><input type="radio" checked={level === k} onChange={() => { setLevel(k); reset(); }} /><span>{n}</span></label>)}</div></div>
      <div className={"om-status" + (over ? " win" : !think ? " me" : "")}>{over || (think ? "🤖 생각 중…" : "⚫ 내 차례! (나는 흑)")}{over && <button type="button" className="btn" style={{ padding: "4px 12px", marginLeft: 8 }} onClick={reset}>한 판 더</button>}</div>
      <div className="om-board">
        {b.map((c, i) => <button key={i} type="button" className={"om-cell" + (!c && !over && !think ? " can" : "")} onClick={() => place(i)} aria-label={`${Math.floor(i / N) + 1}행 ${i % N + 1}열`}>
          {c && <span className={"om-stone " + c + (last === i ? " last" : "")} />}{!c && !over && !think && <span className="om-ghost b" />}</button>)}
      </div>
    </div>
  );
}
