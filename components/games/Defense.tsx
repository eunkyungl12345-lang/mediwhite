"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";

/** 병동 사수 — 줄 지키기 디펜스. 왼쪽에 의료진을 놓고 오른쪽에서 오는 세균을 막아요. */
const ROWS = 5, COLS = 9;
type UnitKind = "iv" | "nurse" | "wall" | "xray" | "doctor";
const UNITS: Record<UnitKind, { name: string; icon: string; cost: number; hp: number; desc: string }> = {
  iv: { name: "수액 걸이", icon: "🧃", cost: 50, hp: 60, desc: "8초마다 수액 25 생산" },
  nurse: { name: "간호사", icon: "💉", cost: 100, hp: 80, desc: "주사기 발사 (공격 20)" },
  wall: { name: "원무 바리케이드", icon: "🚧", cost: 50, hp: 400, desc: "튼튼한 벽" },
  xray: { name: "방사선사", icon: "☢️", cost: 175, hp: 80, desc: "같은 줄 전체 관통 (공격 12)" },
  doctor: { name: "의사", icon: "🩺", cost: 150, hp: 90, desc: "느리지만 강한 처방 (공격 60)" },
};
type Unit = { kind: UnitKind; r: number; c: number; hp: number; cd: number };
type Germ = { r: number; x: number; hp: number; max: number; speed: number; dmg: number; kind: number; eating: boolean };
type Shot = { r: number; x: number; dmg: number; pierce: boolean; hit: Set<Germ> };

export default function Defense({ ranks }: { ranks: Row[] }) {
  const cv = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<UnitKind>("nurse");
  const [ui, setUi] = useState({ sun: 150, wave: 0, running: false, over: "" });
  const g = useRef({ units: [] as Unit[], germs: [] as Germ[], shots: [] as Shot[], sun: 150, t: 0, wave: 0, nextSpawn: 4, spawned: 0, waveSize: 3, running: false, raf: 0, W: 0, H: 0, last: 0, best: 0, sunDrops: [] as { x: number; y: number; t: number }[] });

  useEffect(() => {
    const c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = box.current!.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.width * 0.62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const cw = () => s.W / COLS, ch = () => s.H / ROWS;
    const draw = () => {
      const CW = cw(), CH = ch();
      for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { x.fillStyle = (r + cc) % 2 ? "#E8F0EC" : "#DCE8E2"; x.fillRect(cc * CW, r * CH, CW, CH); }
      x.fillStyle = "#B8C9C1"; x.fillRect(0, 0, 4, s.H);
      x.font = `${Math.floor(CH * .6)}px system-ui`; x.textAlign = "center"; x.textBaseline = "middle";
      for (const u of s.units) { x.fillText(UNITS[u.kind].icon, u.c * CW + CW / 2, u.r * CH + CH / 2); const p = u.hp / UNITS[u.kind].hp; x.fillStyle = "#2C6B5E"; x.fillRect(u.c * CW + 4, u.r * CH + CH - 5, (CW - 8) * p, 3); }
      for (const sh of s.shots) { x.fillStyle = sh.pierce ? "#E2574C" : "#2C6B5E"; x.beginPath(); x.arc(sh.x, sh.r * CH + CH / 2, sh.pierce ? 3 : 4, 0, 7); x.fill(); }
      for (const z of s.germs) { x.fillText(["🦠", "🧫", "👾"][z.kind], z.x, z.r * CH + CH / 2); x.fillStyle = "#E2574C"; x.fillRect(z.x - CW * .3, z.r * CH + 4, CW * .6 * (z.hp / z.max), 3); }
      x.font = `${Math.floor(CH * .45)}px system-ui`;
      for (const d of s.sunDrops) x.fillText("💧", d.x, d.y);
    };
    const spawnGerm = () => { const r = Math.floor(Math.random() * ROWS), w = s.wave; const kind = w >= 6 && Math.random() < .25 ? 2 : w >= 3 && Math.random() < .35 ? 1 : 0; const hp = [60, 140, 300][kind] * (1 + w * .08);
      s.germs.push({ r, x: s.W + 10, hp, max: hp, speed: [14, 10, 8][kind] + w * .6, dmg: [10, 14, 25][kind], kind, eating: false }); };
    const end = () => { s.running = false; cancelAnimationFrame(s.raf); setUi(u => ({ ...u, running: false, over: `${s.wave}웨이브에서 병동이 뚫렸어요` })); saveScore("defense", s.wave).catch(() => {}); };
    const tick = (now: number) => {
      const dt = Math.min(.05, (now - s.last) / 1000); s.last = now; s.t += dt; const CW = cw(), CH = ch();
      // 웨이브
      s.nextSpawn -= dt;
      if (s.nextSpawn <= 0) { if (s.spawned < s.waveSize) { spawnGerm(); s.spawned++; s.nextSpawn = Math.max(.6, 2.2 - s.wave * .12); } else if (!s.germs.length) { s.wave++; s.spawned = 0; s.waveSize = 3 + Math.floor(s.wave * 1.6); s.nextSpawn = 3; setUi(u => ({ ...u, wave: s.wave })); } }
      // 자연 수액
      if (Math.random() < dt * .12) s.sunDrops.push({ x: 30 + Math.random() * (s.W - 60), y: 20 + Math.random() * (s.H - 40), t: 8 });
      s.sunDrops = s.sunDrops.filter(d => (d.t -= dt) > 0);
      // 유닛 행동
      for (const u of s.units) { u.cd -= dt; const lane = s.germs.filter(z => z.r === u.r && z.x > u.c * CW);
        if (u.kind === "iv" && u.cd <= 0) { u.cd = 8; s.sun += 25; setUi(x => ({ ...x, sun: s.sun })); }
        if (u.kind === "nurse" && u.cd <= 0 && lane.length) { u.cd = 1.4; s.shots.push({ r: u.r, x: u.c * CW + CW * .7, dmg: 20, pierce: false, hit: new Set() }); }
        if (u.kind === "xray" && u.cd <= 0 && lane.length) { u.cd = 2.2; s.shots.push({ r: u.r, x: u.c * CW + CW * .7, dmg: 12, pierce: true, hit: new Set() }); }
        if (u.kind === "doctor" && u.cd <= 0 && lane.length) { u.cd = 3.2; s.shots.push({ r: u.r, x: u.c * CW + CW * .7, dmg: 60, pierce: false, hit: new Set() }); } }
      // 탄환
      for (const sh of s.shots) { sh.x += 260 * dt; for (const z of s.germs) { if (z.r === sh.r && !sh.hit.has(z) && Math.abs(z.x - sh.x) < CW * .3) { z.hp -= sh.dmg; sh.hit.add(z); if (!sh.pierce) sh.x = 1e9; } } }
      s.shots = s.shots.filter(sh => sh.x < s.W + 20);
      // 세균
      for (const z of s.germs) { const target = s.units.find(u => u.r === z.r && Math.abs(u.c * CW + CW / 2 - z.x) < CW * .45 && u.c * CW + CW / 2 <= z.x + 2);
        if (target) { z.eating = true; target.hp -= z.dmg * dt; } else { z.eating = false; z.x -= z.speed * dt; }
        if (z.x < -4) return end(); }
      s.units = s.units.filter(u => u.hp > 0); s.germs = s.germs.filter(z => z.hp > 0);
      draw(); s.raf = requestAnimationFrame(tick);
    };
    (box.current as any).__start = () => { s.units = []; s.germs = []; s.shots = []; s.sun = 150; s.t = 0; s.wave = 1; s.spawned = 0; s.waveSize = 3; s.nextSpawn = 5; s.sunDrops = []; s.running = true; s.last = performance.now(); setUi({ sun: 150, wave: 1, running: true, over: "" }); s.raf = requestAnimationFrame(tick); };
    (box.current as any).__place = (kind: UnitKind, px: number, py: number) => {
      if (!s.running) return; const CW = cw(), CH = ch();
      const hit = s.sunDrops.findIndex(d => Math.hypot(d.x - px, d.y - py) < CH * .4);
      if (hit >= 0) { s.sunDrops.splice(hit, 1); s.sun += 25; setUi(u => ({ ...u, sun: s.sun })); return; }
      const c = Math.floor(px / CW), r = Math.floor(py / CH); if (c < 0 || c >= COLS - 1 || r < 0 || r >= ROWS) return;
      if (s.units.some(u => u.r === r && u.c === c)) return; const cost = UNITS[kind].cost; if (s.sun < cost) return;
      s.sun -= cost; s.units.push({ kind, r, c, hp: UNITS[kind].hp, cd: kind === "iv" ? 8 : 0 }); setUi(u => ({ ...u, sun: s.sun }));
    };
    const ro = new ResizeObserver(size); ro.observe(box.current!); size();
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); };
  }, []);

  return (
    <div className="card">
      <div><h3>병동 사수</h3><div className="muted">왼쪽에 의료진을 배치해서 오른쪽에서 밀려오는 세균을 막으세요. 수액(💧)을 눌러 모으고, 수액으로 의료진을 고용해요. 세균이 왼쪽 끝에 닿으면 끝. 5·10웨이브 달성 시 퀘스트 경험치.</div></div>
      <div className="def-bar"><span className="def-sun">💧 {ui.sun}</span><span className="muted">웨이브 {ui.wave}</span></div>
      <div className="def-shop">{(Object.keys(UNITS) as UnitKind[]).map(k => <button key={k} type="button" className={"def-unit" + (sel === k ? " sel" : "") + (ui.sun < UNITS[k].cost ? " poor" : "")} onClick={() => setSel(k)} title={UNITS[k].desc}><span className="def-ico">{UNITS[k].icon}</span><span className="def-name">{UNITS[k].name}</span><span className="def-cost">{UNITS[k].cost}</span></button>)}</div>
      <div className="def-stage" ref={box} onPointerDown={e => { const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); (e.currentTarget as any).__place(sel, e.clientX - r.left, e.clientY - r.top); }}>
        <canvas ref={cv} />
        {!ui.running && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__start(); }}><span className="big">{ui.over ? ui.over : "병동 사수"}</span><span>{ui.over ? "다시 하려면 터치" : "터치해서 시작"}</span></button>}
      </div>
      <div className="muted">{UNITS[sel].icon} {UNITS[sel].name}: {UNITS[sel].desc} · 바닥을 눌러 배치</div>
      <Board title="병동 사수 명예의 전당" rows={ranks} fmt={r => r.value + "웨이브"} />
    </div>
  );
}
