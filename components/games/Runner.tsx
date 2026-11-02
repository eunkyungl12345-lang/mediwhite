"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop, recordWatcher } from "@/lib/juice";
import { BestLine, RecordFlash } from "./Juice";
import { ZONES, ZONE_LEN, zoneAt, OBS, drawBg, drawNurse, drawOb, drawItem, drawHearts, type ObKind } from "./runnerArt";
import HowTo from "./HowTo";
import { todayGoal, goalDone, markGoal } from "@/lib/goals";
const GOALS = [300, 600, 900, 1200, 1800, 2400, 3000, 4000];
const goalName = (g: number) => g >= 1800 ? `옥상까지 (${g}m)` : g >= 1200 ? `수술실까지 (${g}m)` : g >= 600 ? `응급실까지 (${g}m)` : `${g}m 달리기`;

/** 복도 질주 v2 — 4구역(병동→응급실→수술실→옥상), 하트 3개, 영구 코인 상점, 런 미션, 일시정지 */
type Ob = { x: number; w: number; h: number; kind: ObKind; air?: boolean; it?: "coffee" | "pill" | "star" | "heart"; dead?: boolean };
type Up = "shield" | "magnet" | "boost" | "coffee";
type Meta = { coins: number; up: Record<Up, number>; runs: number; far: number };
const UPS: { k: Up; icon: string; name: string; desc: (l: number) => string; cost: number[] }[] = [
  { k: "shield", icon: "🛡️", name: "방패", desc: l => `시작 시 방패 ${l}개 (피격 1회 무시)`, cost: [60, 150, 320] },
  { k: "magnet", icon: "🧲", name: "자석", desc: l => `아이템 흡수 범위 +${l * 60}%`, cost: [50, 120, 260] },
  { k: "boost", icon: "🚀", name: "부스트", desc: l => `시작하자마자 ${l * 150}m 무적 질주`, cost: [80, 200, 400] },
  { k: "coffee", icon: "☕", name: "커피값", desc: l => `커피 한 잔에 코인 +${l}`, cost: [40, 100, 220] },
];
const META0: Meta = { coins: 0, up: { shield: 0, magnet: 0, boost: 0, coffee: 0 }, runs: 0, far: 0 };
const loadMeta = (): Meta => { try { return { ...META0, ...JSON.parse(localStorage.getItem("mw-run") || "{}"), up: { ...META0.up, ...(JSON.parse(localStorage.getItem("mw-run") || "{}").up ?? {}) } }; } catch { return META0; } };
const saveMeta = (m: Meta) => { try { localStorage.setItem("mw-run", JSON.stringify(m)); } catch {} };
type Mission = { id: string; text: string; goal: number; get: (r: RunStat) => number; coins: number };
type RunStat = { dist: number; coffee: number; pills: number; combo: number; noHit: number; jumps: number; stars: number };
const MISSIONS: Mission[] = [
  { id: "c10", text: "커피 10잔 마시기", goal: 10, get: r => r.coffee, coins: 20 }, { id: "c25", text: "커피 25잔 마시기", goal: 25, get: r => r.coffee, coins: 50 },
  { id: "d500", text: "500m 달리기", goal: 500, get: r => r.dist, coins: 20 }, { id: "d1200", text: "1,200m 달리기", goal: 1200, get: r => r.dist, coins: 60 }, { id: "d2000", text: "2,000m 달리기 (옥상 도달)", goal: 2000, get: r => r.dist, coins: 120 },
  { id: "k8", text: "콤보 8 만들기", goal: 8, get: r => r.combo, coins: 25 }, { id: "k15", text: "콤보 15 만들기", goal: 15, get: r => r.combo, coins: 60 },
  { id: "n400", text: "안 맞고 400m", goal: 400, get: r => r.noHit, coins: 30 }, { id: "n900", text: "안 맞고 900m", goal: 900, get: r => r.noHit, coins: 80 },
  { id: "p3", text: "알약 3개 먹기", goal: 3, get: r => r.pills, coins: 20 }, { id: "j30", text: "점프 30번", goal: 30, get: r => r.jumps, coins: 15 }, { id: "s1", text: "별 1개 잡기", goal: 1, get: r => r.stars, coins: 30 },
];
const pick3 = () => [...MISSIONS].sort(() => Math.random() - .5).slice(0, 3);

export default function Runner({ ranks, best = 0 }: { ranks: Row[]; best?: number }) {
  const [rec, setRec] = useState(false); const watch = useRef(recordWatcher(best)); const [combo, setCombo] = useState(0);
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "run" | "pause" | "done">("idle"); const [dist, setDist] = useState(0); const [coinsRun, setCoinsRun] = useState(0);
  const [goal, setGoal] = useState(0); const [gDone, setGDone] = useState(false);
  const [meta, setMeta] = useState<Meta>(META0); const [shop, setShop] = useState(false); const [missions, setMissions] = useState<Mission[]>([]); const [stat, setStat] = useState<RunStat>({ dist: 0, coffee: 0, pills: 0, combo: 0, noHit: 0, jumps: 0, stars: 0 }); const [done, setDone] = useState<{ zone: string; got: string[]; coins: number } | null>(null);
  const g = useRef({ W: 0, H: 0, y: 0, vy: 0, jumps: 0, speed: 0, dist: 0, obs: [] as Ob[], nextX: 0, raf: 0, last: 0, run: false, paused: false, t: 0, hitT: 0, inv: 0, ground: 0, hp: 3, sh: 0, boost: 0, coins: 0, cc: 0, zone: -1, noHitFrom: 0, flash: 0, banner: "", bannerT: 0, st: { dist: 0, coffee: 0, pills: 0, combo: 0, noHit: 0, jumps: 0, stars: 0 } as RunStat, meta: META0, ms: [] as Mission[], msDone: new Set<string>(), pulse: 0 });
  useEffect(() => { const m = loadMeta(); setMeta(m); g.current.meta = m; setMissions(pick3()); const gl = todayGoal("runner", GOALS, Math.max(best, m.far)); setGoal(gl); (g.current as any).goal = gl; setGDone(goalDone("runner")); (g.current as any).gDone = goalDone("runner"); }, []);
  useEffect(() => { g.current.ms = missions; }, [missions]);
  useEffect(() => {
    const st = box.current!, c = cv.current!, x = c.getContext("2d")!, s = g.current;
    const size = () => { const r = st.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); s.W = r.width; s.H = Math.round(r.width * (r.width < 560 ? .82 : .56)); c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; x.setTransform(d, 0, 0, d, 0, 0); s.ground = s.H * .8; draw(); };
    const U = () => s.H * .13, PX = () => s.W * .2;
    const draw = () => {
      const z = zoneAt(s.dist); drawBg(x, s.W, s.H, s.ground, s.dist, z, s.t);
      for (const o of s.obs) { if (o.dead) continue; x.save(); if (o.it) { x.translate(o.x + o.w / 2, s.ground - U() * 1.6); drawItem(x, o.it, o.w / 2, s.t + o.x * .01); } else { x.translate(o.x + o.w / 2, o.air ? s.ground - U() * 1.35 : s.ground); drawOb(x, o.kind, o.w, o.h, s.t + o.x * .01); } x.restore(); }
      // 플레이어
      const blink = s.inv > 0 && Math.floor(s.t * 14) % 2 === 0;
      if (!blink) { x.save(); x.translate(PX(), s.ground - s.y); if (s.boost > 0) { x.fillStyle = "rgba(244,211,94,.35)"; for (let i = 1; i <= 4; i++) { x.beginPath(); x.ellipse(-i * U() * .35, -U() * 1.0, U() * .5, U() * .9, 0, 0, 7); x.fill(); } } if (s.pulse > 0) x.scale(1 + s.pulse * .22, 1 + s.pulse * .22); drawNurse(x, U(), s.t, s.hitT > 0 ? "hit" : s.y > 0 ? "jump" : s.run ? "run" : "idle", s.sh > 0 || s.boost > 0); x.restore(); }
      // HUD
      drawHearts(x, 16, 18, s.hp, 3, s.sh);
      x.fillStyle = z.sky ? "#FFF" : "#18231F"; x.font = `800 ${Math.floor(s.H * .085)}px system-ui`; x.textAlign = "right"; x.textBaseline = "top"; x.fillText(`${Math.floor(s.dist)}m`, s.W - 14, 10);
      x.font = `600 ${Math.floor(s.H * .05)}px system-ui`; x.fillStyle = z.sky ? "#F4D35E" : "#7A5B12"; x.fillText(`🪙 ${s.coins}`, s.W - 14, 14 + s.H * .095);
      x.textAlign = "left"; x.fillStyle = z.sky ? "rgba(255,255,255,.75)" : "rgba(24,35,31,.6)"; x.fillText(z.name + ((g.current as any).goal && !(g.current as any).gDone ? ` · 🎯 ${(g.current as any).goal}m` : ""), 16, 34);
      if (s.cc >= 5) { x.textAlign = "center"; x.fillStyle = "#E2574C"; x.font = `900 ${Math.floor(s.H * .07)}px system-ui`; x.fillText(`${s.cc} COMBO`, s.W / 2, 12); }
      if (s.bannerT > 0) { x.globalAlpha = Math.min(1, s.bannerT); x.fillStyle = "rgba(24,35,31,.8)"; x.fillRect(0, s.H * .36, s.W, s.H * .18); x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `800 ${Math.floor(s.H * .085)}px system-ui`; x.fillText(s.banner, s.W / 2, s.H * .45); x.globalAlpha = 1; }
      if (s.flash > 0) { x.fillStyle = `rgba(226,87,76,${s.flash * .5})`; x.fillRect(0, 0, s.W, s.H); }
    };
    const zoneIdx = () => Math.min(ZONES.length - 1, Math.floor(s.dist / ZONE_LEN));
    const spawn = () => { const zi = zoneIdx(), r = Math.random(), u = U();
      if (r < .6) { const kinds = (Object.keys(OBS) as ObKind[]).filter(k => OBS[k].zones.includes(zi)); const k = kinds[Math.floor(Math.random() * kinds.length)], sp = OBS[k]; s.obs.push({ x: s.W + 20, w: u * sp.w, h: u * sp.h, kind: k, air: sp.air }); }
      else { const it = r < .85 ? "coffee" : r < .95 ? "pill" : r < .985 ? "star" : "heart"; s.obs.push({ x: s.W + 20, w: u * .8, h: u * .8, kind: "cart", it });
        if (it === "coffee" && Math.random() < .5) for (let i = 1; i <= 2; i++) s.obs.push({ x: s.W + 20 + i * u * 1.1, w: u * .8, h: u * .8, kind: "cart", it: "coffee" }); }
      s.nextX = s.W * (.5 + Math.random() * .55) * Math.max(.5, 1 - s.dist / 5000) + (r >= .6 ? u * 2.5 : 0); };
    const hurt = () => { if (s.inv > 0 || s.boost > 0) return; if (s.sh > 0) { s.sh--; s.inv = 1.2; sfx.hit(); haptic(20); pop(st, PX(), s.ground - U() * 2.2, "방패!", "good"); return; }
      s.hp--; s.hitT = .35; s.inv = 1.5; s.flash = 1; s.cc = 0; setCombo(0); s.noHitFrom = s.dist; sfx.boom(); haptic([40, 40, 40]); shake(st, "l"); burst(st, PX(), s.ground - U(), "#E2574C", 16);
      if (s.hp <= 0) finish(); };
    const checkMissions = () => { s.st.dist = s.dist; s.st.noHit = s.dist - s.noHitFrom; for (const m of s.ms) if (!s.msDone.has(m.id) && m.get(s.st) >= m.goal) { s.msDone.add(m.id); s.coins += m.coins; sfx.perfect(); pop(st, s.W / 2, s.H * .3, `미션 완료! +${m.coins}🪙`, "good big"); } };
    const finish = () => { s.run = false; cancelAnimationFrame(s.raf); const final = Math.floor(s.dist); checkMissions();
      const m = { ...s.meta, coins: s.meta.coins + s.coins, runs: s.meta.runs + 1, far: Math.max(s.meta.far, final) }; s.meta = m; saveMeta(m); setMeta(m);
      setDist(final); setCoinsRun(s.coins); setStat({ ...s.st }); setDone({ zone: zoneAt(final).name, got: [...s.msDone], coins: s.coins }); setState("done"); saveScore("runner", final).catch(() => {}); draw(); };
    const tick = (t: number) => { if (s.paused) return; const dt = Math.min(.04, (t - s.last) / 1000); s.last = t; s.t += dt;
      s.speed = s.W * (.72 + Math.min(1.2, s.dist / 1300)) * (s.boost > 0 ? 1.6 : 1); s.dist += s.speed * dt / 10;
      if (s.boost > 0) { s.boost -= s.speed * dt / 10; if (s.boost <= 0) { s.boost = 0; pop(st, PX(), s.ground - U() * 2.4, "부스트 끝", ""); } }
      const zi = zoneIdx(); if (zi !== s.zone) { s.zone = zi; if (zi > 0) { s.banner = `${ZONES[zi].name} 진입!`; s.bannerT = 2; sfx.level(); haptic(15); } }
      s.vy -= s.H * 3.2 * dt; s.y = Math.max(0, s.y + s.vy * dt); if (s.y === 0) { s.vy = 0; s.jumps = 0; }
      s.nextX -= s.speed * dt; if (s.nextX <= 0) spawn();
      const px = PX(), u = U(), py = s.ground - s.y - u, mag = 1 + s.meta.up.magnet * .6;
      for (const o of s.obs) { if (o.dead) continue; o.x -= s.speed * dt;
        if (o.it) { const oy = s.ground - u * 1.6, dx = o.x + o.w / 2 - px, dy = oy - py, d = Math.hypot(dx, dy);
          if (d < u * 1.6 * mag && d > u * .5) { o.x -= dx * dt * 6 * (mag - .5); }
          if (d < u * .95) { o.dead = true; s.cc++; const cc = s.cc; s.st.combo = Math.max(s.st.combo, cc); const mult = 1 + Math.min(3, Math.floor(cc / 5)) * .5;
            if (o.it === "coffee") { s.st.coffee++; s.coins += 1 + s.meta.up.coffee; s.dist += 8 * mult; } else if (o.it === "pill") { s.st.pills++; s.coins += 3; s.dist += 30 * mult; } else if (o.it === "star") { s.st.stars++; s.coins += 15; s.dist += 100; s.inv = Math.max(s.inv, 1); } else { s.hp = Math.min(3, s.hp + 1); }
            s.pulse = 1; setCombo(cc); sfx.coin(); haptic(8); burst(st, o.x + o.w / 2, oy, o.it === "pill" ? "#9B7EDE" : o.it === "star" ? "#F4D35E" : o.it === "heart" ? "#F07A70" : "#B08968", 8); pop(st, o.x + o.w / 2, oy - 10, o.it === "heart" ? "+❤️" : o.it === "star" ? "+100m ⭐" : `+${Math.round((o.it === "pill" ? 30 : 8) * mult)}m`, "good"); if (cc % 5 === 0) sfx.combo(cc); } }
        else { const oy = o.air ? s.ground - u * 1.35 - o.h / 2 : s.ground - o.h / 2; const dx = Math.abs(o.x + o.w / 2 - px), dy = Math.abs(oy - py); if (dx < (o.w / 2 + u * .3) && dy < (o.h / 2 + u * .75)) { if (s.boost > 0) { o.dead = true; burst(st, o.x + o.w / 2, oy, "#F4D35E", 10); sfx.hit(); } else hurt(); } } }
      s.obs = s.obs.filter(o => o.x > -200 && !o.dead);
      if (s.pulse > 0) s.pulse -= dt * 5; const GG = (g.current as any); if (GG.goal && !GG.gDone && s.dist >= GG.goal) { GG.gDone = true; markGoal("runner"); setGDone(true); s.banner = `🎯 오늘의 목표 달성!`; s.bannerT = 2.5; sfx.record(); haptic([30, 50, 30]); s.paused = true; setTimeout(() => { s.paused = false; s.last = performance.now(); s.raf = requestAnimationFrame(tick); }, 220); }
      if (s.hitT > 0) s.hitT -= dt; if (s.inv > 0) s.inv -= dt; if (s.flash > 0) s.flash -= dt * 2; if (s.bannerT > 0) s.bannerT -= dt;
      if (!s.run) return; checkMissions(); setDist(Math.floor(s.dist)); watch.current(s.dist, () => { setRec(true); sfx.record(); setTimeout(() => setRec(false), 1400); }); draw(); s.raf = requestAnimationFrame(tick); };
    (st as any).__start = () => { setRec(false); setDone(null); watch.current = recordWatcher(best); const ms = pick3(); setMissions(ms); s.ms = ms; s.msDone = new Set(); s.st = { dist: 0, coffee: 0, pills: 0, combo: 0, noHit: 0, jumps: 0, stars: 0 }; s.cc = 0; setCombo(0); sfx.level();
      s.y = 0; s.vy = 0; s.jumps = 0; s.dist = 0; s.obs = []; s.nextX = s.W * .9; s.hitT = 0; s.inv = 0; s.flash = 0; s.hp = 3; s.sh = s.meta.up.shield; s.boost = s.meta.up.boost * 150; s.coins = 0; s.zone = 0; s.noHitFrom = 0; s.banner = ""; s.bannerT = 0; s.run = true; s.paused = false; s.t = 0; s.last = performance.now(); setState("run"); setDist(0); setCoinsRun(0); cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(tick); };
    (st as any).__pause = (v: boolean) => { if (!s.run) return; s.paused = v; setState(v ? "pause" : "run"); if (!v) { s.last = performance.now(); s.raf = requestAnimationFrame(tick); } };
    (st as any).__jump = () => { if (!s.run || s.paused) return; if (s.jumps < 2) { s.vy = s.H * (s.jumps === 0 ? 1.55 : 1.35); s.jumps++; s.st.jumps++; sfx.whoosh(); haptic(6); } };
    const ro = new ResizeObserver(size); ro.observe(st); size();
    const pd = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; e.preventDefault(); (st as any).__jump(); };
    const kd = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); (st as any).__jump(); } if (e.code === "Escape") (st as any).__pause(!s.paused); };
    const vis = () => { if (document.hidden) (st as any).__pause(true); };
    st.addEventListener("pointerdown", pd); addEventListener("keydown", kd); document.addEventListener("visibilitychange", vis);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); st.removeEventListener("pointerdown", pd); removeEventListener("keydown", kd); document.removeEventListener("visibilitychange", vis); };
  }, []);
  const buy = (u: typeof UPS[number]) => { const l = meta.up[u.k]; if (l >= 3) return; const cost = u.cost[l]; if (meta.coins < cost) { sfx.fail(); return; } const m = { ...meta, coins: meta.coins - cost, up: { ...meta.up, [u.k]: l + 1 } }; setMeta(m); g.current.meta = m; saveMeta(m); sfx.perfect(); haptic(10); };
  const idle = state === "idle" || state === "done";
  return (
    <div className="card run2">
      <div><h3>복도 질주</h3><div className="muted">탭=점프(공중에서 한 번 더 = 2단). 병동 → 응급실 → 수술실 → 옥상, 600m마다 구역이 바뀌고 장애물이 달라져요. 떨어지는 차트·비둘기는 <b>안 뛰어야</b> 피해요. 하트 3개, 🪙 코인으로 영구 업그레이드.</div></div>
      <HowTo id="runner" steps={[{ icon: "👆", title: "탭 = 점프", desc: "공중에서 한 번 더 누르면 2단 점프" }, { icon: "🛒", title: "바닥 장애물은 뛰어넘기", desc: "카트·휠체어·들것" }, { icon: "🐦", title: "날아오는 건 안 뛰기", desc: "차트·비둘기는 가만히 있으면 지나가요" }]} />
      {goal > 0 && <div className={"goal" + (gDone ? " done" : "")}>🎯 오늘의 목표: <b>{goalName(goal)}</b>{gDone ? <small>✅ 달성!</small> : <small>최고 {Math.max(best, meta.far)}m</small>}</div>}
      <div className="def-bar"><span className="def-sun">🏃‍♀️ {dist}m{combo >= 5 && <span className="tag" style={{ marginLeft: 6 }}>{combo} COMBO</span>}</span><span className="muted">🪙 {meta.coins}{state === "run" && coinsRun ? ` (+${coinsRun})` : ""}</span><BestLine best={best} cur={dist} unit="m" /></div>
      <div className="def-stage" ref={box} style={{ touchAction: "manipulation" }}><canvas ref={cv} />{rec && <RecordFlash />}
        {(state === "run" || state === "pause") && <button type="button" className="run-pause" aria-label="일시정지" onClick={e => { e.stopPropagation(); (box.current as any).__pause(state === "run"); }}>{state === "run" ? "❚❚" : "▶"}</button>}
        {state === "pause" && <button type="button" className="overlay" onClick={e => { e.stopPropagation(); (box.current as any).__pause(false); }}><span className="big">일시정지</span><span>터치해서 계속</span></button>}
        {idle && !shop && <div className="overlay run-ov" onPointerDown={e => e.stopPropagation()}>
          {state === "done" && done ? <>
            <span className="big">{dist}m</span><span className="run-sub">{done.zone}까지 · 🪙 +{done.coins} · 커피 {stat.coffee}잔 · 최대 콤보 {stat.combo}</span>
            <div className="run-ms">{missions.map(m => <span key={m.id} className={done.got.includes(m.id) ? "ok" : ""}>{done.got.includes(m.id) ? "✅" : "⬜"} {m.text} <small>+{m.coins}🪙</small></span>)}</div>
          </> : <>
            <span className="big">복도 질주</span><span className="run-sub">{meta.runs ? `최장 ${meta.far}m · ${meta.runs}번 달림` : "탭=점프 · 하트 3개 · 코인 모아 업그레이드"}</span>
            <div className="run-ms"><b>이번 런 미션</b>{missions.map(m => <span key={m.id}>⬜ {m.text} <small>+{m.coins}🪙</small></span>)}</div>
          </>}
          <div className="run-btns"><button type="button" className="btn" onClick={() => (box.current as any).__start()}>{state === "done" ? "다시 달리기" : "달리기 시작"}</button><button type="button" className="btn ghost" onClick={() => setShop(true)}>🛒 상점 (🪙 {meta.coins})</button></div>
        </div>}
        {idle && shop && <div className="overlay run-ov shop" onPointerDown={e => e.stopPropagation()}>
          <span className="big" style={{ fontSize: 24 }}>🛒 업그레이드 · 🪙 {meta.coins}</span>
          <div className="run-shop">{UPS.map(u => { const l = meta.up[u.k]; return <button type="button" key={u.k} className={"run-up" + (l >= 3 ? " max" : meta.coins >= u.cost[l] ? " can" : "")} onClick={() => buy(u)}><span className="run-ui">{u.icon}</span><span className="run-un">{u.name} <small>{"●".repeat(l)}{"○".repeat(3 - l)}</small><br /><em>{u.desc(Math.min(3, l + 1))}</em></span><span className="run-uc">{l >= 3 ? "MAX" : `🪙 ${u.cost[l]}`}</span></button>; })}</div>
          <div className="run-btns"><button type="button" className="btn" onClick={() => setShop(false)}>닫기</button></div>
        </div>}
      </div>
      <Board title="복도 질주 명예의 전당" rows={ranks} fmt={r => r.value + "m"} />
    </div>
  );
}
