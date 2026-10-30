"use client";
import { useEffect, useRef, useState } from "react";
import { ivLoad, ivSubmit, type IvState } from "@/lib/daily.actions";

const DUR = 30;
type Vein = { pts: [number, number][]; w: number };
/** 원샷원킬 IV: 표시된 소독 구역 안의 혈관 정중앙을 탭! 30초 · 하루 3번 */
export default function OneShot() {
  const [st, setSt] = useState<IvState | null>(null), [play, setPlay] = useState(false), [res, setRes] = useState<{ score: number; hits: number; perfect: number; xp?: number; error?: string } | null>(null), [hud, setHud] = useState({ t: DUR, score: 0, combo: 0 });
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const g = useRef({ W: 0, H: 0, t: 0, score: 0, combo: 0, hits: 0, perfect: 0, veins: [] as Vein[], target: 0, zx: 0, zr: 30, raf: 0, last: 0, fx: [] as { x: number; y: number; t: number; txt: string; good: boolean }[], bruises: [] as { x: number; y: number }[], needle: null as null | { x: number; y: number; t: number }, phase: 0, running: false });
  useEffect(() => { ivLoad().then(setSt).catch(() => {}); }, []);
  const newArm = () => {
    const s = g.current, W = s.W, H = s.H, top = H * .28, bot = H * .78, n = 3;
    const lv = Math.min(1, s.t / DUR), w = 10 - lv * 6;
    s.veins = Array.from({ length: n }, (_, i) => { const y0 = top + (bot - top) * (i + .5) / n + (Math.random() - .5) * 18, amp = 8 + Math.random() * 16, f = 1 + Math.random() * 1.5, ph = Math.random() * 6; return { w: w * (.8 + Math.random() * .4), pts: Array.from({ length: 41 }, (_, k) => { const x = W * .08 + (W * .84) * k / 40; return [x, y0 + Math.sin(k / 40 * Math.PI * f + ph) * amp] as [number, number]; }) }; });
    s.target = Math.floor(Math.random() * n); s.zx = W * (.25 + Math.random() * .55); s.zr = Math.max(18, 34 - lv * 14); s.phase = Math.random() * 6; s.bruises = [];
  };
  const veinY = (v: Vein, x: number, roll: number) => { const p = v.pts, k = Math.max(0, Math.min(p.length - 2, Math.floor((x - p[0][0]) / (p[1][0] - p[0][0])))), a = p[k], b = p[k + 1], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t + roll; };
  const roll = () => { const s = g.current, lv = Math.min(1, s.t / DUR); return Math.sin(s.t * (2 + lv * 3) + s.phase) * lv * 9; };
  const draw = () => {
    const s = g.current, c = cv.current; if (!c) return; const x = c.getContext("2d")!; const W = s.W, H = s.H;
    x.clearRect(0, 0, W, H); x.fillStyle = "#EAF2F8"; x.fillRect(0, 0, W, H);
    // 팔
    const ag = x.createLinearGradient(0, H * .18, 0, H * .88); ag.addColorStop(0, "#E9B999"); ag.addColorStop(.5, "#F6D2B8"); ag.addColorStop(1, "#D9A585"); x.fillStyle = ag; x.beginPath(); x.roundRect(-20, H * .18, W + 40, H * .7, H * .3); x.fill();
    x.fillStyle = "#3D7DD8"; x.fillRect(W * .04, H * .16, W * .035, H * .74); x.fillStyle = "rgba(255,255,255,.4)"; x.fillRect(W * .045, H * .16, W * .008, H * .74);
    const rl = roll();
    for (const [i, v] of s.veins.entries()) { x.save(); x.strokeStyle = i === s.target ? "rgba(70,90,170,.75)" : "rgba(90,110,170,.45)"; x.lineWidth = v.w; x.lineCap = "round"; x.beginPath(); v.pts.forEach(([px, py], k) => k ? x.lineTo(px, py + rl) : x.moveTo(px, py + rl)); x.stroke(); x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = v.w * .3; x.stroke(); x.restore(); }
    const ty = veinY(s.veins[s.target], s.zx, rl);
    x.save(); x.strokeStyle = "rgba(255,180,60,.9)"; x.setLineDash([5, 4]); x.lineWidth = 2; x.beginPath(); x.arc(s.zx, ty, s.zr, 0, 7); x.stroke(); x.restore();
    x.fillStyle = "rgba(255,240,200,.18)"; x.beginPath(); x.arc(s.zx, ty, s.zr, 0, 7); x.fill();
    for (const b of s.bruises) { const bg = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, 12); bg.addColorStop(0, "rgba(120,40,120,.5)"); bg.addColorStop(1, "rgba(120,40,120,0)"); x.fillStyle = bg; x.beginPath(); x.arc(b.x, b.y, 12, 0, 7); x.fill(); }
    if (s.needle) { const n = s.needle, a = Math.max(0, n.t); x.save(); x.globalAlpha = a; x.translate(n.x, n.y); x.rotate(-.6); x.fillStyle = "#E9F4FF"; x.strokeStyle = "#5A6B85"; x.lineWidth = 1.5; x.fillRect(4, -5, 46, 10); x.strokeRect(4, -5, 46, 10); x.fillStyle = "#5FD1F5"; x.fillRect(8, -3, 26, 6); x.strokeStyle = "#9AA6B8"; x.lineWidth = 2; x.beginPath(); x.moveTo(4, 0); x.lineTo(-10, 0); x.stroke(); x.restore(); }
    for (const f of s.fx) { x.save(); x.globalAlpha = Math.min(1, f.t * 1.5); x.font = `800 ${f.good ? 20 : 16}px system-ui`; x.textAlign = "center"; x.lineWidth = 4; x.strokeStyle = "#fff"; x.fillStyle = f.good ? "#E2574C" : "#5A6B85"; const yy = f.y - (1 - f.t) * 30; x.strokeText(f.txt, f.x, yy); x.fillText(f.txt, f.x, yy); x.restore(); }
  };
  const tick = (now: number) => {
    const s = g.current; if (!s.running) return; const dt = Math.min(.05, (now - s.last) / 1000); s.last = now; s.t += dt;
    s.fx = s.fx.map(f => ({ ...f, t: f.t - dt })).filter(f => f.t > 0); if (s.needle) { s.needle.t -= dt * 2; if (s.needle.t <= 0) s.needle = null; }
    draw(); setHud({ t: Math.max(0, DUR - s.t), score: s.score, combo: s.combo });
    if (s.t >= DUR) { s.running = false; finish(); return; }
    s.raf = requestAnimationFrame(tick);
  };
  const finish = async () => {
    const s = g.current; setPlay(false); const r = await ivSubmit(s.score);
    setRes({ score: s.score, hits: s.hits, perfect: s.perfect, xp: r.xp, error: r.error }); setSt(r);
  };
  const start = () => {
    if (!st || st.attempts >= 3) return;
    setRes(null); setPlay(true);
    setTimeout(() => { const c = cv.current!, r = box.current!.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); const s = g.current; s.W = r.width; s.H = r.width * .62; c.width = s.W * d; c.height = s.H * d; c.style.height = s.H + "px"; c.getContext("2d")!.setTransform(d, 0, 0, d, 0, 0);
      Object.assign(s, { t: 0, score: 0, combo: 0, hits: 0, perfect: 0, fx: [], needle: null, running: true, last: performance.now() }); newArm(); s.raf = requestAnimationFrame(tick); }, 30);
  };
  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);
  const tap = (e: React.PointerEvent) => {
    const s = g.current; if (!s.running) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const rl = roll(), v = s.veins[s.target], vy = veinY(v, px, rl), d = Math.abs(py - vy), inZone = Math.hypot(px - s.zx, py - veinY(v, s.zx, rl)) <= s.zr + 4, tol = v.w * .5 + 5;
    s.needle = { x: px, y: py, t: 1 };
    if (inZone && d <= tol) {
      const q = 1 - d / tol, perfect = q > .7; s.combo++; s.hits++; if (perfect) s.perfect++;
      const pts = Math.round((60 + 90 * q + (perfect ? 60 : 0)) * (1 + Math.min(10, s.combo - 1) * .1)); s.score += pts;
      s.fx.push({ x: px, y: py - 10, t: 1, txt: perfect ? `원샷원킬! +${pts}` : `+${pts}`, good: true }); navigator.vibrate?.(perfect ? [15, 20, 25] : 10); newArm();
    } else {
      s.combo = 0; s.score = Math.max(0, s.score - 40); s.bruises.push({ x: px, y: py }); s.fx.push({ x: px, y: py - 10, t: 1, txt: inZone ? "재천자… -40" : "구역 밖! -40", good: false }); navigator.vibrate?.(40);
      box.current?.animate([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 160 });
    }
  };
  const left = st ? 3 - st.attempts : 0;
  return (
    <div className="card os">
      <div className="wd-top"><b>🎯 원샷원킬 IV</b><span className="muted">30초 동안 주황 소독 구역 안 혈관 정중앙을 탭! · 하루 3번 · 자정 리셋</span></div>
      {play ? <>
        <div className="os-hud"><span>⏱ {hud.t.toFixed(1)}s</span><span>🎯 {hud.score.toLocaleString()}</span><span>{hud.combo > 1 ? `🔥 ${hud.combo}콤보` : ""}</span></div>
        <div ref={box} className="os-stage" onPointerDown={tap}><canvas ref={cv} style={{ width: "100%", display: "block", touchAction: "none" }} /></div>
        <div className="muted" style={{ fontSize: 12 }}>뒤로 갈수록 혈관이 가늘어지고 굴러요. 빗나가면 -40 · 연속 성공하면 콤보 보너스</div>
      </> : <>
        {res && <div className="os-res"><div className="big">{res.score.toLocaleString()}점</div><div className="muted">성공 {res.hits}번 · 원샷원킬 {res.perfect}번{res.xp ? ` · +${res.xp} XP` : ""}</div>{res.error && <div className="error">{res.error}</div>}</div>}
        <div className="row" style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
          <button type="button" className="btn" disabled={!st || left <= 0} onClick={start}>{!st ? "불러오는 중…" : left > 0 ? `도전하기 (남은 기회 ${left}/3)` : "오늘 기회 끝! 자정에 다시"}</button>
          {st && st.best > 0 && <span className="muted">내 오늘 최고 {st.best.toLocaleString()}점{st.myRank ? ` · ${st.myRank}등 / ${st.total}명` : ""}</span>}
        </div>
      </>}
      {st && <div className="os-boards">
        <div><div className="os-bt">🏆 오늘의 랭킹 <span className="muted">(1~3등은 내일 「명사수」 + XP)</span></div>
          {st.today.length ? <ol className="os-list">{st.today.map((r, i) => <li key={i} className={r.me ? "me" : ""}><span>{["🥇", "🥈", "🥉"][i] ?? i + 1 + "."}</span><b>{r.name}</b><span>{r.best.toLocaleString()}</span></li>)}</ol> : <div className="muted" style={{ fontSize: 13 }}>아직 오늘 기록이 없어요. 첫 1등의 기회!</div>}</div>
        {st.yesterday.length > 0 && <div><div className="os-bt">🎖️ 어제의 명사수</div><ol className="os-list">{st.yesterday.map((r, i) => <li key={i}><span>{["🥇", "🥈", "🥉"][i]}</span><b>{r.name}</b><span>{r.best.toLocaleString()}</span></li>)}</ol></div>}
      </div>}
    </div>
  );
}
