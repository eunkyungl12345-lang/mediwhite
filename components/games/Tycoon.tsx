"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, burst, pop } from "@/lib/juice";
import {
  DEPTS, DORDER, MILESTONES, MAX_EDU, ROOMS, GEAR, AMBULANCE, HELI, HOMES, SLOTS, fmt, hireCost, lvCost, perHead, dailyOf, assetsOf,
  OFFLINE_CAP, OFFLINE_RATE, tycoonDept, fresh, isCurrent, DAY, type Dept, type Saved, type Slot,
} from "@/lib/tycoon";

/** 우리 병원 키우기 — 시즌 2. 병원을 키워 번 돈으로 집·가구·미술품·차를 사요. (계정 저장) */
const ROOM_OF: Record<Dept, number> = { 원무: 0, 간호: 0, 의사: 0, 총괄: 0, 물리치료: 1, 임상병리: 2, 방사선: 3, 응급구조: 4 };
const GEAR_ROOM: Record<string, number> = { kiosk: 0, emr: 0, rehab: 1, analyzer: 2, ct: 3, mri: 3, robot: 5 };
const MAIN_FLOORS = [0, 1, 2, 3, 5, 6, 7]; // 응급실(4)은 별동, 신관(8)·대학병원(9)은 건물 변화

/** 직원은 사람 캐릭터로: 최대 5명까지 그리고 나머지는 +N. 고용하면 새 캐릭터가 톡 튀어나와요 */
const PERSON: Record<Dept, string> = { 원무: "💁", 간호: "👩‍⚕️", 의사: "🧑‍⚕️", 총괄: "🕴️", 물리치료: "🤸", 임상병리: "🧑‍🔬", 방사선: "👨‍🔬", 응급구조: "🧑‍🚒" };
function Crowd({ d, n }: { d: Dept; n: number }) {
  if (!n) return null;
  const shown = Math.min(5, n);
  return <span className="hs-crowd" title={`${d} ${n}명`}>{Array.from({ length: shown }, (_, i) => <i key={i} style={{ animationDelay: `${(i * 0.37) % 1.2}s` }}>{PERSON[d]}</i>)}{n > shown && <b>+{n - shown}</b>}</span>;
}

const LINES: Record<Dept, string[]> = {
  원무: ["접수 도와드릴게요~", "3번 진료실로 가세요!", "수납은 이쪽이에요", "대기 12번째예요"],
  간호: ["수액 바꿔드릴게요", "혈압 잴게요~", "오늘 인계 빨리 끝내자!", "콜벨 누구야?!"],
  의사: ["다음 환자분 들어오세요", "검사 결과 좋네요", "오늘 수술 3건…", "커피 한 잔만…"],
  총괄: ["오늘 매출 좋은데?", "다들 수고 많아요!", "회의는 3시입니다", "인력 충원하자!"],
  물리치료: ["하나, 둘, 셋!", "천천히 걸어보세요", "어깨 풀어드릴게요"],
  임상병리: ["피 뽑을게요~ 따끔!", "결과 30분 뒤 나와요", "검체 접수 완료"],
  방사선: ["숨 참으세요~", "촬영 들어갑니다", "CT 대기 5명!"],
  응급구조: ["응급 환자 이송 중!", "비켜주세요!!", "구급차 출동!"],
};
/** 로비 장면: 고용한 직원이 큼직한 캐릭터로 돌아다니고 가끔 말풍선 */
function HospitalScene({ s }: { s: Saved }) {
  const CAP = 22, total = DORDER.reduce((a, d) => a + (s.staff[d]?.n ?? 0), 0);
  const people: { d: Dept; i: number }[] = [];
  for (const d of DORDER) { const n = s.staff[d]?.n ?? 0; if (!n) continue; const k = total <= CAP ? n : Math.max(1, Math.round(n / total * CAP)); for (let i = 0; i < k; i++) people.push({ d, i }); }
  const shown = people.slice(0, CAP);
  const [bubble, setBubble] = useState<{ k: number; t: string } | null>(null);
  useEffect(() => { if (!shown.length) return; const id = setInterval(() => { const k = Math.floor(Math.random() * shown.length), L = LINES[shown[k].d]; setBubble({ k, t: L[Math.floor(Math.random() * L.length)] }); setTimeout(() => setBubble(null), 2400); }, 3200); return () => clearInterval(id); }, [shown.length]); // eslint-disable-line
  const pos = (k: number) => { const h = (k * 2654435761) >>> 0, x = 6 + (h % 1000) / 1000 * 80, row = k % 4, y = 30 + row * 16 + ((h >>> 10) % 100) / 100 * 8; return { x, y, sc: .78 + (y - 30) / 70 * .55 }; };
  const opened = ROOMS.slice(1, s.rooms + 1);
  const uni = s.rooms >= 9;
  return (
    <div className={"lb" + (uni ? " uni" : "")}>
      <div className="lb-facade">
        {s.heli && <span className="lb-heli">🚁</span>}
        <span className="lb-sign"><i>✚</i>{uni ? "메디화이트 대학교병원" : "메디화이트병원"}</span>
        <span className="lb-floors">{s.rooms + 1}층{s.rooms >= 8 ? " · 신관" : ""}</span>
      </div>
      <div className="lb-room">
        <div className="lb-wall">
          <span className="lb-door">🏥 외래</span>
          {opened.map(r => <span key={r.name} className={"lb-door" + (r.name === "응급실" ? " er" : "")}>{r.icon} {r.name}</span>)}
          {s.gear.map(k => <span key={k} className="lb-gear" title={GEAR.find(g => g.key === k)?.name}>{GEAR.find(g => g.key === k)?.icon}</span>)}
        </div>
        <div className="lb-floor" />
        {!shown.length && <div className="lb-empty">아직 직원이 없어요<br /><b>👇 아래에서 원무 직원을 고용해보세요</b></div>}
        {shown.map((p, k) => { const { x, y, sc } = pos(k); return (
          <div key={p.d + p.i} className="lb-guy" style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y), ["--sc" as any]: sc, ["--dur" as any]: `${5 + (k % 5)}s`, ["--dx" as any]: `${(k % 2 ? 1 : -1) * (10 + (k * 7) % 22)}px` }}>
            {bubble?.k === k && <span className="lb-bubble">{bubble.t}</span>}
            <span className="lb-emoji">{PERSON[p.d]}</span>
          </div>); })}
        <div className="lb-park">{Array.from({ length: s.amb }, (_, i) => <span key={i}>🚑</span>)}</div>
      </div>
      <div className="lb-legend">{DORDER.filter(d => s.staff[d]?.n).map(d => <span key={d}>{PERSON[d]} {d} <b>{s.staff[d]!.n}</b></span>)}<span className="lb-pat">🧍 환자 {fmt(s.patients)}명</span></div>
    </div>
  );
}

const VIEWS: Record<string, string> = { wall: "벽뷰", alley: "골목뷰", city: "시티뷰", river: "한강뷰", nightriver: "한강 야경", garden: "정원뷰" };
function HomeScene({ s }: { s: Saved }) {
  const h = HOMES[s.home];
  const it = (key: string) => { const sl = SLOTS.find(x => x.key === key)!; const t = s.items[key] ?? 0; return t ? { ...sl.tiers[t - 1], t, max: sl.tiers.length } : null; };
  const Thing = ({ k, cls }: { k: string; cls: string }) => { const x = it(k); if (!x) return null; const lux = x.t / x.max; return <div className={"hm-thing " + cls + (lux >= .99 ? " top" : lux > .6 ? " lux" : "")} style={{ ["--sc" as any]: 0.8 + x.t * 0.18 }} title={x.name}><span>{x.icon}</span></div>; };
  const art = it("art");
  const dark = s.home === 8;
  return (
    <div className={"hm" + (dark ? " dark" : "")} style={{ ["--wall" as any]: h.wall, ["--floor" as any]: h.floor }}>
      <div className="hm-wall">
        <div className={"hm-win v-" + h.view}><span className="hm-view-label">{VIEWS[h.view]}</span></div>
        {art && <div className={"hm-art t" + art.t} title={art.name}><span>{art.t >= 4 ? "🎨" : "🖼️"}</span></div>}
        <Thing k="light" cls="hm-light" />
        <Thing k="tv" cls="hm-tv" />
      </div>
      <div className="hm-floor">
        <Thing k="bed" cls="hm-bed" />
        <Thing k="sofa" cls="hm-sofa" />
        <Thing k="table" cls="hm-table" />
        <Thing k="plant" cls="hm-plant" />
        <Thing k="sculpt" cls="hm-sculpt" />
        {!Object.values(s.items).some(Boolean) && <span className="hm-empty">텅 빈 방… 가구를 들여볼까요?</span>}
      </div>
      <div className="hm-garage">{it("car") ? <span className={"hm-car t" + it("car")!.t} title={it("car")!.name}>{it("car")!.icon}</span> : <span className="muted">🚶 뚜벅이</span>}<span className="hm-car-name">{it("car")?.name ?? ""}</span></div>
      <div className="hm-plate">{h.area} {h.name}</div>
    </div>
  );
}

type Tab = "staff" | "rooms" | "gear" | "cars" | "home" | "furn" | "art" | "car";
export default function Tycoon({ ranks, myDept }: { ranks: Row[]; myDept: string }) {
  const [s, setS] = useState<Saved>(fresh());
  const [loaded, setLoaded] = useState(false);
  const [welcome, setWelcome] = useState<{ sec: number; earn: number; pts: number } | null>(null);
  const [season, setSeason] = useState(false);
  const [vip, setVip] = useState(false);
  const [scene, setScene] = useState<"hosp" | "home">("hosp");
  const [tab, setTab] = useState<Tab>("staff");
  const [toast, setToast] = useState("");
  const ref = useRef(s); ref.current = s;
  const box = useRef<HTMLDivElement>(null);
  const mine = tycoonDept(myDept);
  const daily = dailyOf(s, mine), rate = daily / DAY;
  const dirty = useRef(false), lastSave = useRef(0), lastScore = useRef(0);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const persist = (force = false) => { const now = Date.now(); if (!force && now - lastSave.current < 15000) { dirty.current = true; return; } lastSave.current = now; dirty.current = false; const cur = { ...ref.current, lastSeen: now }; saveGameState("tycoon", cur).catch(() => {}); const a = assetsOf(cur); if (a >= 1e6 && a > lastScore.current * 1.3) { lastScore.current = a; saveScore("tycoon", Math.floor(a)).catch(() => {}); } };

  useEffect(() => {
    loadGameState("tycoon").then(d => {
      const now = Date.now();
      if (isCurrent(d)) { const sv = d; const sec = Math.min(OFFLINE_CAP, Math.max(0, (now - sv.lastSeen) / 1000)); const earn = Math.floor(dailyOf(sv, mine) / DAY * sec * OFFLINE_RATE); const pts = Math.floor(earn / 30000);
        setS({ ...sv, cash: sv.cash + earn, total: sv.total + earn, patients: sv.patients + pts, lastSeen: now }); lastScore.current = assetsOf(sv); if (earn > 0 && sec > 60) setWelcome({ sec, earn, pts }); }
      else { if (d) setSeason(true); const f = fresh(); setS(f); saveGameState("tycoon", f).catch(() => {}); }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [mine]);

  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => { const r = dailyOf(ref.current, mine) / DAY; if (r > 0) { setS(x => ({ ...x, cash: x.cash + r, total: x.total + r, patients: x.patients + r / 30000 })); dirty.current = true; }
      if (dirty.current && Date.now() - lastSave.current > 15000) persist(true);
      if (!vip && r > 0 && Math.random() < 1 / 60) setVip(true); }, 1000);
    const onHide = () => { if (document.visibilityState === "hidden") persist(true); };
    document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", onHide as any);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide as any); };
  }, [loaded, mine, vip]);

  const spend = (cost: number, f: (x: Saved) => Saved, msg: string, big = false) => {
    if (ref.current.cash < cost) { flash(`💸 ${fmt(cost - ref.current.cash)}원이 부족해요`); haptic(20); return false; }
    setS(x => ({ ...f(x), cash: x.cash - cost })); flash(msg);
    if (big) { sfx.level(); haptic([20, 30, 40]); burst(box.current, (box.current?.clientWidth ?? 300) / 2, 80, "#F2B705", 26); } else { sfx.tap(); haptic(8); }
    setTimeout(() => persist(true), 60); return true;
  };
  const tapBonus = Math.max(3000, daily / 1440); // 1분치
  const tap = (e: React.PointerEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), br = box.current!.getBoundingClientRect(); setS(x => ({ ...x, cash: x.cash + tapBonus, total: x.total + tapBonus, patients: x.patients + 1 })); sfx.coin(); haptic(6); pop(box.current, e.clientX - br.left, e.clientY - br.top, "+" + fmt(tapBonus), "good"); dirty.current = true; void r; };
  const claimVip = () => { const bonus = Math.max(30000, daily / 144); setVip(false); sfx.level(); haptic([20, 20, 60]); burst(box.current, 160, 60, "#F2B705", 30); setS(x => ({ ...x, cash: x.cash + bonus, total: x.total + bonus })); flash(`💼 VIP 환자 진료! +${fmt(bonus)}원`); setTimeout(() => persist(true), 60); };

  const roomOpen = (name?: string) => !name || ROOMS.slice(0, s.rooms + 1).some(r => r.name === name);
  const hire = (d: Dept) => { if (ref.current.cash >= hireCost(d, ref.current.staff[d]?.n ?? 0)) setTimeout(() => pop(box.current, (box.current?.clientWidth ?? 300) / 2, 150, `${PERSON[d]} 입사!`, "good big"), 30); const st = s.staff[d] ?? { n: 0, lv: 1 }, n = st.n + 1; spend(hireCost(d, st.n), x => ({ ...x, staff: { ...x.staff, [d]: { n, lv: st.lv } } }), MILESTONES.includes(n) ? `🎉 ${d} ${n}명 달성! ${d} 매출 +50%` : `${PERSON[d]} ${d} ${n}번째 직원 입사!`, MILESTONES.includes(n)); };
  const edu = (d: Dept) => { const st = s.staff[d]; if (!st || st.lv >= MAX_EDU) return; spend(lvCost(d, st.lv), x => ({ ...x, staff: { ...x.staff, [d]: { n: st.n, lv: st.lv + 1 } } }), `📚 ${d} 교육 Lv${st.lv + 1} · 1인 매출 ×1.25`); };
  const buyRoom = () => { const r = ROOMS[s.rooms + 1]; if (r) spend(r.cost, x => ({ ...x, rooms: x.rooms + 1 }), `${r.icon} ${r.name} 개설! 병원이 커졌어요`, true); };
  const buyGear = (k: string) => { const g = GEAR.find(x => x.key === k)!; spend(g.cost, x => ({ ...x, gear: [...x.gear, k] }), `${g.icon} ${g.name} 도입!`, true); };
  const buyAmb = () => spend(AMBULANCE.cost, x => ({ ...x, amb: x.amb + 1 }), `🚑 구급차 ${s.amb + 1}대째 출동 대기`, true);
  const buyHeli = () => spend(HELI.cost, x => ({ ...x, heli: true }), "🚁 닥터헬기 도입! 옥상에 헬기장", true);
  const buyHome = (i: number) => { const h = HOMES[i]; spend(h.price, x => ({ ...x, home: i }), `🏠 ${h.area} ${h.name}(으)로 이사!`, true); };
  const buySlot = (sl: Slot) => { const t = s.items[sl.key] ?? 0, nx = sl.tiers[t]; if (nx) spend(nx.price, x => ({ ...x, items: { ...x.items, [sl.key]: t + 1 } }), `${nx.icon} ${nx.name} 들였어요`, t + 1 === sl.tiers.length); };

  const Btn = ({ cost, onClick, label = "구매" }: { cost: number; onClick: () => void; label?: string }) => <button type="button" className={"btn" + (s.cash < cost ? " ghost" : "")} onClick={onClick}>{label}<br /><small>{fmt(cost)}</small></button>;
  const assets = assetsOf(s);

  return (
    <div className="card">
      <div><h3>우리 병원 키우기</h3><div className="muted">직원을 고용하고 시설·장비를 늘리면 <b>접속 안 해도 매출이 쌓여요</b>(최대 8시간, 50%). 번 돈으로 <b>내 집·가구·미술품·차</b>를 사서 꾸며요. 내 직종(<b>{mine}</b>) 직원은 매출 +20%. 명예의 전당은 <b>총자산</b> 순. (계정 저장)</div></div>
      {season && <div className="warn">🆕 <span><b>시즌 2 오픈!</b> 경제가 새로 짜여서 병원을 처음부터 다시 시작해요. 이제 집·가구·미술품·차를 살 수 있어요.</span></div>}
      <div className="ty-top" ref={box}>
        <div className="ty-hud" onPointerDown={tap} role="button" aria-label="병원 탭해서 직접 진료">
          <div className="ty-hud-cash">💰 {fmt(s.cash)}원</div>
          <div className="ty-hud-rates"><span>+{fmt(tapBonus)}원/클릭</span><span>+{rate < 10 ? rate.toFixed(1) : fmt(rate)}원/초</span></div>
        </div>
        <div className="ty-rate" style={{ textAlign: "center" }}>하루 +{fmt(daily)}원 · 총자산 {fmt(assets)}원</div>
        <div className="ty-scene-tabs">
          <button type="button" className={scene === "hosp" ? "on" : ""} onClick={() => { setScene("hosp"); setTab("staff"); }}>🏥 우리 병원</button>
          <button type="button" className={scene === "home" ? "on" : ""} onClick={() => { setScene("home"); setTab("home"); }}>🏠 내 집</button>
        </div>
        <div onPointerDown={scene === "hosp" ? tap : undefined} className="ty-scene">{scene === "hosp" ? <HospitalScene s={s} /> : <HomeScene s={s} />}</div>
        {scene === "hosp" && <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>👆 병원을 탭하면 직접 진료 (+{fmt(tapBonus)}원)</div>}
        {vip && <button type="button" className="ty-vip" onClick={claimVip}>💼 VIP 환자 도착! <small>탭하면 10분치 매출</small></button>}
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
      {toast && <div className="ty-toast">{toast}</div>}

      <div className="cats" style={{ paddingBottom: 0 }}>
        {(scene === "hosp" ? [["staff", "👥 직원"], ["rooms", `🏗️ 시설 ${s.rooms + 1}/${ROOMS.length}`], ["gear", "🔬 장비"], ["cars", "🚑 차량"]] : [["home", "🏠 집"], ["furn", "🛋️ 가구·가전"], ["art", "🖼️ 미술품"], ["car", "🚗 내 차"]]).map(([k, n]) => <button key={k} type="button" className="cats-btn" aria-pressed={tab === k} onClick={() => setTab(k as Tab)}>{n}</button>)}
      </div>

      <div className="ty-list">
        {tab === "staff" && DORDER.map(d => { const st = s.staff[d] ?? { n: 0, lv: 1 }; const ok = roomOpen(DEPTS[d].need); const nextM = MILESTONES.find(m => m > st.n);
          return <div key={d} className={"ty-row" + (ok ? "" : " locked")}>
            <span className="def-ico" style={{ background: ok ? "var(--scrub-soft)" : undefined }}>{ok ? DEPTS[d].icon : "🔒"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{d}</b> <span className="tag">{st.n}명</span>{st.lv > 1 && <span className="tag" style={{ marginLeft: 4 }}>교육 Lv{st.lv}</span>}{d === mine && <span className="tag" style={{ marginLeft: 4, background: "var(--scrub)", color: "#fff" }}>내 직종 +20%</span>}
              <div className="muted" style={{ fontSize: 12 }}>{ok ? `1인당 하루 ${fmt(perHead(s, d, mine))}원 · ${DEPTS[d].desc}${nextM ? ` · ${nextM}명 달성 시 +50%` : ""}` : `${DEPTS[d].need} 개설 후 고용 가능`}</div>
              {ok && nextM ? <div className="ty-bar"><i style={{ width: `${Math.min(100, st.n / nextM * 100)}%` }} /></div> : null}
            </div>
            {ok && <div className="ty-btns"><Btn cost={hireCost(d, st.n)} onClick={() => hire(d)} label="고용" />{st.n > 0 && st.lv < MAX_EDU && <Btn cost={lvCost(d, st.lv)} onClick={() => edu(d)} label="교육" />}</div>}
          </div>; })}

        {tab === "rooms" && ROOMS.map((r, i) => <div key={r.name} className={"ty-row" + (i > s.rooms ? " locked" : "")}>
          <span className="def-ico" style={{ background: i <= s.rooms ? "var(--scrub-soft)" : undefined }}>{i <= s.rooms ? r.icon : "🔒"}</span>
          <div style={{ flex: 1 }}><b>{r.name}</b> {i <= s.rooms && <span className="tag">운영 중</span>}<div className="muted" style={{ fontSize: 12 }}>{r.desc}</div></div>
          {i === s.rooms + 1 && <div className="ty-btns"><Btn cost={r.cost} onClick={buyRoom} label="개설" /></div>}
        </div>)}

        {tab === "gear" && GEAR.map(g => { const own = s.gear.includes(g.key), ok = s.rooms >= g.need;
          return <div key={g.key} className={"ty-row" + (ok ? "" : " locked")}>
            <span className="def-ico" style={{ background: own ? "var(--scrub-soft)" : undefined }}>{ok ? g.icon : "🔒"}</span>
            <div style={{ flex: 1 }}><b>{g.name}</b> {own && <span className="tag">보유</span>}<div className="muted" style={{ fontSize: 12 }}>{ok ? g.desc : `${ROOMS[g.need].name} 개설 후 구매 가능`}</div></div>
            {ok && !own && <div className="ty-btns"><Btn cost={g.cost} onClick={() => buyGear(g.key)} /></div>}
          </div>; })}

        {tab === "cars" && <>
          <div className={"ty-row" + (s.rooms >= AMBULANCE.need ? "" : " locked")}>
            <span className="def-ico" style={{ background: "var(--scrub-soft)" }}>🚑</span>
            <div style={{ flex: 1 }}><b>{AMBULANCE.name}</b> <span className="tag">{s.amb}/{AMBULANCE.max}대</span><div className="muted" style={{ fontSize: 12 }}>{s.rooms >= AMBULANCE.need ? "1대당 응급구조 +20% · 주차장에 서요" : "응급실 개설 후 구매 가능"}</div></div>
            {s.rooms >= AMBULANCE.need && s.amb < AMBULANCE.max && <div className="ty-btns"><Btn cost={AMBULANCE.cost} onClick={buyAmb} /></div>}
          </div>
          <div className={"ty-row" + (s.rooms >= HELI.need ? "" : " locked")}>
            <span className="def-ico" style={{ background: s.heli ? "var(--scrub-soft)" : undefined }}>🚁</span>
            <div style={{ flex: 1 }}><b>{HELI.name}</b> {s.heli && <span className="tag">보유</span>}<div className="muted" style={{ fontSize: 12 }}>{s.rooms >= HELI.need ? "응급구조 +100%, 의사 +30% · 옥상 헬기장" : "수술실 개설 후 구매 가능"}</div></div>
            {s.rooms >= HELI.need && !s.heli && <div className="ty-btns"><Btn cost={HELI.cost} onClick={buyHeli} /></div>}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>내 차(아반떼~롤스로이스)는 🏠 내 집 → 🚗 내 차에서 살 수 있어요.</div>
        </>}

        {tab === "home" && HOMES.map((h, i) => <div key={i} className={"ty-row" + (i === s.home ? " cur" : i < s.home ? " past" : "")}>
          <span className="def-ico" style={{ background: i <= s.home ? "var(--scrub-soft)" : undefined }}>{i === 0 ? "🛏️" : i < 3 ? "🏢" : i < 7 ? "🏙️" : i < 9 ? "🌉" : "🏯"}</span>
          <div style={{ flex: 1 }}><b>{h.area} {h.name}</b> {i === s.home && <span className="tag">거주 중</span>}<div className="muted" style={{ fontSize: 12 }}>{i ? `${fmt(h.price)}원 · ${VIEWS[h.view]}` : "시작 집"}</div></div>
          {i > s.home && <div className="ty-btns"><Btn cost={h.price} onClick={() => buyHome(i)} label="이사" /></div>}
        </div>)}
        {tab === "home" && <div className="muted" style={{ fontSize: 12 }}>서울 매매 시세를 대략 반영했어요. 이사하면 벽지·바닥·창밖 풍경이 바뀌어요.</div>}

        {(tab === "furn" || tab === "art" || tab === "car") && SLOTS.filter(sl => sl.cat === tab).map(sl => { const t = s.items[sl.key] ?? 0, cur = t ? sl.tiers[t - 1] : null, nx = sl.tiers[t];
          return <div key={sl.key} className="ty-row">
            <span className="def-ico" style={{ background: cur ? "var(--scrub-soft)" : undefined }}>{(cur ?? sl.tiers[0]).icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}><b>{sl.label}</b> <span className="tag">{t}/{sl.tiers.length}</span>
              <div className="muted" style={{ fontSize: 12 }}>{cur ? `지금: ${cur.name}` : "아직 없어요"}{nx ? ` → 다음: ${nx.name}` : " · 최고급 완료 ✨"}</div></div>
            {nx && <div className="ty-btns"><Btn cost={nx.price} onClick={() => buySlot(sl)} label={t ? "업그레이드" : "구매"} /></div>}
          </div>; })}
      </div>

      <Board title="우리 병원 명예의 전당 (총자산)" rows={ranks} fmt={r => fmt(r.value) + "원"} />
    </div>
  );
}
