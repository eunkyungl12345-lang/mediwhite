"use client";
import { HERO_SVG, GERM_SVG, art, artSrc } from "./defArt";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState, defenseDaily } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop } from "@/lib/juice";

/** 병동 사수 — 스테이지형 줄 지키기 디펜스. 스테이지를 깨면 별·처방전 코인·새 의료진. (계정 저장) */
const ROWS = 5, COLS = 9, STAGES = 30;
type UnitKind = "iv" | "nurse" | "wall" | "xray" | "doctor" | "ortho" | "anes" | "lab" | "ems" | "ornurse" | "punk";
type UnitDef = { name: string; icon: string; cost: number; hp: number; desc: string; unlock: number; skill: string; dmg: number };
const UNITS: Record<UnitKind, UnitDef> = {
  iv:      { name: "수액 걸이",   icon: "🧃", cost: 50,  hp: 60,  unlock: 0,  desc: "8초마다 수액 25 생산", skill: "", dmg: 0 },
  nurse:   { name: "간호사",      icon: "💉", cost: 100, hp: 80,  unlock: 0,  desc: "주사기 발사", skill: "", dmg: 25 },
  wall:    { name: "원무 바리케이드", icon: "🚧", cost: 50, hp: 400, unlock: 0, desc: "튼튼한 벽", skill: "", dmg: 0 },
  xray:    { name: "방사선사",    icon: "☢️", cost: 200, hp: 80,  unlock: 3,  desc: "🔴 레이저: 같은 줄 전체를 한 번에 관통", skill: "관통 빔", dmg: 10 },
  doctor:  { name: "내과 의사",   icon: "🩺", cost: 150, hp: 90,  unlock: 5,  desc: "💥 처방 샷건: 가까운 적 4마리(옆 줄 포함) 산탄", skill: "", dmg: 60 },
  ortho:   { name: "정형외과 의사", icon: "🦴", cost: 225, hp: 120, unlock: 8, desc: "앞 2칸 망치 강타 (광역)", skill: "🔨 망치", dmg: 90 },
  anes:    { name: "마취과 의사", icon: "💤", cost: 175, hp: 80,  unlock: 12, desc: "💤 수면 가스: 같은 줄 느려짐 + 가스 피해", skill: "💤 수면가스", dmg: 8 },
  lab:     { name: "임상병리사",  icon: "🧪", cost: 200, hp: 80,  unlock: 15, desc: "독병 투척, 맞은 세균 지속 피해", skill: "☠️ 독", dmg: 15 },
  ems:     { name: "응급구조사",  icon: "⚡", cost: 300, hp: 100, unlock: 20, desc: "⚡ 연쇄 번개: 6초마다 적 6마리까지 튕겨 가며 감전", skill: "⚡ 번개", dmg: 120 },
  ornurse: { name: "수술실 간호사", icon: "✂️", cost: 250, hp: 90, unlock: 25, desc: "가위 투척, 세균 3마리 관통", skill: "✂️ 가위", dmg: 35 },
  punk:    { name: "당일 펑크 알바", icon: "💣", cost: 125, hp: 40, unlock: 2, desc: "💣 자폭맨: \"저 오늘 못 가요!\" 외치고 달려가서 펑! 주변 3줄 큰 피해 (1회용)", skill: "💣 자폭", dmg: 450 },
};
const ORDER = Object.keys(UNITS) as UnitKind[];
const UCOLOR: Record<UnitKind, string> = { iv: "#8FD3C2", nurse: "#F5A3B7", wall: "#E6B341", xray: "#B8A1E8", doctor: "#A9C7F0", ortho: "#F0B48C", anes: "#C9B6F0", lab: "#9FE0A8", ems: "#FFD36E", ornurse: "#F7C6D9", punk: "#FF8A3D" };
// 세균: 0 일반 1 끈질긴 2 돌연변이(빠름) 3 보스 4 변이균(죽으면 분열) 5 내성균(주사·빔 피해 절반) 6 날벌레(아주 빠름) 7 슈퍼박테리아(소환 보스)
const GICON = ["🦠", "🧫", "👾", "🧟", "🧬", "🛡️", "🦟", "👑"];
const GCOLOR = ["#7CCB8F", "#9BD6E0", "#C48BE8", "#E26B6B", "#F0A6D2", "#B0BEC5", "#D7CCA1", "#FFB74D"];
const GNAME = ["일반 세균", "끈질긴 균", "돌연변이", "보스 🧟", "변이균(분열)", "내성균", "날벌레", "슈퍼박테리아"];
/** 괴물 입 위치(그림 크기 대비)·흘리는 것 색 */
const MOUTH: [number, number][] = [[-.05, -.33], [-.27, -.25], [-.4, -.38], [.01, -.38], [.0, -.3], [-.02, -.26], [-.12, -.2], [-.05, -.27]];
const DRIP = ["#B3121A", "#7BE04A", "#B3121A", "#B3121A", "#C2185B", "#FF8A1A", "#8A0A12", "#FF6A00"];
const CHAPTERS = ["응급실", "일반병동", "중환자실"];
const MAXLV = 5;
type Unit = { kind: UnitKind; r: number; c: number; hp: number; max: number; cd: number; atk?: number; run?: number; fuse?: number };
type Germ = { r: number; x: number; hp: number; max: number; speed: number; dmg: number; kind: number; eating: boolean; slow: number; poison: number; cd: number; warn?: boolean; hit?: number; cd2?: number; seed?: number };
type Shot = { r: number; x: number; dmg: number; kind: "needle" | "beam" | "pill" | "poison" | "scissor"; hit: Set<Germ>; pierce: number; spin: number };
type Fx = { kind: "bolt" | "boom" | "cloud" | "zzz" | "dmg" | "laser" | "blast" | "chain" | "gas" | "nuke" | "die"; r: number; x: number; t: number; w?: number; txt?: string; y?: number; pts?: [number, number][]; k?: number; gs?: number };
type Saved = { bestWave?: number; stars?: Record<string, number>; coins?: number; levels?: Partial<Record<UnitKind, number>>; dailyDone?: string; cleared?: number };
type Mod = "none" | "night" | "iso" | "rush" | "tough" | "double";
const MODS: Record<Mod, { name: string; desc: string }> = {
  none: { name: "", desc: "" },
  night: { name: "🌙 야간 근무", desc: "수액이 떨어지지 않아요. 수액 걸이 필수" },
  iso: { name: "🚪 격리 병동", desc: "가운데 3줄만 사용" },
  rush: { name: "🚨 응급 상황", desc: "세균 속도 +30%, 시작 수액 300" },
  tough: { name: "🧱 슈퍼 내성", desc: "세균 체력 +50%" },
  double: { name: "👯 2배 출현", desc: "세균이 2배로 몰려와요" },
};
type StageDef = { id: number; ch: number; no: number; name: string; waves: number; mod: Mod; boss: number; pool: number[]; mult: number; spd: number };
function stageDef(id: number, forced?: Mod): StageDef {
  const ch = Math.ceil(id / 10), no = ((id - 1) % 10) + 1;
  const pool = [0]; if (id >= 2) pool.push(1); if (id >= 4) pool.push(2); if (id >= 7) pool.push(4); if (id >= 11) pool.push(5); if (id >= 14) pool.push(6);
  const mod: Mod = forced ?? (no === 4 ? "night" : no === 7 ? "iso" : no === 9 ? "rush" : "none");
  const boss = id % 5 === 0 ? (id >= 25 ? 7 : 3) : 0;
  return { id, ch, no, name: `${ch}-${no}`, waves: id <= 3 ? 2 : id <= 6 ? 3 : Math.min(10, 3 + Math.floor((id - 1) / 3)), mod, boss, pool, mult: (id <= 3 ? .45 : id <= 6 ? .6 : id <= 10 ? .75 : id <= 15 ? .9 : 1) * (1 + (id - 1) * .08), spd: (id <= 3 ? .7 : id <= 6 ? .85 : 1) * (1 + (id - 1) * .015) };
}
const kstDay = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const lvCost = (k: UnitKind, lv: number) => Math.round((40 + ORDER.indexOf(k) * 15) * lv);
const lvMult = (lv: number) => 1 + .2 * (lv - 1);
/** 수액 걸이: 레벨마다 생산량 +10, 간격 -0.5초 */
const ivAmt = (lv: number) => 25 + 10 * (lv - 1), ivGap = (lv: number) => 8 - .5 * (lv - 1);
/** 연속 실패 시 자동 지원 (스테이지별, 최대 3단계) */
const helpKey = (id: number) => `mw-def-help-${id}`;
const getHelp = (id: number) => { try { return Math.min(3, Number(localStorage.getItem(helpKey(id)) ?? 0) || 0); } catch { return 0; } };
const setHelp = (id: number, n: number) => { try { n ? localStorage.setItem(helpKey(id), String(n)) : localStorage.removeItem(helpKey(id)); } catch {} };
const stageCoins = (id: number, stars: number) => Math.round((15 + id * 5) * stars / 3);

/** 그림을 가로 띠로 잘라 휘게 그려요: 윗몸은 크게, 발은 고정 → 걷기·덮치기·움찔 */
function drawWarp(x: CanvasRenderingContext2D, im: CanvasImageSource, cx: number, footY: number, GS: number, dxAt: (h: number) => number, stretch = 1) {
  const iw = (im as HTMLImageElement).naturalWidth || 200, ih = (im as HTMLImageElement).naturalHeight || 200, N = 18, bh = ih / N, dh = GS * stretch / N;
  for (let i = 0; i < N; i++) { const h = 1 - (i + .5) / N; x.drawImage(im, 0, i * bh, iw, bh + .6, cx - GS / 2 + dxAt(h), footY - GS * stretch + i * dh, GS, dh + .8); }
}
export default function Defense({ ranks }: { ranks: Row[] }) {
  const cv = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<UnitKind>("nurse");
  const [ui, setUi] = useState({ sun: 150, wave: 0, running: false });
  const [save, setSave] = useState<Required<Pick<Saved, "stars" | "coins" | "levels" | "cleared">> & { dailyDone?: string }>({ stars: {}, coins: 0, levels: {}, cleared: 0 });
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"map" | "play">("map");
  const [chapter, setChapter] = useState(1);
  const [stage, setStage] = useState<StageDef | null>(null);
  const [daily, setDaily] = useState(false);
  const [result, setResult] = useState<{ win: boolean; stars: number; coins: number; first: boolean; xp?: number } | null>(null);
  const [showUp, setShowUp] = useState(false);
  const [unlockCard, setUnlockCard] = useState<UnitDef | null>(null);
  const [toast, setToast] = useState("");
  const [fast, setFast] = useState(false);
  const g = useRef({ units: [] as Unit[], germs: [] as Germ[], shots: [] as Shot[], fx: [] as Fx[], sun: 150, t: 0, wave: 0, nextSpawn: 4, spawned: 0, waveSize: 3, running: false, paused: false, assist: false, carts: [true, true, true, true, true] as boolean[], cartFx: [] as { r: number; x: number }[], raf: 0, help: 0, speed: 1, W: 0, H: 0, last: 0, lost: 0, stage: null as StageDef | null, daily: false, levels: {} as Partial<Record<UnitKind, number>>, sunDrops: [] as { x: number; y: number; t: number }[], drops: [] as { x: number; y: number; vy: number; vx: number; c: string; t: number; floor: number }[] });
  const saveRef = useRef(save); saveRef.current = save;

  const persist = (next: typeof save) => { setSave(next); saveGameState("defense", next).catch(() => {}); };
  useEffect(() => {
    loadGameState("defense").then(s => { const d = (s as Saved | null) ?? {};
      let stars = d.stars ?? {}, coins = d.coins ?? 0, cleared = d.cleared ?? 0;
      if (!d.stars && d.bestWave) { cleared = Math.min(STAGES, Math.floor(Number(d.bestWave))); stars = {}; for (let i = 1; i <= cleared; i++) stars[i] = 1; coins = cleared * 20; }
      setSave({ stars, coins, levels: d.levels ?? {}, cleared, dailyDone: d.dailyDone }); setChapter(Math.min(3, Math.ceil((cleared + 1) / 10))); setLoaded(true);
      try { if (location.search.includes("unlockdemo")) setUnlockCard(UNITS.ortho); } catch {} }).catch(() => setLoaded(true));
  }, []);
  useEffect(() => { g.current.levels = save.levels; }, [save.levels]);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const closeUnlock = () => { setUnlockCard(null); g.current.paused = false; };

  useEffect(() => {
    const c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = box.current!.getBoundingClientRect(); if (!r.width) return; const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = r.width * 0.62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const cw = () => s.W / COLS, ch = () => s.H / ROWS;
    const rowOk = (r: number) => { const id = s.stage?.id ?? 99; if (id === 1) return r === 2; if (id === 2) return r >= 1 && r <= 2; if (s.stage?.mod === "iso" || id <= 4) return r >= 1 && r <= 3; if (id <= 7) return r <= 3; return true; };
    const lv = (k: UnitKind) => lvMult(s.levels[k] ?? 1);
    const draw = () => {
      const CW = cw(), CH = ch();
      for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { x.fillStyle = !rowOk(r) ? "#C9D3CE" : (r + cc) % 2 ? "#EAF2EE" : "#DFEBE5"; x.fillRect(cc * CW, r * CH, CW, CH); }
      if (s.stage?.mod === "night") { x.fillStyle = "rgba(20,30,60,.18)"; x.fillRect(0, 0, s.W, s.H); }
      x.strokeStyle = "rgba(0,0,0,.05)"; x.lineWidth = 1; for (let r = 1; r < ROWS; r++) { x.beginPath(); x.moveTo(0, r * CH); x.lineTo(s.W, r * CH); x.stroke(); }
      x.fillStyle = "#E2574C"; x.fillRect(0, 0, 5, s.H); x.fillStyle = "rgba(226,87,76,.12)"; x.fillRect(5, 0, CW * .5, s.H);
      x.fillStyle = "#B8C9C1"; x.fillRect(s.W - 6, 0, 6, s.H);
      for (const u of s.units) if (u.kind === "anes") { x.fillStyle = "rgba(120,100,220,.10)"; x.fillRect(u.c * CW, u.r * CH, s.W - u.c * CW, CH); }
      x.textAlign = "center"; x.textBaseline = "middle";
      for (const u of s.units) { const cx = u.c * CW + CW / 2, cy = u.r * CH + CH / 2, wob = Math.sin(s.t * 3 + u.c + u.r) * 1.2, S = Math.min(CW * 1.25, CH * 1.3);
        const kick = (u.atk && u.atk > 0 ? Math.sin(u.atk * Math.PI) * 4 : 0) - (u.run ?? 0); const runBob = u.run ? Math.abs(Math.sin(s.t * 18)) * 4 : 0;
        const im = art(u.kind, HERO_SVG[u.kind]);
        if (im) { x.save(); x.translate(cx - kick, cy + wob - runBob); if (u.kind === "punk" && (u.fuse ?? 1) > 0) x.translate(Math.sin(s.t * 40) * 1.5, 0); if (u.kind === "ortho" && u.atk && u.atk > 0) x.rotate(-Math.sin(u.atk * Math.PI) * .25); x.drawImage(im, -S / 2, -S * .62, S, S); x.restore(); }
        else { x.fillStyle = UCOLOR[u.kind]; x.beginPath(); x.arc(cx, cy, CH * .38, 0, 7); x.fill(); x.font = `${Math.floor(CH * .45)}px system-ui`; x.fillText(UNITS[u.kind].icon, cx, cy + 1); }
        if (u.cd > 0 && u.kind !== "iv" && u.kind !== "wall") { x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2.5; x.beginPath(); x.arc(cx + S * .32, cy - S * .42, 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, 1 - Math.min(1, u.cd / 3))); x.stroke(); }
        const l = s.levels[u.kind] ?? 1; if (l > 1) { x.font = `700 ${Math.floor(CH * .2)}px system-ui`; x.fillStyle = "#fff"; x.strokeStyle = "#2C6B5E"; x.lineWidth = 3; x.strokeText("Lv" + l, cx - S * .3, cy - S * .45); x.fillText("Lv" + l, cx - S * .3, cy - S * .45); }
        const p = u.hp / u.max; if (p < 1) { x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(u.c * CW + 6, u.r * CH + CH - 5, CW - 12, 3); x.fillStyle = p > .5 ? "#2C6B5E" : p > .25 ? "#E6B341" : "#E2574C"; x.fillRect(u.c * CW + 6, u.r * CH + CH - 5, (CW - 12) * p, 3); } }
      for (const sh of s.shots) {
        const cy = sh.r * CH + CH / 2 - CH * .08;
        if (sh.kind === "scissor") { x.save(); x.translate(sh.x, cy); x.rotate(sh.spin); x.shadowColor = "#BFF6FF"; x.shadowBlur = 10; for (let k = 0; k < 3; k++) { x.rotate(Math.PI * 2 / 3); x.fillStyle = "#E9EEF4"; x.beginPath(); x.moveTo(0, -2); x.lineTo(CH * .32, 0); x.lineTo(0, 2); x.fill(); } x.restore(); }
        else if (sh.kind === "poison") { const yy = cy - Math.sin(Math.min(Math.PI, sh.spin * 2.2)) * CH * .6; x.save(); x.shadowColor = "#8CFF6A"; x.shadowBlur = 12; x.fillStyle = "#5BE37D"; x.beginPath(); x.arc(sh.x, yy, CH * .1, 0, 7); x.fill(); x.fillStyle = "#DFFFE6"; x.fillRect(sh.x - 2, yy - CH * .18, 4, CH * .1); x.restore(); }
        else { x.save(); const col = sh.kind === "pill" ? "#FFD36E" : "#5FD1F5"; x.shadowColor = col; x.shadowBlur = 10; const g2 = x.createLinearGradient(sh.x - CW * .5, 0, sh.x, 0); g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(1, col); x.strokeStyle = g2; x.lineWidth = 3; x.beginPath(); x.moveTo(sh.x - CW * .5, cy); x.lineTo(sh.x, cy); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(sh.x, cy, 2.6, 0, 7); x.fill(); x.restore(); }
      }
      for (const z of s.germs) {
        const big = z.kind === 3 || z.kind === 7;
        const bounce = z.eating ? Math.abs(Math.sin(s.t * 14)) * 3 : Math.abs(Math.sin(s.t * (z.kind === 6 ? 16 : 6) + z.x * .05)) * (z.kind === 6 ? 8 : 4), cy = z.r * CH + CH / 2 - bounce, R = big ? CH * .46 : z.kind === 6 ? CH * .22 : CH * .3;
        x.fillStyle = "rgba(0,0,0,.12)"; x.beginPath(); x.ellipse(z.x, z.r * CH + CH - 4, R * .8, 3, 0, 0, 7); x.fill();
        if (big) { x.save(); x.globalAlpha = .18 + Math.sin(s.t * 5) * .08; const ag = x.createRadialGradient(z.x, cy, 0, z.x, cy, R * 1.6); ag.addColorStop(0, z.kind === 7 ? "#FF5A1A" : "#B5FF5A"); ag.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = ag; x.beginPath(); x.arc(z.x, cy, R * 1.6, 0, 7); x.fill(); x.restore(); }
        if (z.poison > 0) { x.save(); x.globalAlpha = .35; x.fillStyle = "#4CAF50"; x.beginPath(); x.arc(z.x, cy, R * 1.2, 0, 7); x.fill(); x.restore(); }
        const gim = art("g" + z.kind, GERM_SVG[z.kind]), GS = R * (big ? 3.4 : 3.7), squash = z.eating ? 1 + Math.sin(s.t * 14) * .06 : 1;
        const sd = z.seed ?? 0, foot = z.r * CH + CH / 2 + GS * .4;
        const wp = s.t * (z.kind === 2 ? 11 : z.kind === 6 ? 14 : big ? 4.5 : 7) + sd, ap = s.t * (big ? 4.5 : 6.5) + sd, strike = z.eating ? Math.max(0, Math.sin(ap)) ** 3 : 0, wind = z.eating ? Math.max(0, -Math.sin(ap)) : 0;
        const hitK = (z.hit ?? 0) * 3, stomp = z.eating ? 0 : Math.abs(Math.sin(wp)) * GS * (big ? .035 : .025);
        const dxAt = (h: number) => (z.eating ? -h * h * GS * .26 * strike + h * h * GS * .07 * wind : h ** 1.5 * Math.sin(wp) * GS * .045 + (h < .3 ? (.3 - h) / .3 * Math.sin(wp * 2) * GS * .03 : 0)) + h * GS * .08 * hitK;
        const stretch = (z.eating ? 1 - strike * .07 + wind * .05 : 1 + Math.sin(wp * 2) * .025) * (z.kind === 6 ? 1 + Math.sin(s.t * 40) * .03 : 1);
        if (gim) { drawWarp(x, gim, z.x, foot - stomp * (z.kind === 6 ? 3 : 1), GS, dxAt, stretch);
          if (hitK > 0) { x.save(); x.globalAlpha = Math.min(.7, hitK * .5); x.globalCompositeOperation = "lighter"; drawWarp(x, gim, z.x, foot - stomp, GS, dxAt, stretch); x.restore(); }
          if (z.eating && strike > .6) { x.save(); x.globalAlpha = (strike - .6) * 2.5; x.strokeStyle = "#FFF"; x.lineWidth = big ? 5 : 3; x.shadowColor = "#FF3030"; x.shadowBlur = 14; x.beginPath(); x.arc(z.x - GS * .28, cy - GS * .05, GS * .34, Math.PI * .55, Math.PI * 1.4); x.stroke(); x.restore(); }
          if (big && !z.eating && Math.abs(Math.sin(wp)) < .08) { x.save(); x.globalAlpha = .35; x.fillStyle = "#8C7B66"; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(z.x + (k - 1.5) * GS * .12, foot - 2, GS * .04, 0, 7); x.fill(); } x.restore(); } }
        else { x.fillStyle = GCOLOR[z.kind]; x.beginPath(); x.arc(z.x, cy, R, 0, 7); x.fill(); x.font = `${Math.floor(R * 1.3)}px system-ui`; x.fillText(GICON[z.kind], z.x, cy + 1); }
        if (z.slow > 0) { x.font = `${Math.floor(CH * .3)}px system-ui`; x.fillText("💤", z.x + R, cy - R); }
        x.fillStyle = "rgba(0,0,0,.15)"; x.fillRect(z.x - R, z.r * CH + 4, R * 2, 3); x.fillStyle = big ? "#B71C1C" : "#E2574C"; x.fillRect(z.x - R, z.r * CH + 4, R * 2 * (z.hp / z.max), 3);
      }
      for (const d of s.drops) { x.save(); x.globalAlpha = Math.min(1, d.t * 2); x.fillStyle = d.c; if (d.y >= d.floor) { x.beginPath(); x.ellipse(d.x, d.floor, 4, 1.6, 0, 0, 7); x.fill(); } else { x.beginPath(); x.ellipse(d.x, d.y, 1.8, 3.2, 0, 0, 7); x.fill(); } x.restore(); }
      for (const f of s.fx) {
        const cy = f.r * CH + CH / 2, a = Math.max(0, f.t);
        if (f.kind === "bolt") { x.save(); x.globalAlpha = a; x.strokeStyle = "#FFE766"; x.lineWidth = 3; x.shadowColor = "#FFE766"; x.shadowBlur = 12; x.beginPath(); let px = f.x, py = cy; x.moveTo(px, py); while (px < s.W) { px += 14; py = cy + (Math.random() - .5) * CH * .6; x.lineTo(px, py); } x.stroke(); x.restore(); }
        if (f.kind === "boom") { x.save(); x.globalAlpha = a; x.shadowColor = "#FFD36E"; x.shadowBlur = 14; x.strokeStyle = "#FFD36E"; x.lineWidth = 5 * a + 1; x.beginPath(); x.ellipse(f.x, cy + CH * .25, (1 - a) * CW * 1.6 + 8, ((1 - a) * CW * 1.6 + 8) * .35, 0, 0, 7); x.stroke(); x.fillStyle = "rgba(140,110,70,.5)"; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(f.x + Math.cos(k) * (1 - a) * CW * 1.3, cy + CH * .2 - Math.abs(Math.sin(k * 2)) * (1 - a) * CH * .5, 3, 0, 7); x.fill(); } x.restore(); }
        if (f.kind === "dmg") { x.save(); x.globalAlpha = a; x.font = `600 ${Math.floor(CH * .32)}px system-ui`; x.fillStyle = "#E2574C"; x.strokeStyle = "#fff"; x.lineWidth = 3; const yy = (f.y ?? cy) - (1 - a) * 18; x.strokeText(f.txt ?? "", f.x, yy); x.fillText(f.txt ?? "", f.x, yy); x.restore(); }
        if (f.kind === "die" && f.k !== undefined) { const im = art("g" + f.k, GERM_SVG[f.k]); if (im) { const GS3 = f.gs ?? CH; x.save(); x.globalAlpha = Math.min(1, a * 1.6); x.translate(f.x, f.r * CH + CH / 2 + GS3 * .4); x.rotate((1 - a) * 1.25); x.scale(1, 1 - (1 - a) * .25); x.drawImage(im, -GS3 / 2, -GS3, GS3, GS3); x.restore(); } }
        if (f.kind === "nuke") { x.save(); const rr = (1 - a) * CW * 1.9 + 10; const gr = x.createRadialGradient(f.x, cy, 0, f.x, cy, rr); gr.addColorStop(0, `rgba(255,250,200,${a})`); gr.addColorStop(.4, `rgba(255,150,40,${a * .9})`); gr.addColorStop(1, "rgba(200,40,20,0)"); x.fillStyle = gr; x.beginPath(); x.arc(f.x, cy, rr, 0, 7); x.fill(); x.globalAlpha = a; x.strokeStyle = "#FFE08A"; x.lineWidth = 3; x.beginPath(); x.arc(f.x, cy, rr * 1.15, 0, 7); x.stroke(); x.restore(); }
        if (f.kind === "laser") { x.save(); x.globalAlpha = Math.min(1, a * 2); const w = (f.w ?? 6) * a; x.shadowColor = "#FF4D4D"; x.shadowBlur = 18; x.strokeStyle = "#FF5A4E"; x.lineWidth = w + 4; x.beginPath(); x.moveTo(f.x, cy - CH * .08); x.lineTo(s.W, cy - CH * .08); x.stroke(); x.strokeStyle = "#FFF2F0"; x.lineWidth = Math.max(1, w * .4); x.stroke(); x.restore(); }
        if (f.kind === "blast") { x.save(); x.globalAlpha = a; x.fillStyle = "rgba(255,210,110,.55)"; x.beginPath(); x.moveTo(f.x, cy - CH * .08); x.arc(f.x, cy - CH * .08, CW * 1.4 * (1.2 - a * .4), -.45, .45); x.closePath(); x.fill(); x.strokeStyle = "#FFE08A"; x.lineWidth = 2; for (const [px, py] of f.pts ?? []) { x.beginPath(); x.moveTo(f.x, cy - CH * .08); x.lineTo(px, py); x.stroke(); } x.restore(); }
        if (f.kind === "chain") { x.save(); x.globalAlpha = a; x.shadowColor = f.w === 1 ? "#FF2A1A" : "#FFF27A"; x.shadowBlur = 16; x.strokeStyle = f.w === 1 ? "#FF9A8A" : "#FFF7B0"; x.lineWidth = 3; x.beginPath(); const P = f.pts ?? []; if (P.length) { x.moveTo(P[0][0], P[0][1]); for (let k = 1; k < P.length; k++) { const [ax, ay] = P[k - 1], [bx, by] = P[k]; for (let q = 1; q <= 5; q++) { const t2 = q / 5; x.lineTo(ax + (bx - ax) * t2 + (q < 5 ? (Math.random() - .5) * 14 : 0), ay + (by - ay) * t2 + (q < 5 ? (Math.random() - .5) * 14 : 0)); } } } x.stroke(); x.restore(); }
        if (f.kind === "gas") { x.save(); x.globalAlpha = a * .45; for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? "#C9A2FF" : "#B18CFF"; x.beginPath(); x.arc(f.x + k * CW * .6 + (1 - a) * CW, cy + Math.sin(k + s.t * 3) * 6, CH * (.3 + (1 - a) * .25), 0, 7); x.fill(); } x.restore(); }
        if (f.kind === "cloud") { x.save(); x.globalAlpha = a * .6; x.fillStyle = "#6CC070"; x.beginPath(); x.arc(f.x, cy, CW * .55, 0, 7); x.fill(); x.restore(); }
      }
      x.font = `${Math.floor(CH * .45)}px system-ui`;
      for (let r = 0; r < ROWS; r++) if (s.carts[r] && rowOk(r)) x.fillText("🛒", CW * .3, r * CH + CH / 2);
      for (const c of s.cartFx) { x.save(); x.font = `${Math.floor(CH * .6)}px system-ui`; x.fillText("🛒", c.x, c.r * CH + CH / 2); x.restore(); }
      for (const d of s.sunDrops) x.fillText("💧", d.x, d.y);
    };
    const randRow = () => { const rows = [0, 1, 2, 3, 4].filter(rowOk); return rows[Math.floor(Math.random() * rows.length)]; };
    const spawn = (kind: number, r = randRow(), x0 = s.W + 10, hpScale = 1) => {
      const st = s.stage!, w = s.wave, m = st.mult * (st.mod === "tough" ? 1.5 : 1) * (1 + w * .06), sp = st.spd * (st.mod === "rush" ? 1.3 : 1) * (1 + w * .03);
      const base = [60, 150, 340, 1800, 120, 260, 50, 3500][kind] * m * hpScale * (s.assist ? .65 : 1) * (1 - .15 * s.help), speed = [15, 11, 9, 7, 13, 9, 28, 6][kind] * sp * (1 + Math.random() * .2), dmg = [10, 16, 30, 80, 12, 20, 8, 100][kind];
      s.germs.push({ r, x: x0, hp: base, max: base, speed, dmg, kind, eating: false, slow: 0, poison: 0, cd: 6 });
    };
    const spawnGerm = () => { const st = s.stage!, w = s.wave; const pool = st.pool.filter(k => k === 0 || Math.random() < Math.min(.6, .2 + w * .05 + st.id * .01)); spawn(pool[Math.floor(Math.random() * pool.length)]); };
    const finish = (win: boolean) => {
      s.running = false; cancelAnimationFrame(s.raf); draw();
      const st = s.stage!, cur = saveRef.current;
      if (!win) { sfx.boom(); haptic([60, 40, 60]); shake(box.current, "l"); if (!s.daily) setHelp(st.id, Math.min(3, s.help + 1)); setUi(u => ({ ...u, running: false })); setResult({ win: false, stars: 0, coins: 0, first: false }); return; }
      setHelp(st.id, 0);
      const stars = Math.min(s.assist ? 2 : 3, s.lost === 0 ? 3 : s.lost <= 3 ? 2 : 1);
      const prevStars = cur.stars[st.id] ?? 0, first = prevStars === 0;
      let coins = stageCoins(st.id, stars) + (first ? 30 : 0);
      if (s.daily) coins *= 2;
      const next = { ...cur, stars: { ...cur.stars, [st.id]: Math.max(prevStars, stars) }, coins: cur.coins + coins, cleared: Math.max(cur.cleared, st.id), dailyDone: s.daily ? kstDay() : cur.dailyDone };
      persist(next);
      sfx.level(); haptic([30, 30, 60]); setUi(u => ({ ...u, running: false }));
      setResult({ win: true, stars, coins, first });
      if (st.id > cur.cleared) { saveScore("defense", st.id).catch(() => {}); const nu = ORDER.find(k => UNITS[k].unlock > cur.cleared && UNITS[k].unlock <= st.id); if (nu) setTimeout(() => setUnlockCard(UNITS[nu]), 900); }
      if (s.daily) defenseDaily(kstDay()).then(xp => { if (xp) setResult(r => r && { ...r, xp }); }).catch(() => {});
    };
    const laneGerms = (r: number, fromX: number) => s.germs.filter(z => z.r === r && z.x > fromX);
    const tick = (now: number) => {
      if (s.paused) { s.last = now; s.raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(.05, (now - s.last) / 1000) * s.speed; s.last = now; s.t += dt; const CW = cw(), CH = ch(); const st = s.stage!;
      s.nextSpawn -= dt;
      if (s.nextSpawn <= 0) {
        if (s.spawned < s.waveSize) { spawnGerm(); s.spawned++; if (st.boss && s.wave === st.waves && s.spawned === s.waveSize) { spawn(st.boss); sfx.boom(); pop(box.current, s.W / 2, s.H * .3, "⚠ BOSS", "bad big"); shake(box.current, "m"); } s.nextSpawn = Math.max(.5, 2.3 - s.wave * .1 - st.id * .02); }
        else if (!s.germs.length) {
          if (s.wave >= st.waves) return finish(true);
          sfx.level(); pop(box.current, s.W / 2, s.H / 2, `WAVE ${s.wave + 1}/${st.waves}`, "good big");
          s.wave++; s.spawned = 0; s.waveSize = st.id <= 2 ? 3 : Math.round((2 + s.wave * 1.5 + Math.floor(st.id / 5)) * (st.mod === "double" ? 2 : 1)); s.nextSpawn = 3; setUi(u => ({ ...u, wave: s.wave })); } }
      if (st.mod !== "night" && Math.random() < dt * Math.max(.05, .16 - s.wave * .008)) s.sunDrops.push({ x: 30 + Math.random() * (s.W - 60), y: 20 + Math.random() * (s.H - 40), t: 8 });
      for (const d of s.sunDrops) if ((d.t -= dt) < 5.5) { s.sun += 25; d.t = -1; setUi(u => ({ ...u, sun: s.sun })); pop(box.current, d.x, d.y, "+25", "good"); }
      s.sunDrops = s.sunDrops.filter(d => d.t > 0);
      for (const z of s.germs) if (z.hit) z.hit = Math.max(0, z.hit - dt);
      for (const u of s.units) { if (u.atk) u.atk = Math.max(0, u.atk - dt * 4); u.cd -= dt; const fx = u.c * CW + CW * .7, lane = laneGerms(u.r, u.c * CW), D = Math.round(UNITS[u.kind].dmg * lv(u.kind));
        switch (u.kind) {
          case "iv": if (u.cd <= 0) { const L = s.levels.iv ?? 1, amt = ivAmt(L); u.cd = ivGap(L); s.sun += amt; setUi(x => ({ ...x, sun: s.sun })); pop(box.current, u.c * CW + CW / 2, u.r * CH + CH * .2, `+${amt}💧`, "good"); } break;
          case "nurse": if (u.cd <= 0 && lane.length) { u.cd = 1.4; u.atk = 1; s.shots.push({ r: u.r, x: fx, dmg: D, kind: "needle", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "xray": if (u.cd <= 0 && lane.length) { u.cd = 2.2; u.atk = 1; for (const z of lane) { const d = z.kind === 5 ? Math.round(D / 2) : D; z.hp -= d; z.hit = .25; s.fx.push({ kind: "dmg", r: u.r, x: z.x, y: u.r * CH + CH * .3, t: 1, txt: String(d) }); } s.fx.push({ kind: "laser", r: u.r, x: fx, t: .5, w: 8 }); sfx.tick(); } break;
          case "doctor": { const near = s.germs.filter(z => Math.abs(z.r - u.r) <= 1 && z.x > u.c * CW && z.x < u.c * CW + CW * 3.6).sort((a2, b2) => (a2.x + Math.abs(a2.r - u.r) * CW) - (b2.x + Math.abs(b2.r - u.r) * CW)).slice(0, 4);
            if (u.cd <= 0 && near.length) { u.cd = 2.6; u.atk = 1; const pts: [number, number][] = []; for (const z of near) { const d = Math.round(D * (z.r === u.r ? 1 : .6)); z.hp -= d; z.hit = .25; pts.push([z.x, z.r * CH + CH / 2]); s.fx.push({ kind: "dmg", r: z.r, x: z.x, y: z.r * CH + CH * .3, t: 1, txt: String(d) }); } s.fx.push({ kind: "blast", r: u.r, x: fx, t: .45, pts }); shake(box.current, "s"); sfx.hit(); } break; }
          case "ortho": { const near = lane.filter(z => z.x < u.c * CW + CW * 2.6); if (u.cd <= 0 && near.length) { u.cd = 2.8; u.atk = 1; shake(box.current, "m"); sfx.boom(); for (const z of near) z.hit = .3; for (const z of near) { z.hp -= D; s.fx.push({ kind: "dmg", r: u.r, x: z.x, y: u.r * CH + CH * .3, t: 1, txt: String(D) }); } s.fx.push({ kind: "boom", r: u.r, x: u.c * CW + CW * 1.6, t: 1 }); } break; }
          case "anes": for (const z of lane) z.slow = .6; if (u.cd <= 0 && lane.length) { u.cd = 2; u.atk = 1; for (const z of lane.filter(z2 => z2.x < u.c * CW + CW * 4)) { z.hp -= D; z.hit = .15; } s.fx.push({ kind: "gas", r: u.r, x: fx, t: 1 }); } break;
          case "lab": if (u.cd <= 0 && lane.length) { u.cd = 3; u.atk = 1; s.shots.push({ r: u.r, x: fx, dmg: D, kind: "poison", hit: new Set(), pierce: 1, spin: 0 }); } break;
          case "ems": if (u.cd <= 0 && lane.length) { u.cd = 6; u.atk = 1; let cur = lane.reduce((m, z) => z.x < m.x ? z : m, lane[0]); const hitSet = new Set<Germ>(); const pts: [number, number][] = [[fx, u.r * CH + CH * .3]];
            for (let k = 0; k < 6 && cur; k++) { hitSet.add(cur); const d = Math.round(D * Math.pow(.85, k)); cur.hp -= d; cur.hit = .3; pts.push([cur.x, cur.r * CH + CH / 2]); s.fx.push({ kind: "dmg", r: cur.r, x: cur.x, y: cur.r * CH + CH * .3, t: 1, txt: String(d) }); const from: Germ = cur; cur = s.germs.filter(o => !hitSet.has(o) && Math.hypot(o.x - from.x, (o.r - from.r) * CH) < CW * 2.4).sort((a2, b2) => Math.hypot(a2.x - from.x, (a2.r - from.r) * CH) - Math.hypot(b2.x - from.x, (b2.r - from.r) * CH))[0]; }
            s.fx.push({ kind: "chain", r: u.r, x: fx, t: .6, pts }); shake(box.current, "s"); sfx.boom(); } break;
          case "punk": { if (u.fuse === undefined) { if (!lane.length) break; u.fuse = .6; pop(box.current, u.c * CW + CW / 2, u.r * CH, ["😅 저 오늘 못 가요!", "ㅈㅅ 펑크요!", "급한 일이 생겨서…", "단톡 나갑니다"][Math.floor(Math.random() * 4)], "bad"); }
            u.fuse -= dt; if (u.fuse <= 0) { u.run = (u.run ?? 0) + 190 * dt; const px = u.c * CW + CW / 2 + u.run; const hitG = s.germs.find(z => z.r === u.r && Math.abs(z.x - px) < CW * .5);
              if (hitG || px > s.W - CW * .3) { u.hp = 0; sfx.boom(); haptic([80, 40, 120]); shake(box.current, "l"); s.fx.push({ kind: "nuke", r: u.r, x: px, t: 1 });
                for (const z of s.germs) if (Math.abs(z.r - u.r) <= 1 && Math.abs(z.x - px) < CW * 1.4) { const d = z.kind === 3 || z.kind === 7 ? Math.round(D * .6) : D; z.hp -= d; z.hit = .4; s.fx.push({ kind: "dmg", r: z.r, x: z.x, y: z.r * CH + CH * .3, t: 1, txt: String(d) }); }
                pop(box.current, px, u.r * CH + CH / 2, "💥 펑!!", "bad big"); } } break; }
          case "ornurse": if (u.cd <= 0 && lane.length) { u.cd = 2.4; u.atk = 1; s.shots.push({ r: u.r, x: fx, dmg: D, kind: "scissor", hit: new Set(), pierce: 3, spin: 0 }); } break;
        } }
      for (const sh of s.shots) { sh.x += (sh.kind === "poison" ? 180 : sh.kind === "scissor" ? 300 : 260) * dt; sh.spin += dt * (sh.kind === "scissor" ? 14 : 1.2);
        for (const z of s.germs) { if (z.r === sh.r && !sh.hit.has(z) && Math.abs(z.x - sh.x) < CW * .3) {
            const d = z.kind === 5 && (sh.kind === "needle" || sh.kind === "beam") ? Math.round(sh.dmg / 2) : sh.dmg;
            z.hp -= d; z.hit = .2; sh.hit.add(z); s.fx.push({ kind: "dmg", r: sh.r, x: z.x, y: z.r * CH + CH * .3, t: 1, txt: String(d) }); if (z.hp <= 0) { sfx.hit(); burst(box.current, z.x, z.r * CH + CH / 2, GCOLOR[z.kind], 8); }
            if (sh.kind === "poison") { z.poison = 4; s.fx.push({ kind: "cloud", r: sh.r, x: z.x, t: .6 }); for (const o of s.germs) if (o !== z && o.r === z.r && Math.abs(o.x - z.x) < CW) o.poison = 4; }
            if (sh.hit.size >= sh.pierce) sh.x = 1e9; } } }
      s.shots = s.shots.filter(sh => sh.x < s.W + 20);
      for (const f of s.fx) f.t -= dt * (f.kind === "bolt" ? 3 : f.kind === "dmg" ? 1.4 : f.kind === "laser" ? 2.2 : f.kind === "chain" ? 2 : f.kind === "nuke" ? 1.4 : f.kind === "die" ? 1.3 : 1.6); s.fx = s.fx.filter(f => f.t > 0);
      // 괴물 연출: 입·코에서 피/침 뚝뚝, 보스 스킬
      for (const z of s.germs) { if (z.seed === undefined) { z.seed = Math.random() * 6; z.cd2 = 3 + Math.random() * 3; }
        const big2 = z.kind === 3 || z.kind === 7, Rr = big2 ? CH * .46 : z.kind === 6 ? CH * .22 : CH * .3, GS2 = Rr * (big2 ? 3.4 : 3.7), [mx, my] = MOUTH[z.kind];
        if (Math.random() < dt * (z.eating ? 4 : 1.2)) s.drops.push({ x: z.x + mx * GS2 + (Math.random() - .5) * 4, y: z.r * CH + CH / 2 + my * GS2, vx: (Math.random() - .5) * 10, vy: 10 + Math.random() * 20, c: DRIP[z.kind], t: 1.4, floor: z.r * CH + CH - 6 });
        z.cd2! -= dt;
        if (z.kind === 7 && z.cd2! <= 0) { // 슈퍼박테리아 군주: 입에서 붉은 번개
          const tgt = s.units.filter(u => u.r === z.r && u.c * CW < z.x).sort((a2, b2) => b2.c - a2.c)[0] ?? s.units.filter(u => Math.abs(u.r - z.r) <= 1).sort((a2, b2) => b2.c - a2.c)[0];
          if (tgt) { z.cd2 = 4; tgt.hp -= 45; s.fx.push({ kind: "chain", r: z.r, x: z.x, t: .7, w: 1, pts: [[z.x + mx * GS2, z.r * CH + CH / 2 + my * GS2], [tgt.c * CW + CW / 2, tgt.r * CH + CH / 2]] }); s.fx.push({ kind: "dmg", r: tgt.r, x: tgt.c * CW + CW / 2, y: tgt.r * CH + CH * .2, t: 1, txt: "-45" }); sfx.boom(); shake(box.current, "s"); } else z.cd2 = 1; }
        if (z.kind === 3 && z.eating && z.cd2! <= 0) { // 역병 오크: 도끼로 내려찍기 → 앞 2칸 충격파
          z.cd2 = 5; for (const u of s.units) if (u.r === z.r && u.c * CW + CW / 2 < z.x && z.x - (u.c * CW + CW / 2) < CW * 2.2) { u.hp -= 60; s.fx.push({ kind: "dmg", r: u.r, x: u.c * CW + CW / 2, y: u.r * CH + CH * .2, t: 1, txt: "-60" }); }
          s.fx.push({ kind: "boom", r: z.r, x: z.x - CW * .8, t: 1 }); shake(box.current, "m"); sfx.boom(); pop(box.current, z.x, z.r * CH + CH * .1, "쾅!", "bad"); }
        if (z.kind === 2 && !z.eating && z.cd2! <= 0) { z.cd2 = 4 + Math.random() * 2; z.x -= CW * .6; pop(box.current, z.x, z.r * CH + CH * .2, "도약!", "bad"); } }
      for (const d of s.drops) { d.t -= dt * (d.y >= d.floor ? 1.2 : .3); if (d.y < d.floor) { d.vy += 260 * dt; d.y = Math.min(d.floor, d.y + d.vy * dt); d.x += d.vx * dt; } }
      s.drops = s.drops.filter(d => d.t > 0).slice(-160);
      for (const z of s.germs) { if (z.poison > 0) { z.poison -= dt; z.hp -= 12 * dt; } const sp = z.speed * (z.slow > 0 ? .5 : 1); z.slow = Math.max(0, z.slow - dt);
        if (z.kind === 7) { z.cd -= dt; if (z.cd <= 0) { z.cd = 6; spawn(0, z.r, z.x + 10, .6); pop(box.current, z.x, z.r * CH + CH * .2, "소환!", "bad"); } }
        const target = s.units.find(u => !(u.kind === "punk" && (u.fuse ?? 1) <= 0) && u.r === z.r && Math.abs(u.c * CW + CW / 2 - z.x) < CW * .45 && u.c * CW + CW / 2 <= z.x + 2);
        if (target) { z.eating = true; target.hp -= z.dmg * dt; } else { z.eating = false; z.x -= sp * dt; }
        if (z.x < CW * .25 && s.carts[z.r]) { // 응급 카트: 그 줄을 한 번 싹 쓸어줌
          s.carts[z.r] = false; s.cartFx.push({ r: z.r, x: 0 }); sfx.boom(); haptic([40, 30, 40]); shake(box.current, "m"); pop(box.current, s.W / 2, z.r * CH + CH / 2, "🛒 응급 카트 출동!", "bad big");
          for (const o of s.germs) if (o.r === z.r && o.kind !== 3 && o.kind !== 7) o.hp = 0; else if (o.r === z.r) { o.hp -= o.max * .5; o.x = Math.max(o.x, CW * 3); }
          continue; }
        if (z.x < -4) return finish(false); }
      for (const z of s.germs) if (!z.warn && z.x < CW * 1.2) { z.warn = true; sfx.tick(); shake(box.current, "s"); }
      // 변이균: 죽으면 둘로 분열
      for (const z of s.germs) if (z.hp <= 0 && z.kind === 4) { spawn(0, z.r, z.x - 6, .4); spawn(0, z.r, z.x + 14, .4); pop(box.current, z.x, z.r * CH + CH * .2, "분열!", "bad"); }
      for (const z of s.germs) if (z.hp <= 0) { const bg2 = z.kind === 3 || z.kind === 7, R2 = bg2 ? CH * .46 : z.kind === 6 ? CH * .22 : CH * .3; s.fx.push({ kind: "die", r: z.r, x: z.x, t: 1, k: z.kind, gs: R2 * (bg2 ? 3.4 : 3.7) }); for (let k = 0; k < 10; k++) s.drops.push({ x: z.x, y: z.r * CH + CH * .3, vx: (Math.random() - .5) * 120, vy: -60 - Math.random() * 80, c: DRIP[z.kind], t: 1.2, floor: z.r * CH + CH - 6 }); }
      s.lost += s.units.filter(u => u.hp <= 0 && u.kind !== "punk").length; s.units = s.units.filter(u => u.hp > 0); s.germs = s.germs.filter(z => z.hp > 0);
      for (const c of s.cartFx) c.x += 520 * dt; s.cartFx = s.cartFx.filter(c => c.x < s.W + 40);
      draw(); s.raf = requestAnimationFrame(tick);
    };
    (box.current as any).__start = (st: StageDef, isDaily: boolean, assist = false) => { sfx.level(); size(); s.stage = st; s.daily = isDaily; s.assist = assist; s.help = isDaily ? 0 : getHelp(st.id); s.carts = [true, true, true, true, true]; s.cartFx = []; s.units = []; s.germs = []; s.shots = []; s.fx = []; s.drops = []; s.sun = (st.mod === "rush" ? 400 : st.id <= 3 ? 300 : 250) + (assist ? 150 : 0) + 75 * s.help; s.t = 0; s.wave = 1; s.spawned = 0; s.waveSize = st.id <= 2 ? 2 : Math.round((2 + 1.5 + Math.floor(st.id / 5)) * (st.mod === "double" ? 2 : 1)); s.nextSpawn = st.id <= 2 ? 8 : 6; s.sunDrops = []; s.lost = 0; s.running = true; s.paused = false; s.last = performance.now(); setUi({ sun: s.sun, wave: 1, running: true }); if (s.help) setTimeout(() => pop(box.current, s.W / 2, s.H * .4, `🩹 자동 지원 Lv${s.help}: 세균 체력 -${15 * s.help}% · 수액 +${75 * s.help}`, "good"), 300); if (st.id === 1) { setTimeout(() => pop(box.current, s.W / 2, s.H / 2, "💡 가운데 줄에 간호사 2명 + 수액 걸이!", "good"), 400); setTimeout(() => pop(box.current, s.W / 2, s.H * .7, "세균은 8초 뒤에 와요", "good"), 2200); } s.raf = requestAnimationFrame(tick); };
    (box.current as any).__place = (kind: UnitKind, px: number, py: number) => {
      if (!s.running) return; const CW = cw(), CH = ch();
      const hit = s.sunDrops.findIndex(d => Math.hypot(d.x - px, d.y - py) < CH * .4);
      if (hit >= 0) { s.sunDrops.splice(hit, 1); s.sun += 25; setUi(u => ({ ...u, sun: s.sun })); sfx.coin(); pop(box.current, px, py, "+25", "good"); return; }
      if (UNITS[kind].unlock > saveRef.current.cleared) return;
      const c = Math.floor(px / CW), r = Math.floor(py / CH); if (c < 0 || c >= COLS - 1 || r < 0 || r >= ROWS || !rowOk(r)) return;
      if (s.units.some(u => u.r === r && u.c === c)) return; const cost = UNITS[kind].cost; if (s.sun < cost) { pop(box.current, px, py, "수액 부족", "bad"); return; }
      const hp = Math.round(UNITS[kind].hp * lv(kind));
      s.sun -= cost; s.units.push({ kind, r, c, hp, max: hp, cd: kind === "iv" ? ivGap(s.levels.iv ?? 1) : 0 }); setUi(u => ({ ...u, sun: s.sun })); sfx.tap(); haptic(8); burst(box.current, px, py, UCOLOR[kind], 8);
    };
    (box.current as any).__auto = () => {
      if (!s.running) return; const CW = cw(), CH = ch(); let n = 0;
      const rows = [2, 1, 3, 0, 4].filter(rowOk), has = (k: UnitKind) => UNITS[k].unlock <= saveRef.current.cleared;
      const plan: [UnitKind, number, number][] = [];
      for (const r of rows) { plan.push(["iv", r, 0]); plan.push(["nurse", r, 1]); }
      for (const r of rows) { plan.push([has("doctor") ? "doctor" : "nurse", r, 2]); }
      for (const r of rows) { plan.push(["iv", r, 3]); plan.push(["wall", r, 5]); }
      for (const [k, r, c] of plan) { if (s.units.some(u => u.r === r && u.c === c)) continue; if (s.sun < UNITS[k].cost) break; const hp = Math.round(UNITS[k].hp * lv(k)); s.sun -= UNITS[k].cost; s.units.push({ kind: k, r, c, hp, max: hp, cd: k === "iv" ? ivGap(s.levels.iv ?? 1) : 0 }); burst(box.current, c * CW + CW / 2, r * CH + CH / 2, UCOLOR[k], 6); n++; }
      setUi(u => ({ ...u, sun: s.sun })); if (n) { sfx.tap(); haptic(10); } else pop(box.current, s.W / 2, s.H / 2, "수액을 더 모아주세요", "bad");
    };
    (box.current as any).__speed = () => { s.speed = s.speed === 1 ? 2 : 1; return s.speed; };
    try { if (location.search.includes("devwin")) { (box.current as any).__win = () => finish(true); (box.current as any).__sun = (n: number) => { s.sun += n; }; } } catch {}
    const ro = new ResizeObserver(size); ro.observe(box.current!); size();
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); };
  }, []);

  // 데일리 챌린지: 날짜로 정해지는 스테이지 + 규칙
  const today = kstDay(), dh = hash(today);
  const dailyStage = stageDef(Math.max(1, Math.min(STAGES, (dh % Math.max(1, save.cleared + 1)) + 1)), (["night", "iso", "rush", "tough", "double"] as Mod[])[dh % 5]);
  const dailyDone = save.dailyDone === today;
  const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  const unlocked = ORDER.filter(k => UNITS[k].unlock <= save.cleared), locked = ORDER.filter(k => UNITS[k].unlock > save.cleared);
  const start = (st: StageDef, isDaily = false, assist = false) => { setStage(st); setDaily(isDaily); setResult(null); setView("play"); setShowUp(false); setTimeout(() => (box.current as any)?.__start(st, isDaily, assist), 50); };
  const upgrade = (k: UnitKind) => { const lv = save.levels[k] ?? 1; if (lv >= MAXLV) return; const cost = lvCost(k, lv); if (save.coins < cost) { flash("처방전 코인이 부족해요"); return; } sfx.coin(); haptic(10); persist({ ...save, coins: save.coins - cost, levels: { ...save.levels, [k]: lv + 1 } }); flash(`${UNITS[k].name} Lv${lv + 1}!`); };
  const Stars = ({ n, size = 14 }: { n: number; size?: number }) => <span className="stars" style={{ fontSize: size }}>{[1, 2, 3].map(i => <span key={i} className={i <= n ? "on" : ""}>★</span>)}</span>;

  return (
    <div className="card">
      <div><h3>병동 사수</h3><div className="muted">왼쪽에 의료진을 배치해 오른쪽에서 밀려오는 세균을 막아요. 수액(💧)을 눌러 모으고 수액으로 고용. 스테이지를 깨면 <b>별·처방전 코인·새 의료진</b>이 열리고, 코인으로 의료진을 강화해요. 줄마다 <b>🛒 응급 카트</b>가 한 번씩 막아줘요. 💧는 놔둬도 잠시 뒤 자동으로 모여요. (계정 저장)</div></div>
      <div className="def-bar"><span className="def-sun">💊 {save.coins}</span><span className="muted">⭐ {totalStars}/{STAGES * 3} · {save.cleared}/{STAGES} 클리어</span>
        {view === "play" ? <button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => { g.current.running = false; cancelAnimationFrame(g.current.raf); setResult(null); setView("map"); }}>맵으로</button>
          : <button type="button" className={"btn" + (showUp ? "" : " ghost")} style={{ padding: "6px 12px" }} onClick={() => setShowUp(v => !v)}>의료진 강화</button>}
      </div>
      {toast && <div className="muted">{toast}</div>}

      {view === "map" && !showUp && (
        <>
          <div className="def-daily">
            <div><b>📅 오늘의 챌린지</b> <span className="muted">{dailyStage.name} · {MODS[dailyStage.mod].name}</span><div className="muted" style={{ fontSize: 12 }}>{MODS[dailyStage.mod].desc} · 보상 코인 2배 + 경험치 100</div></div>
            {dailyDone ? <span className="tag">완료 ✓</span> : <button type="button" className="btn" disabled={!loaded} onClick={() => start(dailyStage, true)}>도전</button>}
          </div>
          <div className="cats" style={{ paddingBottom: 0 }}>{CHAPTERS.map((n, i) => <button key={n} type="button" className="cats-btn" aria-pressed={chapter === i + 1} disabled={save.cleared < i * 10} onClick={() => setChapter(i + 1)}>{i + 1}장 {n}{save.cleared < i * 10 ? " 🔒" : ""}</button>)}</div>
          <div className="def-map">
            {Array.from({ length: 10 }, (_, i) => stageDef((chapter - 1) * 10 + i + 1)).map(st => { const open = st.id <= save.cleared + 1, s3 = save.stars[st.id] ?? 0;
              return <button key={st.id} type="button" className={"def-node" + (open ? "" : " locked") + (st.id === save.cleared + 1 ? " next" : "") + (st.boss ? " boss" : "")} disabled={!open || !loaded} onClick={() => start(st)}>
                <span className="def-no">{st.boss ? GICON[st.boss] : st.name}</span>
                {open ? <Stars n={s3} /> : <span className="muted">🔒</span>}
                {st.mod !== "none" && <span className="def-mod">{MODS[st.mod].name.split(" ")[0]}</span>}
              </button>; })}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>⭐ 의료진을 하나도 잃지 않으면 별 3개, 3명 이하 2개. 보스: 5스테이지마다 🧟, 25·30은 👑 슈퍼박테리아(소환). {locked[0] ? `다음 해금: ${UNITS[locked[0]].name} (${stageDef(UNITS[locked[0]].unlock).name} 클리어)` : "모든 의료진 해금 완료!"}</div>
        </>
      )}

      {view === "map" && showUp && (
        <div className="def-up">
          <div className="muted">처방전 코인 💊으로 의료진을 강화해요. 레벨당 공격력·체력 +20%, 수액 걸이는 생산량 +10·간격 -0.5초. 최대 Lv{MAXLV}.</div>
          {ORDER.map(k => { const lv = save.levels[k] ?? 1, isU = UNITS[k].unlock <= save.cleared, cost = lvCost(k, lv);
            return <div key={k} className={"def-uprow" + (isU ? "" : " locked")}>
              <span className={"def-ico" + (isU ? " art" : "")} style={{ background: isU ? UCOLOR[k] : undefined }}>{isU ? <img src={artSrc(k, HERO_SVG[k])} alt="" draggable={false} /> : "🔒"}</span>
              <div style={{ flex: 1, minWidth: 0 }}><b>{UNITS[k].name}</b> <span className="tag">Lv{lv}</span><div className="muted" style={{ fontSize: 12 }}>{isU ? `${k === "iv" ? `${ivGap(lv)}초마다 수액 ${ivAmt(lv)} 생산${lv < MAXLV ? ` (다음 Lv: ${ivGap(lv + 1)}초·${ivAmt(lv + 1)})` : ""}` : UNITS[k].desc}${UNITS[k].dmg ? ` · 공격 ${Math.round(UNITS[k].dmg * lvMult(lv))}` : ""} · 체력 ${Math.round(UNITS[k].hp * lvMult(lv))}` : `${stageDef(UNITS[k].unlock).name} 클리어 시 해금`}</div></div>
              {isU && (lv >= MAXLV ? <span className="tag">MAX</span> : <button type="button" className={"btn" + (save.coins < cost ? " ghost" : "")} style={{ padding: "6px 10px" }} onClick={() => upgrade(k)}>💊 {cost}</button>)}
            </div>; })}
        </div>
      )}

      <div style={{ display: view === "play" ? "grid" : "none", gap: 10 }}>
        {stage && <div className="def-bar"><span className="def-sun">💧 {ui.sun}</span><span className="muted">{daily ? "📅 " : ""}{stage.name} · 웨이브 {ui.wave}/{stage.waves}{stage.mod !== "none" ? ` · ${MODS[stage.mod].name}` : ""}</span><span className="muted">잃은 의료진 {g.current.lost}</span></div>}
        {stage && <div className="row" style={{ gap: 6 }}><button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => (box.current as any)?.__auto()}>✨ 추천 배치</button><button type="button" className={"btn" + (fast ? "" : " ghost")} style={{ padding: "6px 12px" }} onClick={() => setFast(((box.current as any)?.__speed() ?? 1) === 2)}>⏩ {fast ? "2배속 ON" : "2배속"}</button></div>}
        <div className="def-shop">{unlocked.map(k => <button key={k} type="button" className={"def-unit" + (sel === k ? " sel" : "") + (ui.sun < UNITS[k].cost ? " poor" : "")} onClick={() => setSel(k)} title={UNITS[k].desc}><span className="def-ico art" style={{ background: UCOLOR[k] }}><img src={artSrc(k, HERO_SVG[k])} alt="" draggable={false} /></span><span className="def-name">{UNITS[k].name}{(save.levels[k] ?? 1) > 1 ? ` +${(save.levels[k] ?? 1) - 1}` : ""}</span><span className="def-cost">{UNITS[k].cost}</span></button>)}
          {locked.map(k => <div key={k} className="def-unit locked" title={`${stageDef(UNITS[k].unlock).name} 클리어 시 해금`}><span className="def-ico">🔒</span><span className="def-name">{UNITS[k].name}</span><span className="def-cost">{stageDef(UNITS[k].unlock).name}</span></div>)}</div>
        <div className="def-stage" ref={box} onPointerDown={e => { const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); (e.currentTarget as any).__place(sel, e.clientX - r.left, e.clientY - r.top); }}>
          <canvas ref={cv} />
          {result && (
            <div className="def-result" onPointerDown={e => e.stopPropagation()}>
              <div className="def-result-card">
                <div className="big">{result.win ? (daily ? "챌린지 성공!" : `${stage?.name} 클리어!`) : "병동이 뚫렸어요"}</div>
                {result.win ? <>
                  <Stars n={result.stars} size={34} />
                  <div>💊 +{result.coins}{result.first ? <span className="muted"> (첫 클리어 +30)</span> : null}{daily ? <span className="muted"> · 2배</span> : null}{result.xp ? <span className="tag" style={{ marginLeft: 6 }}>+{result.xp} XP</span> : null}</div>
                  <div className="row">
                    <button type="button" className="btn ghost" onClick={() => { setResult(null); setView("map"); }}>맵으로</button>
                    <button type="button" className="btn ghost" onClick={() => stage && start(stage, daily)}>다시</button>
                    {!daily && stage && stage.id < STAGES && <button type="button" className="btn" onClick={() => start(stageDef(stage.id + 1))}>다음 스테이지 ▶</button>}
                  </div>
                </> : <>
                  <div className="muted">웨이브 {ui.wave}/{stage?.waves}에서 실패<br />{!daily && stage && <><b>🩹 다음 판 자동 지원 Lv{Math.min(3, g.current.help + 1)}</b>: 세균 체력 -{15 * Math.min(3, g.current.help + 1)}% · 수액 +{75 * Math.min(3, g.current.help + 1)} (질수록 쉬워져요)<br /></>}<b>🩹 지원 받고 다시</b>: 세균 체력 -35%, 시작 수액 +150 (별은 최대 2개)</div>
                  <div className="row">
                    <button type="button" className="btn ghost" onClick={() => { setResult(null); setView("map"); }}>맵으로</button>
                    <button type="button" className="btn ghost" onClick={() => stage && start(stage, daily)}>다시 도전</button>
                    <button type="button" className="btn" onClick={() => stage && start(stage, daily, true)}>🩹 지원 받고 다시</button>
                  </div>
                </>}
              </div>
            </div>
          )}
          {unlockCard && (
            <div className="unlock" role="dialog" aria-modal="true" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
              <div className="unlock-title">새 의료진을 영입했어요!</div>
              <div className="unlock-frame">
                <div className="unlock-card">
                  <div className="unlock-top">{unlockCard.name}</div>
                  <div className="unlock-body">
                    <div className="unlock-tile"><span className="unlock-ico">{(() => { const k = ORDER.find(q => UNITS[q] === unlockCard); return k ? <img src={artSrc(k, HERO_SVG[k])} alt="" style={{ width: 88, height: 88, objectFit: "contain" }} /> : unlockCard.icon; })()}</span></div>
                    <div className="unlock-desc">{unlockCard.desc}{unlockCard.skill && <><br /><span className="tag">{unlockCard.skill}</span></>}<div className="muted" style={{ marginTop: 6 }}>고용 비용 {unlockCard.cost}💧</div></div>
                  </div>
                </div>
                <button type="button" className="unlock-btn" onClick={closeUnlock}>CONTINUE</button>
              </div>
            </div>
          )}
        </div>
        <div className="muted">{UNITS[sel].icon} {UNITS[sel].name}: {UNITS[sel].desc} · 바닥을 눌러 배치{stage && stage.pool.length > 1 ? ` · 등장: ${stage.pool.map(k => GICON[k]).join(" ")}${stage.boss ? " + " + GICON[stage.boss] : ""}` : ""}</div>
      </div>
      <details className="muted" style={{ fontSize: 12 }}><summary>세균 도감</summary>{GNAME.map((n, i) => <div key={i}>{GICON[i]} {n}</div>)}</details>
      <Board title="병동 사수 명예의 전당" rows={ranks} fmt={r => stageDef(Math.max(1, Math.min(STAGES, r.value))).name + " 클리어"} />
    </div>
  );
}
