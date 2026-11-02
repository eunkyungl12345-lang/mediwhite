"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import { HERO_SVG, art, artSrc } from "./defArt";
import { sfx, haptic, pop, shake } from "@/lib/juice";
import Board, { type Row } from "./Board";
import HowTo from "./HowTo";

/** 🧟 병원묵시록 DAY 0 — 학원묵시록식 세로 방어전.
 *  의료진 5명이 아래 바리케이드 앞에 서서 자동 공격, 좀비 떼는 위에서 몰려와요.
 *  좀비를 잡아 팀 레벨이 오르면 스킬 3개 중 1개를 골라 배우고(로그라이크), 왼쪽 스킬 버튼을 탭해 시전해요. */

const COLS = 7;
type Cls = "doctor" | "xray" | "pt" | "nurse" | "lab";
const HEROES: Record<Cls, { name: string; role: string; art: string; color: string; hp: number; atk: number; cd: number; range: number; kind: "melee" | "shot"; desc: string }> = {
  doctor: { name: "의사", role: "검사", art: "doctor", color: "#5FA8E8", hp: 260, atk: 30, cd: .8, range: 1.7, kind: "melee", desc: "메스 검기로 전방을 베어요" },
  xray: { name: "방사선사", role: "방어 전투가", art: "xray", color: "#6E5BB8", hp: 460, atk: 18, cd: 1.0, range: 1.4, kind: "melee", desc: "납 방패로 버티고 밀쳐요 · 좀비가 먼저 노려요" },
  pt: { name: "물리치료사", role: "격투가", art: "ortho", color: "#2E7D6B", hp: 300, atk: 16, cd: .36, range: 1.5, kind: "melee", desc: "빠른 연타 · 충격파" },
  nurse: { name: "간호사", role: "힐러", art: "nurse", color: "#F48FB1", hp: 220, atk: 14, cd: .9, range: 5.5, kind: "shot", desc: "주사기 사격 + 2초마다 동료 치유" },
  lab: { name: "임상병리사", role: "마법사", art: "lab", color: "#7ED69B", hp: 200, atk: 24, cd: 1.3, range: 6.5, kind: "shot", desc: "플라스크 폭발 · 번개·화염·소환" },
};
const ORDER: Cls[] = ["xray", "doctor", "pt", "nurse", "lab"]; // 왼쪽부터 서는 순서
type Skill = { id: string; who: Cls; name: string; icon: string; cd: number; desc: string };
const SKILLS: Skill[] = [
  { id: "d1", who: "doctor", name: "검기 베기", icon: "🗡️", cd: 6, desc: "전방 부채꼴 60 피해" },
  { id: "d2", who: "doctor", name: "회전 참격", icon: "🌀", cd: 9, desc: "주변 360° 50 피해 + 밀치기" },
  { id: "d3", who: "doctor", name: "돌진 베기", icon: "⚡", cd: 11, desc: "일직선 돌진, 경로 위 80 피해" },
  { id: "d4", who: "doctor", name: "성검 강림", icon: "✨", cd: 24, desc: "가장 많이 모인 곳에 거대한 빛의 검 · 150 피해 + 기절" },
  { id: "x1", who: "xray", name: "방패 밀치기", icon: "🛡️", cd: 7, desc: "전방 좀비를 크게 밀치고 25 피해" },
  { id: "x2", who: "xray", name: "X선 폭풍", icon: "☢️", cd: 12, desc: "세로 빔 1.5초, 관통 지속 피해" },
  { id: "x3", who: "xray", name: "납 방패 결계", icon: "🔰", cd: 22, desc: "4초 전원 무적 + 바리케이드 100 회복" },
  { id: "x4", who: "xray", name: "감마 폭발", icon: "💥", cd: 28, desc: "화면 전체 90 피해 (보스 60)" },
  { id: "p1", who: "pt", name: "연타", icon: "👊", cd: 5, desc: "가장 가까운 적에게 8연타" },
  { id: "p2", who: "pt", name: "충격파 발차기", icon: "🌊", cd: 9, desc: "퍼지는 충격파 55 피해 + 밀치기" },
  { id: "p3", who: "pt", name: "지진 스톰프", icon: "🦶", cd: 14, desc: "전체 4초 느려짐 + 25 피해" },
  { id: "p4", who: "pt", name: "라운드하우스", icon: "🌪️", cd: 20, desc: "회전 발차기 110 피해 광역" },
  { id: "n1", who: "nurse", name: "치유 주사", icon: "💉", cd: 6, desc: "가장 약한 동료 40% 회복" },
  { id: "n2", who: "nurse", name: "회복의 파동", icon: "💚", cd: 14, desc: "전원 30% 회복 + 바리케이드 150" },
  { id: "n3", who: "nurse", name: "정화의 빛", icon: "🌟", cd: 10, desc: "전방 빛기둥 70 피해" },
  { id: "n4", who: "nurse", name: "부활", icon: "🕊️", cd: 50, desc: "쓰러진 동료 전원 부활(60%) + 전원 50% 회복" },
  { id: "l1", who: "lab", name: "화염 플라스크", icon: "🔥", cd: 8, desc: "불바다 5초, 초당 20 피해" },
  { id: "l2", who: "lab", name: "번개 사슬", icon: "⚡", cd: 10, desc: "6마리 연쇄 번개 55 피해" },
  { id: "l3", who: "lab", name: "얼음 배양", icon: "🧊", cd: 16, desc: "전체 3초 빙결" },
  { id: "l4", who: "lab", name: "세균 소환", icon: "🦠", cd: 22, desc: "아군 세균 3마리 12초 소환" },
];
const BOOSTS = [{ id: "b_atk", name: "공격력 +15%", icon: "⚔️" }, { id: "b_hp", name: "최대 체력 +20% & 회복", icon: "❤️" }, { id: "b_cd", name: "스킬 쿨타임 -10%", icon: "⏱️" }];
const ZT = [
  { name: "좀비", hp: 70, spd: .55, dps: 12, xp: 3, size: 1, body: "#7E9C7A", cloth: "#C9D6E3" },
  { name: "러너", hp: 45, spd: 1.1, dps: 9, xp: 4, size: .92, body: "#8FA88A", cloth: "#E8A0A0" },
  { name: "뚱보", hp: 320, spd: .32, dps: 32, xp: 12, size: 1.25, body: "#6C8A63", cloth: "#B8C9A0" },
  { name: "비명꾼", hp: 90, spd: .6, dps: 10, xp: 8, size: 1, body: "#9A8FB0", cloth: "#F2F2F2" },
  { name: "보스", hp: 2200, spd: .26, dps: 70, xp: 80, size: 1.6, body: "#5A6E4E", cloth: "#7A2E2E" },
];
type MetaUp = "hp" | "atk" | "cd" | "lv";
type Meta = { vac: number; up: Record<MetaUp, number> };
const META0: Meta = { vac: 0, up: { hp: 0, atk: 0, cd: 0, lv: 0 } };
const MUPS: { k: MetaUp; icon: string; name: string; max: number; cost: (l: number) => number; desc: (l: number) => string }[] = [
  { k: "hp", icon: "❤️", name: "체력 훈련", max: 5, cost: l => 20 + l * 15, desc: l => `의료진 최대 체력 +${l * 10}%` },
  { k: "atk", icon: "⚔️", name: "장비 개량", max: 5, cost: l => 25 + l * 18, desc: l => `공격력 +${l * 8}%` },
  { k: "cd", icon: "⏱️", name: "숙련도", max: 5, cost: l => 25 + l * 18, desc: l => `스킬 쿨타임 -${l * 6}%` },
  { k: "lv", icon: "📚", name: "사전 교육", max: 2, cost: l => 60 + l * 60, desc: l => `시작하자마자 스킬 ${l}개 선택` },
];
const loadMeta = (): Meta => { try { const m = JSON.parse(localStorage.getItem("mw-apoc") || "{}"); return { vac: m.vac ?? 0, up: { ...META0.up, ...(m.up ?? {}) } }; } catch { return META0; } };
const saveMeta = (m: Meta) => { try { localStorage.setItem("mw-apoc", JSON.stringify(m)); } catch {} };
const CHAPTERS = [{ name: "DAY 0 · 정문 앞", tint: "rgba(0,0,0,0)" }, { name: "DAY 1 · 깊은 밤", tint: "rgba(10,20,60,.42)" }, { name: "DAY 2 · 핏빛 새벽", tint: "rgba(130,30,20,.3)" }, { name: "DAY 3 · 폭풍", tint: "rgba(30,34,50,.5)" }];
const chapterOf = (wave: number) => Math.min(CHAPTERS.length - 1, Math.floor((wave - 1) / 10));
const LINES = ["와라! 여기가 우리의 최후 방어선이다. 한 발자국도 물러서지 않겠어!", "환자들은 뒤에 있다. 여기서 막는다!", "콜벨이 아니라 좀비라니… 그래도 3교대보단 낫지.", "방사선사 방패 뒤로! 납은 좀비도 못 뚫어!", "주사기 리필 완료. 다음 분~!", "플라스크 투척 준비. 배양 결과: 전멸이에요.", "오늘도 정시 퇴근은 글렀네. 가자!", "보스다! 전원 스킬 아끼지 마!"];

type Hero = { k: Cls; x: number; y: number; hp: number; max: number; cd: number; atk: number; down: boolean; face: number; heal: number };
type Z = { t: number; x: number; y: number; hp: number; max: number; spd: number; dps: number; slow: number; frz: number; stun: number; hit: number; seed: number; eating: boolean; face: number; burn: number; v: number };
type Ally = { x: number; y: number; t: number; seed: number };
type Fx = { kind: string; x: number; y: number; t: number; max: number; x2?: number; y2?: number; r?: number; c?: string; pts?: number[][]; text?: string; a?: number };
type Shot = { x: number; y: number; vx: number; vy: number; dmg: number; splash: number; c: string; life: number };
type Pool = { x: number; y: number; r: number; t: number };
type G = { W: number; H: number; CS: number; heroes: Hero[]; zs: Z[]; fx: Fx[]; shots: Shot[]; pools: Pool[]; allies: Ally[]; wave: number; toSpawn: number; total: number; killed: number; spawnT: number; breakT: number; t: number; last: number; raf: number; bg: HTMLCanvasElement | null; base: number; baseMax: number; xp: number; lv: number; xpNeed: number; learned: string[]; cds: Record<string, number>; atkMul: number; cdMul: number; shield: number; beam: number; beamX: number; over: boolean; paused: boolean; line: string; lineT: number; flash: number; killsAll: number; bossKills: number; freeLv: number; bossT: number; chapter: number; manual: boolean };

export default function Apoc({ ranks, best }: { ranks: Row[]; best: number }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [ui, setUi] = useState({ wave: 1, lv: 1, xp: 0, xpNeed: 30, base: 1000, baseMax: 1000, killed: 0, total: 0, over: false, breakT: 0, cds: {} as Record<string, number>, learned: [] as string[], heroes: [] as { k: Cls; hp: number; max: number; down: boolean }[] });
  const [meta, setMeta] = useState<Meta>(META0); const [lab, setLab] = useState(false); const [res, setRes] = useState<{ wave: number; kills: number; vac: number; time: number; skills: number; chapter: string } | null>(null); const [paused, setPaused] = useState(false);
  useEffect(() => { setMeta(loadMeta()); }, []);
  const [started, setStarted] = useState(false), [myBest, setMyBest] = useState(best), [choice, setChoice] = useState<(Skill | typeof BOOSTS[number])[] | null>(null), [tip, setTip] = useState("");
  const g = useRef<G>({ W: 0, H: 0, CS: 0, heroes: [], zs: [], fx: [], shots: [], pools: [], allies: [], wave: 1, toSpawn: 0, total: 0, killed: 0, spawnT: 0, breakT: 0, t: 0, last: 0, raf: 0, bg: null, base: 1000, baseMax: 1000, xp: 0, lv: 1, xpNeed: 30, learned: [], cds: {}, atkMul: 1, cdMul: 1, shield: 0, beam: 0, beamX: 0, over: false, paused: false, line: "", lineT: 0, flash: 0, killsAll: 0, bossKills: 0, freeLv: 0, bossT: 0, chapter: 0, manual: false });

  const sync = () => { const s = g.current; setUi({ wave: s.wave, lv: s.lv, xp: s.xp, xpNeed: s.xpNeed, base: Math.max(0, Math.round(s.base)), baseMax: s.baseMax, killed: s.killed, total: s.total, over: s.over, breakT: s.breakT, cds: { ...s.cds }, learned: [...s.learned], heroes: s.heroes.map(h => ({ k: h.k, hp: Math.max(0, Math.round(h.hp)), max: h.max, down: h.down })) }); };
  const size = () => {
    const s = g.current, c = cv.current, b = box.current; if (!c || !b) return; const w = b.getBoundingClientRect().width; if (!w) return;
    const d = Math.min(2, devicePixelRatio || 1); s.W = w; s.CS = w / COLS; s.H = s.CS * 10.5; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; c.getContext("2d")!.setTransform(d, 0, 0, d, 0, 0);
    s.bg = buildBg(s.W, s.H, s.CS, s.chapter); placeHeroes();
  };
  const lineY = () => g.current.H - g.current.CS * 2.1;      // 바리케이드 선
  const placeHeroes = () => { const s = g.current; s.heroes.forEach((h, i) => { h.x = s.CS * (1 + i * 1.25); h.y = s.H - s.CS * 1.25; }); };
  const newGame = () => {
    const s = g.current, m = loadMeta(); setMeta(m); const hpM = 1 + m.up.hp * .1; s.heroes = ORDER.map(k => ({ k, x: 0, y: 0, hp: Math.round(HEROES[k].hp * hpM), max: Math.round(HEROES[k].hp * hpM), cd: Math.random(), atk: 0, down: false, face: 1, heal: 0 }));
    s.zs = []; s.fx = []; s.shots = []; s.pools = []; s.allies = []; s.wave = 1; s.killed = 0; s.base = 1000; s.baseMax = 1000; s.xp = 0; s.lv = 1; s.xpNeed = 30; s.learned = []; s.cds = {}; s.atkMul = 1 + m.up.atk * .08; s.cdMul = 1 - m.up.cd * .06; s.shield = 0; s.beam = 0; s.over = false; s.paused = false; s.flash = 0; s.t = 0; s.killsAll = 0; s.bossKills = 0; s.freeLv = m.up.lv; s.bossT = 0; s.chapter = 0; s.manual = false;
    setChoice(null); setRes(null); setPaused(false); setStarted(true); setTimeout(() => { size(); startWave(); loop(); }, 30);
  };
  const startWave = () => { const s = g.current; s.total = 12 + s.wave * 7 + (s.wave % 5 === 0 ? 1 : 0); s.toSpawn = s.total; s.killed = 0; s.spawnT = 1; s.breakT = 0; s.line = s.wave % 5 === 0 ? LINES[7] : LINES[(s.wave - 1) % 7]; s.lineT = 4.5; sfx.level(); haptic([20, 30, 20]); sync(); };
  const spawnZ = () => {
    const s = g.current, w = s.wave, CS = s.CS; const r = Math.random(); let t = 0;
    if (w >= 2 && r < .28) t = 1; if (w >= 3 && r > .86) t = 2; if (w >= 4 && r > .76 && r <= .86) t = 3; if (s.toSpawn === 1 && w % 5 === 0) t = 4;
    const T = ZT[t], m = 1 + (w - 1) * .22;
    s.zs.push({ t, x: CS * .6 + Math.random() * (s.W - CS * 1.2), y: -CS * (.5 + Math.random() * 1.5), hp: T.hp * m, max: T.hp * m, spd: T.spd * CS * (.9 + Math.random() * .25), dps: T.dps * (1 + (w - 1) * .1), slow: 0, frz: 0, stun: 0, hit: 0, seed: Math.random() * 10, eating: false, face: 1, burn: 0, v: Math.floor(Math.random() * 3) });
    if (t === 4) { s.bossT = 2.2; shake(box.current, "m"); sfx.boom(); haptic([30, 50, 30, 50]); }
  };
  const gameOver = () => { const s = g.current; s.over = true; sync(); sfx.boom(); haptic([60, 40, 80]); shake(box.current, "l"); const w = s.wave - 1; if (w > myBest) setMyBest(w); if (w > 0) saveScore("apoc", w).catch(() => {});
    const vac = w * 2 + s.bossKills * 5 + Math.floor(s.killsAll / 25); const m = loadMeta(); m.vac += vac; saveMeta(m); setMeta(m); setRes({ wave: w, kills: s.killsAll, vac, time: Math.round(s.t), skills: s.learned.length, chapter: CHAPTERS[chapterOf(Math.max(1, w))].name }); };
  const dmgZ = (z: Z, d: number, c = "#fff") => { z.hp -= d; z.hit = 1; if (Math.random() < .35) g.current.fx.push({ kind: "num", x: z.x + (Math.random() - .5) * 20, y: z.y - g.current.CS * .6, t: 0, max: .7, text: String(Math.round(d)), c }); };
  const alive = () => g.current.heroes.filter(h => !h.down);
  const densest = () => { const s = g.current; let bx = s.W / 2, by = s.H * .4, bn = -1; for (const z of s.zs) { const n = s.zs.filter(q => Math.hypot(q.x - z.x, q.y - z.y) < s.CS * 2).length; if (n > bn) { bn = n; bx = z.x; by = z.y; } } return { x: bx, y: by }; };

  /* ---------- 스킬 시전 ---------- */
  const cast = (id: string) => {
    const s = g.current; if (s.over || s.paused) return; const sk = SKILLS.find(k => k.id === id)!; const h = s.heroes.find(x => x.k === sk.who)!; if ((s.cds[id] ?? 0) > 0 || h.down) return;
    const CS = s.CS, A = s.atkMul; s.cds[id] = sk.cd * s.cdMul; h.atk = 1; sfx.whoosh(); haptic(12);
    const inCone = (r: number) => s.zs.filter(z => z.y < h.y && Math.hypot(z.x - h.x, z.y - h.y) < r * CS && Math.abs(z.x - h.x) < (h.y - z.y) * 1.2 + CS * .6);
    const around = (x: number, y: number, r: number) => s.zs.filter(z => Math.hypot(z.x - x, z.y - y) < r * CS);
    const push = (z: Z, fx: number, fy: number, k: number) => { const d = Math.hypot(fx, fy) || 1; z.x += fx / d * k; z.y += fy / d * k; z.x = Math.max(CS * .3, Math.min(s.W - CS * .3, z.x)); };
    switch (id) {
      case "d1": for (const z of inCone(2.8)) dmgZ(z, 60 * A); s.fx.push({ kind: "cone", x: h.x, y: h.y - CS * .3, t: 0, max: .35, r: 2.8 * CS, c: "#9FD3F5" }); break;
      case "d2": for (const z of around(h.x, h.y, 2.2)) { dmgZ(z, 50 * A); push(z, z.x - h.x, z.y - h.y, CS * 1.2); } s.fx.push({ kind: "ring", x: h.x, y: h.y, t: 0, max: .4, r: 2.2 * CS, c: "#9FD3F5" }); break;
      case "d3": for (const z of s.zs) if (Math.abs(z.x - h.x) < CS * .7) dmgZ(z, 80 * A); s.fx.push({ kind: "dash", x: h.x, y: h.y, t: 0, max: .45, c: "#BFE7FF" }); shake(box.current, "s"); break;
      case "d4": { const p = densest(); s.fx.push({ kind: "sword", x: p.x, y: p.y, t: 0, max: 1.1, r: 3 * CS }); setTimeout(() => { for (const z of around(p.x, p.y, 3)) { dmgZ(z, 150 * A, "#FFE08A"); z.stun = 1.2; } shake(box.current, "l"); sfx.boom(); s.flash = .5; }, 550); break; }
      case "x1": for (const z of inCone(2.2)) { dmgZ(z, 25 * A); push(z, 0, -1, CS * 2.2); } s.fx.push({ kind: "cone", x: h.x, y: h.y - CS * .3, t: 0, max: .3, r: 2.2 * CS, c: "#C9A2FF" }); break;
      case "x2": s.beam = 1.5; s.beamX = h.x; break;
      case "x3": s.shield = 4; s.base = Math.min(s.baseMax, s.base + 100); s.fx.push({ kind: "ring", x: s.W / 2, y: h.y, t: 0, max: .6, r: s.W * .6, c: "#C9A2FF" }); break;
      case "x4": for (const z of s.zs) dmgZ(z, (z.t === 4 ? 60 : 90) * A, "#C9FF8A"); s.flash = .9; shake(box.current, "l"); sfx.boom(); break;
      case "p1": { const tg = s.zs.filter(z => z.y > 0).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0]; if (tg) for (let i = 0; i < 8; i++) setTimeout(() => { if (tg.hp > 0) { dmgZ(tg, 15 * A); s.fx.push({ kind: "hit", x: tg.x + (Math.random() - .5) * 20, y: tg.y - CS * .3 + (Math.random() - .5) * 20, t: 0, max: .2 }); } }, i * 90); break; }
      case "p2": for (const z of around(h.x, h.y, 3.2)) { dmgZ(z, 55 * A); push(z, z.x - h.x, z.y - h.y, CS * 1.4); } s.fx.push({ kind: "ring", x: h.x, y: h.y - CS * .2, t: 0, max: .5, r: 3.2 * CS, c: "#7EE7D0" }); break;
      case "p3": for (const z of s.zs) { dmgZ(z, 25 * A); z.slow = 4; } s.fx.push({ kind: "quake", x: 0, y: 0, t: 0, max: .6 }); shake(box.current, "l"); sfx.boom(); break;
      case "p4": for (const z of around(h.x, h.y, 2.6)) { dmgZ(z, 110 * A, "#FFE08A"); push(z, z.x - h.x, z.y - h.y, CS * .8); } s.fx.push({ kind: "spin", x: h.x, y: h.y, t: 0, max: .5, r: 2.6 * CS }); break;
      case "n1": { const w = alive().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { w.hp = Math.min(w.max, w.hp + w.max * .4); s.fx.push({ kind: "heal", x: w.x, y: w.y, t: 0, max: .8 }); } break; }
      case "n2": for (const w of alive()) { w.hp = Math.min(w.max, w.hp + w.max * .3); s.fx.push({ kind: "heal", x: w.x, y: w.y, t: 0, max: .8 }); } s.base = Math.min(s.baseMax, s.base + 150); break;
      case "n3": { const p = { x: h.x, y: h.y - CS * 2.4 }; for (const z of around(p.x, p.y, 2.2)) dmgZ(z, 70 * A, "#FFF3C4"); s.fx.push({ kind: "pillar", x: p.x, y: p.y, t: 0, max: .7, r: 2.2 * CS }); break; }
      case "n4": for (const w of s.heroes) { if (w.down) { w.down = false; w.hp = w.max * .6; s.fx.push({ kind: "heal", x: w.x, y: w.y, t: 0, max: 1.2 }); } else w.hp = Math.min(w.max, w.hp + w.max * .5); } s.flash = .4; break;
      case "l1": { const p = densest(); s.pools.push({ x: p.x, y: p.y, r: 1.6 * CS, t: 5 }); s.fx.push({ kind: "shot", x: h.x, y: h.y, x2: p.x, y2: p.y, t: 0, max: .4, c: "#FF8A3D" }); break; }
      case "l2": { let cur: { x: number; y: number } = { x: h.x, y: h.y - CS * .5 }; const used = new Set<Z>(); const pts: number[][] = [[cur.x, cur.y]]; for (let i = 0; i < 6; i++) { const nx = s.zs.filter(z => !used.has(z) && z.y > -CS).sort((a, b) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y))[0]; if (!nx) break; used.add(nx); dmgZ(nx, 55 * A, "#FFF59D"); nx.stun = Math.max(nx.stun, .4); cur = { x: nx.x, y: nx.y - CS * .4 }; pts.push([cur.x, cur.y]); } s.fx.push({ kind: "bolt", x: 0, y: 0, t: 0, max: .45, pts }); s.flash = .25; break; }
      case "l3": for (const z of s.zs) { z.frz = 3; dmgZ(z, 10 * A, "#BFEFFF"); } s.fx.push({ kind: "freeze", x: 0, y: 0, t: 0, max: 3 }); break;
      case "l4": for (let i = 0; i < 3; i++) s.allies.push({ x: h.x + (i - 1) * CS * .5, y: h.y - CS * .8, t: 12, seed: Math.random() * 10 }); s.fx.push({ kind: "ring", x: h.x, y: h.y, t: 0, max: .5, r: 1.2 * CS, c: "#7ED69B" }); break;
    }
    sync();
  };
  const levelUp = () => {
    const s = g.current; s.lv++; s.xp -= s.xpNeed; s.xpNeed = 30 + s.lv * 28; sfx.level(); haptic([20, 40, 20]);
    const left = SKILLS.filter(k => !s.learned.includes(k.id) && !s.heroes.find(h => h.k === k.who)?.down);
    const opts: (Skill | typeof BOOSTS[number])[] = s.learned.length >= 8 || left.length < 3 ? [...BOOSTS] : [...left].sort(() => Math.random() - .5).slice(0, 3);
    s.paused = true; setChoice(opts); sync();
  };
  const choose = (o: Skill | typeof BOOSTS[number]) => {
    const s = g.current; if ("who" in o) { s.learned.push(o.id); s.cds[o.id] = 0; setTip(`${o.icon} ${o.name} 배움! 왼쪽 버튼을 탭해 시전해요`); }
    else { if (o.id === "b_atk") s.atkMul *= 1.15; if (o.id === "b_hp") for (const h of s.heroes) { h.max = Math.round(h.max * 1.2); h.hp = Math.min(h.max, h.hp + h.max * .3); } if (o.id === "b_cd") s.cdMul *= .9; setTip(`${o.icon} ${o.name}`); }
    setTimeout(() => setTip(""), 3000); s.paused = false; setChoice(null); s.last = performance.now(); sync();
  };

  /* ---------- 업데이트 ---------- */
  const update = (dt: number) => {
    const s = g.current, CS = s.CS, LY = lineY(); s.t += dt; s.flash = Math.max(0, s.flash - dt * 1.6); s.shield = Math.max(0, s.shield - dt); s.lineT = Math.max(0, s.lineT - dt);
    for (const k of Object.keys(s.cds)) s.cds[k] = Math.max(0, s.cds[k] - dt);
    // 웨이브 진행
    if (s.bossT > 0) s.bossT -= dt;
    if (s.freeLv > 0 && !s.paused && s.t > .3) { s.freeLv--; s.xp = s.xpNeed; }
    if (s.breakT > 0) { s.breakT -= dt; if (s.breakT <= 0) { s.wave++; const ch = chapterOf(s.wave); if (ch !== s.chapter) { s.chapter = ch; s.bg = buildBg(s.W, s.H, s.CS, ch); pop(box.current, s.W / 2, s.H * .3, `🌒 ${CHAPTERS[ch].name}`, "good big"); } startWave(); } }
    else if (s.toSpawn > 0) { s.spawnT -= dt; if (s.spawnT <= 0) { const n = Math.min(s.toSpawn, 1 + Math.floor(Math.random() * 2) + (s.wave > 4 ? 1 : 0)); for (let i = 0; i < n; i++) spawnZ(); s.toSpawn -= n; s.spawnT = Math.max(.35, 1.6 - s.wave * .08) * (.6 + Math.random() * .8); } }
    else if (!s.zs.length) { s.breakT = 3; for (const h of alive()) h.hp = Math.min(h.max, h.hp + h.max * .2); s.base = Math.min(s.baseMax, s.base + 50); pop(box.current, s.W / 2, s.H * .35, `✅ WAVE ${s.wave} 클리어`, "good big"); sfx.coin(); if (s.wave > myBest) setMyBest(s.wave); saveScore("apoc", s.wave).catch(() => {}); }
    // X선 빔
    if (s.beam > 0) { s.beam -= dt; for (const z of s.zs) if (Math.abs(z.x - s.beamX) < CS * .6) { z.hp -= 55 * s.atkMul * dt; z.hit = .6; } }
    // 불바다
    for (const p of s.pools) { p.t -= dt; for (const z of s.zs) if (Math.hypot(z.x - p.x, z.y - p.y) < p.r) { z.hp -= 20 * s.atkMul * dt; z.burn = .5; } } s.pools = s.pools.filter(p => p.t > 0);
    // 소환 세균
    for (const a of s.allies) { a.t -= dt; const tg = s.zs.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0]; if (tg) { const d = Math.hypot(tg.x - a.x, tg.y - a.y); if (d > CS * .5) { a.x += (tg.x - a.x) / d * CS * 2.2 * dt; a.y += (tg.y - a.y) / d * CS * 2.2 * dt; } else { tg.hp -= 12 * s.atkMul * dt; tg.hit = .5; } } } s.allies = s.allies.filter(a => a.t > 0);
    // 좀비
    const scream = s.zs.filter(z => z.t === 3), tank = s.heroes.find(h => h.k === "xray" && !h.down);
    for (const z of s.zs) {
      z.hit = Math.max(0, z.hit - dt * 4); z.slow = Math.max(0, z.slow - dt); z.frz = Math.max(0, z.frz - dt); z.stun = Math.max(0, z.stun - dt); z.burn = Math.max(0, z.burn - dt);
      if (z.frz > 0 || z.stun > 0) { z.eating = false; continue; }
      const boost = scream.some(q => q !== z && Math.hypot(q.x - z.x, q.y - z.y) < CS * 2) ? 1.3 : 1;
      const gait = z.v === 1 ? ((s.t + z.seed) * .6 % 1 < .3 ? .15 : 1.6) : z.v === 2 ? .7 + .6 * Math.abs(Math.sin(s.t * 1.4 + z.seed)) : .85 + .3 * Math.max(0, Math.sin(s.t * 4 + z.seed));
      const sp = z.spd * (z.slow > 0 ? .4 : 1) * boost * gait;
      const R = ZT[z.t].size * CS;
      // 목표: 바리케이드 선. 탱커가 가까우면 탱커 쪽으로
      const tx = tank && Math.abs(tank.x - z.x) < CS * 2.6 ? tank.x : alive().sort((a, b) => Math.abs(a.x - z.x) - Math.abs(b.x - z.x))[0]?.x ?? s.W / 2;
      if (z.y >= LY - R * .25) {
        z.eating = true; const tg = alive().sort((a, b) => Math.abs(a.x - z.x) - Math.abs(b.x - z.x))[0];
        if (tg && Math.abs(tg.x - z.x) < CS * 1.1) { if (s.shield <= 0) tg.hp -= z.dps * dt; z.face = tg.x >= z.x ? 1 : -1; if (tg.hp <= 0 && !tg.down) { tg.down = true; tg.hp = 0; pop(box.current, tg.x, tg.y - CS, `${HEROES[tg.k].name} 쓰러짐!`, "bad"); shake(box.current, "m"); } }
        else { if (s.shield <= 0) s.base -= z.dps * dt * .6; z.x += Math.sign(tx - z.x) * sp * .5 * dt; if (Math.random() < dt * 1.5) shake(box.current, "s"); }
      } else {
        z.eating = false; z.y += sp * dt; z.x += Math.sign(tx - z.x) * Math.min(Math.abs(tx - z.x), sp * .35 * dt) + Math.sin(s.t * 1.7 + z.seed) * CS * .15 * dt; z.face = tx >= z.x ? 1 : -1;
      }
      // 서로 밀어내기(떼처럼)
      for (const q of s.zs) if (q !== z) { const dx = z.x - q.x, dy = z.y - q.y, d = Math.hypot(dx, dy), m = R * .45; if (d > 0 && d < m) { const k = (m - d) / m * CS * 1.2 * dt; z.x += dx / d * k; z.y += dy / d * k * .4; } }
      z.x = Math.max(CS * .3, Math.min(s.W - CS * .3, z.x));
    }
    // 의료진 공격
    for (const h of s.heroes) {
      if (h.down) continue; const Hd = HEROES[h.k]; h.atk = Math.max(0, h.atk - dt * 3); h.cd -= dt;
      if (h.k === "nurse") { h.heal += dt; if (h.heal >= 2) { h.heal = 0; const w = alive().filter(x => x !== h && x.hp < x.max).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { w.hp = Math.min(w.max, w.hp + 6 + s.lv); s.fx.push({ kind: "heal", x: w.x, y: w.y, t: 0, max: .5 }); } } }
      if (h.cd > 0) continue;
      const inR = s.zs.filter(z => z.y > -CS * .5 && Math.hypot(z.x - h.x, z.y - h.y) <= Hd.range * CS + ZT[z.t].size * CS * .3).sort((a, b) => b.y - a.y);
      if (!inR.length) continue; h.cd = Hd.cd; h.atk = 1; h.face = inR[0].x >= h.x ? 1 : -1;
      if (Hd.kind === "melee") { for (const z of inR.slice(0, h.k === "doctor" ? 3 : h.k === "xray" ? 2 : 1)) dmgZ(z, Hd.atk * s.atkMul); s.fx.push({ kind: h.k === "doctor" ? "slash" : h.k === "xray" ? "bash" : "punch", x: h.x, y: h.y - CS * .4, t: 0, max: .22, r: Hd.range * CS, c: Hd.color, a: h.face }); if (Math.random() < .3) sfx.hit(); }
      else { const tg = inR[0], dx = tg.x - h.x, dy = tg.y - h.y, L = Math.hypot(dx, dy) || 1, v = CS * 9; s.shots.push({ x: h.x, y: h.y - CS * .5, vx: dx / L * v, vy: dy / L * v, dmg: Hd.atk * s.atkMul, splash: h.k === "lab" ? CS * .9 : 0, c: Hd.color, life: 1.2 }); }
    }
    // 투사체
    for (const p of s.shots) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; const hit = s.zs.find(z => Math.hypot(z.x - p.x, z.y - p.y - CS * .3) < ZT[z.t].size * CS * .4); if (hit) { if (p.splash) { for (const z of s.zs) if (Math.hypot(z.x - hit.x, z.y - hit.y) < p.splash) dmgZ(z, p.dmg, p.c); s.fx.push({ kind: "ring", x: hit.x, y: hit.y, t: 0, max: .3, r: p.splash, c: p.c }); } else dmgZ(hit, p.dmg, p.c); p.life = 0; } } s.shots = s.shots.filter(p => p.life > 0 && p.y > -CS);
    // 죽음·경험치
    for (const z of s.zs) if (z.hp <= 0) { s.killed++; s.killsAll++; if (z.t === 4) s.bossKills++; s.xp += ZT[z.t].xp; s.fx.push({ kind: "die", x: z.x, y: z.y, t: 0, max: .6, a: z.t }); s.fx.push({ kind: "blood", x: z.x, y: z.y + CS * .3, t: 0, max: 6, r: ZT[z.t].size * CS * .4 }); if (z.t === 4) { pop(box.current, z.x, z.y, "💀 보스 처치!", "good big"); sfx.record(); s.flash = .6; shake(box.current, "l"); haptic([40, 60, 40]); s.paused = true; setTimeout(() => { if (!s.manual && !choice) { s.paused = false; s.last = performance.now(); } }, 200); } }
    s.zs = s.zs.filter(z => z.hp > 0);
    for (const f of s.fx) f.t += dt; s.fx = s.fx.filter(f => f.t < f.max);
    if (s.xp >= s.xpNeed && !s.paused) levelUp();
    if (s.base <= 0 || !alive().length) gameOver();
  };

  /* ---------- 그리기 ---------- */
  const draw = () => {
    const s = g.current, c = cv.current; if (!c || !s.bg || s.W < 2) return; const x = c.getContext("2d")!, CS = s.CS, LY = lineY();
    x.drawImage(s.bg, 0, 0, s.W, s.H);
    // 핏자국(오래 남음) · 불바다 · 빔
    for (const f of s.fx) if (f.kind === "blood") { x.globalAlpha = Math.min(.55, (f.max - f.t) / f.max * .7); x.fillStyle = "#7A0A0A"; x.beginPath(); x.ellipse(f.x, f.y, f.r!, f.r! * .45, 0, 0, 7); x.fill(); x.globalAlpha = 1; }
    for (const p of s.pools) { const a = Math.min(1, p.t); x.save(); x.globalAlpha = .55 * a; const gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, "#FFE08A"); gr.addColorStop(.5, "#FF7A1A"); gr.addColorStop(1, "rgba(255,60,0,0)"); x.fillStyle = gr; x.beginPath(); x.ellipse(p.x, p.y, p.r, p.r * .6, 0, 0, 7); x.fill(); for (let i = 0; i < 10; i++) { const a2 = s.t * 3 + i, fy = p.y - Math.abs(Math.sin(a2 * 1.3)) * CS * .8; x.fillStyle = `rgba(255,${120 + (i * 13) % 100},40,${.5 * a})`; x.beginPath(); x.ellipse(p.x + Math.cos(a2) * p.r * .7, fy, CS * .12, CS * .22, 0, 0, 7); x.fill(); } x.restore(); }
    if (s.beam > 0) { x.save(); const gr = x.createLinearGradient(s.beamX - CS * .6, 0, s.beamX + CS * .6, 0); gr.addColorStop(0, "rgba(180,140,255,0)"); gr.addColorStop(.5, `rgba(220,200,255,${.5 + Math.sin(s.t * 40) * .15})`); gr.addColorStop(1, "rgba(180,140,255,0)"); x.fillStyle = gr; x.fillRect(s.beamX - CS * .6, 0, CS * 1.2, LY); x.restore(); }
    // 바리케이드 + 의료진 + 좀비 (y 정렬)
    const items: { y: number; f: () => void }[] = [];
    for (const h of s.heroes) items.push({ y: h.y + CS * .5, f: () => drawHero(x, h, CS, s.t, s.shield > 0) });
    for (const z of s.zs) items.push({ y: z.y + ZT[z.t].size * CS * .5, f: () => drawZombie(x, z, CS, s.t) });
    for (const a of s.allies) items.push({ y: a.y, f: () => { x.save(); x.translate(a.x, a.y + Math.sin(s.t * 8 + a.seed) * 3); x.fillStyle = "#7ED69B"; x.strokeStyle = "#2E7D6B"; x.lineWidth = 2; x.beginPath(); x.ellipse(0, 0, CS * .22, CS * .16, Math.sin(s.t * 3 + a.seed) * .4, 0, 7); x.fill(); x.stroke(); x.fillStyle = "#1A1F16"; x.beginPath(); x.arc(-CS * .06, -CS * .03, 2, 0, 7); x.arc(CS * .06, -CS * .03, 2, 0, 7); x.fill(); x.restore(); } });
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    // 투사체
    for (const p of s.shots) { x.save(); x.translate(p.x, p.y); x.rotate(Math.atan2(p.vy, p.vx)); x.fillStyle = p.c; x.shadowColor = p.c; x.shadowBlur = 8; if (p.splash) { x.beginPath(); x.arc(0, 0, CS * .12, 0, 7); x.fill(); } else x.fillRect(-CS * .16, -2, CS * .32, 4); x.restore(); }
    // 이펙트
    for (const f of s.fx) {
      const k = f.t / f.max, inv = 1 - k; x.save(); x.globalAlpha = Math.max(0, inv);
      if (f.kind === "slash") { x.strokeStyle = f.c!; x.lineWidth = 5; x.shadowColor = f.c!; x.shadowBlur = 12; x.beginPath(); x.arc(f.x, f.y, f.r! * (.6 + k * .5), -Math.PI * .95, -Math.PI * .05); x.stroke(); }
      else if (f.kind === "bash") { x.fillStyle = f.c!; x.globalAlpha = inv * .5; x.beginPath(); x.moveTo(f.x, f.y); x.arc(f.x, f.y, f.r! * (.7 + k * .4), -Math.PI * .85, -Math.PI * .15); x.closePath(); x.fill(); }
      else if (f.kind === "punch") { x.fillStyle = "#fff"; x.shadowColor = f.c!; x.shadowBlur = 10; x.beginPath(); x.arc(f.x + f.a! * CS * .3, f.y - CS * .6 - k * CS * .4, CS * .14 * inv, 0, 7); x.fill(); }
      else if (f.kind === "cone") { x.fillStyle = f.c!; x.globalAlpha = inv * .55; x.beginPath(); x.moveTo(f.x, f.y); x.arc(f.x, f.y, f.r! * (.5 + k * .6), -Math.PI * .83, -Math.PI * .17); x.closePath(); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 3; x.stroke(); }
      else if (f.kind === "ring") { x.strokeStyle = f.c!; x.lineWidth = 6 * inv + 1; x.shadowColor = f.c!; x.shadowBlur = 14; x.beginPath(); x.ellipse(f.x, f.y, f.r! * (.2 + k * .8), f.r! * (.2 + k * .8) * .7, 0, 0, 7); x.stroke(); }
      else if (f.kind === "dash") { x.strokeStyle = f.c!; x.lineWidth = CS * .5 * inv; x.shadowColor = f.c!; x.shadowBlur = 20; x.globalAlpha = inv * .8; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x, 0); x.stroke(); }
      else if (f.kind === "sword") { const drop = Math.min(1, f.t / .5), y = f.y - CS * 7 * (1 - drop); x.globalAlpha = 1; x.translate(f.x, y); x.shadowColor = "#FFE08A"; x.shadowBlur = 30; x.fillStyle = "#FFF7D6"; x.beginPath(); x.moveTo(0, CS * 1.6); x.lineTo(-CS * .35, -CS * 2.5); x.lineTo(0, -CS * 3.2); x.lineTo(CS * .35, -CS * 2.5); x.closePath(); x.fill(); x.fillStyle = "#C98A00"; x.fillRect(-CS * .9, -CS * 2.6, CS * 1.8, CS * .25); if (drop >= 1) { x.globalAlpha = Math.max(0, 1 - (f.t - .5) / .6); x.strokeStyle = "#FFE08A"; x.lineWidth = 8; x.beginPath(); x.ellipse(0, CS * 1.4, f.r! * ((f.t - .5) / .6), f.r! * .6 * ((f.t - .5) / .6), 0, 0, 7); x.stroke(); } }
      else if (f.kind === "pillar") { x.globalAlpha = inv * .75; const gr = x.createLinearGradient(0, 0, 0, f.y); gr.addColorStop(0, "rgba(255,243,196,0)"); gr.addColorStop(1, "#FFF3C4"); x.fillStyle = gr; x.fillRect(f.x - f.r! * .5, 0, f.r!, f.y); x.strokeStyle = "#FFE08A"; x.lineWidth = 4; x.beginPath(); x.ellipse(f.x, f.y, f.r! * (.5 + k * .5), f.r! * .4, 0, 0, 7); x.stroke(); }
      else if (f.kind === "bolt") { x.strokeStyle = "#FFF59D"; x.shadowColor = "#FFEB3B"; x.shadowBlur = 18; x.lineWidth = 4; x.beginPath(); const P = f.pts!; for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1]; x.moveTo(ax, ay); const segs = 5; for (let j = 1; j <= segs; j++) { const tt = j / segs, jx = (Math.random() - .5) * 18 * (j < segs ? 1 : 0), jy = (Math.random() - .5) * 18 * (j < segs ? 1 : 0); x.lineTo(ax + (bx - ax) * tt + jx, ay + (by - ay) * tt + jy); } } x.stroke(); x.lineWidth = 1.5; x.strokeStyle = "#fff"; x.stroke(); }
      else if (f.kind === "freeze") { x.globalAlpha = Math.min(.35, inv); x.fillStyle = "#BFEFFF"; x.fillRect(0, 0, s.W, LY); }
      else if (f.kind === "quake") { x.strokeStyle = "#9E7A4A"; x.lineWidth = 3; x.globalAlpha = inv * .8; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(Math.random() * s.W, LY - Math.random() * CS * 4); x.lineTo(Math.random() * s.W, LY - Math.random() * CS * 4); x.stroke(); } }
      else if (f.kind === "spin") { x.strokeStyle = "#7EE7D0"; x.lineWidth = 5; x.shadowColor = "#7EE7D0"; x.shadowBlur = 12; x.beginPath(); x.ellipse(f.x, f.y - CS * .3, f.r! * (.3 + k * .7), f.r! * (.3 + k * .7) * .55, k * 6, .3, 5.5); x.stroke(); }
      else if (f.kind === "heal") { x.fillStyle = "#7ED69B"; x.font = `800 ${Math.floor(CS * .36)}px system-ui`; x.textAlign = "center"; x.shadowColor = "#fff"; x.shadowBlur = 6; x.fillText("+", f.x, f.y - CS * .8 - k * CS * .6); x.globalAlpha = inv * .4; x.strokeStyle = "#7ED69B"; x.lineWidth = 3; x.beginPath(); x.ellipse(f.x, f.y + CS * .3, CS * .5, CS * .2, 0, 0, 7); x.stroke(); }
      else if (f.kind === "hit") { x.fillStyle = "#fff"; x.beginPath(); x.arc(f.x, f.y, CS * .12 * inv, 0, 7); x.fill(); }
      else if (f.kind === "num") { x.fillStyle = f.c ?? "#fff"; x.strokeStyle = "#000"; x.lineWidth = 3; x.font = `800 ${Math.floor(CS * .26)}px system-ui`; x.textAlign = "center"; x.strokeText(f.text!, f.x, f.y - k * CS * .5); x.fillText(f.text!, f.x, f.y - k * CS * .5); }
      else if (f.kind === "die") { x.translate(f.x, f.y); x.rotate(k * 1.5); x.globalAlpha = inv * .8; drawZombieBody(x, ZT[f.a!], CS, 0, 1, false); }
      else if (f.kind === "shot") { x.strokeStyle = f.c!; x.lineWidth = 3; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(f.x, f.y); x.quadraticCurveTo((f.x + f.x2!) / 2, Math.min(f.y, f.y2!) - CS * 2, f.x2!, f.y2!); x.stroke(); }
      x.restore();
    }
    // 무적 결계
    if (s.shield > 0) { x.save(); x.globalAlpha = .25 + Math.sin(s.t * 10) * .08; x.fillStyle = "#C9A2FF"; x.fillRect(0, LY - CS * .4, s.W, s.H - LY + CS * .4); x.restore(); }
    // 보스 체력바 + 등장 연출
    const boss = s.zs.find(z => z.t === 4);
    if (boss) { const bw = s.W * .6, bx = s.W * .2, by = CS * .35; x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(bx - 3, by - 3, bw + 6, 14); x.fillStyle = "#E2574C"; x.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.max), 8); x.fillStyle = "#fff"; x.font = `800 ${Math.floor(CS * .22)}px system-ui`; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillText("☠️ 보스", s.W / 2, by - 6); }
    if (s.bossT > 0) { const a = Math.min(1, s.bossT); x.fillStyle = `rgba(60,0,0,${a * .45})`; x.fillRect(0, 0, s.W, s.H); x.save(); x.globalAlpha = a; x.translate(s.W / 2, s.H * .4); x.fillStyle = "#E2574C"; x.strokeStyle = "#000"; x.lineWidth = 6; x.font = `900 ${Math.floor(CS * 1.1)}px system-ui`; x.textAlign = "center"; x.textBaseline = "middle"; x.strokeText("BOSS", 0, 0); x.fillText("BOSS", 0, 0); x.fillStyle = "#fff"; x.font = `800 ${Math.floor(CS * .3)}px system-ui`; x.fillText("전원 스킬 아끼지 마!", 0, CS * .85); x.restore(); }
    // 화면 플래시
    if (s.flash > 0) { x.fillStyle = `rgba(255,255,255,${s.flash * .7})`; x.fillRect(0, 0, s.W, s.H); }
    // 대사 말풍선
    if (s.lineT > 0 && s.line) { const a = Math.min(1, s.lineT * 2); x.save(); x.globalAlpha = a; x.font = `700 ${Math.floor(CS * .24)}px system-ui`; const lines = wrapText(x, s.line, s.W * .7); const bw = s.W * .78, bh = lines.length * CS * .32 + CS * .3, bx = s.W / 2 - bw / 2, by = LY - CS * 1.1 - bh; x.fillStyle = "#fff"; x.strokeStyle = "#222"; x.lineWidth = 3; x.beginPath(); (x as any).roundRect ? (x as any).roundRect(bx, by, bw, bh, 10) : x.rect(bx, by, bw, bh); x.fill(); x.stroke(); x.beginPath(); x.moveTo(s.W / 2 - 10, by + bh); x.lineTo(s.W / 2, by + bh + 12); x.lineTo(s.W / 2 + 10, by + bh); x.closePath(); x.fill(); x.fillStyle = "#1b1b1b"; x.textAlign = "center"; lines.forEach((l, i) => x.fillText(l, s.W / 2, by + CS * .38 + i * CS * .32)); x.restore(); }
  };
  const loop = () => { const s = g.current; cancelAnimationFrame(s.raf); s.last = performance.now(); const tick = () => { s.raf = requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(.05, (now - s.last) / 1000); s.last = now; if (!s.over && !s.paused) { update(dt); if (Math.floor(s.t * 4) !== Math.floor((s.t - dt) * 4)) sync(); } draw(); }; tick(); };
  useEffect(() => { const on = () => size(); addEventListener("resize", on); return () => { removeEventListener("resize", on); cancelAnimationFrame(g.current.raf); }; }, []);

  const learned = ui.learned.map(id => SKILLS.find(k => k.id === id)!);
  return (
    <div className="games">
      {!started ? <div className="ap-start">
        <div className="ap-title">병원묵시록<small>DAY 0</small></div>
        <HowTo id="apoc" steps={[{ icon: "🤖", title: "싸움은 자동", desc: "의료진 5명이 알아서 때려요" }, { icon: "⬆️", title: "레벨업 → 스킬 고르기", desc: "3개 중 1개, 왼쪽 버튼에 쌓여요" }, { icon: "👆", title: "스킬 버튼 탭!", desc: "쿨타임 돌면 바로바로 눌러요" }]} />
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>감염 첫날 밤, 병원 정문 앞 최후 방어선.<br />의료진 5명(의사·방사선사·물리치료사·간호사·임상병리사)이 자동으로 싸워요.<br />좀비를 잡아 레벨이 오르면 <b>스킬 3개 중 1개</b>를 배우고, 왼쪽 버튼을 탭해 시전하세요. 5웨이브마다 보스!</div>
        <div className="ap-roster">{ORDER.map(k => <div key={k} className="ap-ro"><span className="def-ico art" style={{ background: HEROES[k].color }}><img src={artSrc(HEROES[k].art, HERO_SVG[HEROES[k].art])} alt="" /></span><b>{HEROES[k].name}</b><small>{HEROES[k].role}</small></div>)}</div>
        <div className="run-btns" style={{ justifyContent: "center" }}><button type="button" className="btn" onClick={newGame}>🧟 방어 시작</button><button type="button" className="btn ghost" onClick={() => setLab(v => !v)}>🧪 연구소 (💉 {meta.vac})</button></div>
        {myBest > 0 && <div className="muted">내 최고 기록: {myBest}웨이브 · 10웨이브마다 DAY가 바뀌어요</div>}
        {lab && <div className="ap-lab"><div className="muted" style={{ fontSize: 12 }}>💉 백신은 판이 끝날 때 받아요 (웨이브×2 + 보스×5 + 처치 25마리당 1). 영구 강화예요.</div>
          {MUPS.map(u => { const l = meta.up[u.k], cost = u.cost(l), can = l < u.max && meta.vac >= cost; return <button key={u.k} type="button" className={"run-up" + (l >= u.max ? " max" : can ? " can" : "")} disabled={l >= u.max || !can} onClick={() => { const m = loadMeta(); if (m.vac < cost || m.up[u.k] >= u.max) return; m.vac -= cost; m.up[u.k]++; saveMeta(m); setMeta(m); sfx.perfect(); haptic(10); }}><span className="run-ui">{u.icon}</span><span className="run-un">{u.name} <small>{"●".repeat(l)}{"○".repeat(u.max - l)}</small><br /><em>{u.desc(Math.min(u.max, l + 1))}</em></span><span className="run-uc">{l >= u.max ? "MAX" : `💉 ${cost}`}</span></button>; })}</div>}
      </div> : <>
        <div className="ap-bar">
          <span className="ap-day night">🌙 WAVE {ui.wave} <small style={{ opacity: .7, fontWeight: 600 }}>{CHAPTERS[chapterOf(ui.wave)].name.split(" · ")[0]}</small></span><button type="button" className="ap-pause" aria-label="일시정지" onClick={() => { const s = g.current; if (s.over || choice) return; s.manual = !s.manual; s.paused = s.manual; setPaused(s.manual); if (!s.manual) s.last = performance.now(); }}>{paused ? "▶" : "❚❚"}</button>
          <span className="ap-lv">Lv.{ui.lv}<i style={{ width: `${Math.min(100, ui.xp / ui.xpNeed * 100)}%` }} /></span>
          <span className="ap-hp"><i style={{ width: `${ui.base / ui.baseMax * 100}%` }} />🚧 {ui.base}</span>
        </div>
        <div ref={box} className="ap-stage sq"><canvas ref={cv} style={{ width: "100%", display: "block", touchAction: "none" }} />
          <div className="ap-skills">{learned.map(sk => { const cd = ui.cds[sk.id] ?? 0, down = ui.heroes.find(h => h.k === sk.who)?.down; return <button key={sk.id} type="button" className={"ap-sk" + (cd > 0 || down ? " cd" : "")} style={{ borderColor: HEROES[sk.who].color }} onClick={() => cast(sk.id)} title={`${sk.name} — ${sk.desc}`}><span>{sk.icon}</span>{cd > 0 && <i style={{ height: `${cd / (sk.cd * (g.current.cdMul || 1)) * 100}%` }} />}{cd > 0 && <b>{Math.ceil(cd)}</b>}</button>; })}
            {learned.length === 0 && <div className="ap-sk-hint">레벨업하면<br />스킬이 생겨요</div>}</div>
          <div className="ap-party">{ui.heroes.map(h => <div key={h.k} className={"ap-pm" + (h.down ? " down" : "")} style={{ borderColor: HEROES[h.k].color }}><img src={artSrc(HEROES[h.k].art, HERO_SVG[HEROES[h.k].art])} alt="" /><i style={{ width: `${h.hp / h.max * 100}%`, background: HEROES[h.k].color }} /></div>)}</div>
          <div className="ap-prog"><i style={{ width: `${ui.total ? ui.killed / ui.total * 100 : 0}%` }} /><span>{ui.breakT > 0 ? `다음 웨이브 ${Math.ceil(ui.breakT)}초` : `${ui.killed}/${ui.total}`}</span></div>
          {tip && <div className="ap-tip">{tip}</div>}
          {choice && <div className="ap-choice"><div className="ap-ch-title">⬆️ Lv.{ui.lv} 달성! 하나를 고르세요</div><div className="ap-ch-list">{choice.map(o => <button key={o.id} type="button" onClick={() => choose(o)} style={{ borderColor: "who" in o ? HEROES[o.who].color : "#F0CF7A" }}><span className="ap-ch-ico">{o.icon}</span><b>{o.name}</b><small>{"who" in o ? `${HEROES[o.who].name} · ${o.desc} · 쿨 ${o.cd}초` : "팀 전체 강화"}</small></button>)}</div></div>}
          {paused && !ui.over && <button type="button" className="ap-over" onClick={() => { const s = g.current; s.manual = false; s.paused = false; setPaused(false); s.last = performance.now(); }}><div className="big">일시정지</div><div>터치해서 계속</div></button>}
          {ui.over && <div className="ap-over"><div className="big">방어선이 무너졌어요</div>
            {res && <div className="ap-res"><span><b>{res.wave}</b>웨이브</span><span><b>{res.kills}</b>처치</span><span><b>{Math.floor(res.time / 60)}:{String(res.time % 60).padStart(2, "0")}</b>생존</span><span><b>{res.skills}</b>스킬</span></div>}
            <div>{res?.chapter}{ui.wave - 1 >= myBest && ui.wave > 1 ? " · 🏆 최고 기록!" : ""} · 💉 백신 +{res?.vac ?? 0}</div>
            <div className="run-btns"><button type="button" className="btn" onClick={newGame}>다시 하기</button><button type="button" className="btn ghost" onClick={() => { setStarted(false); setLab(true); }}>🧪 연구소</button></div></div>}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>의료진은 자동으로 싸워요 · 좀비는 방사선사(방패)를 먼저 노려요 · 간호사는 2초마다 동료 치유 · 쓰러진 동료는 간호사의 ‘부활’ 스킬로만 일어나요</div>
      </>}
      <Board title="병원묵시록 명예의 전당 (방어 웨이브)" rows={ranks} fmt={r => `${r.value}웨이브`} />
    </div>
  );
}
function wrapText(x: CanvasRenderingContext2D, text: string, maxW: number) { const words = text.split(" "), lines: string[] = []; let cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }

/* ---------- 배경: 병원 정문 앞 마당 (위에서 내려다봄) ---------- */
function buildBg(W: number, H: number, CS: number, chapter = 0) {
  const d = Math.min(2, devicePixelRatio || 1), cv = document.createElement("canvas"); cv.width = W * d; cv.height = H * d; const x = cv.getContext("2d")!; x.scale(d, d);
  const rnd = (i: number) => { const v = Math.sin(i * 91.7) * 43758.5; return v - Math.floor(v); };
  const LY = H - CS * 2.1;
  x.fillStyle = "#A9ADB3"; x.fillRect(0, 0, W, H);
  // 보도블록 격자
  x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 1; for (let i = 0; i <= COLS; i++) { x.beginPath(); x.moveTo(i * CS, 0); x.lineTo(i * CS, LY); x.stroke(); } for (let j = 0; j < 12; j++) { x.beginPath(); x.moveTo(0, j * CS); x.lineTo(W, j * CS); x.stroke(); }
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${rnd(i) > .5 ? "120,124,130" : "150,154,160"},.5)`; x.fillRect(rnd(i * 3) * W, rnd(i * 7) * LY, 2, 2); }
  // 벚나무(오른쪽 위) · 금지 표지판 · 쓰러진 경찰 방패 · 핏자국
  const tree = (cx: number, cy: number, r: number) => { for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(${240 + rnd(k) * 15},${160 + rnd(k * 2) * 40},${190 + rnd(k * 3) * 30},.9)`; x.beginPath(); x.arc(cx + (rnd(k * 5) - .5) * r * 1.6, cy + (rnd(k * 9) - .5) * r * 1.4, r * (.3 + rnd(k * 7) * .35), 0, 7); x.fill(); } };
  tree(W - CS * .6, CS * 1.2, CS * 1.2); tree(W - CS * .2, CS * 3.6, CS * .9);
  x.fillStyle = "#555"; x.fillRect(CS * 1.2, CS * 1.9, 4, CS * 1.2); x.fillStyle = "#fff"; x.beginPath(); x.arc(CS * 1.22, CS * 1.7, CS * .3, 0, 7); x.fill(); x.strokeStyle = "#E2574C"; x.lineWidth = 6; x.beginPath(); x.arc(CS * 1.22, CS * 1.7, CS * .3, 0, 7); x.stroke(); x.beginPath(); x.moveTo(CS * 1.0, CS * 1.5); x.lineTo(CS * 1.44, CS * 1.9); x.stroke();
  x.save(); x.translate(W - CS * 1.4, CS * 5.8); x.rotate(.5); x.fillStyle = "#2A3B5A"; x.beginPath(); (x as any).roundRect ? (x as any).roundRect(-CS * .35, -CS * .5, CS * .7, CS, 10) : x.rect(-CS * .35, -CS * .5, CS * .7, CS); x.fill(); x.fillStyle = "#fff"; x.font = `800 ${Math.floor(CS * .18)}px system-ui`; x.textAlign = "center"; x.fillText("POLICE", 0, CS * .06); x.restore();
  for (let i = 0; i < 14; i++) { const px = rnd(i * 11 + 1) * W, py = rnd(i * 13 + 2) * (LY - CS); x.fillStyle = `rgba(140,10,10,${.35 + rnd(i) * .3})`; x.beginPath(); x.ellipse(px, py, CS * (.15 + rnd(i) * .3), CS * (.08 + rnd(i * 3) * .12), rnd(i * 5) * 3, 0, 7); x.fill(); for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(px + (rnd(i * 17 + k) - .5) * CS, py + (rnd(i * 19 + k) - .5) * CS * .5, CS * .04, 0, 7); x.fill(); } }
  // 바리케이드: 병상·책상·모래주머니
  x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, LY - 4, W, CS * .5);
  for (let i = 0; i < COLS; i++) { const bx = i * CS; x.fillStyle = i % 2 ? "#C9D3DE" : "#8B5A2B"; x.fillRect(bx + 3, LY - CS * .35, CS - 6, CS * .45); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(bx + 3, LY + CS * .02, CS - 6, CS * .08); if (i % 2 === 0) { x.fillStyle = "#B59A6A"; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(bx + CS * (.2 + k * .3), LY - CS * .42, CS * .14, CS * .08, 0, 0, 7); x.fill(); } } else { x.strokeStyle = "#5A6472"; x.lineWidth = 2; x.strokeRect(bx + 8, LY - CS * .3, CS - 16, CS * .3); } }
  // 병원 입구 바닥(아래)
  x.fillStyle = "#E9EEF4"; x.fillRect(0, LY + CS * .1, W, H - LY); x.fillStyle = "#C9D3DE"; x.fillRect(0, LY + CS * .1, W, 6);
  x.strokeStyle = "rgba(0,0,0,.08)"; for (let i = 0; i <= COLS * 2; i++) { x.beginPath(); x.moveTo(i * CS * .5, LY + CS * .1); x.lineTo(i * CS * .5, H); x.stroke(); }
  x.fillStyle = "#E2574C"; x.font = `800 ${Math.floor(CS * .3)}px system-ui`; x.textAlign = "center"; x.globalAlpha = .25; x.fillText("EMERGENCY  →", W / 2, H - CS * .25); x.globalAlpha = 1;
  const vg = x.createRadialGradient(W / 2, H * .5, H * .3, W / 2, H * .5, W * .9); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.3)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  if (chapter > 0) { x.fillStyle = CHAPTERS[chapter].tint; x.fillRect(0, 0, W, H);
    if (chapter === 1) { for (const lx of [CS * .5, W - CS * .5]) { const lg = x.createRadialGradient(lx, CS * .4, 0, lx, CS * .4, CS * 2.2); lg.addColorStop(0, "rgba(255,230,160,.5)"); lg.addColorStop(1, "rgba(255,230,160,0)"); x.fillStyle = lg; x.fillRect(0, 0, W, H); } }
    if (chapter === 2) { const dg = x.createLinearGradient(0, 0, 0, H); dg.addColorStop(0, "rgba(255,120,60,.35)"); dg.addColorStop(.5, "rgba(0,0,0,0)"); x.fillStyle = dg; x.fillRect(0, 0, W, H); }
    if (chapter === 3) { x.strokeStyle = "rgba(200,220,255,.35)"; x.lineWidth = 1; for (let i = 0; i < 160; i++) { const rx = rnd(i * 23) * W, ry = rnd(i * 29) * H; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 4, ry + CS * .35); x.stroke(); } } }
  return cv;
}
function drawHero(x: CanvasRenderingContext2D, h: Hero, CS: number, t: number, shield: boolean) {
  const Hd = HEROES[h.k], S = CS * 1.35, im = art(Hd.art, HERO_SVG[Hd.art]);
  x.save(); if (h.down) x.globalAlpha = .45;
  x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(h.x, h.y + CS * .38, CS * .32, CS * .09, 0, 0, 7); x.fill();
  if (shield) { x.strokeStyle = "#C9A2FF"; x.lineWidth = 3; x.globalAlpha = .7; x.beginPath(); x.ellipse(h.x, h.y - CS * .1, CS * .55, CS * .75, 0, 0, 7); x.stroke(); x.globalAlpha = h.down ? .45 : 1; }
  if (im) { x.save(); x.translate(h.x, h.y + Math.sin(t * 3 + h.x) * 1.2 - h.atk * CS * .12); if (h.face < 0) x.scale(-1, 1); if (h.down) { x.rotate(Math.PI / 2 * .9); } x.drawImage(im, -S / 2, -S * .66, S, S); x.restore(); }
  else { x.fillStyle = Hd.color; x.beginPath(); x.arc(h.x, h.y - CS * .3, CS * .35, 0, 7); x.fill(); }
  x.restore();
}
function drawZombieBody(x: CanvasRenderingContext2D, T: typeof ZT[number], CS: number, walk: number, face: number, eating: boolean) {
  const R = T.size * CS, sw = Math.sin(walk);
  x.save(); x.scale(face, 1);
  x.strokeStyle = "#1A1F16"; x.lineWidth = Math.max(1, R * .05); x.lineCap = "round"; x.lineJoin = "round";
  x.fillStyle = "#3E4A3A"; for (const s of [-1, 1]) { x.save(); x.translate(s * R * .1, R * .05); x.rotate(sw * .5 * s); x.fillRect(-R * .07, 0, R * .14, R * .42); x.strokeRect(-R * .07, 0, R * .14, R * .42); x.restore(); }
  x.fillStyle = T.cloth; x.beginPath(); x.moveTo(-R * .22, -R * .5); x.lineTo(R * .24, -R * .48); x.lineTo(R * .28, R * .1); x.lineTo(R * .05, R * .14); x.lineTo(-R * .02, R * .06); x.lineTo(-R * .25, R * .12); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = "rgba(120,10,10,.55)"; x.beginPath(); x.ellipse(R * .05, -R * .2, R * .1, R * .07, .4, 0, 7); x.fill();
  x.fillStyle = T.body; const reach = eating ? Math.sin(walk * 2) * .4 : .1;
  for (const s of [0, 1]) { x.save(); x.translate(R * (.12 + s * .06), -R * .4); x.rotate(-1.35 + reach + s * .15 + sw * .1); x.fillRect(-R * .06, 0, R * .12, R * .5); x.strokeRect(-R * .06, 0, R * .12, R * .5); x.restore(); }
  x.fillStyle = T.body; x.beginPath(); x.arc(R * .06, -R * .66, R * .2, 0, 7); x.fill(); x.stroke();
  x.fillStyle = "#1A1F16"; x.beginPath(); x.arc(R * .14, -R * .69, R * .035, 0, 7); x.fill(); x.fillStyle = "#3A0A0A"; x.fillRect(R * .08, -R * .58, R * .13, R * .04);
  x.restore();
}
function drawZombie(x: CanvasRenderingContext2D, z: Z, CS: number, t: number) {
  const T = ZT[z.t], R = T.size * CS;
  x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(z.x, z.y + R * .45, R * .35, R * .1, 0, 0, 7); x.fill();
  x.save(); x.translate(z.x, z.y + R * .05 - (z.frz > 0 ? 0 : Math.abs(Math.sin(t * 6 + z.seed)) * R * .05)); x.rotate(z.frz > 0 ? 0 : Math.sin(t * 3 + z.seed) * .08 + (z.eating ? .15 * z.face : 0));
  if (z.t === 4) { x.shadowColor = "#FF2A1A"; x.shadowBlur = 16; }
  drawZombieBody(x, T, CS, z.frz > 0 ? 0 : t * (z.t === 1 ? 14 : 7) + z.seed, z.face, z.eating);
  if (z.hit > 0) { x.globalAlpha = z.hit * .6; x.globalCompositeOperation = "lighter"; drawZombieBody(x, T, CS, t * 7 + z.seed, z.face, z.eating); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; }
  if (z.frz > 0) { x.globalAlpha = .55; x.fillStyle = "#BFEFFF"; x.strokeStyle = "#fff"; x.lineWidth = 2; x.beginPath(); x.moveTo(-R * .35, R * .2); x.lineTo(-R * .3, -R * .9); x.lineTo(R * .35, -R * .85); x.lineTo(R * .4, R * .2); x.closePath(); x.fill(); x.stroke(); x.globalAlpha = 1; }
  if (z.burn > 0) { x.fillStyle = `rgba(255,${120 + Math.random() * 100},40,.8)`; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse((k - 1) * R * .15, -R * .3 - Math.random() * R * .4, R * .08, R * .16, 0, 0, 7); x.fill(); } }
  if (z.stun > 0) { x.fillStyle = "#FFE08A"; x.font = `800 ${Math.floor(R * .3)}px system-ui`; x.textAlign = "center"; x.fillText("✦ ✦", 0, -R * .95); }
  x.restore();
  const p = z.hp / z.max; if (p < 1) { x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(z.x - R * .3, z.y - R * .98, R * .6, 3); x.fillStyle = z.t === 4 ? "#E2574C" : "#9FD36E"; x.fillRect(z.x - R * .3, z.y - R * .98, R * .6 * Math.max(0, p), 3); }
}
