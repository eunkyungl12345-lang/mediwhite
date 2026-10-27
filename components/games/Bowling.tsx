"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";

/** 복도 볼링 — 공을 드래그해서 던지기. 10프레임 정식 점수. */
type Pin = { x: number; y: number; up: boolean; vx: number; vy: number };
export default function Bowling({ ranks }: { ranks: Row[] }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [rolls, setRolls] = useState<number[]>([]);
  const [msg, setMsg] = useState("공을 위로 드래그해서 던지세요");
  const [over, setOver] = useState(false);
  const g = useRef({ W: 0, H: 0, pins: [] as Pin[], ball: { x: 0, y: 0, vx: 0, vy: 0, moving: false, r: 10 }, drag: null as null | { x: number; y: number }, raf: 0, standing: 10, rollsDone: 0, frameRolls: [] as number[], rolls: [] as number[], over: false, cur: { x: 0, y: 0 } });

  const score = (r: number[]) => { let total = 0, i = 0; const frames: (number | null)[] = [];
    for (let f = 0; f < 10; f++) { if (i >= r.length) { frames.push(null); continue; }
      if (f === 9) { const a = r[i] ?? 0, b = r[i + 1], c = r[i + 2]; const done = a === 10 ? c != null : (a + (b ?? 0) === 10 ? c != null : b != null); total += a + (b ?? 0) + (c ?? 0); frames.push(done ? total : null); break; }
      if (r[i] === 10) { if (r[i + 1] == null || r[i + 2] == null) { frames.push(null); i++; continue; } total += 10 + r[i + 1] + r[i + 2]; frames.push(total); i++; }
      else if (r[i] + (r[i + 1] ?? 0) === 10 && r[i + 1] != null) { if (r[i + 2] == null) { frames.push(null); i += 2; continue; } total += 10 + r[i + 2]; frames.push(total); i += 2; }
      else { if (r[i + 1] == null) { frames.push(null); i++; continue; } total += r[i] + r[i + 1]; frames.push(total); i += 2; } }
    return { frames, total: frames.filter(x => x != null).slice(-1)[0] ?? 0 }; };

  useEffect(() => {
    const st = box.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.width * 1.25; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); if (!s.pins.length) rack(); resetBall(); draw(); };
    const rack = () => { const cx = s.W / 2, top = s.H * .12, gap = s.W * .085; s.pins = []; for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) s.pins.push({ x: cx + (k - row / 2) * gap, y: top + (3 - row) * gap * .9, up: true, vx: 0, vy: 0 }); s.standing = 10; };
    const resetBall = () => { s.ball = { x: s.W / 2, y: s.H * .9, vx: 0, vy: 0, moving: false, r: s.W * .035 }; };
    const draw = () => {
      x.fillStyle = "#C9B79C"; x.fillRect(0, 0, s.W, s.H);
      x.fillStyle = "#3A4A46"; x.fillRect(0, 0, s.W * .08, s.H); x.fillRect(s.W * .92, 0, s.W * .08, s.H);
      x.strokeStyle = "rgba(0,0,0,.08)"; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(s.W * .08 + i * s.W * .105, 0); x.lineTo(s.W * .08 + i * s.W * .105, s.H); x.stroke(); }
      x.fillStyle = "#6B5B45"; for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(s.W * .25 + i * s.W * .085, s.H * .62, 2, 0, 7); x.fill(); }
      for (const p of s.pins) { if (!p.up) continue; x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(p.x, p.y, s.W * .028, 0, 7); x.fill(); x.strokeStyle = "#E2574C"; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, s.W * .018, 0, 7); x.stroke(); }
      const b = s.ball; x.fillStyle = "#2C6B5E"; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); x.fillStyle = "#1B4A40"; for (const [dx, dy] of [[-.3, -.3], [.3, -.3], [0, .25]]) { x.beginPath(); x.arc(b.x + dx * b.r, b.y + dy * b.r, b.r * .15, 0, 7); x.fill(); }
      if (s.drag && !b.moving) { x.strokeStyle = "rgba(44,107,94,.6)"; x.lineWidth = 3; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x + (b.x - s.cur.x) * 1.2, b.y + (b.y - s.cur.y) * 1.2); x.stroke(); x.setLineDash([]); }
    };
    const endRoll = () => { const b = s.ball; b.moving = false; const standingNow = s.pins.filter(p => p.up).length; const knocked = s.standing - standingNow; s.standing = standingNow;
      s.frameRolls.push(knocked); s.rolls = [...s.rolls, knocked]; setRolls(s.rolls);
      const f = Math.floor(s.rollsDone); const isTenth = s.rolls.length > 0 && score(s.rolls).frames.filter(x => x !== undefined).length >= 9 && frameIndex(s.rolls) >= 9;
      let newRack = false, frameOver = false;
      if (!isTenth) { if (knocked === 10 || s.frameRolls.length === 2) { frameOver = true; newRack = true; } }
      else { const fr = s.frameRolls; if (fr.length === 1 && knocked === 10) newRack = true; else if (fr.length === 2 && (fr[0] === 10 || fr[0] + fr[1] === 10)) newRack = true; if (fr.length === 3 || (fr.length === 2 && fr[0] + fr[1] < 10 && fr[0] !== 10)) frameOver = true; }
      setMsg(knocked === 10 && s.frameRolls.length === 1 ? "스트라이크! 🎳" : s.frameRolls.length === 2 && s.frameRolls[0] + s.frameRolls[1] === 10 ? "스페어!" : knocked === 0 ? "거터…" : `${knocked}개`);
      if (frameOver) s.frameRolls = [];
      if (newRack || standingNow === 0) rack();
      const total = score(s.rolls);
      if (isTenth && frameOver) { s.over = true; setOver(true); setMsg(`게임 끝! ${total.total}점`); saveScore("bowling", total.total).catch(() => {}); }
      resetBall(); draw(); };
    const frameIndex = (r: number[]) => { let f = 0, i = 0; while (i < r.length && f < 9) { if (r[i] === 10) i++; else i += 2; f++; } return f; };
    const tick = () => { const b = s.ball; if (!b.moving) return; b.x += b.vx; b.y += b.vy; b.vy *= .992; b.vx *= .99;
      if (b.x < s.W * .08 + b.r || b.x > s.W * .92 - b.r) { b.vx = 0; b.vy *= .6; b.x = Math.max(s.W * .08 + b.r, Math.min(s.W * .92 - b.r, b.x)); }
      for (const p of s.pins) { if (!p.up) continue; const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < b.r + s.W * .028) { p.up = false; const ang = Math.atan2(p.y - b.y, p.x - b.x); p.vx = Math.cos(ang) * 6; p.vy = Math.sin(ang) * 6; b.vx += Math.cos(ang) * -0.4; b.vy *= .97; chain(p); } }
      draw(); if (b.y < -b.r * 2 || (Math.abs(b.vy) < .15 && Math.abs(b.vx) < .15)) endRoll(); else s.raf = requestAnimationFrame(tick); };
    const chain = (src: Pin, depth = 0) => { if (depth > 3) return; for (const p of s.pins) { if (!p.up || p === src) continue; const d = Math.hypot(p.x - src.x, p.y - src.y); if (d < s.W * .11 && Math.random() < .62 - depth * .12) { p.up = false; chain(p, depth + 1); } } };
    (st as any).__reset = () => { s.rolls = []; s.frameRolls = []; s.over = false; s.rollsDone = 0; rack(); resetBall(); setRolls([]); setOver(false); setMsg("공을 위로 드래그해서 던지세요"); draw(); };
    const pos = (e: PointerEvent) => { const r = st.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const pd = (e: PointerEvent) => { if (s.ball.moving || s.over) return; const p = pos(e); if (Math.hypot(p.x - s.ball.x, p.y - s.ball.y) < s.W * .12) { s.drag = p; s.cur = p; st.setPointerCapture(e.pointerId); } };
    const pm = (e: PointerEvent) => { if (!s.drag) return; s.cur = pos(e); draw(); };
    const pu = () => { if (!s.drag) return; const dx = s.drag.x - s.cur.x, dy = s.drag.y - s.cur.y; s.drag = null; if (dy < 10) { draw(); return; } const pow = Math.min(1, Math.hypot(dx, dy) / (s.H * .35)); s.ball.vx = dx * .06; s.ball.vy = -(5 + pow * 9); s.ball.moving = true; cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); };
    const ro = new ResizeObserver(size); ro.observe(st); size();
    st.addEventListener("pointerdown", pd); st.addEventListener("pointermove", pm); st.addEventListener("pointerup", pu); st.addEventListener("pointercancel", pu);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); st.removeEventListener("pointermove", pm); st.removeEventListener("pointerup", pu); st.removeEventListener("pointercancel", pu); };
  }, []); // eslint-disable-line

  const sc = score(rolls);
  const framesView: string[][] = []; { let i = 0; for (let f = 0; f < 10; f++) { if (f === 9) { framesView.push(rolls.slice(i, i + 3).map((v, k, arr) => v === 10 ? "X" : (k > 0 && arr[k - 1] !== 10 && arr[k - 1] + v === 10) ? "/" : String(v))); break; } if (rolls[i] === 10) { framesView.push(["X"]); i++; } else if (rolls[i] != null) { const a = rolls[i], b = rolls[i + 1]; framesView.push(b == null ? [String(a)] : [String(a), a + b === 10 ? "/" : String(b)]); i += 2; } else framesView.push([]); } }
  return (
    <div className="card">
      <div><h3>복도 볼링</h3><div className="muted">공을 잡고 위로 드래그했다 놓으면 던져요. 좌우로 비스듬히 끌면 각도가 생겨요. 10프레임 정식 점수(스트라이크·스페어 보너스). 100·150·200점 퀘스트.</div></div>
      <div className="bowl-frames">{framesView.map((f, i) => <div key={i} className={"bowl-frame" + (f.length ? " on" : "")}><div className="bowl-rolls">{f.join(" ")}&nbsp;</div><div className="bowl-sum">{sc.frames[i] ?? ""}</div></div>)}</div>
      <div className="def-bar"><span className="def-sun">🎳 {sc.total}점</span><span className="muted">{msg}</span>{over && <button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => (box.current as any).__reset()}>다시</button>}</div>
      <div className="def-stage" ref={box} style={{ touchAction: "none" }}><canvas ref={cv} /></div>
      <Board title="볼링 명예의 전당" rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
