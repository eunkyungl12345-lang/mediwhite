"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop, recordWatcher } from "@/lib/juice";
import { BestLine, RecordFlash } from "./Juice";

/** 총알 피하기 v2 — 페이즈(조준→링→레이저→보스→혼돈), 대시(탭), 그레이즈 집중 게이지, 파워업(⏱🛡💣), 일시정지 */
type B = { x: number; y: number; vx: number; vy: number; r: number; k: "aim" | "ring" | "spin" | "home" | "boss"; life?: number; gz?: boolean };
type L = { x: number; y: number; a: number; t: number }; // 레이저: 경보 → 발사
type P = { x: number; y: number; vx: number; vy: number; k: "slow" | "shield" | "bomb"; t: number };
const PHASES = [[0, "워밍업", "#F07A70"], [10, "링 폭발", "#F2A541"], [20, "레이저 경보", "#5BC0EB"], [30, "보스: 수간호사", "#C77DFF"], [45, "혼돈", "#FF6B6B"], [60, "지옥", "#FF3B3B"]] as const;
const phaseAt = (el: number) => { let i = 0; for (let k = 0; k < PHASES.length; k++) if (el >= PHASES[k][0]) i = k; return i; };
const COL: Record<B["k"], string> = { aim: "#F07A70", ring: "#F2A541", spin: "#C77DFF", home: "#6FE3A5", boss: "#FF5C8A" };

export default function Dodge({ ranks, best = 0 }: { ranks: Row[]; best?: number }) {
  const [rec, setRec] = useState(false); const watch = useRef(recordWatcher(best)); const [sec, setSec] = useState(0);
  const stage = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "run" | "pause" | "done">("idle"); const [res, setRes] = useState<{ sec: number; graze: number; phase: string; dash: number } | null>(null);
  const g = useRef({ W: 0, H: 0, pl: { x: 0, y: 0, r: 8 }, bul: [] as B[], las: [] as L[], pw: [] as P[], t0: 0, tl: 0, el: 0, acc: 0, ringT: 0, lasT: 0, pwT: 0, bossT: 0, bossA: 0, keys: {} as Record<string, boolean>, drag: null as null | { x: number; y: number; t: number; moved: number }, raf: 0, run: false, paused: false, pausedAt: 0, slow: 0, shield: 0, dash: 0, dashCd: 0, dashDir: { x: 0, y: -1 }, inv: 0, graze: 0, focus: 0, focusOn: 0, dashes: 0, flash: 0, phase: -1, banner: "", bannerT: 0, trail: [] as { x: number; y: number }[], shakeT: 0 });

  useEffect(() => {
    const st = stage.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = st.getBoundingClientRect(); const d = Math.min(3, devicePixelRatio || 1); s.W = r.width; s.H = r.height; c.width = r.width * d; c.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const M = () => Math.min(s.W, s.H);
    const draw = () => {
      const ph = phaseAt(s.el), pc = PHASES[ph][2];
      x.fillStyle = "#0B1210"; x.fillRect(0, 0, s.W, s.H);
      // 움직이는 격자 + 비네트
      x.strokeStyle = "rgba(111,191,169,.07)"; x.lineWidth = 1; const gs = M() * .1, off = 0; x.beginPath(); for (let i = -1; i < s.W / gs + 1; i++) { x.moveTo(i * gs + off, 0); x.lineTo(i * gs + off, s.H); } for (let j = -1; j < s.H / gs + 1; j++) { x.moveTo(0, j * gs + off); x.lineTo(s.W, j * gs + off); } x.stroke();
      const vg = x.createRadialGradient(s.W / 2, s.H / 2, M() * .3, s.W / 2, s.H / 2, M() * .8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, s.slow > 0 ? "rgba(91,192,235,.35)" : "rgba(0,0,0,.55)"); x.fillStyle = vg; x.fillRect(0, 0, s.W, s.H);
      if (!s.run && !s.pl) return;
      // 보스
      if (s.bossT > 0) { x.save(); x.translate(s.W / 2, M() * .12); x.fillStyle = "#FF5C8A"; x.shadowColor = "#FF5C8A"; x.shadowBlur = 18; x.beginPath(); x.arc(0, 0, M() * .05, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = "#fff"; x.beginPath(); x.arc(-6, -3, 3, 0, 7); x.arc(6, -3, 3, 0, 7); x.fill(); x.fillStyle = "#fff"; x.fillRect(-10, -M() * .05 - 8, 20, 6); x.fillStyle = "#FF5C8A"; x.fillRect(-2, -M() * .05 - 7, 4, 4); x.restore(); }
      // 레이저
      for (const l of s.las) { x.save(); x.translate(l.x, l.y); x.rotate(l.a); if (l.t < .8) { x.strokeStyle = `rgba(91,192,235,${.25 + .5 * Math.abs(Math.sin(l.t * 20))})`; x.lineWidth = 2; x.setLineDash([8, 8]); x.beginPath(); x.moveTo(-M() * 2, 0); x.lineTo(M() * 2, 0); x.stroke(); } else { x.strokeStyle = "#5BC0EB"; x.shadowColor = "#5BC0EB"; x.shadowBlur = 16; x.lineWidth = M() * .03; x.beginPath(); x.moveTo(-M() * 2, 0); x.lineTo(M() * 2, 0); x.stroke(); x.strokeStyle = "#fff"; x.lineWidth = M() * .01; x.stroke(); } x.restore(); }
      // 총알
      for (const b of s.bul) { x.fillStyle = COL[b.k];
        if (b.k === "ring") { x.save(); x.translate(b.x, b.y); x.rotate(Math.PI / 4); x.fillRect(-b.r, -b.r, b.r * 2, b.r * 2); x.restore(); }
        else if (b.k === "spin") { x.save(); x.translate(b.x, b.y); x.rotate(s.el * 1.5); x.fillRect(-b.r, -b.r, b.r * 2, b.r * 2); x.restore(); }
        else if (b.k === "home") { x.beginPath(); x.moveTo(b.x, b.y - b.r * 1.3); x.lineTo(b.x + b.r, b.y + b.r); x.lineTo(b.x - b.r, b.y + b.r); x.fill(); }
        else { x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); } }
      // 파워업
      for (const p of s.pw) { x.save(); x.translate(p.x, p.y); x.fillStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.arc(0, 0, M() * .035 + Math.sin(p.t * 4) * 2, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke(); x.font = `${Math.floor(M() * .04)}px sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(p.k === "slow" ? "⏱" : p.k === "shield" ? "🛡" : "💣", 0, 1); x.restore(); }
      // 플레이어 (꼬리 + 캡슐 + 방패 + 대시 쿨)
      const pl = s.pl; for (let i = 0; i < s.trail.length; i++) { const tr = s.trail[i]; x.fillStyle = `rgba(111,191,169,${(i / s.trail.length) * .35})`; x.beginPath(); x.arc(tr.x, tr.y, pl.r * (i / s.trail.length), 0, 7); x.fill(); }
      const blink = s.inv > 0 && s.inv < 1e8 && Math.floor(s.el * 6) % 2 === 0; if (!blink) { x.save(); x.translate(pl.x, pl.y); x.fillStyle = "#6FBFA9"; x.beginPath(); x.arc(0, 0, pl.r, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = "#fff"; x.beginPath(); x.arc(-pl.r * .3, -pl.r * .2, pl.r * .18, 0, 7); x.arc(pl.r * .3, -pl.r * .2, pl.r * .18, 0, 7); x.fill(); x.restore(); }
      if (s.shield > 0) { x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = 2; x.beginPath(); x.arc(pl.x, pl.y, pl.r * 2, 0, 7); x.stroke(); }
      if (s.dashCd > 0) { x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 2; x.beginPath(); x.arc(pl.x, pl.y, pl.r * 2.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - s.dashCd / 1.6)); x.stroke(); }
      // HUD: 집중 게이지 + 페이즈
      x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(12, s.H - 18, M() * .3, 6); x.fillStyle = s.focusOn > 0 ? "#5BC0EB" : "#F4D35E"; x.fillRect(12, s.H - 18, M() * .3 * Math.min(1, s.focus), 6);
      x.fillStyle = "rgba(255,255,255,.6)"; x.font = `600 11px system-ui`; x.textAlign = "left"; x.textBaseline = "bottom"; x.fillText(`집중 ${s.focusOn > 0 ? "발동!" : ""} · 그레이즈 ${s.graze}`, 12, s.H - 22);
      x.fillStyle = pc; x.font = `800 12px system-ui`; x.fillText(`PHASE ${ph + 1} · ${PHASES[ph][1]}`, 12, 24);
      if (s.bannerT > 0) { x.globalAlpha = Math.min(1, s.bannerT); x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(0, s.H * .4, s.W, s.H * .16); x.fillStyle = pc; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `900 ${Math.floor(M() * .08)}px system-ui`; x.fillText(s.banner, s.W / 2, s.H * .48); x.globalAlpha = 1; }
      if (s.flash > 0) { x.fillStyle = `rgba(240,122,112,${s.flash * .45})`; x.fillRect(0, 0, s.W, s.H); }
    };
    const push = (b: B) => s.bul.push(b);
    const aimed = (speedMul = 1, spread = .6) => { const m = M(), side = Math.floor(Math.random() * 4); let px: number, py: number; if (side === 0) { px = Math.random() * s.W; py = -8; } else if (side === 1) { px = s.W + 8; py = Math.random() * s.H; } else if (side === 2) { px = Math.random() * s.W; py = s.H + 8; } else { px = -8; py = Math.random() * s.H; }
      const ang = Math.atan2(s.pl.y - py, s.pl.x - px) + (Math.random() - .5) * spread, sp = m * (.22 + Math.random() * .18 + Math.min(.3, s.el * .006)) * speedMul; push({ x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: Math.max(3, m * .012), k: "aim" }); };
    const ring = (cx: number, cy: number, n: number, sp: number, k: B["k"] = "ring", a0 = 0) => { for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2; push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.max(3, M() * .011), k }); } sfx.tap(); };
    const laser = () => { const through = Math.random() < .6; const a = through ? Math.atan2(s.pl.y - s.H / 2, s.pl.x - s.W / 2) + (Math.random() - .5) * .4 : Math.random() * Math.PI; s.las.push({ x: through ? s.W / 2 : s.pl.x + (Math.random() - .5) * M() * .3, y: through ? s.H / 2 : s.pl.y + (Math.random() - .5) * M() * .3, a, t: 0 }); sfx.tick(); };
    const homing = () => { const m = M(); push({ x: Math.random() < .5 ? -8 : s.W + 8, y: Math.random() * s.H, vx: 0, vy: 0, r: Math.max(4, m * .014), k: "home", life: 4 }); };
    const powerup = () => { const m = M(); const ks: P["k"][] = ["slow", "shield", "bomb"]; const fromL = Math.random() < .5; s.pw.push({ x: fromL ? -20 : s.W + 20, y: m * .15 + Math.random() * (s.H - m * .3), vx: (fromL ? 1 : -1) * m * .12, vy: 0, k: ks[Math.floor(Math.random() * 3)], t: 0 }); };
    const hit = () => { if (s.inv > 0 || s.dash > 0) return; if (s.shield > 0) { s.shield = 0; s.inv = 1; sfx.hit(); haptic(20); pop(st, s.pl.x, s.pl.y - 24, "방패!", "good"); burst(st, s.pl.x, s.pl.y, "#fff", 12); return; } end(); };
    const end = () => { s.run = false; lock(false); cancelAnimationFrame(s.raf); s.flash = 1; draw(); sfx.boom(); haptic([50, 40, 50]); shake(st, "l"); burst(st, s.pl.x, s.pl.y, "#F07A70", 24); const sec = Math.round(s.el * 100) / 100;
      setRes({ sec, graze: s.graze, phase: PHASES[phaseAt(s.el)][1], dash: s.dashes }); setState("done"); saveScore("dodge", sec).catch(() => {}); };
    const tick = (t: number) => { if (s.paused) return; const raw = Math.min(.05, (t - s.tl) / 1000); s.tl = t; const ts = s.slow > 0 || s.focusOn > 0 ? .4 : 1, dt = raw * ts; s.el += raw; const el = s.el, m = M(), pl = s.pl;
      const ph = phaseAt(el); if (ph !== s.phase) { s.phase = ph; if (ph > 0) { s.banner = PHASES[ph][1]; s.bannerT = 1.6; sfx.level(); haptic(15); pop(st, s.W / 2, s.H * .3, `${PHASES[ph][0]}초 돌파!`, "good big"); } if (ph === 3) { s.bossT = 15; s.bossA = 0; } }
      // 이동
      const sp = m * .55, mx = (s.keys.ArrowRight || s.keys.KeyD ? 1 : 0) - (s.keys.ArrowLeft || s.keys.KeyA ? 1 : 0), my = (s.keys.ArrowDown || s.keys.KeyS ? 1 : 0) - (s.keys.ArrowUp || s.keys.KeyW ? 1 : 0);
      if (mx || my) { const l = Math.hypot(mx, my); s.dashDir = { x: mx / l, y: my / l }; pl.x += mx / l * sp * raw; pl.y += my / l * sp * raw; }
      if (s.dash > 0) { s.dash -= raw; pl.x += s.dashDir.x * m * 1.6 * raw; pl.y += s.dashDir.y * m * 1.6 * raw; }
      pl.x = Math.max(pl.r, Math.min(s.W - pl.r, pl.x)); pl.y = Math.max(pl.r, Math.min(s.H - pl.r, pl.y));
      s.trail.push({ x: pl.x, y: pl.y }); if (s.trail.length > 10) s.trail.shift();
      // 스폰
      if (el > .5) { const rate = ph === 0 ? 2.2 + el * .3 : ph === 1 ? 1.5 : ph === 2 ? 1.2 : ph === 3 ? 1.8 : ph === 4 ? 3 + (el - 45) * .1 : 4.5 + (el - 60) * .08; s.acc += dt * rate; while (s.acc > 1) { aimed(ph >= 4 ? 1.15 : 1); s.acc--; } }
      if (ph === 1 || ph >= 4) { s.ringT -= dt; if (s.ringT <= 0) { s.ringT = ph === 1 ? 2 : 2.6; ring(Math.random() * s.W, Math.random() * s.H, ph >= 4 ? 16 : 12, m * .22); } }
      if (ph === 2 || ph >= 4) { s.lasT -= dt; if (s.lasT <= 0) { s.lasT = ph === 2 ? 1.6 : 3; laser(); } }
      if (ph >= 4) { s.pwT -= 0; if (Math.random() < dt * .5) homing(); }
      if (s.bossT > 0) { s.bossT -= dt; s.bossA += dt * 2.4; if (Math.floor(s.bossA * 6) !== Math.floor((s.bossA - dt * 2.4) * 6)) { for (const k of [0, 1, 2]) { const a = s.bossA + k * Math.PI * 2 / 3; push({ x: s.W / 2, y: m * .12, vx: Math.cos(a) * m * .2, vy: Math.sin(a) * m * .2, r: Math.max(3, m * .011), k: "spin" }); } } if (s.bossT <= 0) { pop(st, s.W / 2, m * .12, "수간호사 퇴근!", "good big"); burst(st, s.W / 2, m * .12, "#FF5C8A", 20); sfx.perfect(); } }
      s.pwT -= dt; if (s.pwT <= 0) { s.pwT = 7 + Math.random() * 4; powerup(); }
      // 레이저 갱신/판정
      for (const l of s.las) { l.t += dt; if (l.t >= .8 && l.t < 1.15) { const dx = pl.x - l.x, dy = pl.y - l.y; const dist = Math.abs(-Math.sin(l.a) * dx + Math.cos(l.a) * dy); if (dist < m * .015 + pl.r * .8) hit(); } } s.las = s.las.filter(l => l.t < 1.2);
      // 총알
      for (const b of s.bul) { if (b.k === "home") { b.life! -= dt; const dx = pl.x - b.x, dy = pl.y - b.y, d = Math.hypot(dx, dy) || 1; b.vx += dx / d * m * .5 * dt; b.vy += dy / d * m * .5 * dt; const v = Math.hypot(b.vx, b.vy), vm = m * .3; if (v > vm) { b.vx *= vm / v; b.vy *= vm / v; } }
        b.x += b.vx * dt; b.y += b.vy * dt; const d = Math.hypot(b.x - pl.x, b.y - pl.y);
        if (d < b.r + pl.r * .75) { hit(); if (!s.run) return; (b as any).dead = true; }
        else if (!b.gz && d < b.r + pl.r * 2.2) { b.gz = true; s.graze++; s.focus += .07; sfx.tick(); if (s.focus >= 1 && s.focusOn <= 0) { s.focus = 1; s.focusOn = 2.2; sfx.perfect(); haptic(12); pop(st, pl.x, pl.y - 30, "집중!", "good big"); } } }
      s.bul = s.bul.filter(b => !(b as any).dead && b.x > -40 && b.x < s.W + 40 && b.y > -40 && b.y < s.H + 40 && (b.life === undefined || b.life > 0));
      // 파워업
      for (const p of s.pw) { p.t += dt; p.x += p.vx * dt; if (Math.hypot(p.x - pl.x, p.y - pl.y) < m * .035 + pl.r) { (p as any).dead = true; sfx.coin(); haptic(10); burst(st, p.x, p.y, "#fff", 10);
        if (p.k === "slow") { s.slow = 3; pop(st, p.x, p.y - 20, "슬로우 3초", "good"); } else if (p.k === "shield") { s.shield = 1; pop(st, p.x, p.y - 20, "방패", "good"); } else { for (const b of s.bul) burst(st, b.x, b.y, COL[b.k], 2); s.bul = []; s.las = []; shake(st, "m"); sfx.boom(); pop(st, p.x, p.y - 20, "전부 삭제!", "good big"); } } }
      s.pw = s.pw.filter(p => !(p as any).dead && p.x > -40 && p.x < s.W + 40);
      if (s.slow > 0) s.slow -= raw; if (s.focusOn > 0) { s.focusOn -= raw; if (s.focusOn <= 0) s.focus = 0; } if (s.inv > 0) s.inv -= raw; if (s.dashCd > 0) s.dashCd -= raw; if (s.flash > 0) s.flash -= raw * 2; if (s.bannerT > 0) s.bannerT -= raw;
      if (Math.floor(el * 8) !== Math.floor((el - raw) * 8)) setSec(el); watch.current(el, () => { setRec(true); sfx.record(); setTimeout(() => setRec(false), 1400); });
      draw(); s.raf = requestAnimationFrame(tick); };
    const dash = () => { if (!s.run || s.paused || s.dashCd > 0) return; s.dash = .18; s.dashCd = 1.6; s.dashes++; sfx.whoosh(); haptic(8); burst(st, s.pl.x, s.pl.y, "#6FBFA9", 8); };
    const lock = (v: boolean) => { try { document.body.style.overflow = v ? "hidden" : ""; document.body.style.touchAction = v ? "none" : ""; (document.body.style as any).overscrollBehavior = v ? "none" : ""; } catch {} };
    (st as any).__start = () => { setRec(false); setRes(null); lock(true); try { st.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {} watch.current = recordWatcher(best); sfx.level(); size(); const m = M(); s.pl = { x: s.W / 2, y: s.H / 2, r: Math.max(6, m * .022) }; s.bul = []; s.las = []; s.pw = []; s.trail = []; s.acc = 0; s.ringT = 2; s.lasT = 1; s.pwT = 5; s.bossT = 0; s.el = 0; s.slow = 0; s.shield = 0; s.dash = 0; s.dashCd = 0; s.inv = 0; s.graze = 0; s.focus = 0; s.focusOn = 0; s.dashes = 0; s.flash = 0; s.phase = -1; s.bannerT = 0; s.tl = performance.now(); s.run = true; s.paused = false; setState("run"); s.raf = requestAnimationFrame(tick); };
    (st as any).__god = () => { s.inv = 1e9; };
    (st as any).__pause = (v: boolean) => { if (!s.run) return; s.paused = v; lock(!v); setState(v ? "pause" : "run"); if (!v) { s.tl = performance.now(); s.raf = requestAnimationFrame(tick); } };
    const ro = new ResizeObserver(size); ro.observe(st);
    const pd = (e: PointerEvent) => { if (!s.run || s.paused || (e.target as HTMLElement).closest("button")) return; s.drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; st.setPointerCapture(e.pointerId); };
    const pm = (e: PointerEvent) => { if (!s.run || !s.drag) return; const dx = (e.clientX - s.drag.x) * 1.3, dy = (e.clientY - s.drag.y) * 1.3; s.pl.x += dx; s.pl.y += dy; s.drag.moved += Math.abs(dx) + Math.abs(dy); if (Math.abs(dx) + Math.abs(dy) > 1) { const l = Math.hypot(dx, dy); s.dashDir = { x: dx / l, y: dy / l }; } s.drag = { ...s.drag, x: e.clientX, y: e.clientY }; };
    const pu = () => { if (s.drag && performance.now() - s.drag.t < 180 && s.drag.moved < 8) dash(); s.drag = null; };
    const kd = (e: KeyboardEvent) => { if (!s.run) return; if (e.key.startsWith("Arrow") || ["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) { s.keys[e.key] = true; s.keys[e.code] = true; e.preventDefault(); } if (e.code === "Space") { e.preventDefault(); dash(); } if (e.code === "Escape") (st as any).__pause(!s.paused); };
    const ku = (e: KeyboardEvent) => { s.keys[e.key] = false; s.keys[e.code] = false; };
    const vis = () => { if (document.hidden) (st as any).__pause(true); };
    const tm = (e: TouchEvent) => { if (s.run) e.preventDefault(); }; st.addEventListener("touchmove", tm, { passive: false });
    st.addEventListener("pointerdown", pd); st.addEventListener("pointermove", pm); st.addEventListener("pointerup", pu); st.addEventListener("pointercancel", pu);
    addEventListener("keydown", kd); addEventListener("keyup", ku); document.addEventListener("visibilitychange", vis);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); lock(false); st.removeEventListener("touchmove", tm); st.removeEventListener("pointerdown", pd); st.removeEventListener("pointermove", pm); st.removeEventListener("pointerup", pu); st.removeEventListener("pointercancel", pu); removeEventListener("keydown", kd); removeEventListener("keyup", ku); document.removeEventListener("visibilitychange", vis); };
  }, []);

  return (
    <div className="card dodge2">
      <div><h3>총알 피하기</h3><div className="muted">손가락으로 끌어서(또는 방향키/WASD) 피하고, <b>가볍게 톡 치면 대시</b>(무적 0.2초, 쿨 1.6초). 총알을 아슬아슬하게 스치면 집중 게이지가 차고 가득 차면 슬로우 발동. 10초마다 페이즈가 바뀌고 30초엔 보스 등장. ⏱ 슬로우 · 🛡 방패 · 💣 전체 삭제 파워업을 주워요.</div></div>
      <div className="bar" style={{ paddingBottom: 6 }}><span className="muted" style={{ fontSize: 12 }}>{state === "run" || state === "pause" ? `PHASE ${phaseAt(sec) + 1} · ${PHASES[phaseAt(sec)][1]}` : "10 · 20 · 30초 달성 시 XP"}</span><BestLine best={Number(best.toFixed ? best.toFixed(2) : best)} cur={Number(sec.toFixed(2))} unit="초" /></div>
      <div className="stage" ref={stage}>
        <canvas ref={cv} />
        {(state === "run" || state === "pause") && <button type="button" className="run-pause" aria-label="일시정지" onClick={e => { e.stopPropagation(); (stage.current as any).__pause(state === "run"); }}>{state === "run" ? "❚❚" : "▶"}</button>}
        {state === "pause" && <button className="overlay" type="button" onClick={() => (stage.current as any).__pause(false)}><span className="big">일시정지</span><span>터치해서 계속</span></button>}
        {(state === "idle" || state === "done") && <div className="overlay run-ov" onPointerDown={e => e.stopPropagation()}>
          {res ? <><span className="big">{res.sec.toFixed(2)}초</span><span className="run-sub">{res.phase} 페이즈에서 피격 · 그레이즈 {res.graze} · 대시 {res.dash}회</span><span className="run-sub">{res.sec >= 45 ? "혼돈을 뚫은 생존자 🏆" : res.sec >= 30 ? "수간호사와 맞섰어요!" : res.sec >= 20 ? "레이저까지 버텼어요" : res.sec >= 10 ? "링 폭발 돌파" : "다시 한 번!"}</span></>
            : <><span className="big">총알 피하기</span><span className="run-sub">끌어서 이동 · 톡 치면 대시 · 스치면 집중 게이지</span><div className="run-ms"><span>⏱ 슬로우 3초 · 🛡 방패 1회 · 💣 전체 삭제</span><span>10초 링 폭발 → 20초 레이저 → 30초 보스 → 45초 혼돈</span></div></>}
          <div className="run-btns"><button type="button" className="btn" onClick={() => (stage.current as any).__start()}>{res ? "다시 하기" : "시작"}</button></div>
        </div>}
        <span className="hud">{sec.toFixed(2)}초</span>{rec && <RecordFlash />}
      </div>
      <Board title="명예의 전당" rows={ranks} fmt={r => r.value.toFixed(2) + "초"} />
    </div>
  );
}
