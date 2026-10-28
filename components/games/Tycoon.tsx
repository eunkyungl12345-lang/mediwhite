"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState, claimTycoonGrant } from "@/lib/actions";
import Board, { type Row } from "./Board";
import CarArt from "./CarArt";
import { sfx, haptic, burst, pop } from "@/lib/juice";
import {
  STAFF, staffCost, staffRate, PROPS, ARTS, PERKS, CORPS, CITIES, PLANETS, REMODEL, WORKER_BRICKS, workerCost, VIP_UNLOCK, HELPER_UNLOCK, vipDrop,
  helperTps, helperDur, helperCd, helperUp, PETS, PET_COST, REBIRTH_LV, rebirthGain, OFFLINE_CAP, OFFLINE_RATE, HOMES, SLOTS, YIELD,
  clickOf, clickCost, comboOf, rateOf, assetsOf, valueOf, milestoneSum, remodelBuff, perkSum, staffMine, fmt, tycoonDept, fresh, propBuyFee, propSellFee, artBuyFee, artSellFee, homeBuyFee, homeSellAgent, isCurrent, type Saved, type Slot, type Asset,
} from "@/lib/tycoon";

/** 우리 병원 키우기 — 시즌 3: 거지키우기식 방치형. 원장 진료(클릭) → 직원 → 부동산·미술품 → 복지 → 기업·분원·우주병원 → 환생 */
function HospitalScene({ s }: { s: Saved }) {
  const CAP = 16;
  const people: { i: number; k: number }[] = [];
  s.staff.forEach((lv, i) => { if (lv) for (let k = 0; k < Math.min(3, Math.ceil(lv / 10)); k++) people.push({ i, k }); });
  const shown = people.slice(-CAP);
  const [bubble, setBubble] = useState<{ k: number; t: string } | null>(null);
  useEffect(() => { if (!shown.length) return; const id = setInterval(() => { const k = Math.floor(Math.random() * shown.length); setBubble({ k, t: STAFF[shown[k].i].line }); setTimeout(() => setBubble(null), 2400); }, 3200); return () => clearInterval(id); }, [shown.length]); // eslint-disable-line
  const pos = (k: number) => { const h = (k * 2654435761) >>> 0, u = (h % 1000) / 1000, v = ((h >>> 10) % 1000) / 1000; const y = 42 + v * 40, half = 18 + (y - 42) * .55; return { x: 50 + (u * 2 - 1) * half, y, sc: .8 + (y - 42) / 40 * .35 }; };
  const types = s.staff.filter(Boolean).length;
  const bld = types >= 15 ? "b6" : types >= 12 ? "b5" : types >= 8 ? "b4" : types >= 5 ? "b3" : types >= 3 ? "b2" : "b1";
  const uni = types >= 15;
  return (
    <div className={"lb" + (uni ? " uni" : "")}>
      <div className="lb-out">
        <img src={`/game/${bld}.webp`} alt="" className={"lb-bld s-" + bld} key={bld} draggable={false} />
        {s.planets.length > 0 && <span className="lb-heli">🚀</span>}
        <span className="lb-sign"><i>✚</i>{uni ? "메디화이트 의료재단" : "메디화이트병원"}{s.rebirths ? ` · 환생 ${s.rebirths}회` : ""}</span>
      </div>
      <div className="lb-room">
        <img src="/game/lobby.webp" alt="" className="lb-bg" draggable={false} />
        {!shown.length && <div className="lb-empty"><b>👆 병원을 탭해서 진료하고, 모은 돈으로 실습생을 고용해보세요</b></div>}
        {shown.map((p, k) => { const { x, y, sc } = pos(k); return (
          <div key={p.i + "-" + p.k} className="lb-guy" style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y), ["--sc" as any]: sc, ["--dur" as any]: `${5 + (k % 5)}s`, ["--dx" as any]: `${(k % 2 ? 1 : -1) * (8 + (k * 7) % 18)}px` }}>
            {bubble?.k === k && <span className="lb-bubble">{bubble.t}</span>}
            <img src={`/game/${STAFF[p.i].sprite}.webp`} alt={STAFF[p.i].name} className="lb-sprite" draggable={false} />
          </div>); })}
      </div>
      <div className="lb-legend">
        {s.staff.map((lv, i) => lv ? <span key={i}>{STAFF[i].icon} {STAFF[i].name} <b>Lv{lv}</b></span> : null)}
        <span className="lb-pat">🧍 환자 {fmt(s.patients)}명</span>
      </div>
    </div>
  );
}

const SCENE: Record<string, string> = { wall: "🧱🧱🧱", alley: "🏚️🏪🛵", city: "🏢🏬🏢🏣", river: "🏙️🌉⛵", nightriver: "🌃🌉✨🎆", garden: "🌳⛲🌷🌳" };
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
        <div className={"hm-win v-" + h.view}><span className="hm-scene">{SCENE[h.view]}</span><span className="hm-view-label">{VIEWS[h.view]}</span></div>
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
      <div className={"hm-garage" + (it("car") ? " has t" + it("car")!.t : "")}>{it("car") ? <><div className="hm-spot" /><CarArt tier={it("car")!.t} /><span className="hm-car-name">{it("car")!.name}</span></> : <span className="muted">🚶 뚜벅이 · 🚗 내 차 탭에서 차를 사보세요</span>}</div>
      <div className="hm-plate">{h.area} {h.name}</div>
    </div>
  );
}

type Tab = "doc" | "staff" | "prop" | "art" | "perk" | "buy" | "special" | "home" | "furn" | "hart" | "car";
const sumCost = (f: (k: number) => number, from: number, n: number) => { let c = 0; for (let k = from; k < from + n; k++) c += f(k); return c; };

export default function Tycoon({ ranks, myDept }: { ranks: Row[]; myDept: string }) {
  const [s, setS] = useState<Saved>(fresh());
  const [loaded, setLoaded] = useState(false);
  const [welcome, setWelcome] = useState<{ sec: number; earn: number } | null>(null);
  const [season, setSeason] = useState(false);
  const [vip, setVip] = useState(false);
  const [bagMsg, setBagMsg] = useState("");
  const [helping, setHelping] = useState(0); // 남은 초
  const [scene, setScene] = useState<"hosp" | "home">("hosp");
  const [tab, setTab] = useState<Tab>("doc");
  const [toast, setToast] = useState("");
  const [combo, setCombo] = useState(comboOf(0));
  const [talk, setTalk] = useState<number | null>(null);
  const [, setTick] = useState(0); const [tapN, setTapN] = useState(0);
  const ref = useRef(s); ref.current = s;
  const box = useRef<HTMLDivElement>(null);
  const clicks = useRef<number[]>([]);
  const mine = tycoonDept(myDept);
  const rate = rateOf(s, mine), click = clickOf(s);
  const dirty = useRef(false), lastSave = useRef(0), lastScore = useRef(0), loadFailed = useRef(false);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };
  const persist = (force = false) => { const now = Date.now(); if (!force && now - lastSave.current < 15000) { dirty.current = true; return; } lastSave.current = now; dirty.current = false; if (loadFailed.current) return; const cur = { ...ref.current, lastSeen: now }; saveGameState("tycoon", cur as any).then(r => { if ((r as any)?.stale) { setToast("🔄 다른 화면에서 진행한 기록이 있어 불러올게요"); setTimeout(() => location.reload(), 1200); } }).catch(() => {}); const a = assetsOf(cur); if (a >= 1e6 && a > lastScore.current * 1.3) { lastScore.current = a; saveScore("tycoon", Math.floor(a)).catch(() => {}); } };

  useEffect(() => {
    loadGameState("tycoon").then(raw => {
      const now = Date.now(); let d: any = raw;
      // 예전 시즌 기록은 버리지 않고 옮겨요: 현금·누적매출·내 집·가구는 그대로
      if (d && d.v !== 3 && typeof d.cash === "number") { d = fresh({ cash: d.cash, total: d.total ?? 0, patients: d.patients ?? 0, home: typeof d.home === "number" ? d.home : 0, items: d.items ?? {}, lastSeen: now }); setSeason(true); saveGameState("tycoon", d).catch(() => {}); }
      if (isCurrent(d)) { const sv = { ...fresh(), ...d } as Saved; const sec = Math.min(OFFLINE_CAP, Math.max(0, (now - sv.lastSeen) / 1000)); const earn = Math.floor(rateOf(sv, mine) * sec * OFFLINE_RATE * (sv.pet === "ham" ? 1.5 : 1));
        setS({ ...sv, cash: sv.cash + earn, total: sv.total + earn, bricks: sv.bricks + (sv.props[0] ? sv.workers * WORKER_BRICKS * sec * OFFLINE_RATE : 0), lastSeen: now }); lastScore.current = assetsOf(sv); if (earn > 0 && sec > 60) setWelcome({ sec, earn }); }
      else { if (d) setSeason(true); const f = fresh(); setS(f); saveGameState("tycoon", f as any).catch(() => {}); }
      setLoaded(true);
    }).catch(() => { loadFailed.current = true; setLoaded(true); setToast("⚠️ 저장된 병원을 못 불러왔어요. 새로고침해 주세요"); });
  }, [mine]);

  useEffect(() => {
    if (!loaded) return;
    const grab = () => claimTycoonGrant().then(a => { if (a > 0) { setS(x => ({ ...x, cash: x.cash + a, total: x.total + a })); setToast(`🎁 운영팀 지급 +${fmt(a)}원`); setTimeout(() => setToast(""), 4000); setTimeout(() => persist(true), 100); } }).catch(() => {});
    grab(); const id = setInterval(grab, 20000); return () => clearInterval(id);
  }, [loaded]); // eslint-disable-line

  // 1초마다: 매출 · 벽돌 · VIP 손님 · 도우미
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      const cur = ref.current, r = rateOf(cur, mine);
      setS(x => ({ ...x, cash: x.cash + r, total: x.total + r, patients: x.patients + r / 30000, bricks: x.props[0] ? x.bricks + x.workers * WORKER_BRICKS : x.bricks }));
      if (r > 0) dirty.current = true;
      if (dirty.current && Date.now() - lastSave.current > 15000) persist(true);
      if (cur.vipOn && Math.random() < (cur.pet === "par" ? 1.2 : 1) / 90) setVip(true);
      setHelping(h => { if (h <= 0) return 0; const n = helperTps(cur.helperLv), g = clickOf(cur) * n; setS(x => ({ ...x, cash: x.cash + g, total: x.total + g, patients: x.patients + n })); const el = box.current; if (el) pop(el, 40 + Math.random() * (el.clientWidth - 80), 120 + Math.random() * 80, "+" + fmt(g), "good"); return h - 1; });
      setTick(t => t + 1);
    }, 1000);
    const onHide = () => { if (document.visibilityState === "hidden") persist(true); };
    document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", onHide as any);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide as any); };
  }, [loaded, mine]); // eslint-disable-line

  const spend = (cost: number, f: (x: Saved) => Saved, msg: string, big = false) => {
    if (ref.current.cash < cost) { flash(`💸 ${fmt(cost - ref.current.cash)}원이 부족해요`); haptic(20); return false; }
    setS(x => ({ ...f(x), cash: x.cash - cost })); flash(msg);
    if (big) { sfx.level(); haptic([20, 30, 40]); burst(box.current, (box.current?.clientWidth ?? 300) / 2, 80, "#F2B705", 26); } else { sfx.tap(); haptic(8); }
    setTimeout(() => persist(true), 60); return true;
  };
  const tap = (e: React.PointerEvent) => {
    const now = performance.now(); clicks.current = [...clicks.current.filter(t => now - t < 1000), now]; const c = comboOf(clicks.current.length); setCombo(c);
    const g = Math.round(click * c.m), br = box.current!.getBoundingClientRect(), bricks = ref.current.props[0] ? 1 + Math.floor(ref.current.clickLv / 50) : 0;
    setS(x => ({ ...x, cash: x.cash + g, total: x.total + g, patients: x.patients + 1, bricks: x.bricks + bricks })); sfx.coin(); haptic(6); setTapN(n => n + 1);
    pop(box.current, e.clientX - br.left, e.clientY - br.top, "+" + fmt(g) + (c.m > 1 ? ` ×${c.m}` : ""), "good"); dirty.current = true;
  };
  const claimVip = () => {
    const cur = ref.current, reward = Math.max(click * 100, rate * 120), seen = cur.vipSeen + 1, lv = Math.floor(seen / 10), bag = Math.random() * 100 < vipDrop(lv);
    setVip(false); sfx.level(); haptic([20, 20, 60]); burst(box.current, 160, 60, "#F2B705", 30);
    setS(x => ({ ...x, cash: x.cash + reward, total: x.total + reward, vipSeen: seen, vipLv: lv, bags: x.bags + (bag ? 1 : 0) }));
    flash(`💼 VIP 환자 진료! +${fmt(reward)}원${bag ? " · 🧳 황금 왕진가방 획득!" : ""}${lv > cur.vipLv ? ` · VIP 레벨 ${lv}` : ""}`); setTimeout(() => persist(true), 60);
  };
  const openBag = () => {
    const cur = ref.current; if (!cur.bags) return; const r = Math.random() * 100, rare = 10 * (cur.pet === "gor" ? 1.2 : 1), pill = 40 * (cur.pet === "tur" ? 1.2 : 1);
    let msg = "";
    if (r < rare) { const q = Math.random(), k = q < .6 ? "1" : q < .9 ? "5" : "10"; setS(x => ({ ...x, bags: x.bags - 1, coupons: { ...x.coupons, [k]: (x.coupons[k] ?? 0) + 1 } })); msg = `🎟️ 레어! 직원 레벨 +${k} 쿠폰`; }
    else if (r < rare + pill) { const n = 1 + Math.floor(Math.random() * 3); setS(x => ({ ...x, bags: x.bags - 1, pills: x.pills + n })); msg = `💊 영양제 ${n}개`; }
    else { const m = Math.max(click * 300, rate * 300); setS(x => ({ ...x, bags: x.bags - 1, cash: x.cash + m, total: x.total + m })); msg = `💰 ${fmt(m)}원`; }
    setBagMsg(msg); sfx.level(); setTimeout(() => persist(true), 60);
  };

  const upClick = (n: number) => { const c = sumCost(clickCost, s.clickLv, n); spend(c, x => ({ ...x, clickLv: x.clickLv + n }), `👨‍⚕️ 원장 진료 Lv${s.clickLv + n} · 클릭당 ${fmt(clickOf({ ...s, clickLv: s.clickLv + n }))}원`); };
  const upStaff = (i: number, n: number) => {
    const lv = s.staff[i], c = sumCost(k => staffCost(i, k), lv, n);
    const ok = spend(c, x => { const st = [...x.staff]; st[i] = lv + n; return { ...x, staff: st }; }, lv === 0 ? `${STAFF[i].icon} ${STAFF[i].name} 입사!` : `${STAFF[i].icon} ${STAFF[i].name} Lv${lv + n}`, lv === 0 || (lv < 20 && lv + n >= 20) || (lv < 10 && lv + n >= 10));
    if (ok && lv === 0) setTalk(i);
    if (ok && lv < 20 && lv + n >= 20) setTimeout(() => flash(`🎉 ${STAFF[i].name} 20레벨 달성! 전체 매출·진료 +${STAFF[i].bonus}%`), 900);
  };
  const useCoupon = (i: number, k: string) => { if (!(s.coupons[k] > 0) || !s.staff[i]) return; setS(x => { const st = [...x.staff]; st[i] += +k; return { ...x, staff: st, coupons: { ...x.coupons, [k]: x.coupons[k] - 1 } }; }); flash(`🎟️ ${STAFF[i].name} +${k}레벨!`); setTimeout(() => persist(true), 60); };
  const feeB = (kind: "props" | "arts", p: number) => kind === "props" ? propBuyFee(p) : artBuyFee(p);
  const buyCost = (kind: "props" | "arts", a: Asset) => { const f = feeB(kind, a.price); return a.price + f.tax + f.agent; };
  const sellNet = (kind: "props" | "arts", a: Asset, t: number) => { const v = Math.floor(valueOf(a, t, s)), f = kind === "props" ? propSellFee(v, a.price) : artSellFee(v, a.price); return { v, ...f, net: v - f.tax - f.agent }; };
  const buyAsset = (kind: "props" | "arts", i: number, a: Asset) => { const f = feeB(kind, a.price); return spend(buyCost(kind, a), x => ({ ...x, [kind]: { ...x[kind], [i]: Date.now() }, workers: kind === "props" && i === 0 && x.workers < 3 ? 3 : x.workers }), `${a.icon} ${a.name} 구입! (${kind === "props" ? "취득세" : "경매 수수료"} ${fmt(f.tax || f.agent)}${f.tax ? ` · 복비 ${fmt(f.agent)}` : ""} 포함)${kind === "props" && i === 0 && s.workers < 3 ? " 일꾼 3명 합류" : ""}`, true); };
  const sellAsset = (kind: "props" | "arts", i: number, a: Asset) => { const t = s[kind][i]; if (!t) return; const q = sellNet(kind, a, t); setS(x => { const o = { ...x[kind] }; delete o[i]; return { ...x, [kind]: o, cash: x.cash + q.net }; }); flash(`💰 ${a.name} ${fmt(q.v)}원에 팔았어요 · ${kind === "props" ? "양도세" : "기타소득세"} ${fmt(q.tax)} · ${kind === "props" ? "복비" : "수수료"} ${fmt(q.agent)} 떼고 ${fmt(q.net)}원 입금`); sfx.coin(); setTimeout(() => persist(true), 60); };
  const finishRemodel = () => { const r = REMODEL[s.remodel]; if (!r || !s.props[s.remodel] || s.bricks < r.bricks) return; setS(x => ({ ...x, bricks: x.bricks - r.bricks, remodel: x.remodel + 1 })); flash(`🧱 ${PROPS[s.remodel].name} 리모델링 완료! 초당 매출 +${r.buff}%`); sfx.level(); burst(box.current, 160, 80, "#F2B705", 30); setTimeout(() => persist(true), 60); };
  const buyList = (key: "perks" | "corps" | "cities" | "planets", i: number, a: { name: string; icon: string; price: number }) => spend(a.price, x => ({ ...x, [key]: [...x[key], i] }), `${a.icon} ${a.name} ${key === "perks" ? "오픈" : "인수"}!`, true);
  const startHelper = () => { const cur = ref.current, cd = helperCd(cur.helperLv) * 1000; if (Date.now() - cur.helperAt < cd || helping > 0) return; setHelping(helperDur(cur.helperLv)); setS(x => ({ ...x, helperAt: Date.now() + helperDur(x.helperLv) * 1000 })); flash(`🤖 자동 진료 도우미 출동! ${helperDur(cur.helperLv)}초 동안 초당 ${helperTps(cur.helperLv)}회 진료`); };
  const rebirth = () => {
    if (s.clickLv < REBIRTH_LV) return; const gain = rebirthGain(s.clickLv);
    if (!confirm(`환생하면 돈·직원·부동산·미술품·복지·인수한 것들이 모두 초기화되고, 영구 보너스 +${gain}%p를 받아요. (영양제·펫·쿠폰·VIP·도우미·내 집은 유지)`)) return;
    const k = ref.current; const n = fresh({ total: k.total, patients: k.patients, pills: k.pills, pets: k.pets, pet: k.pet, coupons: k.coupons, vipOn: k.vipOn, vipLv: k.vipLv, vipSeen: k.vipSeen, helperOn: k.helperOn, helperLv: k.helperLv, rebirths: k.rebirths + 1, rebirthBonus: k.rebirthBonus + gain, home: k.home, items: k.items });
    setS(n); ref.current = n; flash(`🌅 환생 완료! 영구 보너스 ${n.rebirthBonus}%`); sfx.record(); setTimeout(() => persist(true), 60);
  };
  /** 이사: 지금 집을 팔고(복비, 1주택 양도세 비과세) 새 집을 사요(취득세+복비) */
  const moveCost = (i: number) => { const nb = homeBuyFee(HOMES[i].price), cur = HOMES[s.home].price; return HOMES[i].price + (i ? nb.tax + nb.agent : 0) - (cur - (s.home ? homeSellAgent(cur) : 0)); };
  const buyHome = (i: number) => { const h = HOMES[i], c = moveCost(i);
    if (c <= 0) { setS(x => ({ ...x, home: i, cash: x.cash - c })); flash(`🏠 ${h.area} ${h.name}(으)로 이사! 차액 +${fmt(-c)}원 돌려받았어요`); sfx.coin(); setTimeout(() => persist(true), 60); }
    else spend(c, x => ({ ...x, home: i }), `🏠 ${h.area} ${h.name}(으)로 이사!`, true); };
  const buySlot = (sl: Slot) => { const t = s.items[sl.key] ?? 0, nx = sl.tiers[t]; if (nx) spend(nx.price, x => ({ ...x, items: { ...x.items, [sl.key]: t + 1 } }), `${nx.icon} ${nx.name} 들였어요`, t + 1 === sl.tiers.length); };

  const Btn = ({ cost, onClick, label = "구매" }: { cost: number; onClick: () => void; label?: string }) => <button type="button" className={"btn" + (s.cash < cost ? " ghost" : "")} onClick={onClick}>{label}<br /><small>{fmt(cost)}</small></button>;
  const assets = assetsOf(s), ms = milestoneSum(s), lv30 = s.staff.some(l => l >= 30);
  const cdLeft = Math.max(0, Math.ceil((s.helperAt + helperCd(s.helperLv) * 1000 - Date.now()) / 1000));
  const nextRemodel = REMODEL[s.remodel];
  const showRate = (r: number) => r < 10 ? r.toFixed(1) : fmt(r);

  return (
    <div className="card">
      <div><h3>우리 병원 키우기</h3><div className="muted">병원을 <b>탭해서 진료</b>하고(빠르게 연타하면 보너스), 모은 돈으로 직원을 고용·성장시키면 <b>접속 안 해도 매출이 쌓여요</b>(최대 8시간, 50%). 부동산·미술품은 갖고 있는 동안 값이 올라요. 내 직종(<b>{mine}</b>) 직원은 +20%. 명예의 전당은 <b>총자산</b> 순.</div></div>
      {season && <div className="warn">🆕 <span><b>시즌 3 오픈!</b> 거지키우기처럼 새로 짜였어요. 갖고 있던 <b>현금·내 집·가구는 그대로 옮겨왔고</b>, 병원(직원·시설)은 새로 키워요. 진료 클릭 → 직원 17명 → 부동산·미술품 → 직원 복지 → 기업·분원·우주병원 → 환생까지!</span></div>}
      <div className="ty-top" ref={box}>
        <div className="ty-hud" onPointerDown={tap} role="button" aria-label="탭해서 진료">
          <div key={tapN} className={"ty-hud-cash" + (tapN ? " bump" : "")}>💰 {fmt(s.cash)}원</div>
          <div className="ty-hud-rates"><span style={{ color: combo.c }}>+{fmt(click * combo.m)}원/클릭{combo.m > 1 ? ` ×${combo.m}` : ""}</span><span>+{showRate(rate)}원/초</span></div>
        </div>
        <div className="ty-rate" style={{ textAlign: "center" }}>총자산 {fmt(assets)}원{ms ? ` · 직원 보너스 +${fmt(ms)}%` : ""}{s.rebirthBonus ? ` · 환생 +${s.rebirthBonus}%` : ""}{s.pills ? ` · 💊${s.pills}` : ""}</div>
        <div className="ty-scene-tabs">
          <button type="button" className={scene === "hosp" ? "on" : ""} onClick={() => { setScene("hosp"); setTab("doc"); }}>🏥 우리 병원</button>
          <button type="button" className={scene === "home" ? "on" : ""} onClick={() => { setScene("home"); setTab("home"); }}>🏠 내 집</button>
        </div>
        <div onPointerDown={scene === "hosp" ? tap : undefined} className="ty-scene">{scene === "hosp" ? <HospitalScene s={s} /> : <HomeScene s={s} />}</div>
        {scene === "hosp" && <div className="ty-combo"><span style={{ background: combo.c }} />👆 병원을 탭하면 진료 · 1초에 5번↑ ×1.2 · 8번↑ ×1.3 · 11번↑ ×1.4 · 14번↑ ×1.5{helping > 0 ? ` · 🤖 도우미 진료 중 ${helping}초` : ""}</div>}
        {scene === "hosp" && !s.staff[0] && s.cash >= 1e4 && <button type="button" className="ty-hint" onClick={() => setTab("staff")}>💡 진료만으로는 조금씩 벌려요. <b>👥 직원</b>을 고용하면 가만히 있어도 돈이 쌓여요 →</button>}
        {scene === "hosp" && s.staff[0] > 0 && rate < click && s.cash > clickCost(s.clickLv) * 50 && <button type="button" className="ty-hint" onClick={() => setTab("doc")}>💡 돈이 넉넉해요! <b>👨‍⚕️ 원장</b> 레벨을 올리면 한 번 탭할 때 버는 돈이 확 늘어요 →</button>}
        {vip && <button type="button" className="ty-vip" onClick={claimVip}>💼 VIP 환자 도착! <small>탭하면 큰 보상 + 가끔 황금 왕진가방</small></button>}
        {talk !== null && <div className="ty-welcome" onClick={() => setTalk(null)}><div className="ty-welcome-card ty-talk">
          <div className="big">{STAFF[talk].icon} {STAFF[talk].name} 입사!</div>
          <div className="ty-say"><b>원장</b> “{STAFF[talk].ask}”</div>
          <div className="ty-say you"><b>{STAFF[talk].name}</b> “{STAFF[talk].yes}”</div>
          <div className="muted" style={{ fontSize: 12 }}>10레벨이 되면 다음 직원이 열려요 · 20레벨 달성 보너스 +{STAFF[talk].bonus}%</div>
          <button type="button" className="btn" onClick={() => setTalk(null)}>환영해요!</button></div></div>}
        {welcome && <div className="ty-welcome" onClick={() => setWelcome(null)}><div className="ty-welcome-card">
          <div className="big">🏥 다녀오셨어요?</div>
          <div>{welcome.sec >= 3600 ? `${Math.floor(welcome.sec / 3600)}시간 ${Math.floor(welcome.sec % 3600 / 60)}분` : `${Math.floor(welcome.sec / 60)}분`} 동안 직원들이 벌어둔 돈</div>
          <div className="ty-earn">+{fmt(welcome.earn)}원</div>
          <button type="button" className="btn" onClick={() => setWelcome(null)}>받기</button></div></div>}
      </div>
      {toast && <div className="ty-toast">{toast}</div>}

      <div className="cats" style={{ paddingBottom: 0 }}>
        {(scene === "hosp"
          ? [["doc", "👨‍⚕️ 원장"], ["staff", "👥 직원"], ["prop", "🏢 부동산"], ["art", "🖼️ 미술품"], ["perk", "💗 직원 복지"], ["buy", "🌏 인수"], ["special", `✨ 특별${s.bags ? ` 🧳${s.bags}` : ""}`]]
          : [["home", "🏠 집"], ["furn", "🛋️ 가구·가전"], ["hart", "🖼️ 그림·조각"], ["car", "🚗 내 차"]]).map(([k, n]) => <button key={k} type="button" className="cats-btn" aria-pressed={tab === k} onClick={() => setTab(k as Tab)}>{n}</button>)}
      </div>

      <div className="ty-list">
        {tab === "doc" && <>
          <div className="ty-row next">
            <span className="def-ico" style={{ background: "var(--scrub-soft)" }}>👨‍⚕️</span>
            <div style={{ flex: 1, minWidth: 0 }}><b>원장 진료</b> <span className="tag">Lv{s.clickLv}</span><div className="muted" style={{ fontSize: 12 }}>클릭당 {fmt(click)}원 → 다음 {fmt(clickOf({ ...s, clickLv: s.clickLv + 1 }))}원 · 레벨 n이면 기본 n(n+1)/2+1원{perkSum(s) ? ` · 복지 +${fmt(perkSum(s))}%` : ""}</div></div>
            <div className="ty-btns"><Btn cost={clickCost(s.clickLv)} onClick={() => upClick(1)} label="+1" /><Btn cost={sumCost(clickCost, s.clickLv, 10)} onClick={() => upClick(10)} label="+10" /><Btn cost={sumCost(clickCost, s.clickLv, 100)} onClick={() => upClick(100)} label="+100" /></div>
          </div>
          <div className={"ty-row" + (s.clickLv >= REBIRTH_LV ? " next" : " locked")}>
            <span className="def-ico">🌅</span>
            <div style={{ flex: 1 }}><b>환생</b> {s.rebirths > 0 && <span className="tag">{s.rebirths}회 · +{s.rebirthBonus}%</span>}<div className="muted" style={{ fontSize: 12 }}>원장 Lv{REBIRTH_LV}부터 · 모두 초기화하고 영구 보너스(원장 5레벨마다 +1%p){s.clickLv >= REBIRTH_LV ? ` · 지금 하면 +${rebirthGain(s.clickLv)}%p` : ""}. 진료·매출 모두에 적용</div></div>
            {s.clickLv >= REBIRTH_LV && <div className="ty-btns"><button type="button" className="btn" onClick={rebirth}>환생</button></div>}
          </div>
        </>}

        {tab === "staff" && STAFF.map((st, i) => { const lv = s.staff[i], open = i === 0 || s.staff[i - 1] >= 10; if (!open && !(i > 0 && (i === 1 || s.staff[i - 2] >= 10))) return null;
          return <div key={i} className={"ty-row" + (open ? (lv ? "" : " next") : " locked")}>
            <span className="def-ico" style={{ background: lv ? "var(--scrub-soft)" : undefined }}>{open ? st.icon : "🔒"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{st.name}</b> {lv > 0 && <span className="tag">Lv{lv}</span>}{lv >= 20 && <span className="tag" style={{ marginLeft: 4 }}>+{st.bonus}% ✔</span>}{staffMine(i, mine) && <span className="tag" style={{ marginLeft: 4, background: "var(--scrub)", color: "#fff" }}>내 직종 +20%</span>}
              <div className="muted" style={{ fontSize: 12 }}>{open ? (lv ? `초당 ${showRate(staffRate(s, i, mine))}원 · ` : `고용비 ${fmt(st.hire)}원 · `) + (lv < 20 ? `20레벨 달성 시 +${st.bonus}%` : "달성 보너스 적용 중") + (lv < 10 && i < STAFF.length - 1 ? ` · 10레벨이면 ${STAFF[i + 1].name} 해금` : "") : `${STAFF[i - 1].name} 10레벨이 되면 열려요 · “${st.ask}”`}</div>
              {open && lv > 0 && lv < 20 && <div className="ty-bar"><i style={{ width: `${lv / 20 * 100}%` }} /></div>}
              {open && lv > 0 && Object.entries(s.coupons).some(([, n]) => n > 0) && <div className="row" style={{ gap: 4, marginTop: 4 }}>{["1", "5", "10"].filter(k => s.coupons[k] > 0).map(k => <button key={k} type="button" className="link" onClick={() => useCoupon(i, k)}>🎟️ +{k} 쿠폰 쓰기 ({s.coupons[k]})</button>)}</div>}
            </div>
            {open && <div className="ty-btns"><Btn cost={staffCost(i, lv)} onClick={() => upStaff(i, 1)} label={lv ? "+1" : "고용"} />{lv > 0 && <Btn cost={sumCost(k => staffCost(i, k), lv, 10)} onClick={() => upStaff(i, 10)} label="+10" />}{lv > 0 && s.cash >= sumCost(k => staffCost(i, k), lv, 50) && <Btn cost={sumCost(k => staffCost(i, k), lv, 50)} onClick={() => upStaff(i, 50)} label="+50" />}</div>}
          </div>; })}

        {tab === "prop" && <>
          {PROPS.map((a, i) => { const t = s.props[i]; return <div key={i} className={"ty-row" + (t ? " cur" : "")}>
            <span className="def-ico" style={{ background: t ? "var(--scrub-soft)" : undefined }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}><b>{a.name}</b> {t && <span className="tag">보유</span>}{s.remodel > i && <span className="tag" style={{ marginLeft: 4 }}>🧱 리모델링 +{REMODEL[i].buff}%</span>}<div className="muted" style={{ fontSize: 12 }}>{fmt(a.price)}원 · 초당 +{fmt(a.grow)}원씩 값이 올라요{t ? (() => { const q = sellNet("props", a, t); return ` · 시세 ${fmt(q.v)}원 → 팔면 양도세 ${fmt(q.tax)}·복비 ${fmt(q.agent)} 떼고 ${fmt(q.net)}원`; })() : ` · 살 때 취득세 4.6% + 복비 0.9%`}</div></div>
            <div className="ty-btns">{t ? <button type="button" className="btn ghost" onClick={() => sellAsset("props", i, a)}>판매<br /><small>{fmt(sellNet("props", a, t).net)}</small></button> : <Btn cost={buyCost("props", a)} onClick={() => buyAsset("props", i, a)} />}</div>
          </div>; })}
          <div className="ty-row next">
            <span className="def-ico">🧱</span>
            <div style={{ flex: 1, minWidth: 0 }}><b>리모델링</b> <span className="tag">{s.remodel}/{REMODEL.length}</span>
              <div className="muted" style={{ fontSize: 12 }}>{!s.props[0] && s.remodel === 0 ? "부동산을 하나라도 사면 시작돼요 (일꾼 3명 합류)" : nextRemodel ? `다음: ${PROPS[s.remodel].name} · 벽돌 ${fmt(s.bricks)} / ${fmt(nextRemodel.bricks)} · 완성 시 전체 초당 +${nextRemodel.buff}%${s.props[s.remodel] ? "" : " (이 건물을 갖고 있어야 해요)"} · 클릭마다 벽돌 ${1 + Math.floor(s.clickLv / 50)}개, 일꾼 ${s.workers}명 × 초당 ${WORKER_BRICKS}개` : "모든 리모델링 완료! 🎉"}</div>
              {nextRemodel && s.props[0] && <div className="ty-bar"><i style={{ width: `${Math.min(100, s.bricks / nextRemodel.bricks * 100)}%` }} /></div>}</div>
            <div className="ty-btns">{nextRemodel && s.props[s.remodel] && s.bricks >= nextRemodel.bricks ? <button type="button" className="btn" onClick={finishRemodel}>완성!</button> : s.props[0] ? <Btn cost={workerCost(s.workers)} onClick={() => spend(workerCost(s.workers), x => ({ ...x, workers: x.workers + 1 }), `👷 일꾼 ${s.workers + 1}명`)} label="일꾼+1" /> : null}</div>
          </div>
        </>}

        {tab === "art" && ARTS.map((a, i) => { const t = s.arts[i]; return <div key={i} className={"ty-row" + (t ? " cur" : "")}>
          <span className="def-ico" style={{ background: t ? "var(--scrub-soft)" : undefined }}>{a.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}><b>&lt;{a.name}&gt;</b> {t && <span className="tag">소장</span>}<div className="muted" style={{ fontSize: 12 }}>{fmt(a.price)}원 · 초당 +{fmt(a.grow)}원씩 값이 올라요{t ? (() => { const q = sellNet("arts", a, t); return ` · 시세 ${fmt(q.v)}원 → 팔면 경매 수수료 ${fmt(q.agent)}·기타소득세 ${fmt(q.tax)} 떼고 ${fmt(q.net)}원`; })() : " · 경매 수수료 10% 별도"}</div></div>
          <div className="ty-btns">{t ? <button type="button" className="btn ghost" onClick={() => sellAsset("arts", i, a)}>판매<br /><small>{fmt(sellNet("arts", a, t).net)}</small></button> : <Btn cost={buyCost("arts", a)} onClick={() => buyAsset("arts", i, a)} />}</div>
        </div>; })}

        {tab === "perk" && <>
          {!lv30 && <div className="muted" style={{ fontSize: 13 }}>🔒 직원 중 한 명이라도 <b>30레벨</b>이 되면 직원 복지 시설을 살 수 있어요. 시설마다 원장 진료(클릭) 보너스가 붙어요.</div>}
          {PERKS.map((p, i) => { const own = s.perks.includes(i), next = !own && (i === 0 || s.perks.includes(i - 1)); if (!own && !next && !s.perks.includes(i - 2) && i > 1) return null;
            return <div key={i} className={"ty-row" + (own ? " cur" : lv30 && next ? " next" : " locked")}>
              <span className="def-ico" style={{ background: own ? "var(--scrub-soft)" : undefined }}>{p.icon}</span>
              <div style={{ flex: 1 }}><b>{p.name}</b> {own && <span className="tag">운영 중</span>}<div className="muted" style={{ fontSize: 12 }}>{fmt(p.price)}원 · 원장 진료 +{fmt(p.bonus)}%{p.noSell ? " · 되팔 수 없어요(자산 가치 없음)" : ""}</div></div>
              {lv30 && next && <div className="ty-btns"><Btn cost={p.price} onClick={() => buyList("perks", i, p)} /></div>}
            </div>; })}
        </>}

        {tab === "buy" && ([["corps", "🏭 기업 인수", CORPS], ["cities", "🌏 해외 분원 (도시)", CITIES], ["planets", "🪐 우주병원 (행성)", PLANETS]] as const).map(([key, title, list]) => {
          const owned = s[key]; const nextI = list.findIndex((_, i) => !owned.includes(i));
          return <div key={key} className="ty-group"><div className="ty-group-t">{title} <span className="muted">· 갖고 있으면 매초 가격의 100만분의 1을 벌어요</span></div>
            {list.map((a, i) => { const own = owned.includes(i); if (!own && i > nextI) return null;
              return <div key={i} className={"ty-row" + (own ? " cur" : " next")}><span className="def-ico" style={{ background: own ? "var(--scrub-soft)" : undefined }}>{a.icon}</span>
                <div style={{ flex: 1 }}><b>{a.name}</b> {own && <span className="tag">인수 완료</span>}<div className="muted" style={{ fontSize: 12 }}>{fmt(a.price)}원 · 초당 +{fmt(a.price * YIELD)}원</div></div>
                {!own && <div className="ty-btns"><Btn cost={a.price} onClick={() => buyList(key, i, a)} label="인수" /></div>}</div>; })}
          </div>; })}

        {tab === "special" && <>
          <div className={"ty-row" + (s.vipOn ? " cur" : " next")}>
            <span className="def-ico">💼</span>
            <div style={{ flex: 1 }}><b>VIP 환자</b> {s.vipOn && <span className="tag">Lv{s.vipLv} · {s.vipSeen}명 진료</span>}<div className="muted" style={{ fontSize: 12 }}>가끔 찾아와요. 탭하면 큰 보상, {vipDrop(s.vipLv)}% 확률로 🧳 황금 왕진가방(영양제·돈·레벨업 쿠폰). 10명 진료할 때마다 레벨업(가방 확률 +1%)</div></div>
            {!s.vipOn && <div className="ty-btns"><Btn cost={VIP_UNLOCK} onClick={() => spend(VIP_UNLOCK, x => ({ ...x, vipOn: true }), "💼 VIP 환자를 받기 시작했어요!", true)} label="오픈" /></div>}
          </div>
          {s.bags > 0 && <div className="ty-row next"><span className="def-ico">🧳</span><div style={{ flex: 1 }}><b>황금 왕진가방 {s.bags}개</b><div className="muted" style={{ fontSize: 12 }}>{bagMsg || "열어보세요!"}</div></div><div className="ty-btns"><button type="button" className="btn" onClick={openBag}>열기</button></div></div>}
          <div className={"ty-row" + (s.helperOn ? " cur" : " next")}>
            <span className="def-ico">🤖</span>
            <div style={{ flex: 1 }}><b>자동 진료 도우미</b> {s.helperOn && <span className="tag">Lv{s.helperLv}</span>}<div className="muted" style={{ fontSize: 12 }}>{helperDur(s.helperLv)}초 동안 초당 {helperTps(s.helperLv)}번 대신 진료 · 대기 {helperCd(s.helperLv)}초{s.helperOn ? ` · 💊${helperUp(s.helperLv)}개로 레벨업(횟수·시간↑, 대기↓)` : ""}</div></div>
            <div className="ty-btns">{!s.helperOn ? <Btn cost={HELPER_UNLOCK} onClick={() => spend(HELPER_UNLOCK, x => ({ ...x, helperOn: true }), "🤖 자동 진료 도우미 합류!", true)} label="오픈" /> : <>
              <button type="button" className="btn" disabled={helping > 0 || cdLeft > 0} onClick={startHelper}>{helping > 0 ? `${helping}초` : cdLeft > 0 ? `${cdLeft}초` : "출동"}</button>
              <button type="button" className={"btn" + (s.pills < helperUp(s.helperLv) ? " ghost" : "")} disabled={s.pills < helperUp(s.helperLv) || s.helperLv >= 30} onClick={() => { setS(x => ({ ...x, pills: x.pills - helperUp(x.helperLv), helperLv: x.helperLv + 1 })); flash("🤖 도우미 레벨업!"); setTimeout(() => persist(true), 60); }}>업<br /><small>💊{helperUp(s.helperLv)}</small></button></>}</div>
          </div>
          <div className="ty-group-t">🐾 병원 펫 <span className="muted">· 한 마리만 데리고 다녀요 · 💊{PET_COST}개로 입양</span></div>
          {PETS.map(p => { const own = s.pets.includes(p.key), on = s.pet === p.key;
            return <div key={p.key} className={"ty-row" + (on ? " cur" : "")}><span className="def-ico" style={{ background: on ? "var(--scrub-soft)" : undefined }}>{p.icon}</span>
              <div style={{ flex: 1 }}><b>{p.name}</b> {on && <span className="tag">함께하는 중</span>}<div className="muted" style={{ fontSize: 12 }}>{p.desc}</div></div>
              <div className="ty-btns">{own ? !on && <button type="button" className="btn ghost" onClick={() => { setS(x => ({ ...x, pet: p.key })); setTimeout(() => persist(true), 60); }}>데려가기</button> : <button type="button" className={"btn" + (s.pills < PET_COST ? " ghost" : "")} disabled={s.pills < PET_COST} onClick={() => { setS(x => ({ ...x, pills: x.pills - PET_COST, pets: [...x.pets, p.key], pet: p.key })); flash(`${p.icon} ${p.name} 입양!`); setTimeout(() => persist(true), 60); }}>입양<br /><small>💊{PET_COST}</small></button>}</div></div>; })}
          <div className="muted" style={{ fontSize: 12 }}>💊 영양제는 황금 왕진가방에서 나와요. 🎟️ 레벨업 쿠폰은 👥 직원 탭에서 쓸 수 있어요.</div>
        </>}

        {tab === "home" && HOMES.map((h, i) => <div key={i} className={"ty-row" + (i === s.home ? " cur" : i < s.home ? " past" : "")}>
          <span className="def-ico" style={{ background: i <= s.home ? "var(--scrub-soft)" : undefined }}>{i === 0 ? "🛏️" : i < 3 ? "🏢" : i < 7 ? "🏙️" : i < 9 ? "🌉" : "🏯"}</span>
          <div style={{ flex: 1 }}><b>{h.area} {h.name}</b> {i === s.home && <span className="tag">거주 중</span>}<div className="muted" style={{ fontSize: 12 }}>{i ? `${fmt(h.price)}원` : "시작 집"} · {VIEWS[h.view]}{i && i !== s.home ? ` · 취득세 ${fmt(homeBuyFee(h.price).tax)} · 복비 ${fmt(homeBuyFee(h.price).agent)}` : ""}{i !== s.home && s.home > 0 ? " · 지금 집은 팔고(복비만, 1주택 비과세) 이사" : ""}</div></div>
          {i !== s.home && (moveCost(i) > 0 ? <div className="ty-btns"><Btn cost={moveCost(i)} onClick={() => buyHome(i)} label="이사" /></div> : <div className="ty-btns"><button type="button" className="btn ghost" onClick={() => buyHome(i)}>이사<br /><small>+{fmt(-moveCost(i))} 환급</small></button></div>)}
        </div>)}

        {(tab === "furn" || tab === "hart" || tab === "car") && SLOTS.filter(sl => sl.cat === (tab === "hart" ? "art" : tab)).map(sl => { const t = s.items[sl.key] ?? 0, cur = t ? sl.tiers[t - 1] : null, nx = sl.tiers[t];
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
