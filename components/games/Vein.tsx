"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
/** 혈관 찾기 (스피드) — 20초 동안 계속 나타나는 혈관을 빠르게 찔러요. 연속 성공 콤보 배수, 빗나가면 콤보 리셋. */
type Target = { x: number; y: number; r: number; life: number; max: number; vx: number; vy: number };
export default function Vein({ ranks }: { ranks: Row[] }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "run" | "done">("idle"); const [score, setScore] = useState(0); const [combo, setCombo] = useState(0); const [left, setLeft] = useState(20); const [fb, setFb] = useState(""); const [patient, setPatient] = useState("성인");
  const g = useRef({ W: 0, H: 0, raf: 0, last: 0, t: 0, run: false, targets: [] as Target[], spawn: 0, score: 0, combo: 0, best: 0, hits: 0, miss: 0, ptype: "성인", fx: [] as { x: number; y: number; t: number; txt: string; good: boolean }[], shake: 0 });
  useEffect(() => {
    const st = box.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const rc = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = rc.width; s.H = rc.width * .62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const hard = () => s.ptype === "소아" ? 1.35 : s.ptype === "노인" ? 1.15 : 1;
    const draw = () => { const sh = s.shake > 0 ? (Math.random() - .5) * 6 : 0; x.save(); x.translate(sh, 0);
      x.fillStyle = "#F2E4D8"; x.fillRect(-10, 0, s.W + 20, s.H); x.fillStyle = "#E8C9B4"; x.beginPath(); x.ellipse(s.W / 2, s.H / 2, s.W * .48, s.H * .38, 0, 0, 7); x.fill();
      x.strokeStyle = "rgba(90,120,170,.3)"; x.lineWidth = 5; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(s.W * .1, s.H * (.35 + i * .15)); x.bezierCurveTo(s.W * .4, s.H * (.3 + i * .15), s.W * .6, s.H * (.45 + i * .15), s.W * .9, s.H * (.4 + i * .15)); x.stroke(); }
      for (const t of s.targets) { const p = t.life / t.max; x.strokeStyle = "#4A6FA5"; x.lineWidth = t.r * 1.5; x.lineCap = "round"; x.beginPath(); x.moveTo(t.x - t.r * 2.2, t.y); x.lineTo(t.x + t.r * 2.2, t.y); x.stroke();
        x.strokeStyle = p < .3 ? "#E2574C" : "#fff"; x.lineWidth = 2; x.beginPath(); x.arc(t.x, t.y, t.r * (1.6 - p * .6), 0, 7); x.stroke(); x.fillStyle = "rgba(255,255,255,.9)"; x.beginPath(); x.arc(t.x, t.y, t.r * .4, 0, 7); x.fill(); }
      for (const f of s.fx) { x.globalAlpha = Math.max(0, f.t); x.font = `600 ${Math.floor(s.H * .09)}px system-ui`; x.textAlign = "center"; x.fillStyle = f.good ? "#2C6B5E" : "#E2574C"; x.fillText(f.txt, f.x, f.y - (1 - f.t) * 30); x.globalAlpha = 1; }
      x.restore(); };
    const spawnT = () => { const r = Math.max(5, s.W * .03 / (s.ptype === "소아" ? 1.4 : 1)); const a = Math.random() * 6.28; const sp = (20 + s.t * 4) * hard(); s.targets.push({ x: s.W * (.2 + Math.random() * .6), y: s.H * (.28 + Math.random() * .44), r, life: 0, max: Math.max(.9, 2.2 - s.t * .05), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .5 }); };
    const tick = (now: number) => { const dt = Math.min(.05, (now - s.last) / 1000); s.last = now; s.t += dt; s.shake = Math.max(0, s.shake - dt);
      s.spawn -= dt; if (s.spawn <= 0 && s.targets.length < 3) { spawnT(); s.spawn = Math.max(.35, 1.1 - s.t * .03); }
      for (const t of s.targets) { t.life += dt; t.x += t.vx * dt; t.y += t.vy * dt; if (t.x < s.W * .15 || t.x > s.W * .85) t.vx *= -1; if (t.y < s.H * .25 || t.y > s.H * .75) t.vy *= -1; }
      const expired = s.targets.filter(t => t.life >= t.max); for (const t of expired) { s.miss++; s.combo = 0; setCombo(0); s.fx.push({ x: t.x, y: t.y, t: 1, txt: "놓침", good: false }); }
      s.targets = s.targets.filter(t => t.life < t.max);
      for (const f of s.fx) f.t -= dt * 1.4; s.fx = s.fx.filter(f => f.t > 0);
      setLeft(Math.max(0, Math.ceil(20 - s.t))); draw();
      if (s.t >= 20) { s.run = false; setState("done"); const final = s.score; setFb(final >= 800 ? `${final}점 — 채혈의 신 🩸` : final >= 500 ? `${final}점 — 안정적인 손` : `${final}점 — 연습이 필요해요`); saveScore("vein", final).catch(() => {}); return; }
      s.raf = requestAnimationFrame(tick); };
    (st as any).__start = (ptype: string) => { s.ptype = ptype; s.t = 0; s.score = 0; s.combo = 0; s.hits = 0; s.miss = 0; s.targets = []; s.fx = []; s.spawn = 0; s.run = true; s.last = performance.now(); setScore(0); setCombo(0); setLeft(20); setFb(""); setState("run"); cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); };
    const pd = (e: PointerEvent) => { if (!s.run) return; const rc = st.getBoundingClientRect(); const px = e.clientX - rc.left, py = e.clientY - rc.top;
      let best: Target | null = null, bd = 1e9; for (const t of s.targets) { const d = Math.hypot(px - t.x, py - t.y); if (d < bd) { bd = d; best = t; } }
      if (best && bd < best.r * 2.2) { const base = bd < best.r * .7 ? 30 : bd < best.r * 1.4 ? 20 : 10; s.combo++; const mult = 1 + Math.min(2, Math.floor(s.combo / 5) * .5); const pts = Math.round(base * mult); s.score += pts; s.hits++; s.targets = s.targets.filter(t => t !== best); s.fx.push({ x: px, y: py, t: 1, txt: `+${pts}${s.combo >= 5 ? ` x${mult}` : ""}`, good: true }); }
      else { s.combo = 0; s.score = Math.max(0, s.score - 5); s.shake = .25; s.fx.push({ x: px, y: py, t: 1, txt: "아야!", good: false }); }
      setScore(s.score); setCombo(s.combo); };
    const ro = new ResizeObserver(size); ro.observe(st); size(); st.addEventListener("pointerdown", pd);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); };
  }, []);
  return (
    <div className="card">
      <div><h3>혈관 찾기</h3><div className="muted">20초 동안 팔 위에 계속 나타나는 혈관을 빠르게 찔러요! 중심 30 · 근처 20 · 가장자리 10, 연속 5번마다 콤보 배수(최대 x3). 빗나가면 환자가 "아야!" + 콤보 리셋, 사라지기 전에 못 찌르면 놓침. 소아는 가늘고 노인은 잘 움직여요. 500·800점 퀘스트.</div></div>
      <div className="row">{["성인", "노인", "소아"].map(p => <button key={p} type="button" className="cats-btn" aria-pressed={patient === p} onClick={() => setPatient(p)} disabled={state === "run"}>{p === "성인" ? "🧑 성인" : p === "노인" ? "👴 노인" : "👶 소아"}</button>)}</div>
      <div className="def-bar"><span className="def-sun">🩸 {score}점</span><span className="muted">{state === "run" ? `${left}초 · 콤보 ${combo}` : fb}</span></div>
      <div className="def-stage" ref={box} style={{ touchAction: "manipulation" }}><canvas ref={cv} />
        {state !== "run" && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__start(patient); }}><span className="big">{state === "done" ? "다시" : "혈관 찾기"}</span><span>터치해서 시작</span></button>}</div>
      <Board title="혈관 찾기 명예의 전당" rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
