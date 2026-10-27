"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
/** 복도 질주 — 무한 달리기. 탭=점프(2단 가능). 장애물 피하고 커피·알약 먹기. */
type Ob = { x: number; w: number; h: number; icon: string; kind: "ob" | "coffee" | "pill" };
export default function Runner({ ranks }: { ranks: Row[] }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "run" | "done">("idle"); const [dist, setDist] = useState(0); const [items, setItems] = useState(0); const [msg, setMsg] = useState("");
  const g = useRef({ W: 0, H: 0, y: 0, vy: 0, jumps: 0, speed: 0, dist: 0, items: 0, obs: [] as Ob[], nextX: 0, raf: 0, last: 0, run: false, t: 0, hit: 0, ground: 0, best: 0 });
  useEffect(() => {
    const st = box.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.width * .5; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); s.ground = s.H * .78; draw(); };
    const PX = () => s.W * .18, PR = () => s.H * .11;
    const draw = () => {
      // 복도: 벽, 바닥, 창문
      x.fillStyle = "#EAF1EE"; x.fillRect(0, 0, s.W, s.ground); x.fillStyle = "#CFDAD5"; x.fillRect(0, s.ground, s.W, s.H - s.ground);
      x.fillStyle = "#B9C9C2"; x.fillRect(0, s.ground, s.W, 3);
      const off = (s.dist * 2) % (s.W * .4); x.fillStyle = "#D7E4DF"; for (let i = -1; i < 4; i++) { x.fillRect(i * s.W * .4 - off + s.W * .05, s.H * .12, s.W * .22, s.H * .3); }
      x.strokeStyle = "#A9BDB6"; x.lineWidth = 2; for (let i = -1; i < 10; i++) { const lx = i * s.W * .12 - (s.dist * 4) % (s.W * .12); x.beginPath(); x.moveTo(lx, s.ground + 12); x.lineTo(lx + s.W * .06, s.ground + 12); x.stroke(); }
      x.textAlign = "center"; x.textBaseline = "middle";
      for (const o of s.obs) { x.font = `${Math.floor(o.h)}px system-ui`; x.fillText(o.icon, o.x + o.w / 2, (o.kind === "ob" ? s.ground - o.h / 2 : s.ground - o.h * 1.9) + 2); }
      const bob = s.y === 0 && s.run ? Math.sin(s.t * 18) * 2 : 0;
      x.font = `${Math.floor(PR() * 2.1)}px system-ui`; x.fillText(s.hit > 0 ? "😵" : "🏃‍♀️", PX(), s.ground - s.y - PR() + bob);
      if (s.hit > 0) { x.fillStyle = `rgba(226,87,76,${s.hit})`; x.fillRect(0, 0, s.W, s.H); }
    };
    const spawn = () => { const r = Math.random(); const h = s.H * .13;
      if (r < .62) { const pick = [["🛒", 1.1], ["🧹", .9], ["🩼", 1], ["💧", .8], ["📋", .8], ["🪑", 1.1]][Math.floor(Math.random() * 6)] as [string, number]; s.obs.push({ x: s.W + 20, w: h * pick[1] * .9, h: h * pick[1], icon: pick[0], kind: "ob" }); }
      else s.obs.push({ x: s.W + 20, w: h * .8, h: h * .8, icon: r < .85 ? "☕" : "💊", kind: r < .85 ? "coffee" : "pill" });
      s.nextX = s.W * (.55 + Math.random() * .6) * Math.max(.55, 1 - s.dist / 4000); };
    const tick = (t: number) => { const dt = Math.min(.04, (t - s.last) / 1000); s.last = t; s.t += dt;
      s.speed = s.W * (.55 + Math.min(.9, s.dist / 1500)); s.dist += s.speed * dt / 10;
      s.vy -= s.H * 3.2 * dt; s.y = Math.max(0, s.y + s.vy * dt); if (s.y === 0) { s.vy = 0; s.jumps = 0; }
      s.nextX -= s.speed * dt; if (s.nextX <= 0) spawn();
      const px = PX(), pr = PR(), py = s.ground - s.y - pr;
      for (const o of s.obs) { o.x -= s.speed * dt; const oy = o.kind === "ob" ? s.ground - o.h / 2 : s.ground - o.h * 1.9; const dx = Math.abs(o.x + o.w / 2 - px), dy = Math.abs(oy - py);
        if (dx < (o.w / 2 + pr * .55) && dy < (o.h / 2 + pr * .7)) { if (o.kind === "ob") { if (s.hit <= 0) { s.hit = 1; } } else { o.x = -999; s.items++; s.dist += o.kind === "pill" ? 30 : 10; setItems(s.items); } } }
      s.obs = s.obs.filter(o => o.x > -100);
      if (s.hit > 0) { s.hit -= dt * 1.2; if (s.hit <= .6 && s.run) { s.run = false; cancelAnimationFrame(s.raf); const final = Math.floor(s.dist); setDist(final); setState("done"); setMsg(final >= 1500 ? `${final}m — 복도의 치타 🐆` : final >= 700 ? `${final}m — 뛰는 게 익숙하시네요` : `${final}m — 카트 조심!`); saveScore("runner", final).catch(() => {}); draw(); return; } }
      setDist(Math.floor(s.dist)); draw(); s.raf = requestAnimationFrame(tick); };
    (st as any).__start = () => { s.y = 0; s.vy = 0; s.jumps = 0; s.dist = 0; s.items = 0; s.obs = []; s.nextX = s.W * .9; s.hit = 0; s.run = true; s.t = 0; s.last = performance.now(); setState("run"); setDist(0); setItems(0); setMsg(""); cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); };
    (st as any).__jump = () => { if (!s.run) return; if (s.jumps < 2) { s.vy = s.H * (s.jumps === 0 ? 1.55 : 1.35); s.jumps++; } };
    const ro = new ResizeObserver(size); ro.observe(st); size();
    const pd = (e: PointerEvent) => { e.preventDefault(); (st as any).__jump(); };
    const kd = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); (st as any).__jump(); } };
    st.addEventListener("pointerdown", pd); addEventListener("keydown", kd);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); removeEventListener("keydown", kd); };
  }, []);
  return (
    <div className="card">
      <div><h3>복도 질주</h3><div className="muted">병동 복도를 달려요. 탭(또는 스페이스)으로 점프, 공중에서 한 번 더 누르면 2단 점프. 카트·대걸레·물웅덩이·차트를 피하고 ☕(+10m) 💊(+30m)을 먹으세요. 갈수록 빨라져요. 700·1500m 퀘스트.</div></div>
      <div className="def-bar"><span className="def-sun">🏃‍♀️ {dist}m</span><span className="muted">{state === "run" ? `아이템 ${items}` : msg}</span></div>
      <div className="def-stage" ref={box} style={{ touchAction: "manipulation" }}><canvas ref={cv} />
        {state !== "run" && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__start(); }}><span className="big">{state === "done" ? `${dist}m` : "복도 질주"}</span><span>{state === "done" ? "다시 하려면 터치" : "터치해서 시작 · 탭=점프"}</span></button>}</div>
      <Board title="복도 질주 명예의 전당" rows={ranks} fmt={r => r.value + "m"} />
    </div>
  );
}
