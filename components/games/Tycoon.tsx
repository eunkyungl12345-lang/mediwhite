"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, burst, pop } from "@/lib/juice";

/** 우리 병원 — 방치형 경영. 직원을 고용하고 시설을 늘리면 접속 안 해도 매출이 쌓여요. (계정 저장) */
type Dept = "원무" | "간호" | "물리치료" | "방사선" | "임상병리" | "응급구조" | "의사" | "총괄";
type DeptDef = { icon: string; rate: number; cost: number; need?: string; desc: string };
const DEPTS: Record<Dept, DeptDef> = {
  원무:   { icon: "🧾", rate: 2,    cost: 60,      desc: "접수·수납. 병원의 시작" },
  간호:   { icon: "💉", rate: 6,    cost: 300,     desc: "처치·투약, 환자 회전율 ↑" },
  물리치료: { icon: "🦵", rate: 18,  cost: 1500,    need: "재활센터", desc: "재활 치료 수익" },
  방사선: { icon: "☢️", rate: 50,   cost: 7000,    need: "검사실", desc: "X-ray·CT 촬영 수익" },
  임상병리: { icon: "🧪", rate: 140, cost: 30000,   need: "검사실", desc: "혈액·검체 검사 수익" },
  응급구조: { icon: "🚑", rate: 400, cost: 150000,  need: "응급실", desc: "응급 이송·처치 수익" },
  의사:   { icon: "🩺", rate: 1200, cost: 800000,  desc: "진료·수술. 가장 큰 수익" },
  총괄:   { icon: "👔", rate: 0,    cost: 500000,  desc: "1명당 병원 전체 매출 +5%" },
};
const DORDER = Object.keys(DEPTS) as Dept[];
const MILESTONES = [10, 25, 50, 100, 200];
type Room = { name: string; icon: string; cost: number; mult: number; desc: string };
const ROOMS: Room[] = [
  { name: "외래", icon: "🏥", cost: 0, mult: 1, desc: "기본 진료실" },
  { name: "재활센터", icon: "🏋️", cost: 5000, mult: 1.2, desc: "물리치료사 고용 가능 · 매출 ×1.2" },
  { name: "검사실", icon: "🔬", cost: 30000, mult: 1.3, desc: "방사선사·임상병리사 고용 가능 · 매출 ×1.3" },
  { name: "응급실", icon: "🚨", cost: 300000, mult: 1.5, desc: "응급구조사 고용 가능 · 매출 ×1.5" },
  { name: "수술실", icon: "🔪", cost: 3000000, mult: 2, desc: "의사 매출 ×2 · 전체 ×2" },
  { name: "중환자실", icon: "🫀", cost: 30000000, mult: 2.5, desc: "전체 매출 ×2.5" },
  { name: "신관 증축", icon: "🏢", cost: 500000000, mult: 4, desc: "전체 매출 ×4 · 지역 거점병원" },
];
type Saved = { cash: number; total: number; staff: Partial<Record<Dept, { n: number; lv: number }>>; rooms: number; lastSeen: number; patients: number; myDept?: string };
const fmt = (n: number) => { n = Math.floor(n); if (n >= 1e12) return (n / 1e12).toFixed(n < 1e13 ? 1 : 0) + "조"; if (n >= 1e8) return (n / 1e8).toFixed(n < 1e9 ? 1 : 0) + "억"; if (n >= 1e4) return (n / 1e4).toFixed(n < 1e5 ? 1 : 0) + "만"; return n.toLocaleString(); };
const hireCost = (d: Dept, n: number) => Math.round(DEPTS[d].cost * Math.pow(1.13, n));
const lvCost = (d: Dept, lv: number) => Math.round(DEPTS[d].cost * 8 * Math.pow(2.2, lv - 1));
const milestoneMult = (n: number) => Math.pow(2, MILESTONES.filter(m => n >= m).length);
const OFFLINE_CAP = 8 * 3600, OFFLINE_RATE = .5;

function rateOf(s: Saved, mine: string) {
  const mgr = 1 + (s.staff.총괄?.n ?? 0) * .05, room = ROOMS.slice(0, s.rooms + 1).reduce((a, r) => a * r.mult, 1);
  let sum = 0;
  for (const d of DORDER) { const st = s.staff[d]; if (!st || !DEPTS[d].rate) continue; let r = DEPTS[d].rate * st.n * Math.pow(1.5, st.lv - 1) * milestoneMult(st.n); if (d === mine) r *= 1.2; if (d === "의사" && s.rooms >= 4) r *= 2; sum += r; }
  return sum * mgr * room;
}

export default function Tycoon({ ranks, myDept }: { ranks: Row[]; myDept: string }) {
  const [s, setS] = useState<Saved>({ cash: 100, total: 0, staff: {}, rooms: 0, lastSeen: Date.now(), patients: 0 });
  const [loaded, setLoaded] = useState(false);
  const [welcome, setWelcome] = useState<{ sec: number; earn: number; pts: number } | null>(null);
  const [vip, setVip] = useState(false);
  const [tab, setTab] = useState<"staff" | "rooms">("staff");
  const [toast, setToast] = useState("");
  const ref = useRef(s); ref.current = s;
  const box = useRef<HTMLDivElement>(null);
  const mine = myDept === "총괄" ? "총괄" : myDept;
  const rate = rateOf(s, mine);
  const dirty = useRef(false), lastSave = useRef(0), lastScore = useRef(0);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2000); };
  const persist = (force = false) => { const now = Date.now(); if (!force && now - lastSave.current < 15000) { dirty.current = true; return; } lastSave.current = now; dirty.current = false; const cur = { ...ref.current, lastSeen: now }; saveGameState("tycoon", cur).catch(() => {}); if (cur.total >= 1e6 && cur.total > lastScore.current * 1.5) { lastScore.current = cur.total; saveScore("tycoon", Math.floor(cur.total)).catch(() => {}); } };

  useEffect(() => {
    loadGameState("tycoon").then(d => {
      const now = Date.now();
      if (d && typeof (d as Saved).cash === "number") { const sv = d as Saved; const sec = Math.min(OFFLINE_CAP, Math.max(0, (now - sv.lastSeen) / 1000)); const r = rateOf(sv, mine); const earn = Math.floor(r * sec * OFFLINE_RATE); const pts = Math.floor(earn / 500);
        const next = { ...sv, cash: sv.cash + earn, total: sv.total + earn, patients: sv.patients + pts, lastSeen: now }; setS(next); lastScore.current = sv.total; if (earn > 0 && sec > 60) setWelcome({ sec, earn, pts }); }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [mine]);

  // 1초마다 수익 적립, VIP 이벤트
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => { const cur = ref.current; const r = rateOf(cur, mine); if (r > 0) { setS(x => ({ ...x, cash: x.cash + r, total: x.total + r, patients: x.patients + r / 500 })); dirty.current = true; }
      if (dirty.current && Date.now() - lastSave.current > 15000) persist(true);
      if (!vip && r > 0 && Math.random() < 1 / 45) setVip(true); }, 1000);
    const onHide = () => { if (document.visibilityState === "hidden") persist(true); };
    document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", onHide as any);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide as any); };
  }, [loaded, mine, vip]);

  const tap = (e: React.PointerEvent) => { const base = Math.max(10, rate * .02); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setS(x => ({ ...x, cash: x.cash + base, total: x.total + base, patients: x.patients + 1 })); sfx.coin(); haptic(6); pop(box.current, e.clientX - r.left, e.clientY - r.top, "+" + fmt(base), "good"); dirty.current = true; };
  const hire = (d: Dept) => { const st = s.staff[d] ?? { n: 0, lv: 1 }; const c = hireCost(d, st.n); if (s.cash < c) { flash("현금이 부족해요"); return; } const n = st.n + 1; const ms = MILESTONES.includes(n); sfx.tap(); haptic(8); if (ms) { sfx.level(); burst(box.current, 100, 60, "#F2B705", 20); flash(`${d} ${n}명 달성! 매출 ×2`); }
    setS(x => ({ ...x, cash: x.cash - c, staff: { ...x.staff, [d]: { n, lv: st.lv } } })); setTimeout(() => persist(true), 50); };
  const levelUp = (d: Dept) => { const st = s.staff[d]; if (!st) return; const c = lvCost(d, st.lv); if (s.cash < c) { flash("현금이 부족해요"); return; } sfx.level(); haptic([10, 20, 10]); setS(x => ({ ...x, cash: x.cash - c, staff: { ...x.staff, [d]: { n: st.n, lv: st.lv + 1 } } })); flash(`${d} 교육 Lv${st.lv + 1} · 매출 ×1.5`); setTimeout(() => persist(true), 50); };
  const buyRoom = () => { const r = ROOMS[s.rooms + 1]; if (!r) return; if (s.cash < r.cost) { flash("현금이 부족해요"); return; } sfx.level(); haptic([20, 30, 40]); burst(box.current, 120, 80, "#6FBFA9", 24); setS(x => ({ ...x, cash: x.cash - r.cost, rooms: x.rooms + 1 })); flash(`${r.icon} ${r.name} 개설!`); setTimeout(() => persist(true), 50); };
  const claimVip = () => { const bonus = Math.max(100, rate * 30); setVip(false); sfx.level(); haptic([20, 20, 60]); burst(box.current, 160, 60, "#F2B705", 30); setS(x => ({ ...x, cash: x.cash + bonus, total: x.total + bonus })); flash(`💼 VIP 환자 +${fmt(bonus)}원`); setTimeout(() => persist(true), 50); };
  const canHire = (d: Dept) => { const need = DEPTS[d].need; return !need || ROOMS.slice(0, s.rooms + 1).some(r => r.name === need); };
  const nextRoom = ROOMS[s.rooms + 1];
  const level = Math.min(ROOMS.length - 1, s.rooms);

  return (
    <div className="card">
      <div><h3>우리 병원 키우기</h3><div className="muted">직원을 고용하고 시설을 늘리면 <b>접속 안 해도 매출이 쌓여요</b>(최대 8시간, 50%). 내 직종(<b>{mine}</b>)은 매출 +20%. 직원 10·25·50·100명마다 ×2. 누적 매출로 퀘스트 경험치. (계정 저장)</div></div>
      <div className="ty-top" ref={box}>
        <button type="button" className="ty-hospital" onPointerDown={tap} aria-label="병원 탭하기">
          <span className="ty-build">{ROOMS[level].icon}</span>
          <span className="ty-cash">₩ {fmt(s.cash)}</span>
          <span className="ty-rate">초당 +{fmt(rate)}원 · 누적 {fmt(s.total)}원</span>
          <span className="muted" style={{ fontSize: 12 }}>탭해서 직접 진료 · 환자 {fmt(s.patients)}명</span>
        </button>
        {vip && <button type="button" className="ty-vip" onClick={claimVip}>💼 VIP 환자 도착! <small>탭하면 30초치 매출</small></button>}
        {welcome && (
          <div className="ty-welcome" onClick={() => setWelcome(null)}>
            <div className="ty-welcome-card">
              <div className="big">🏥 다녀오셨어요?</div>
              <div>{welcome.sec >= 3600 ? `${Math.floor(welcome.sec / 3600)}시간 ${Math.floor(welcome.sec % 3600 / 60)}분` : `${Math.floor(welcome.sec / 60)}분`} 동안 환자 <b>{welcome.pts.toLocaleString()}명</b> 진료</div>
              <div className="ty-earn">+{fmt(welcome.earn)}원</div>
              <button type="button" className="btn" onClick={() => setWelcome(null)}>받기</button>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="muted">{toast}</div>}
      <div className="cats" style={{ paddingBottom: 0 }}><button type="button" className="cats-btn" aria-pressed={tab === "staff"} onClick={() => setTab("staff")}>👥 직원</button><button type="button" className="cats-btn" aria-pressed={tab === "rooms"} onClick={() => setTab("rooms")}>🏗️ 시설 {s.rooms + 1}/{ROOMS.length}</button></div>
      {tab === "staff" && <div className="ty-list">
        {DORDER.map(d => { const st = s.staff[d] ?? { n: 0, lv: 1 }; const ok = canHire(d); const c = hireCost(d, st.n); const nextM = MILESTONES.find(m => m > st.n);
          const income = DEPTS[d].rate ? DEPTS[d].rate * st.n * Math.pow(1.5, st.lv - 1) * milestoneMult(st.n) * (d === mine ? 1.2 : 1) : 0;
          return <div key={d} className={"ty-row" + (ok ? "" : " locked")}>
            <span className="def-ico" style={{ background: ok ? "var(--scrub-soft)" : undefined }}>{ok ? DEPTS[d].icon : "🔒"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{d}</b> <span className="tag">{st.n}명</span>{st.lv > 1 && <span className="tag" style={{ marginLeft: 4 }}>Lv{st.lv}</span>}{d === mine && <span className="tag" style={{ marginLeft: 4, background: "var(--scrub)", color: "#fff" }}>내 직종 +20%</span>}
              <div className="muted" style={{ fontSize: 12 }}>{ok ? (DEPTS[d].rate ? `초당 ${fmt(income)}원 · ${DEPTS[d].desc}` : DEPTS[d].desc) : `${DEPTS[d].need} 개설 후 고용 가능`}{ok && nextM && DEPTS[d].rate ? ` · ${nextM}명 달성 시 ×2` : ""}</div>
              {ok && nextM && DEPTS[d].rate ? <div className="ty-bar"><i style={{ width: `${Math.min(100, st.n / nextM * 100)}%` }} /></div> : null}
            </div>
            {ok && <div className="ty-btns">
              <button type="button" className={"btn" + (s.cash < c ? " ghost" : "")} onClick={() => hire(d)}>고용<br /><small>{fmt(c)}</small></button>
              {st.n > 0 && DEPTS[d].rate > 0 && <button type="button" className={"btn ghost"} onClick={() => levelUp(d)} title="교육: 매출 ×1.5">교육<br /><small>{fmt(lvCost(d, st.lv))}</small></button>}
            </div>}
          </div>; })}
      </div>}
      {tab === "rooms" && <div className="ty-list">
        {ROOMS.map((r, i) => <div key={r.name} className={"ty-row" + (i > s.rooms ? " locked" : "")}>
          <span className="def-ico" style={{ background: i <= s.rooms ? "var(--scrub-soft)" : undefined }}>{i <= s.rooms ? r.icon : "🔒"}</span>
          <div style={{ flex: 1 }}><b>{r.name}</b> {i <= s.rooms && <span className="tag">운영 중</span>}<div className="muted" style={{ fontSize: 12 }}>{r.desc}</div></div>
          {i === s.rooms + 1 && <button type="button" className={"btn" + (s.cash < r.cost ? " ghost" : "")} onClick={buyRoom}>개설<br /><small>{fmt(r.cost)}</small></button>}
        </div>)}
        {!nextRoom && <div className="muted">모든 시설을 지었어요. 지역 거점병원 달성 🎉</div>}
      </div>}
      <Board title="우리 병원 명예의 전당 (누적 매출)" rows={ranks} fmt={r => fmt(r.value) + "원"} />
    </div>
  );
}
