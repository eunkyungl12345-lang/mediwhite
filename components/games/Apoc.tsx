"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import { HERO_SVG, art, artSrc } from "./defArt";
import { sfx, haptic, pop, shake, burst } from "@/lib/juice";
import Board, { type Row } from "./Board";

/** 병원묵시록 DAY 0 — 병원을 지키는 생존 타워디펜스. 낮엔 배치·수색, 밤엔 좀비 웨이브 */
const COLS = 11, ROWS = 7, HC = 5, HR = 3; // 병원 위치(가운데)
type UKind = "nurse" | "doctor" | "ortho" | "ems" | "anes" | "lab" | "wall";
const UNITS: Record<UKind, { name: string; icon: string; cost: number; hp: number; range: number; dmg: number; cd: number; desc: string; color: string }> = {
  nurse: { name: "간호사", icon: "💉", cost: 50, hp: 120, range: 3, dmg: 14, cd: .7, desc: "주사기 연사 · 싸고 무난", color: "#F48FB1" },
  wall: { name: "바리케이드", icon: "🧱", cost: 30, hp: 420, range: 0, dmg: 0, cd: 0, desc: "병상·휠체어로 길막", color: "#8C6A3D" },
  doctor: { name: "의사", icon: "🩺", cost: 90, hp: 140, range: 4.5, dmg: 42, cd: 1.4, desc: "멀리서 한 방이 큰 저격", color: "#5FA8E8" },
  ortho: { name: "정형외과", icon: "🔨", cost: 80, hp: 280, range: 1.3, dmg: 48, cd: 1.1, desc: "망치로 주변 좀비 광역 타격", color: "#2E7D6B" },
  ems: { name: "응급구조사", icon: "⚡", cost: 120, hp: 150, range: 3.5, dmg: 30, cd: 1.6, desc: "제세동 번개가 3마리 연쇄", color: "#F2A900" },
  anes: { name: "마취과", icon: "💨", cost: 100, hp: 150, range: 2, dmg: 6, cd: 0, desc: "마취 가스: 주변 좀비 50% 느리게", color: "#8C7AC9" },
  lab: { name: "수간호사", icon: "🩹", cost: 110, hp: 130, range: 1.8, dmg: 0, cd: 0, desc: "주변 의료진·병원 치료 (초당 12)", color: "#7ED69B" },
};
const ORDER = Object.keys(UNITS) as UKind[];
const ART: Record<UKind, string> = { nurse: "nurse", wall: "wall", doctor: "doctor", ortho: "ortho", ems: "ems", anes: "anes", lab: "lab" };
const ZT = [
  { name: "좀비", hp: 60, spd: .45, dps: 10, rew: 3, size: .58, body: "#7E9C7A", cloth: "#C9D6E3" },
  { name: "러너", hp: 40, spd: .95, dps: 8, rew: 4, size: .52, body: "#8FA88A", cloth: "#E8A0A0" },
  { name: "뚱보", hp: 280, spd: .3, dps: 30, rew: 12, size: .78, body: "#6C8A63", cloth: "#B8C9A0" },
  { name: "비명꾼", hp: 80, spd: .5, dps: 10, rew: 8, size: .58, body: "#9A8FB0", cloth: "#F2F2F2" },
  { name: "보스", hp: 1600, spd: .24, dps: 60, rew: 80, size: 1.05, body: "#5A6E4E", cloth: "#7A2E2E" },
];
const lvM = (lv: number) => Math.pow(1.35, lv - 1);
const upCost = (k: UKind, lv: number) => Math.round(UNITS[k].cost * (lv === 1 ? .8 : 1.4));
type U = { k: UKind; c: number; r: number; hp: number; max: number; lv: number; cd: number; atk: number; face: number };
type Z = { t: number; x: number; y: number; hp: number; max: number; spd: number; dps: number; slow: number; hit: number; seed: number; eating: boolean; face: number };
type Fx = { kind: "line" | "ring" | "bolt" | "txt" | "die"; x: number; y: number; x2?: number; y2?: number; t: number; c?: string; pts?: [number, number][]; txt?: string; zt?: number; s?: number };

export default function Apoc({ ranks, best }: { ranks: Row[]; best: number }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [ui, setUi] = useState({ sup: 200, day: 1, phase: "day" as "day" | "night" | "over", hp: 1000, left: 0 });
  const [sel, setSel] = useState<UKind>("nurse"), [pick, setPick] = useState<U | null>(null), [msg, setMsg] = useState(""), [myBest, setMyBest] = useState(best), [started, setStarted] = useState(false);
  const g = useRef({ W: 0, H: 0, CS: 0, units: [] as U[], zs: [] as Z[], fx: [] as Fx[], sup: 200, day: 1, phase: "day" as "day" | "night" | "over", hp: 1000, maxHp: 1000, toSpawn: 0, spawnT: 0, t: 0, last: 0, raf: 0, bg: null as HTMLCanvasElement | null, dark: null as HTMLCanvasElement | null, nightT: 0 });

  const sync = () => { const s = g.current; setUi({ sup: s.sup, day: s.day, phase: s.phase, hp: Math.max(0, Math.round(s.hp)), left: s.toSpawn + s.zs.length }); };
  const size = () => {
    const s = g.current, c = cv.current, b = box.current; if (!c || !b) return; const w = b.getBoundingClientRect().width; if (!w) return;
    const d = Math.min(2, devicePixelRatio || 1); s.W = w; s.CS = w / COLS; s.H = s.CS * ROWS; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; c.getContext("2d")!.setTransform(d, 0, 0, d, 0, 0);
    s.bg = buildBg(s.W, s.H, s.CS); s.dark = document.createElement("canvas"); s.dark.width = s.W; s.dark.height = s.H;
  };
  const hx = () => (HC + .5) * g.current.CS, hy = () => (HR + .5) * g.current.CS;
  const spawnZ = () => {
    const s = g.current, d = s.day, CS = s.CS; const sides = d === 1 ? [0] : d === 2 ? [0, 1] : d <= 4 ? [0, 1, 2] : [0, 1, 2, 3];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const x = side === 0 ? s.W + CS * .5 : side === 1 ? -CS * .5 : Math.random() * s.W, y = side === 2 ? -CS * .5 : side === 3 ? s.H + CS * .5 : Math.random() * s.H;
    const r = Math.random(); let t = 0;
    if (d >= 2 && r < .25) t = 1; if (d >= 3 && r > .85) t = 2; if (d >= 4 && r > .75 && r <= .85) t = 3;
    if (s.toSpawn === 1 && d % 5 === 0) t = 4;
    const T = ZT[t], m = 1 + (d - 1) * .2;
    s.zs.push({ t, x, y, hp: T.hp * m, max: T.hp * m, spd: T.spd * CS * (1 + Math.random() * .15), dps: T.dps * (1 + (d - 1) * .08), slow: 0, hit: 0, seed: Math.random() * 10, eating: false, face: x > hx() ? -1 : 1 });
    if (t === 4) { pop(box.current, s.W / 2, s.H * .3, "☠️ 보스 좀비 출현!", "bad big"); shake(box.current, "m"); sfx.boom(); }
  };
  const startNight = () => {
    const s = g.current; if (s.phase !== "day") return; setPick(null);
    s.phase = "night"; s.toSpawn = 8 + s.day * 5 + (s.day % 5 === 0 ? 1 : 0); s.spawnT = 1.5; s.nightT = 0; sfx.level(); haptic([30, 40, 30]);
    pop(box.current, s.W / 2, s.H / 2, `🌙 DAY ${s.day} 밤 — 좀비 ${s.toSpawn}마리가 몰려와요!`, "bad big"); sync();
  };
  const endNight = () => {
    const s = g.current; const rew = 60 + s.day * 20; s.sup += rew; s.day++; s.phase = "day";
    for (const u of s.units) u.hp = Math.min(u.max, u.hp + u.max * .3);
    s.hp = Math.min(s.maxHp, s.hp + 100);
    pop(box.current, s.W / 2, s.H / 2, `☀️ 살아남았다! DAY ${s.day} · 보급품 +${rew}`, "good big"); sfx.record(); burst(box.current, s.W / 2, s.H / 2, "#FFD36E", 30); sync();
    if (s.day - 1 > myBest) { setMyBest(s.day - 1); }
    saveScore("apoc", s.day - 1).catch(() => {});
  };
  const gameOver = () => {
    const s = g.current; s.phase = "over"; sync(); sfx.boom(); haptic([60, 40, 80]); shake(box.current, "l");
    const days = s.day - 1; if (days > myBest) setMyBest(days); if (days > 0) saveScore("apoc", days).catch(() => {});
  };
  const newGame = () => {
    const s = g.current; Object.assign(s, { units: [], zs: [], fx: [], sup: 200, day: 1, phase: "day", hp: 1000, maxHp: 1000, toSpawn: 0, t: 0 }); setPick(null); setStarted(true); setMsg(""); sync();
    setTimeout(() => { size(); s.last = performance.now(); cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); }, 30);
  };
  const scout = () => {
    const s = g.current; if (s.phase !== "day" || s.sup < 30) return; s.sup -= 30;
    const r = Math.random();
    if (r < .2 && s.units.length) { const i = Math.floor(Math.random() * s.units.length), u = s.units[i]; s.units.splice(i, 1); setMsg(`🔦 수색 실패… ${UNITS[u.k].name}가 돌아오지 못했어요`); sfx.boom(); }
    else { const got = 40 + Math.floor(Math.random() * (60 + s.day * 15)); s.sup += got; setMsg(`🔦 수색 성공! 보급품 +${got}`); sfx.coin(); }
    sync();
  };

  // 메인 루프
  const tick = (now: number) => {
    const s = g.current; const dt = Math.min(.05, (now - s.last) / 1000); s.last = now; s.t += dt;
    if (s.phase === "night") step(dt);
    s.fx = s.fx.filter(f => (f.t -= dt * (f.kind === "die" ? .9 : 2.2)) > 0);
    draw(); if (Math.floor(s.t * 4) !== Math.floor((s.t - dt) * 4)) sync();
    s.raf = requestAnimationFrame(tick);
  };
  const step = (dt: number) => {
    const s = g.current, CS = s.CS, HX = hx(), HY = hy(); s.nightT += dt;
    if (s.toSpawn > 0) { s.spawnT -= dt; if (s.spawnT <= 0) { spawnZ(); s.toSpawn--; s.spawnT = Math.max(.35, 2.2 - s.day * .12) * (.6 + Math.random() * .8); } }
    // 비명꾼 버프
    const scream = s.zs.filter(z => z.t === 3);
    for (const z of s.zs) {
      z.hit = Math.max(0, z.hit - dt * 4); z.slow = Math.max(0, z.slow - dt);
      const boost = scream.some(q => q !== z && Math.hypot(q.x - z.x, q.y - z.y) < CS * 2) ? 1.3 : 1;
      const sp = z.spd * (z.slow > 0 ? .5 : 1) * boost * (z.t === 1 ? .7 + Math.abs(Math.sin(s.t * 5 + z.seed)) * .6 : z.t === 2 ? .7 + Math.abs(Math.sin(s.t * 2 + z.seed)) * .5 : .8 + Math.abs(Math.sin(s.t * 3 + z.seed)) * .4);
      const R = ZT[z.t].size * CS * .6;
      const blk = s.units.find(u => Math.hypot((u.c + .5) * CS - z.x, (u.r + .5) * CS - z.y) < CS * .45 + R * .5);
      const dH = Math.hypot(HX - z.x, HY - z.y);
      if (blk) { z.eating = true; blk.hp -= z.dps * dt; }
      else if (dH < CS * .8 + R * .4) { z.eating = true; s.hp -= z.dps * dt; if (Math.random() < dt * 2) shake(box.current, "s"); }
      else { z.eating = false; const ang = Math.atan2(HY - z.y, HX - z.x) + Math.sin(s.t * 1.3 + z.seed) * .25; z.x += Math.cos(ang) * sp * dt; z.y += Math.sin(ang) * sp * dt; z.face = Math.cos(ang) >= 0 ? 1 : -1; }
    }
    // 의료진 공격·치료
    for (const u of s.units) {
      const U = UNITS[u.k], m = lvM(u.lv), ux = (u.c + .5) * CS, uy = (u.r + .5) * CS; u.atk = Math.max(0, u.atk - dt * 3);
      if (u.k === "wall") continue;
      if (u.k === "lab") { const heal = 12 * m * dt; for (const v of s.units) if (v !== u && Math.hypot(v.c - u.c, v.r - u.r) <= U.range && v.hp < v.max) v.hp = Math.min(v.max, v.hp + heal); if (Math.hypot(u.c - HC, u.r - HR) <= U.range + .5) s.hp = Math.min(s.maxHp, s.hp + heal); continue; }
      const inR = s.zs.filter(z => Math.hypot(z.x - ux, z.y - uy) <= U.range * CS + ZT[z.t].size * CS * .3);
      if (u.k === "anes") { for (const z of inR) { z.slow = .3; z.hp -= U.dmg * m * dt; } if (inR.length && Math.random() < dt * 3) s.fx.push({ kind: "ring", x: ux, y: uy, t: 1, c: "#C9A2FF", s: U.range * CS }); continue; }
      u.cd -= dt; if (u.cd > 0 || !inR.length) continue;
      const tgt = inR.sort((a, b) => Math.hypot(a.x - HX, a.y - HY) - Math.hypot(b.x - HX, b.y - HY))[0];
      u.cd = U.cd; u.atk = 1; u.face = tgt.x >= ux ? 1 : -1;
      if (u.k === "ortho") { for (const z of inR) { z.hp -= U.dmg * m; z.hit = 1; } s.fx.push({ kind: "ring", x: ux, y: uy, t: 1, c: "#FFD36E", s: U.range * CS }); sfx.boom(); }
      else if (u.k === "ems") { const chain: Z[] = [tgt]; while (chain.length < 3) { const last = chain[chain.length - 1]; const nx = s.zs.filter(z => !chain.includes(z)).sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y))[0]; if (!nx || Math.hypot(nx.x - last.x, nx.y - last.y) > CS * 2) break; chain.push(nx); } for (const z of chain) { z.hp -= U.dmg * m; z.hit = 1; } s.fx.push({ kind: "bolt", x: ux, y: uy, t: 1, pts: [[ux, uy], ...chain.map(z => [z.x, z.y] as [number, number])] }); }
      else { tgt.hp -= U.dmg * m; tgt.hit = 1; s.fx.push({ kind: "line", x: ux + u.face * CS * .25, y: uy - CS * .1, x2: tgt.x, y2: tgt.y - ZT[tgt.t].size * CS * .3, t: 1, c: u.k === "doctor" ? "#FFE08A" : "#7FE3FF" }); if (u.k === "doctor") sfx.tap(); }
    }
    // 죽음 처리
    for (const z of s.zs) if (z.hp <= 0) { s.sup += ZT[z.t].rew; s.fx.push({ kind: "die", x: z.x, y: z.y, t: 1, zt: z.t }); s.fx.push({ kind: "txt", x: z.x, y: z.y - CS * .4, t: 1, txt: `+${ZT[z.t].rew}` }); if (z.t === 4) { burst(box.current, z.x, z.y, "#FF6B6B", 30); sfx.record(); } }
    s.zs = s.zs.filter(z => z.hp > 0);
    for (const u of s.units) if (u.hp <= 0) { s.fx.push({ kind: "txt", x: (u.c + .5) * CS, y: (u.r + .2) * CS, t: 1, txt: `${UNITS[u.k].name} 쓰러짐…` }); haptic(30); }
    s.units = s.units.filter(u => u.hp > 0);
    if (s.hp <= 0) return gameOver();
    if (s.toSpawn <= 0 && !s.zs.length) endNight();
  };

  const draw = () => {
    const s = g.current, c = cv.current; if (!c || !s.bg || s.W < 2) return; const x = c.getContext("2d")!, CS = s.CS, HX = hx(), HY = hy();
    x.drawImage(s.bg, 0, 0, s.W, s.H);
    // 병원 건물
    drawHospital(x, HX, HY, CS, s.hp / s.maxHp, s.phase === "night", s.t);
    // 배치 가능 칸 (낮)
    if (s.phase === "day") { x.save(); x.strokeStyle = "rgba(255,255,255,.25)"; x.setLineDash([3, 4]); for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { if (Math.abs(cc - HC) <= 0 && Math.abs(r - HR) <= 0) continue; if (s.units.some(u => u.c === cc && u.r === r)) continue; x.strokeRect(cc * CS + 3, r * CS + 3, CS - 6, CS - 6); } x.restore(); }
    // 그리기 순서: y 기준
    const items: { y: number; f: () => void }[] = [];
    for (const u of s.units) items.push({ y: (u.r + 1) * CS, f: () => drawUnit(x, u, CS, s.t, pick === u) });
    for (const z of s.zs) items.push({ y: z.y + ZT[z.t].size * CS * .5, f: () => drawZombie(x, z, CS, s.t, s.phase === "night") });
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    for (const f of s.fx) {
      x.save(); x.globalAlpha = Math.min(1, f.t);
      if (f.kind === "line") { x.strokeStyle = f.c!; x.lineWidth = 2.5; x.shadowColor = f.c!; x.shadowBlur = 8; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x2!, f.y2!); x.stroke(); }
      if (f.kind === "ring") { x.strokeStyle = f.c!; x.lineWidth = 3; x.beginPath(); x.arc(f.x, f.y, (f.s ?? CS) * (1.1 - f.t * .4), 0, 7); x.stroke(); }
      if (f.kind === "bolt") { x.strokeStyle = "#FFF27A"; x.shadowColor = "#FFF27A"; x.shadowBlur = 12; x.lineWidth = 2.5; x.beginPath(); const P = f.pts!; x.moveTo(P[0][0], P[0][1]); for (let k = 1; k < P.length; k++) { const [ax, ay] = P[k - 1], [bx, by] = P[k]; for (let q = 1; q <= 4; q++) x.lineTo(ax + (bx - ax) * q / 4 + (q < 4 ? (Math.random() - .5) * 12 : 0), ay + (by - ay) * q / 4 + (q < 4 ? (Math.random() - .5) * 12 : 0)); } x.stroke(); }
      if (f.kind === "txt") { x.font = `800 ${Math.floor(CS * .24)}px system-ui`; x.textAlign = "center"; x.lineWidth = 3; x.strokeStyle = "#000"; x.fillStyle = f.txt!.startsWith("+") ? "#FFD36E" : "#FF8A8A"; const yy = f.y - (1 - f.t) * 20; x.strokeText(f.txt!, f.x, yy); x.fillText(f.txt!, f.x, yy); }
      if (f.kind === "die") { x.translate(f.x, f.y); x.rotate((1 - f.t) * 1.4); x.globalAlpha = f.t * .8; drawZombieBody(x, ZT[f.zt!], CS, 0, 1, false); }
      x.restore();
    }
    // 밤: 어둠 + 손전등
    if (s.phase === "night" && s.dark) {
      const d = s.dark.getContext("2d")!; d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, s.W, s.H); d.fillStyle = `rgba(4,8,22,${Math.min(.6, s.nightT * .5)})`; d.fillRect(0, 0, s.W, s.H);
      d.globalCompositeOperation = "destination-out";
      const hole = (cx: number, cy: number, r: number) => { const gg = d.createRadialGradient(cx, cy, 0, cx, cy, r); gg.addColorStop(0, "rgba(0,0,0,1)"); gg.addColorStop(.6, "rgba(0,0,0,.7)"); gg.addColorStop(1, "rgba(0,0,0,0)"); d.fillStyle = gg; d.beginPath(); d.arc(cx, cy, r, 0, 7); d.fill(); };
      hole(HX, HY, CS * 2.2 * (.95 + Math.sin(s.t * 9) * .02));
      for (const u of s.units) if (u.k !== "wall") hole((u.c + .5) * CS, (u.r + .5) * CS, CS * 1.4);
      for (const f of s.fx) if (f.kind === "bolt" || f.kind === "ring") hole(f.x, f.y, CS * 1.6 * f.t);
      x.drawImage(s.dark, 0, 0, s.W, s.H);
      // 어둠 속 빨간 눈
      for (const z of s.zs) { const R = ZT[z.t].size * CS; x.fillStyle = "#FF2A1A"; x.shadowColor = "#FF2A1A"; x.shadowBlur = 6; x.beginPath(); x.arc(z.x + z.face * R * .12, z.y - R * .62, Math.max(1.2, R * .05), 0, 7); x.fill(); x.shadowBlur = 0; }
    }
  };

  useEffect(() => { const on = () => { size(); }; addEventListener("resize", on); return () => { removeEventListener("resize", on); cancelAnimationFrame(g.current.raf); }; }, []);
  const tap = (e: React.PointerEvent) => {
    const s = g.current; if (s.phase === "over") return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), cc = Math.floor((e.clientX - r.left) / s.CS), rr = Math.floor((e.clientY - r.top) / s.CS);
    if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS || (cc === HC && rr === HR)) return;
    const ex = s.units.find(u => u.c === cc && u.r === rr); if (ex) { setPick(ex); return; }
    setPick(null); const U = UNITS[sel];
    if (s.sup < U.cost) { pop(box.current, e.clientX - r.left, e.clientY - r.top, `보급품 ${U.cost - s.sup} 부족`, "bad"); haptic(20); return; }
    s.sup -= U.cost; s.units.push({ k: sel, c: cc, r: rr, hp: U.hp, max: U.hp, lv: 1, cd: 0, atk: 0, face: cc < HC ? -1 : 1 }); sfx.tap(); haptic(8); burst(box.current, (cc + .5) * s.CS, (rr + .5) * s.CS, U.color, 8); sync();
  };
  const upgrade = () => { const s = g.current, u = pick; if (!u || u.lv >= 3) return; const c = upCost(u.k, u.lv); if (s.sup < c) { setMsg(`보급품 ${c - s.sup} 부족`); return; } s.sup -= c; const m0 = lvM(u.lv); u.lv++; const m1 = lvM(u.lv); u.max = Math.round(UNITS[u.k].hp * m1); u.hp = Math.min(u.max, u.hp * m1 / m0 + 30); sfx.level(); setPick({ ...u }); setPick(u); sync(); };
  const sell = () => { const s = g.current, u = pick; if (!u) return; s.units = s.units.filter(v => v !== u); s.sup += Math.floor(UNITS[u.k].cost * .5 * u.lv); setPick(null); sync(); };
  const repair = () => { const s = g.current; if (s.sup < 50 || s.hp >= s.maxHp) return; s.sup -= 50; s.hp = Math.min(s.maxHp, s.hp + 250); sfx.coin(); sync(); };

  const P = pick ? UNITS[pick.k] : null;
  return (
    <div className="card ap">
      <div className="wd-top"><b>🧟 병원묵시록 DAY 0</b><span className="muted">낮엔 의료진·바리케이드를 배치하고, 밤엔 몰려오는 좀비로부터 병원을 지켜요. 며칠 버틸 수 있을까?</span></div>
      {!started ? <div className="ap-start">
        <div className="ap-title">병원묵시록<small>DAY 0</small></div>
        <div className="muted" style={{ fontSize: 13 }}>정체불명의 감염이 퍼진 첫날 밤. 병원 문을 걸어 잠그고 살아남으세요.<br />5일마다 보스 좀비 · 비명꾼은 주변 좀비를 빠르게 만들어요.</div>
        <button type="button" className="btn" onClick={newGame}>🔦 생존 시작</button>
        {myBest > 0 && <div className="muted">내 최고 기록: {myBest}일 생존</div>}
      </div> : <>
        <div className="ap-bar">
          <span className={"ap-day " + ui.phase}>{ui.phase === "night" ? "🌙" : ui.phase === "over" ? "💀" : "☀️"} DAY {ui.day}</span>
          <span>📦 {ui.sup}</span>
          <span className="ap-hp"><i style={{ width: `${ui.hp / 10}%` }} />🏥 {ui.hp}</span>
          {ui.phase === "night" && <span className="muted">남은 좀비 {ui.left}</span>}
        </div>
        <div ref={box} className="ap-stage" onPointerDown={tap}><canvas ref={cv} style={{ width: "100%", display: "block", touchAction: "none" }} />
          {ui.phase === "over" && <div className="ap-over"><div className="big">병원이 함락됐어요</div><div>{ui.day - 1}일 생존{ui.day - 1 >= myBest && ui.day > 1 ? " · 🏆 최고 기록!" : ""}</div><button type="button" className="btn" onClick={newGame}>다시 생존 시작</button></div>}
        </div>
        {pick && P ? <div className="ap-pick">
          <span className="def-ico art" style={{ background: P.color }}><img src={artSrc(ART[pick.k], HERO_SVG[ART[pick.k]])} alt="" /></span>
          <div style={{ flex: 1, minWidth: 0 }}><b>{P.name} Lv{pick.lv}</b><div className="muted" style={{ fontSize: 12 }}>체력 {Math.round(pick.hp)}/{pick.max} · {P.desc}</div></div>
          {pick.lv < 3 && <button type="button" className="btn" onClick={upgrade}>강화<br /><small>📦{upCost(pick.k, pick.lv)}</small></button>}
          <button type="button" className="btn ghost" onClick={sell}>철수<br /><small>+{Math.floor(P.cost * .5 * pick.lv)}</small></button>
          <button type="button" className="btn ghost" onClick={() => setPick(null)}>✕</button>
        </div> : <div className="ap-shop">{ORDER.map(k => <button key={k} type="button" className={"def-unit" + (sel === k ? " sel" : "") + (ui.sup < UNITS[k].cost ? " poor" : "")} onClick={() => setSel(k)} title={UNITS[k].desc}>
          <span className="def-ico art" style={{ background: UNITS[k].color }}><img src={artSrc(ART[k], HERO_SVG[ART[k]])} alt="" draggable={false} /></span><span className="def-name">{UNITS[k].name}</span><span className="def-cost">{UNITS[k].cost}</span></button>)}</div>}
        {ui.phase === "day" && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={startNight}>🌙 밤 시작 (DAY {ui.day})</button>
          <button type="button" className={"btn" + (ui.sup < 30 ? " ghost" : "")} onClick={scout}>🔦 수색대 (📦30)</button>
          <button type="button" className={"btn" + (ui.sup < 50 || ui.hp >= 1000 ? " ghost" : "")} onClick={repair}>🔧 병원 수리 (📦50)</button>
        </div>}
        <div className="muted" style={{ fontSize: 12 }}>{msg || `${UNITS[sel].icon} ${UNITS[sel].name}: ${UNITS[sel].desc} · 빈 칸을 탭해서 배치 (밤에도 가능) · 배치한 의료진을 탭하면 강화·철수`}</div>
      </>}
      <Board title="병원묵시록 명예의 전당 (생존 일수)" rows={ranks} fmt={r => `${r.value}일 생존`} />
    </div>
  );
}

/* ---------- 그림 ---------- */
function buildBg(W: number, H: number, CS: number) {
  const d = Math.min(2, devicePixelRatio || 1), cv = document.createElement("canvas"); cv.width = W * d; cv.height = H * d; const x = cv.getContext("2d")!; x.scale(d, d);
  const rnd = (i: number) => { const v = Math.sin(i * 91.7) * 43758.5; return v - Math.floor(v); };
  x.fillStyle = "#5E6B5A"; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${rnd(i) > .5 ? "90,120,70" : "70,90,60"},.5)`; x.fillRect(rnd(i * 3) * W, rnd(i * 7) * H, 2, 3); }
  // 병원 앞 주차장 (가운데 가로·세로 도로)
  x.fillStyle = "#4A4F57"; x.fillRect(CS * 1.5, CS * 2, W - CS * 3, CS * 3); x.fillRect(CS * 4, CS * .5, CS * 3, H - CS);
  x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 2; x.setLineDash([CS * .3, CS * .25]); x.beginPath(); x.moveTo(CS * 1.5, CS * 3.5); x.lineTo(W - CS * 1.5, CS * 3.5); x.moveTo(CS * 5.5, CS * .5); x.lineTo(CS * 5.5, H - CS * .5); x.stroke(); x.setLineDash([]);
  for (let k = 0; k < 6; k++) { x.strokeStyle = "rgba(255,255,255,.25)"; x.beginPath(); x.moveTo(CS * (2 + k * .5), CS * 2); x.lineTo(CS * (2 + k * .5), CS * 2.6); x.stroke(); x.beginPath(); x.moveTo(W - CS * (2 + k * .5), CS * 4.4); x.lineTo(W - CS * (2 + k * .5), CS * 5); x.stroke(); }
  // 버려진 차·구급차·핏자국·잔해
  const car = (cx: number, cy: number, col: string, amb = false) => { x.save(); x.translate(cx, cy); x.rotate(rnd(cx) - .5); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(-CS * .42, -CS * .2, CS * .9, CS * .48); x.fillStyle = col; x.fillRect(-CS * .45, -CS * .25, CS * .9, CS * .45); x.fillStyle = "#2B3245"; x.fillRect(-CS * .2, -CS * .2, CS * .35, CS * .35); if (amb) { x.fillStyle = "#E2574C"; x.fillRect(CS * .2, -CS * .05, CS * .16, CS * .05); x.fillRect(CS * .255, -CS * .11, CS * .05, CS * .17); } x.restore(); };
  car(CS * 2.2, CS * 1.2, "#B8C2CC"); car(W - CS * 2, CS * 5.9, "#8E3B3B"); car(CS * 8.6, CS * 1.1, "#FFFFFF", true); car(CS * 1.6, CS * 6, "#C9A227");
  for (let i = 0; i < 9; i++) { const px = rnd(i * 11 + 1) * W, py = rnd(i * 13 + 2) * H; x.fillStyle = "rgba(120,10,10,.45)"; x.beginPath(); x.ellipse(px, py, CS * (.08 + rnd(i) * .12), CS * .05, rnd(i * 5), 0, 7); x.fill(); }
  for (let i = 0; i < 7; i++) { x.fillStyle = "#7A6E5E"; x.beginPath(); const px = rnd(i * 17 + 4) * W, py = rnd(i * 19 + 5) * H; x.moveTo(px, py); x.lineTo(px + 6, py - 4); x.lineTo(px + 10, py + 3); x.closePath(); x.fill(); }
  // 철조망 울타리 테두리
  x.strokeStyle = "rgba(200,200,200,.35)"; x.lineWidth = 1; x.setLineDash([2, 3]); x.strokeRect(CS * .15, CS * .15, W - CS * .3, H - CS * .3); x.setLineDash([]);
  const vg = x.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.35)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  return cv;
}
function drawHospital(x: CanvasRenderingContext2D, cx: number, cy: number, CS: number, hp: number, night: boolean, t: number) {
  x.save(); x.translate(cx, cy);
  x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(-CS * .62, -CS * .45, CS * 1.3, CS * 1);
  x.fillStyle = "#E9EEF4"; x.fillRect(-CS * .65, -CS * .55, CS * 1.3, CS * 1); x.fillStyle = "#C9D3DE"; x.fillRect(-CS * .65, CS * .3, CS * 1.3, CS * .15);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { x.fillStyle = night ? (Math.sin(t * 2 + i + j * 3) > -.5 ? "#FFE9A0" : "#3B4250") : "#9FD3F5"; x.fillRect(-CS * .55 + i * CS * .3, -CS * .45 + j * CS * .32, CS * .18, CS * .2); }
  x.fillStyle = "#E2574C"; x.fillRect(-CS * .07, -CS * .78, CS * .14, CS * .3); x.fillRect(-CS * .17, -CS * .68, CS * .34, CS * .1);
  x.fillStyle = "#5A4632"; x.fillRect(-CS * .12, CS * .1, CS * .24, CS * .35);
  if (hp < .6) { x.fillStyle = "rgba(40,30,20,.6)"; x.beginPath(); x.moveTo(-CS * .6, -CS * .2); x.lineTo(-CS * .3, CS * .1); x.lineTo(-CS * .5, CS * .3); x.fill(); }
  if (hp < .35) { for (let k = 0; k < 3; k++) { x.fillStyle = `rgba(255,${120 + k * 40},40,${.5 + Math.sin(t * 10 + k) * .2})`; x.beginPath(); x.ellipse(CS * (.3 - k * .2), -CS * .55 - Math.abs(Math.sin(t * 6 + k)) * CS * .1, CS * .07, CS * .15, 0, 0, 7); x.fill(); } }
  x.restore();
  x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(cx - CS * .6, cy + CS * .55, CS * 1.2, 5); x.fillStyle = hp > .5 ? "#3FA34D" : hp > .25 ? "#E6B341" : "#E2574C"; x.fillRect(cx - CS * .6, cy + CS * .55, CS * 1.2 * Math.max(0, hp), 5);
}
function drawUnit(x: CanvasRenderingContext2D, u: U, CS: number, t: number, picked: boolean) {
  const cx = (u.c + .5) * CS, cy = (u.r + .5) * CS, S = CS * 1.15, im = art(ART[u.k], HERO_SVG[ART[u.k]]);
  if (picked) { x.strokeStyle = "#FFD36E"; x.lineWidth = 3; x.strokeRect(u.c * CS + 2, u.r * CS + 2, CS - 4, CS - 4); }
  x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(cx, cy + CS * .35, CS * .3, CS * .08, 0, 0, 7); x.fill();
  if (im) { x.save(); x.translate(cx - u.atk * u.face * 3, cy + Math.sin(t * 3 + u.c + u.r) * 1.2); if (u.face < 0 && u.k !== "wall") x.scale(-1, 1); x.drawImage(im, -S / 2, -S * .62, S, S); x.restore(); }
  if (u.lv > 1) { x.font = `800 ${Math.floor(CS * .2)}px system-ui`; x.fillStyle = "#FFD36E"; x.strokeStyle = "#000"; x.lineWidth = 3; x.strokeText("★".repeat(u.lv - 1), cx - CS * .25, cy - CS * .38); x.fillText("★".repeat(u.lv - 1), cx - CS * .25, cy - CS * .38); }
  const p = u.hp / u.max; if (p < 1) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(cx - CS * .35, cy + CS * .42, CS * .7, 4); x.fillStyle = p > .5 ? "#3FA34D" : p > .25 ? "#E6B341" : "#E2574C"; x.fillRect(cx - CS * .35, cy + CS * .42, CS * .7 * p, 4); }
}
function drawZombieBody(x: CanvasRenderingContext2D, T: typeof ZT[number], CS: number, walk: number, face: number, eating: boolean) {
  const R = T.size * CS, sw = Math.sin(walk);
  x.save(); x.scale(face, 1);
  x.strokeStyle = "#1A1F16"; x.lineWidth = Math.max(1, R * .05); x.lineCap = "round"; x.lineJoin = "round";
  // 다리
  x.fillStyle = "#3E4A3A"; for (const s of [-1, 1]) { x.save(); x.translate(s * R * .1, R * .05); x.rotate(sw * .5 * s); x.fillRect(-R * .07, 0, R * .14, R * .42); x.strokeRect(-R * .07, 0, R * .14, R * .42); x.restore(); }
  // 몸통(환자복)
  x.fillStyle = T.cloth; x.beginPath(); x.moveTo(-R * .22, -R * .5); x.lineTo(R * .24, -R * .48); x.lineTo(R * .28, R * .1); x.lineTo(R * .05, R * .14); x.lineTo(-R * .02, R * .06); x.lineTo(-R * .25, R * .12); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = "rgba(120,10,10,.55)"; x.beginPath(); x.ellipse(R * .05, -R * .2, R * .1, R * .07, .4, 0, 7); x.fill();
  // 팔 (앞으로 뻗음)
  x.fillStyle = T.body; const reach = eating ? Math.sin(walk * 2) * .4 : .1;
  for (const s of [0, 1]) { x.save(); x.translate(R * (.12 + s * .06), -R * .4); x.rotate(-1.35 + reach + s * .15 + sw * .1); x.fillRect(-R * .06, 0, R * .12, R * .5); x.strokeRect(-R * .06, 0, R * .12, R * .5); x.restore(); }
  // 머리
  x.fillStyle = T.body; x.beginPath(); x.arc(R * .06, -R * .66, R * .2, 0, 7); x.fill(); x.stroke();
  x.fillStyle = "#1A1F16"; x.beginPath(); x.arc(R * .14, -R * .69, R * .035, 0, 7); x.fill(); x.fillStyle = "#3A0A0A"; x.fillRect(R * .08, -R * .58, R * .13, R * .04);
  x.restore();
}
function drawZombie(x: CanvasRenderingContext2D, z: Z, CS: number, t: number, night: boolean) {
  const T = ZT[z.t], R = T.size * CS;
  x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(z.x, z.y + R * .45, R * .35, R * .1, 0, 0, 7); x.fill();
  x.save(); x.translate(z.x, z.y + R * .05 - Math.abs(Math.sin(t * 6 + z.seed)) * R * .05); x.rotate(Math.sin(t * 3 + z.seed) * .08 + (z.eating ? .15 * z.face : 0));
  if (z.t === 4) { x.shadowColor = "#FF2A1A"; x.shadowBlur = 16; }
  drawZombieBody(x, T, CS, t * (z.t === 1 ? 14 : 7) + z.seed, z.face, z.eating);
  if (z.hit > 0) { x.globalAlpha = z.hit * .6; x.globalCompositeOperation = "lighter"; drawZombieBody(x, T, CS, t * 7 + z.seed, z.face, z.eating); }
  x.restore();
  if (z.t === 3 && Math.sin(t * 4 + z.seed) > .7) { x.save(); x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 1.5; for (let k = 1; k <= 2; k++) { x.beginPath(); x.arc(z.x, z.y - R * .6, R * .3 * k, -1, 1); x.stroke(); } x.restore(); }
  if (z.slow > 0) { x.font = `${Math.floor(CS * .22)}px system-ui`; x.textAlign = "center"; x.fillText("💤", z.x + R * .3, z.y - R * .8); }
  if (z.hp < z.max) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(z.x - R * .35, z.y - R * .98, R * .7, 3); x.fillStyle = z.t === 4 ? "#B71C1C" : "#E2574C"; x.fillRect(z.x - R * .35, z.y - R * .98, R * .7 * z.hp / z.max, 3); }
  void night;
}
