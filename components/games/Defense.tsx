"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop } from "@/lib/juice";
import { BestLine } from "./Juice";

/** 병동 사수 — 줄 지키기 디펜스. 웨이브를 넘기면 새 의료진이 해금돼요(계정 저장). */
const ROWS = 5, COLS = 9;
type UnitKind = "iv" | "nurse" | "wall" | "xray" | "doctor" | "ortho" | "anes" | "lab" | "ems" | "ornurse";
type UnitDef = { name: string; icon: string; cost: number; hp: number; desc: string; unlock: number; skill: string };
const UNITS: Record<UnitKind, UnitDef> = {
  iv:      { name: "수액 걸이",   icon: "🧃", cost: 50,  hp: 60,  unlock: 0,  desc: "8초마다 수액 25 생산", skill: "" },
  nurse:   { name: "간호사",      icon: "💉", cost: 100, hp: 80,  unlock: 0,  desc: "주사기 발사 (공격 20)", skill: "" },
  wall:    { name: "원무 바리케이드", icon: "🚧", cost: 50, hp: 400, unlock: 0, desc: "튼튼한 벽", skill: "" },
  xray:    { name: "방사선사",    icon: "☢️", cost: 200, hp: 80,  unlock: 3,  desc: "같은 줄 전체 관통 (공격 10)", skill: "관통 빔" },
  doctor:  { name: "내과 의사",   icon: "🩺", cost: 150, hp: 90,  unlock: 5,  desc: "느리지만 강한 처방 (공격 60)", skill: "" },
  ortho:   { name: "정형외과 의사", icon: "🦴", cost: 225, hp: 120, unlock: 8, desc: "앞 2칸 망치 강타 (공격 90, 광역)", skill: "🔨 망치" },
  anes:    { name: "마취과 의사", icon: "💤", cost: 175, hp: 80,  unlock: 12, desc: "같은 줄 세균 느려짐 + 약한 공격", skill: "💤 수면가스" },
  lab:     { name: "임상병리사",  icon: "🧪", cost: 200, hp: 80,  unlock: 15, desc: "독병 투척, 맞은 세균 지속 피해", skill: "☠️ 독" },
  ems:     { name: "응급구조사",  icon: "⚡", cost: 300, hp: 100, unlock: 20, desc: "8초마다 번개로 줄 전체 타격 (공격 120)", skill: "⚡ 번개" },
  ornurse: { name: "수술실 간호사", icon: "✂️", cost: 250, hp: 90, unlock: 25, desc: "가위 투척, 세균 3마리 관통", skill: "✂️ 가위" },
};
const ORDER = Object.keys(UNITS) as UnitKind[];
const UCOLOR: Record<UnitKind, string> = { iv: "#8FD3C2", nurse: "#F5A3B7", wall: "#E6B341", xray: "#B8A1E8", doctor: "#A9C7F0", ortho: "#F0B48C", anes: "#C9B6F0", lab: "#9FE0A8", ems: "#FFD36E", ornurse: "#F7C6D9" };
const GCOLOR = ["#7CCB8F", "#9BD6E0", "#C48BE8", "#E26B6B"];
type Unit = { kind: UnitKind; r: number; c: number; hp: number; cd: number };
type Germ = { r: number; x: number; hp: number; max: number; speed: number; dmg: number; kind: number; eating: boolean; slow: number; poison: number };
type Shot = { r: number; x: number; dmg: number; kind: "needle" | "beam" | "pill" | "poison" | "scissor"; hit: Set<Germ>; pierce: number; spin: number };
type Fx = { kind: "bolt" | "boom" | "cloud" | "zzz" | "dmg"; r: number; x: number; t: number; w?: number; txt?: string; y?: number };
type Saved = { bestWave: number };

export default function Defense({ ranks, best: bestProp = 0 }: { ranks: Row[]; best?: number }) {
  const cv = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<UnitKind>("nurse");
  const [ui, setUi] = useState({ sun: 150, wave: 0, running: false, over: "" });
  const [saved, setSaved] = useState("");
  const [best, setBest] = useState(0);
  const [unlockCard, setUnlockCard] = useState<UnitDef | null>(null);
  const closeUnlock = () => { setUnlockCard(null); g.current.paused = false; };
  useEffect(() => { try { if (location.search.includes("unlockdemo")) setUnlockCard(UNITS.ortho); } catch {} }, []);
  const g = useRef({ units: [] as Unit[], germs: [] as Germ[], shots: [] as Shot[], fx: [] as Fx[], sun: 150, t: 0, wave: 0, nextSpawn: 4, spawned: 0, waveSize: 3, running: false, paused: false, raf: 0, W: 0, H: 0, last: 0, best: 0, account: 0, sunDrops: [] as { x: number; y: number; t: number }[] });

  useEffect(() => { loadGameState("defense").then(s => { const b = Number((s as Saved | null)?.bestWave ?? 0); g.current.account = b; setBest(b); }).catch(() => {}); }, []);

  useEffect(() => {
    const c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = box.current!.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.width * 0.62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const cw = () => s.W / COLS, ch = () => s.H / ROWS;
    const draw = () => {
      const CW = cw(), CH = ch();
      for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { x.fillStyle = (r + cc) % 2 ? "#EAF2EE" : "#DFEBE5"; x.fillRect(cc * CW, r * CH, CW, CH); }
      x.strokeStyle = "rgba(0,0,0,.05)"; x.lineWidth = 1; for (let r = 1; r < ROWS; r++) { x.beginPath(); x.moveTo(0, r * CH); x.lineTo(s.W, r * CH); x.stroke(); }
      x.fillStyle = "#E2574C"; x.fillRect(0, 0, 5, s.H); x.fillStyle = "rgba(226,87,76,.12)"; x.fillRect(5, 0, CW * .5, s.H);
      x.fillStyle = "#B8C9C1"; x.fillRect(s.W - 6, 0, 6, s.H);
      // 수면가스 영역 표시
      for (const u of s.units) if (u.kind === "anes") { x.fillStyle = "rgba(120,100,220,.10)"; x.fillRect(u.c * CW, u.r * CH, s.W - u.c * CW, CH); }
      x.textAlign = "center"; x.textBaseline = "middle";
      for (const u of s.units) { const cx = u.c * CW + CW / 2, cy = u.r * CH + CH / 2, wob = Math.sin(s.t * 4 + u.c + u.r) * 1.5, R = Math.min(CW, CH) * .42;
        x.fillStyle = "rgba(0,0,0,.12)"; x.beginPath(); x.ellipse(cx, u.r * CH + CH - 4, R * .9, 3, 0, 0, 7); x.fill();
        x.fillStyle = UCOLOR[u.kind]; x.beginPath(); x.arc(cx, cy + wob, R, 0, 7); x.fill(); x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = 2; x.stroke();
        if (u.cd > 0 && u.kind !== "iv" && u.kind !== "wall") { x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy + wob, R + 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, u.cd / 3)); x.stroke(); }
        x.font = `${Math.floor(R * 1.25)}px system-ui`; x.fillText(UNITS[u.kind].icon, cx, cy + wob + 1);
        const p = u.hp / UNITS[u.kind].hp; x.fillStyle = "rgba(0,0,0,.15)"; x.fillRect(u.c * CW + 4, u.r * CH + CH - 6, CW - 8, 3); x.fillStyle = p > .5 ? "#2C6B5E" : p > .25 ? "#E6B341" : "#E2574C"; x.fillRect(u.c * CW + 4, u.r * CH + CH - 6, (CW - 8) * p, 3); }
      for (const sh of s.shots) {
        const cy = sh.r * CH + CH / 2;
        if (sh.kind === "scissor") { x.save(); x.translate(sh.x, cy); x.rotate(sh.spin); x.font = `${Math.floor(CH * .45)}px system-ui`; x.fillText("✂️", 0, 0); x.restore(); }
        else if (sh.kind === "poison") { x.font = `${Math.floor(CH * .4)}px system-ui`; x.fillText("🧪", sh.x, cy - Math.sin(Math.min(1, sh.spin)) * CH * .5); }
        else { x.fillStyle = sh.kind === "beam" ? "#E2574C" : sh.kind === "pill" ? "#3B5BA9" : "#2C6B5E"; x.beginPath(); x.arc(sh.x, cy, sh.kind === "beam" ? 3 : sh.kind === "pill" ? 5 : 4, 0, 7); x.fill(); }
      }
      for (const z of s.germs) {
        const bounce = z.eating ? Math.abs(Math.sin(s.t * 14)) * 3 : Math.abs(Math.sin(s.t * 6 + z.x * .05)) * 4, cy = z.r * CH + CH / 2 - bounce, R = z.kind === 3 ? CH * .46 : CH * .3;
        x.fillStyle = "rgba(0,0,0,.12)"; x.beginPath(); x.ellipse(z.x, z.r * CH + CH - 4, R * .8, 3, 0, 0, 7); x.fill();
        if (z.kind === 3) { x.save(); x.globalAlpha = .25 + Math.sin(s.t * 5) * .1; x.fillStyle = "#E26B6B"; x.beginPath(); x.arc(z.x, cy, R * 1.35, 0, 7); x.fill(); x.restore(); }
        if (z.poison > 0) { x.save(); x.globalAlpha = .35; x.fillStyle = "#4CAF50"; x.beginPath(); x.arc(z.x, cy, R * 1.2, 0, 7); x.fill(); x.restore(); }
        x.fillStyle = GCOLOR[z.kind]; x.beginPath(); x.arc(z.x, cy, R, 0, 7); x.fill(); x.strokeStyle = "rgba(0,0,0,.15)"; x.lineWidth = 2; x.stroke();
        x.font = `${Math.floor(R * 1.3)}px system-ui`; x.fillText(["🦠", "🧫", "👾", "🧟"][z.kind], z.x, cy + 1);
        if (z.slow > 0) { x.font = `${Math.floor(CH * .3)}px system-ui`; x.fillText("💤", z.x + R, cy - R); }
        x.fillStyle = "rgba(0,0,0,.15)"; x.fillRect(z.x - R, z.r * CH + 4, R * 2, 3); x.fillStyle = z.kind === 3 ? "#B71C1C" : "#E2574C"; x.fillRect(z.x - R, z.r * CH + 4, R * 2 * (z.hp / z.max), 3);
      }
      // 이펙트
      for (const f of s.fx) {
        const cy = f.r * CH + CH / 2, a = Math.max(0, f.t);
        if (f.kind === "bolt") { x.save(); x.globalAlpha = a; x.strokeStyle = "#FFE766"; x.lineWidth = 3; x.shadowColor = "#FFE766"; x.shadowBlur = 12; x.beginPath(); let px = f.x, py = cy; x.moveTo(px, py); while (px < s.W) { px += 14; py = cy + (Math.random() - .5) * CH * .6; x.lineTo(px, py); } x.stroke(); x.restore(); }
        if (f.kind === "boom") { x.save(); x.globalAlpha = a; x.strokeStyle = "#E6B341"; x.lineWidth = 4; x.beginPath(); x.arc(f.x, cy, (1 - a) * CW * 1.2 + 6, 0, 7); x.stroke(); x.font = `${Math.floor(CH * .5)}px system-ui`; x.fillText("🔨", f.x, cy - CH * .2); x.restore(); }
        if (f.kind === "dmg") { x.save(); x.globalAlpha = a; x.font = `600 ${Math.floor(CH * .32)}px system-ui`; x.fillStyle = "#E2574C"; x.strokeStyle = "#fff"; x.lineWidth = 3; const yy = (f.y ?? cy) - (1 - a) * 18; x.strokeText(f.txt ?? "", f.x, yy); x.fillText(f.txt ?? "", f.x, yy); x.restore(); }
        if (f.kind === "cloud") { x.save(); x.globalAlpha = a * .6; x.fillStyle = "#6CC070"; x.beginPath(); x.arc(f.x, cy, CW * .55, 0, 7); x.fill(); x.restore(); }
      }
      x.font = `${Math.floor(CH * .45)}px system-ui`;
      for (const d of s.sunDrops) x.fillText("💧", d.x, d.y);
    };
    const spawnGerm = (boss = false) => { const r = Math.floor(Math.random() * ROWS), w = s.wave;
      const base = { r, x: s.W + 10, eating: false, slow: 0, poison: 0 };
      if (boss) { const hp = 1800 * (1 + w * .15); s.germs.push({ ...base, hp, max: hp, speed: 7 + w * .3, dmg: 80, kind: 3 }); return; }
      const kind = w >= 5 && Math.random() < Math.min(.5, .15 + w * .03) ? 2 : w >= 2 && Math.random() < .4 ? 1 : 0; const hp = [60, 150, 340][kind] * (1 + w * .14);
      s.germs.push({ ...base, hp, max: hp, speed: ([15, 11, 9][kind] + w * 1.1) * (1 + Math.random() * .25), dmg: [10, 16, 30][kind], kind }); };
    const commitBest = (w: number) => { if (w > s.best) { s.best = w; saveScore("defense", w).catch(() => {}); }
      if (w > s.account) { const prev = s.account; s.account = w; setBest(w); saveGameState("defense", { bestWave: w }).catch(() => {});
        const nu = ORDER.find(k => UNITS[k].unlock > prev && UNITS[k].unlock <= w); if (nu) { s.paused = true; setUnlockCard(UNITS[nu]); sfx.level(); haptic([30, 30, 60]); } } };
    const end = () => { s.running = false; cancelAnimationFrame(s.raf); draw(); sfx.boom(); haptic([60, 40, 60]); shake(box.current, "l"); setUi(u => ({ ...u, running: false, over: `${s.wave}웨이브에서 병동이 뚫렸어요` })); commitBest(s.wave - 1); };
    const laneGerms = (r: number, fromX: number) => s.germs.filter(z => z.r === r && z.x > fromX);
    const tick = (now: number) => {
      if (s.paused) { s.last = now; s.raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(.05, (now - s.last) / 1000); s.last = now; s.t += dt; const CW = cw(), CH = ch();
      s.nextSpawn -= dt;
      if (s.nextSpawn <= 0) {
        if (s.spawned < s.waveSize) { spawnGerm(); s.spawned++; if (s.wave % 5 === 0 && s.spawned === s.waveSize) spawnGerm(true); s.nextSpawn = Math.max(.35, 1.8 - s.wave * .11); }
        else if (!s.germs.length) { commitBest(s.wave); sfx.level(); pop(box.current, s.W / 2, s.H / 2, `WAVE ${s.wave + 1}`, "good big"); if ((s.wave + 1) % 5 === 0) setTimeout(() => { sfx.boom(); pop(box.current, s.W / 2, s.H * .3, "⚠ BOSS", "bad big"); shake(box.current, "m"); }, 1200); s.wave++; s.spawned = 0; s.waveSize = 4 + Math.floor(s.wave * 2.2); s.nextSpawn = 2.5; setUi(u => ({ ...u, wave: s.wave })); } }
      if (Math.random() < dt * Math.max(.03, .1 - s.wave * .006)) s.sunDrops.push({ x: 30 + Math.random() * (s.W - 60), y: 20 + Math.random() * (s.H - 40), t: 8 });
      s.sunDrops = s.sunDrops.filter(d => (d.t -= dt) > 0);
      for (const u of s.units) { u.cd -= dt; const fx = u.c * CW + CW * .7, lane = laneGerms(u.r, u.c * CW);
        switch (u.kind) {
          case "iv": if (u.cd <= 0) { u.cd = 8; s.sun += 25; setUi(x => ({ ...x, sun: s.sun })); } break;
          case "nurse": if (u.cd <= 0 && lane.length) { u.cd = 1.4; s.shots.push({ r: u.r, x: fx, dmg: 20, kind: "needle", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "xray": if (u.cd <= 0 && lane.length) { u.cd = 2.2; s.shots.push({ r: u.r, x: fx, dmg: 10, kind: "beam", hit: new Set(), pierce: 99, spin: 0 }); } break;
          case "doctor": if (u.cd <= 0 && lane.length) { u.cd = 3.2; s.shots.push({ r: u.r, x: fx, dmg: 60, kind: "pill", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "ortho": { const near = lane.filter(z => z.x < u.c * CW + CW * 2.6); if (u.cd <= 0 && near.length) { u.cd = 2.8; for (const z of near) { z.hp -= 90; s.fx.push({ kind: "dmg", r: u.r, x: z.x, y: u.r * CH + CH * .3, t: 1, txt: "90" }); } s.fx.push({ kind: "boom", r: u.r, x: u.c * CW + CW * 1.6, t: 1 }); } break; }
          case "anes": for (const z of lane) z.slow = .6; if (u.cd <= 0 && lane.length) { u.cd = 2; s.shots.push({ r: u.r, x: fx, dmg: 8, kind: "needle", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "lab": if (u.cd <= 0 && lane.length) { u.cd = 3; s.shots.push({ r: u.r, x: fx, dmg: 15, kind: "poison", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "ems": if (u.cd <= 0 && lane.length) { u.cd = 8; for (const z of lane) { z.hp -= 120; s.fx.push({ kind: "dmg", r: u.r, x: z.x, y: u.r * CH + CH * .3, t: 1, txt: "120" }); } s.fx.push({ kind: "bolt", r: u.r, x: fx, t: 1 }); } break;
          case "ornurse": if (u.cd <= 0 && lane.length) { u.cd = 2.4; s.shots.push({ r: u.r, x: fx, dmg: 35, kind: "scissor", hit: new Set(), pierce: 3, spin: 0 }); } break;
        } }
      for (const sh of s.shots) { sh.x += (sh.kind === "poison" ? 180 : sh.kind === "scissor" ? 300 : 260) * dt; sh.spin += dt * (sh.kind === "scissor" ? 14 : 1.2);
        for (const z of s.germs) { if (z.r === sh.r && !sh.hit.has(z) && Math.abs(z.x - sh.x) < CW * .3) { z.hp -= sh.dmg; sh.hit.add(z); s.fx.push({ kind: "dmg", r: sh.r, x: z.x, y: z.r * CH + CH * .3, t: 1, txt: String(sh.dmg) }); if (z.hp <= 0) { sfx.hit(); burst(box.current, z.x, z.r * CH + CH / 2, GCOLOR[z.kind], 8); }
          if (sh.kind === "poison") { z.poison = 4; s.fx.push({ kind: "cloud", r: sh.r, x: z.x, t: .6 }); for (const o of s.germs) if (o !== z && o.r === z.r && Math.abs(o.x - z.x) < CW) o.poison = 4; }
          if (sh.hit.size >= sh.pierce) sh.x = 1e9; } } }
      s.shots = s.shots.filter(sh => sh.x < s.W + 20);
      for (const f of s.fx) f.t -= dt * (f.kind === "bolt" ? 3 : f.kind === "dmg" ? 1.4 : 1.6); s.fx = s.fx.filter(f => f.t > 0);
      for (const z of s.germs) { if (z.poison > 0) { z.poison -= dt; z.hp -= 12 * dt; } const sp = z.speed * (z.slow > 0 ? .5 : 1); z.slow = Math.max(0, z.slow - dt);
        const target = s.units.find(u => u.r === z.r && Math.abs(u.c * CW + CW / 2 - z.x) < CW * .45 && u.c * CW + CW / 2 <= z.x + 2);
        if (target) { z.eating = true; target.hp -= z.dmg * dt; } else { z.eating = false; z.x -= sp * dt; }
        if (z.x < -4) return end(); }
      // 세균이 왼쪽 경계 근처까지 오면 경고
      for (const z of s.germs) if (!(z as any).warn && z.x < CW * 1.2) { (z as any).warn = true; sfx.tick(); shake(box.current, "s"); }
      s.units = s.units.filter(u => u.hp > 0); s.germs = s.germs.filter(z => z.hp > 0);
      draw(); s.raf = requestAnimationFrame(tick);
    };
    (box.current as any).__start = () => { sfx.level(); size(); s.units = []; s.germs = []; s.shots = []; s.fx = []; s.sun = 150; s.t = 0; s.wave = 1; s.spawned = 0; s.waveSize = 3; s.nextSpawn = 5; s.sunDrops = []; s.best = 0; s.running = true; s.last = performance.now(); setUi({ sun: 150, wave: 1, running: true, over: "" }); s.raf = requestAnimationFrame(tick); };
    (box.current as any).__place = (kind: UnitKind, px: number, py: number) => {
      if (!s.running) return; const CW = cw(), CH = ch();
      const hit = s.sunDrops.findIndex(d => Math.hypot(d.x - px, d.y - py) < CH * .4);
      if (hit >= 0) { s.sunDrops.splice(hit, 1); s.sun += 25; setUi(u => ({ ...u, sun: s.sun })); sfx.coin(); pop(box.current, px, py, "+25", "good"); return; }
      if (UNITS[kind].unlock > s.account) return;
      const c = Math.floor(px / CW), r = Math.floor(py / CH); if (c < 0 || c >= COLS - 1 || r < 0 || r >= ROWS) return;
      if (s.units.some(u => u.r === r && u.c === c)) return; const cost = UNITS[kind].cost; if (s.sun < cost) return;
      s.sun -= cost; s.units.push({ kind, r, c, hp: UNITS[kind].hp, cd: kind === "iv" ? 8 : 0 }); setUi(u => ({ ...u, sun: s.sun })); sfx.tap(); haptic(8); burst(box.current, px, py, UCOLOR[kind], 8);
    };
    const ro = new ResizeObserver(size); ro.observe(box.current!); size();
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); };
  }, []);

  const unlocked = ORDER.filter(k => UNITS[k].unlock <= best), locked = ORDER.filter(k => UNITS[k].unlock > best);
  const next = locked[0];
  return (
    <div className="card">
      <div><h3>병동 사수</h3><div className="muted">왼쪽에 의료진을 배치해서 오른쪽에서 밀려오는 세균을 막으세요. 수액(💧)을 눌러 모으고, 수액으로 의료진을 고용해요. 세균이 왼쪽 끝에 닿으면 끝. 5웨이브마다 보스 🧟. <b>웨이브를 넘길수록 새 의료진이 해금</b>돼요 (계정에 저장).</div></div>
      <div className="def-bar"><span className="def-sun">💧 {ui.sun}</span><span className="muted">웨이브 {ui.wave}</span><BestLine best={Math.max(best, bestProp)} cur={Math.max(0, ui.wave - 1)} unit="웨이브" />
        {ui.running && <button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={async () => { const w = Math.max(0, g.current.wave - 1); if (!w) { setSaved("1웨이브를 넘긴 뒤 저장할 수 있어요"); return; } try { await saveScore("defense", w); g.current.best = Math.max(g.current.best, w); setSaved(`${w}웨이브 기록 저장됨`); } catch { setSaved("저장 실패"); } setTimeout(() => setSaved(""), 2500); }}>기록 저장</button>}
      </div>
      {saved && <div className="muted">{saved}</div>}
      <div className="def-shop">{unlocked.map(k => <button key={k} type="button" className={"def-unit" + (sel === k ? " sel" : "") + (ui.sun < UNITS[k].cost ? " poor" : "")} onClick={() => setSel(k)} title={UNITS[k].desc}><span className="def-ico" style={{ background: UCOLOR[k] }}>{UNITS[k].icon}</span><span className="def-name">{UNITS[k].name}</span><span className="def-cost">{UNITS[k].cost}</span></button>)}
        {locked.map(k => <div key={k} className="def-unit locked" title={`${UNITS[k].unlock}웨이브 달성 시 해금`}><span className="def-ico">🔒</span><span className="def-name">{UNITS[k].name}</span><span className="def-cost">{UNITS[k].unlock}웨이브</span></div>)}</div>
      <div className="def-stage" ref={box} onPointerDown={e => { const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); (e.currentTarget as any).__place(sel, e.clientX - r.left, e.clientY - r.top); }}>
        <canvas ref={cv} />
        {!ui.running && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__start(); }}><span className="big">{ui.over ? ui.over : "병동 사수"}</span><span>{ui.over ? "다시 하려면 터치" : "터치해서 시작"}</span></button>}
        {unlockCard && (
          <div className="unlock" role="dialog" aria-modal="true" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div className="unlock-title">새 의료진을 영입했어요!</div>
            <div className="unlock-frame">
              <div className="unlock-card">
                <div className="unlock-top">{unlockCard.name}</div>
                <div className="unlock-body">
                  <div className="unlock-tile"><span className="unlock-ico">{unlockCard.icon}</span></div>
                  <div className="unlock-desc">{unlockCard.desc}{unlockCard.skill && <><br /><span className="tag">{unlockCard.skill}</span></>}<div className="muted" style={{ marginTop: 6 }}>고용 비용 {unlockCard.cost}💧</div></div>
                </div>
              </div>
              <button type="button" className="unlock-btn" onClick={closeUnlock}>CONTINUE</button>
            </div>
          </div>
        )}
      </div>
      <div className="muted">{UNITS[sel].icon} {UNITS[sel].name}: {UNITS[sel].desc} · 바닥을 눌러 배치{next ? ` · 다음 해금: ${UNITS[next].name} (${UNITS[next].unlock}웨이브)` : " · 모든 의료진 해금 완료!"}</div>
      <Board title="병동 사수 명예의 전당" rows={ranks} fmt={r => r.value + "웨이브"} />
    </div>
  );
}
