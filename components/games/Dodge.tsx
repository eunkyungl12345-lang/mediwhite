"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";

type B = { x: number; y: number; vx: number; vy: number; r: number };
export default function Dodge({ ranks }: { ranks: Row[] }) {
  const stage = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(false), [msg, setMsg] = useState("시작"), [sub, setSub] = useState("터치해서 시작"), [hud, setHud] = useState("0.00초");
  const g = useRef({ W: 0, H: 0, pl: null as null | { x: number; y: number; r: number }, bul: [] as B[], t0: 0, tl: 0, acc: 0, keys: {} as Record<string, boolean>, drag: null as null | { x: number; y: number }, raf: 0, run: false });

  useEffect(() => {
    const st = stage.current!, c = cv.current!, x = c.getContext("2d")!;
    const s = g.current;
    const size = () => { const r = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.height; c.width = r.width * d; c.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const draw = () => { x.fillStyle = "#0E1513"; x.fillRect(0, 0, s.W, s.H); if (!s.pl) return;
      x.fillStyle = "#F07A70"; for (const b of s.bul) { x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); }
      x.fillStyle = "#6FBFA9"; x.beginPath(); x.arc(s.pl.x, s.pl.y, s.pl.r, 0, 7); x.fill(); };
    const spawn = (el: number) => { const m = Math.min(s.W, s.H), side = Math.floor(Math.random() * 4); let px: number, py: number;
      if (side === 0) { px = Math.random() * s.W; py = -8; } else if (side === 1) { px = s.W + 8; py = Math.random() * s.H; } else if (side === 2) { px = Math.random() * s.W; py = s.H + 8; } else { px = -8; py = Math.random() * s.H; }
      const ang = Math.atan2(s.pl!.y - py, s.pl!.x - px) + (Math.random() - .5) * .6, sp = m * (.22 + Math.random() * .18 + Math.min(.25, el * .008));
      s.bul.push({ x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: Math.max(3, m * .012) }); };
    const end = (el: number) => { s.run = false; cancelAnimationFrame(s.raf); draw(); const sec = Math.round(el * 100) / 100;
      setMsg(sec.toFixed(2) + "초"); setSub((sec >= 20 ? "베테랑 생존자!" : sec >= 10 ? "꽤 버텼어요" : "아깝다") + " · 다시 하려면 터치"); setRun(false); saveScore("dodge", sec).catch(() => {}); };
    const tick = (t: number) => { const dt = Math.min(.05, (t - s.tl) / 1000); s.tl = t; const el = (t - s.t0) / 1000, m = Math.min(s.W, s.H), pl = s.pl!;
      const sp = m * .55, mx = (s.keys.ArrowRight ? 1 : 0) - (s.keys.ArrowLeft ? 1 : 0), my = (s.keys.ArrowDown ? 1 : 0) - (s.keys.ArrowUp ? 1 : 0);
      pl.x = Math.max(pl.r, Math.min(s.W - pl.r, pl.x + mx * sp * dt)); pl.y = Math.max(pl.r, Math.min(s.H - pl.r, pl.y + my * sp * dt));
      if (el > .6) { s.acc += dt * (1.8 + el * .3); while (s.acc > 1) { spawn(el); s.acc--; } }
      for (const b of s.bul) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.hypot(b.x - pl.x, b.y - pl.y) < b.r + pl.r * .8) return end(el); }
      s.bul = s.bul.filter(b => b.x > -30 && b.x < s.W + 30 && b.y > -30 && b.y < s.H + 30);
      setHud(el.toFixed(2) + "초"); draw(); s.raf = requestAnimationFrame(tick); };
    (st as any).__start = () => { size(); const m = Math.min(s.W, s.H); s.pl = { x: s.W / 2, y: s.H / 2, r: Math.max(6, m * .022) }; s.bul = []; s.acc = 0; s.t0 = s.tl = performance.now(); s.run = true; setRun(true); s.raf = requestAnimationFrame(tick); };
    const ro = new ResizeObserver(size); ro.observe(st);
    const pd = (e: PointerEvent) => { if (!s.run) return; s.drag = { x: e.clientX, y: e.clientY }; st.setPointerCapture(e.pointerId); };
    const pm = (e: PointerEvent) => { if (!s.run || !s.drag || !s.pl) return; s.pl.x += (e.clientX - s.drag.x) * 1.3; s.pl.y += (e.clientY - s.drag.y) * 1.3; s.drag = { x: e.clientX, y: e.clientY }; };
    const pu = () => { s.drag = null; };
    const kd = (e: KeyboardEvent) => { if (s.run && e.key.startsWith("Arrow")) { s.keys[e.key] = true; e.preventDefault(); } };
    const ku = (e: KeyboardEvent) => { s.keys[e.key] = false; };
    st.addEventListener("pointerdown", pd); st.addEventListener("pointermove", pm); st.addEventListener("pointerup", pu); st.addEventListener("pointercancel", pu);
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); st.removeEventListener("pointermove", pm); st.removeEventListener("pointerup", pu); st.removeEventListener("pointercancel", pu); removeEventListener("keydown", kd); removeEventListener("keyup", ku); };
  }, []);

  return (
    <div className="card">
      <div><h3>총알 피하기</h3><div className="muted">화면을 손가락으로 끌거나 방향키로 움직여서 사방에서 날아오는 총알을 피하세요. 오래 버틸수록 총알이 많아져요. 10·20·30초 달성 시 퀘스트 경험치.</div></div>
      <div className="stage" ref={stage}>
        <canvas ref={cv} />
        {!run && <button className="overlay" type="button" onClick={() => (stage.current as any).__start()}><span className="big">{msg}</span><span>{sub}</span></button>}
        <span className="hud">{hud}</span>
      </div>
      <Board title="명예의 전당" rows={ranks} fmt={r => r.value.toFixed(2) + "초"} />
    </div>
  );
}
