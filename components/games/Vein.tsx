"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
/** 혈관 찾기 — 팔 위를 떠다니는 혈관 타깃. 중심에 가깝게 탭할수록 고득점. 10회, 갈수록 손 떨림·속도 증가. */
export default function Vein({ ranks }: { ranks: Row[] }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "run" | "done">("idle"); const [score, setScore] = useState(0); const [shot, setShot] = useState(0); const [fb, setFb] = useState(""); const [patient, setPatient] = useState("성인");
  const g = useRef({ W: 0, H: 0, t: 0, raf: 0, vx: 0, vy: 0, px: 0, py: 0, shake: 0, speed: 0, r: 0, score: 0, shot: 0, run: false, last: 0, ptype: "성인", hitFx: [] as { x: number; y: number; t: number; good: boolean }[] });
  useEffect(() => {
    const st = box.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const rc = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = rc.width; s.H = rc.width * .62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const draw = () => { x.fillStyle = "#F2E4D8"; x.fillRect(0, 0, s.W, s.H);
      x.fillStyle = "#E8C9B4"; x.beginPath(); x.ellipse(s.W / 2, s.H / 2, s.W * .48, s.H * .36, 0, 0, 7); x.fill();
      x.strokeStyle = "rgba(90,120,170,.35)"; x.lineWidth = 6; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(s.W * .1, s.H * (.35 + i * .15)); x.bezierCurveTo(s.W * .4, s.H * (.3 + i * .15), s.W * .6, s.H * (.45 + i * .15), s.W * .9, s.H * (.4 + i * .15)); x.stroke(); }
      if (s.run) { const jx = (Math.random() - .5) * s.shake, jy = (Math.random() - .5) * s.shake; x.strokeStyle = "#4A6FA5"; x.lineWidth = s.r * 1.6; x.lineCap = "round"; x.beginPath(); x.moveTo(s.px + jx - s.r * 2.2, s.py + jy); x.lineTo(s.px + jx + s.r * 2.2, s.py + jy); x.stroke();
        x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.arc(s.px + jx, s.py + jy, s.r * .45, 0, 7); x.fill(); }
      for (const f of s.hitFx) { x.globalAlpha = Math.max(0, f.t); x.font = `${Math.floor(s.H * .12)}px system-ui`; x.textAlign = "center"; x.fillText(f.good ? "💉" : "💢", f.x, f.y - (1 - f.t) * 20); x.globalAlpha = 1; } };
    const tick = (t: number) => { const dt = Math.min(.05, (t - s.last) / 1000); s.last = t; s.t += dt;
      s.px += s.vx * dt; s.py += s.vy * dt; if (s.px < s.W * .15 || s.px > s.W * .85) s.vx *= -1; if (s.py < s.H * .25 || s.py > s.H * .75) s.vy *= -1;
      if (Math.random() < dt * .8) { const a = Math.random() * Math.PI * 2; s.vx = Math.cos(a) * s.speed; s.vy = Math.sin(a) * s.speed * .5; }
      for (const f of s.hitFx) f.t -= dt * 1.5; s.hitFx = s.hitFx.filter(f => f.t > 0); draw(); s.raf = requestAnimationFrame(tick); };
    (st as any).__start = (ptype: string) => { s.ptype = ptype; s.score = 0; s.shot = 0; s.run = true; s.px = s.W / 2; s.py = s.H / 2; s.last = performance.now(); setScore(0); setShot(0); setFb(""); setState("run"); setLevel(0); cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); };
    const setLevel = (n: number) => { const hard = s.ptype === "소아" ? 1.4 : s.ptype === "노인" ? 1.2 : 1; s.speed = (40 + n * 14) * hard; s.shake = (2 + n * 1.6) * hard; s.r = Math.max(5, (s.W * .028) / (s.ptype === "소아" ? 1.5 : 1) - n * .4); };
    (st as any).__tap = (tx: number, ty: number) => { if (!s.run) return; const d = Math.hypot(tx - s.px, ty - s.py); const pts = d < s.r * .6 ? 100 : d < s.r * 1.2 ? 70 : d < s.r * 2 ? 40 : 0;
      s.score += pts; s.shot++; s.hitFx.push({ x: tx, y: ty, t: 1, good: pts > 0 }); setScore(s.score); setShot(s.shot); setFb(pts === 100 ? "한 번에 쏙! 100" : pts === 70 ? "살짝 빗나감 70" : pts === 40 ? "아슬아슬 40" : "혈관 터짐… 0");
      if (s.shot >= 10) { s.run = false; setState("done"); const final = s.score; setFb(final >= 800 ? `${final}점 — 채혈의 신 🩸` : final >= 500 ? `${final}점 — 안정적인 손` : `${final}점 — 연습이 필요해요`); saveScore("vein", final).catch(() => {}); } else setLevel(s.shot); };
    const ro = new ResizeObserver(size); ro.observe(st); size();
    const pd = (e: PointerEvent) => { const rc = st.getBoundingClientRect(); (st as any).__tap(e.clientX - rc.left, e.clientY - rc.top); };
    st.addEventListener("pointerdown", pd); return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); };
  }, []);
  return (
    <div className="card">
      <div><h3>혈관 찾기</h3><div className="muted">팔 위에서 움직이는 혈관을 정확히 탭! 10번 주사, 갈수록 손이 떨리고 혈관이 도망가요. 소아는 혈관이 가늘고 노인은 잘 움직여요. 중심 100 · 근처 70 · 가장자리 40. 500·800점 퀘스트.</div></div>
      <div className="row">{["성인", "노인", "소아"].map(p => <button key={p} type="button" className="cats-btn" aria-pressed={patient === p} onClick={() => setPatient(p)} disabled={state === "run"}>{p === "성인" ? "🧑 성인" : p === "노인" ? "👴 노인 (×1.2)" : "👶 소아 (×1.4)"}</button>)}</div>
      <div className="def-bar"><span className="def-sun">🩸 {score}점</span><span className="muted">{state === "run" ? `${shot}/10 · ${fb}` : fb}</span></div>
      <div className="def-stage" ref={box} style={{ touchAction: "manipulation" }}><canvas ref={cv} />
        {state !== "run" && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__start(patient); }}><span className="big">{state === "done" ? "다시" : "혈관 찾기"}</span><span>터치해서 시작</span></button>}</div>
      <Board title="혈관 찾기 명예의 전당" rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
