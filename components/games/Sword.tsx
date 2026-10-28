"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore, loadGameState, saveGameState } from "@/lib/actions";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake as shakeEl, burst, pop } from "@/lib/juice";
import SwordArt from "./SwordArt";
import { ITEMS, NAMES, FINAL, STORABLE, DROP, row, need, SHOP, WARP_RATE, COMBOS, START, type Item, type Mode } from "@/lib/swordData";

type M = { gold: number; lvl: number; best: number; tickets: number; items: Partial<Record<Item, number>>; stored: Record<string, number>; drop?: { item: Item; qty: number } | null };
type S = { v: 2; mode: Mode | null; easy: M; hard: M; protect: boolean };
const fresh = (): M => ({ gold: START, lvl: 0, best: 0, tickets: 0, items: {}, stored: {}, drop: null });
const INIT: S = { v: 2, mode: null, easy: fresh(), hard: fresh(), protect: true };
const won = (n: number) => {
  if (n >= 1e8) { const jo = Math.floor(n / 1e12), eok = Math.floor((n % 1e12) / 1e8), man = Math.floor((n % 1e8) / 1e4); return `${jo ? jo.toLocaleString() + "조 " : ""}${eok ? eok.toLocaleString() + "억" : ""}${man ? " " + man.toLocaleString() + "만" : ""}원`.trim(); }
  return n >= 1e4 ? `${Math.floor(n / 1e4).toLocaleString()}만${n % 1e4 ? " " + (n % 1e4).toLocaleString() : ""}원` : `${n.toLocaleString()}원`;
};
const nm = (l: number) => `+${l} ${NAMES[l]}`;
type View = "main" | "items" | "combo" | "shop";

export default function Sword({ ranks, best = 0 }: { ranks: Row[]; best?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState<S>(INIT), [view, setView] = useState<View>("main"), [loaded, setLoaded] = useState(false), [anim, setAnim] = useState(0);
  const [log, setLog] = useState<{ t: string; c: string }>({ t: "강화 버튼을 눌러 검을 강화하세요.", c: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    loadGameState("sword").then(r => { const x = r as any;
      if (x && x.v === 2) setSt({ ...INIT, ...x });
      else if (x && typeof x.gold === "number") { // 예전 버전 기록: 돈과 최고 기록을 두 모드에 옮겨요
        const carry = (): M => ({ ...fresh(), gold: Math.max(START, Math.floor(x.gold)), best: x.best ?? 0, tickets: x.protect ?? 0 });
        const n: S = { ...INIT, easy: carry(), hard: carry() }; setSt(n); saveGameState("sword", n as any).catch(() => {});
        setLog({ t: `예전 기록에서 ${won(Math.max(START, Math.floor(x.gold)))}과 방지권을 옮겨왔어요`, c: "good" }); } }).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  const save = (n: S) => { setSt(n); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { saveGameState("sword", n as any).catch(() => {}); }, 600); };
  const mode = st.mode, m = mode ? st[mode] : fresh();
  const put = (nm2: M) => mode && save({ ...st, [mode]: nm2 });
  const fx = () => { const el = boxRef.current, r = el?.getBoundingClientRect(); return { el, cx: r ? r.width / 2 : 0, cy: r ? r.height * .32 : 0 }; };

  if (!loaded) return <div className="card"><h3>검 강화하기</h3><div className="muted">불러오는 중…</div></div>;
  if (!mode) return (
    <div className="card">
      <h3>검 강화하기</h3>
      <div className="muted">정해진 확률로 검을 강화하고, 강화된 검을 팔아 돈을 모아요. 돈을 버는 방법은 <b>검 판매뿐</b>! 실패하면 검이 부서지고 잡템이 떨어져요. 난이도를 골라주세요. (모드별로 따로 저장돼요)</div>
      <div className="sw-modes">
        <button type="button" className="sw-mode" onClick={() => save({ ...st, mode: "easy" })}><b>😊 이지 모드</b><span>강화비 싸고 확률 높음 · 판매가 낮음 · 방지권 싸고 조합 재료 적게</span></button>
        <button type="button" className="sw-mode hard" onClick={() => save({ ...st, mode: "hard" })}><b>🔥 하드 모드</b><span>강화비 비싸고 확률 낮음 · 대신 판매가가 높아요 · 워프권은 더 쌈</span></button>
      </div>
      <Board title="강화 명예의 전당" rows={ranks} fmt={r => "+" + r.value} />
    </div>
  );

  const r = row(mode, m.lvl), nd = need(mode, m.lvl), isFinal = m.lvl >= FINAL;
  const haveNeed = !nd || (nd.stored ? (m.stored[nd.stored] ?? 0) >= nd.n : (m.items[nd.item!] ?? 0) >= nd.n);
  const canPay = !!r && m.gold >= r.cost && haveNeed;
  const broke = m.lvl === 0 && m.gold < (row(mode, 0)?.cost ?? 0) && !Object.values(m.stored).some(v => v > 0);

  function enhance() {
    if (!r || isFinal || !canPay) return;
    const n: M = { ...m, gold: m.gold - r.cost, items: { ...m.items }, stored: { ...m.stored }, drop: null };
    if (nd?.stored) n.stored[nd.stored] = (n.stored[nd.stored] ?? 0) - nd.n;
    if (nd?.item) n.items[nd.item] = (n.items[nd.item] ?? 0) - nd.n;
    const { el, cx, cy } = fx(); sfx.tap(); haptic(8); setAnim(a => a + 1);
    if (Math.random() * 100 < r.rate) {
      n.lvl = m.lvl + 1;
      setLog({ t: n.lvl === FINAL ? `🌞 전설 달성! ${nm(n.lvl)}을(를) 완성했어요!` : `성공! ${nm(n.lvl)}`, c: "good" });
      if (n.lvl >= 10) sfx.record(); else sfx.level(); haptic([15, 20, 15]);
      burst(el, cx, cy, n.lvl >= 13 ? "#F4D35E" : "#6FBFA9", n.lvl >= 13 ? 26 : 12); pop(el, cx, cy, `+${n.lvl}!`, "good big");
      if (n.lvl > n.best) { n.best = n.lvl; saveScore("sword", n.lvl, mode ?? undefined).catch(() => {}); }
    } else if (r.ticket > 0 && st.protect && m.tickets >= r.ticket) {
      n.tickets = m.tickets - r.ticket;
      setLog({ t: `실패! 🛡️ 깨짐 방지권 ${r.ticket}개로 검을 지켰어요 (남은 ${n.tickets}개)`, c: "good" }); sfx.hit(); shakeEl(el, "m"); pop(el, cx, cy, "🛡️ 방어!", "good");
    } else {
      const d = DROP[m.lvl]; n.lvl = 0;
      if (d) n.drop = { item: d, qty: 1 + Math.floor(Math.random() * (m.lvl >= 14 ? 2 : 3)) };
      setLog({ t: `쨍그랑… ${nm(m.lvl)}이(가) 부서졌어요.${d ? ` ${ITEMS[d].icon} 잡템이 떨어졌어요! 줍기를 눌러야 가져가요` : ""}`, c: "bad" });
      sfx.boom(); haptic([80, 50, 80]); shakeEl(el, "l"); burst(el, cx, cy, "#E2574C", 30); pop(el, cx, cy, "쨍그랑!", "bad big");
    }
    put(n);
  }
  const pick = () => { if (!m.drop) return; const { item, qty } = m.drop; put({ ...m, items: { ...m.items, [item]: (m.items[item] ?? 0) + qty }, drop: null }); sfx.coin(); setLog({ t: `${ITEMS[item].icon} ${ITEMS[item].name} ${qty}개를 주웠어요`, c: "good" }); };
  const sell = () => { if (!r || !r.sell || m.lvl < 1) return; put({ ...m, gold: m.gold + r.sell, lvl: 0, drop: null }); sfx.coin(); setLog({ t: `${nm(m.lvl)}을(를) ${won(r.sell)}에 팔았어요`, c: "good" }); };
  const store = () => { if (!STORABLE.includes(m.lvl)) return; put({ ...m, stored: { ...m.stored, [m.lvl]: (m.stored[m.lvl] ?? 0) + 1 }, lvl: 0, drop: null }); setLog({ t: `${nm(m.lvl)}을(를) 보관함에 넣었어요`, c: "good" }); };
  const takeOut = (k: number) => { if (m.lvl !== 0 || !(m.stored[k] > 0)) return; put({ ...m, stored: { ...m.stored, [k]: m.stored[k] - 1 }, lvl: k, drop: null }); setView("main"); setLog({ t: `보관함에서 ${nm(k)}을(를) 꺼냈어요`, c: "" }); };
  const buy = (it: typeof SHOP[number]) => {
    const price = it.price[mode]; if (m.gold < price || m.lvl !== 0) return;
    if ("tickets" in it) { put({ ...m, gold: m.gold - price, tickets: m.tickets + it.tickets }); setLog({ t: `🛡️ 깨짐 방지권 ${it.tickets}개 구입 (보유 ${m.tickets + it.tickets}개)`, c: "good" }); return; }
    const ok = Math.random() * 100 < WARP_RATE; put({ ...m, gold: m.gold - price, lvl: ok ? it.warp : 0, best: ok && it.warp > m.best ? it.warp : m.best });
    if (ok && it.warp > m.best) saveScore("sword", it.warp, mode ?? undefined).catch(() => {});
    setView("main"); setLog(ok ? { t: `🌀 워프 성공! ${nm(it.warp)}에서 시작해요`, c: "good" } : { t: "🌀 워프 실패… 워프권이 사라졌어요", c: "bad" }); ok ? sfx.level() : sfx.fail();
  };
  const combine = (i: number) => {
    const c = COMBOS[i], need2 = c.n[mode]; if ((m.items[c.item] ?? 0) < need2) return;
    const items = { ...m.items, [c.item]: (m.items[c.item] ?? 0) - need2 };
    if (c.tickets) { put({ ...m, items, tickets: m.tickets + c.tickets[mode] }); setLog({ t: `조합 완료! 🛡️ 방지권 ${c.tickets[mode]}개`, c: "good" }); }
    else if (c.sword) { put({ ...m, items, lvl: c.sword, best: Math.max(m.best, c.sword) }); if (c.sword > m.best) saveScore("sword", c.sword, mode ?? undefined).catch(() => {}); setView("main"); setLog({ t: `조합 완료! ${nm(c.sword)} 획득`, c: "good" }); }
    sfx.level();
  };

  const left = m.lvl === 0 ? { label: "🎒 아이템창", go: () => setView("items") } : m.lvl === 1 ? { label: "⚒️ 조합소", go: () => setView("combo") } : STORABLE.includes(m.lvl) ? { label: "📦 검 보관하기", go: store } : null;
  const right = m.lvl === 0 ? { label: "🏪 상점", go: () => setView("shop"), dis: false } : { label: `💰 판매하기${r?.sell ? ` (${won(r.sell)})` : ""}`, go: sell, dis: !r?.sell };
  const itemList = (Object.keys(ITEMS) as Item[]).filter(k => (m.items[k] ?? 0) > 0);

  return (
    <div className="card">
      <div className="sw-title"><h3>검 강화하기 <span className="sw-modetag">{mode === "hard" ? "하드" : "이지"}</span></h3><button type="button" className="link" onClick={() => { save({ ...st, mode: null }); setView("main"); }}>난이도 바꾸기</button></div>
      <div className="sword sw-stage" ref={boxRef}>
        {view === "main" && <>
          <div className="sw-top">
            {left ? <button type="button" className="sw-corner" onClick={left.go}>{left.label}</button> : <span />}
            <button type="button" className="sw-corner" disabled={right.dis} onClick={right.go}>{right.label}</button>
          </div>
          <div className="sw-mid">
            <div key={anim} className="sw-art"><SwordArt lv={m.lvl} size={240} /></div>
            <button type="button" className={"sw-go" + (canPay && !isFinal ? "" : " off")} disabled={!canPay || isFinal} onClick={enhance}>
              {isFinal ? "완성!" : <>강화<small>{r && r.cost ? won(r.cost) : r ? "무료" : ""}</small><small>{r?.rate}%</small></>}
            </button>
          </div>
          {m.drop && <div className="sw-drop"><span>{ITEMS[m.drop.item].icon} {ITEMS[m.drop.item].name} ×{m.drop.qty}</span><button type="button" className="btn" onClick={pick}>줍기</button></div>}
          <div className={"sword-log " + log.c}>{log.t}</div>
          <div className="sw-info">
            <div className="sw-name">{nm(m.lvl)}</div>
            {!isFinal && r && <div className="sw-row"><span>강화 비용 <b>{r.cost ? won(r.cost) : "무료"}</b></span><span>확률 <b>{r.rate}%</b></span><span>판매가 <b>{r.sell ? won(r.sell) : "판매 불가"}</b></span><span>실패 시 방지권 <b>{r.ticket > 0 ? `${r.ticket}개` : r.ticket < 0 ? "사용 불가" : "없음"}</b></span></div>}
            {nd && !isFinal && <div className={"sw-need" + (haveNeed ? "" : " lack")}>🔸 이번 강화 재료: {nd.label} {haveNeed ? "✔" : "(부족)"}</div>}
            <div className="sw-row big"><span>🛡️ 방지권 <b>{m.tickets}</b>개</span><span>💰 <b>{won(m.gold)}</b></span></div>
            <label className="sw-protect"><input type="checkbox" checked={st.protect} onChange={e => save({ ...st, protect: e.target.checked })} /> 실패하면 방지권 자동 사용</label>
            {broke && <button type="button" className="btn ghost" onClick={() => { put({ ...m, gold: START }); setLog({ t: `응급 지원금 ${won(START)}을 받았어요`, c: "good" }); }}>🚑 파산! 응급 지원금 받기</button>}
            {isFinal && <button type="button" className="btn" onClick={() => { put({ ...m, lvl: 0 }); setLog({ t: "전설의 기록은 명예의 전당에! 새 검으로 다시 시작", c: "" }); }}>새 검으로 다시 시작</button>}
          </div>
        </>}
        {view === "items" && <div className="sw-panel">
          <div className="sw-top"><button type="button" className="sw-corner" onClick={() => setView("main")}>← 돌아가기</button><span className="muted">🎒 아이템창</span></div>
          <h4>📦 보관한 검</h4>
          {STORABLE.map(k => <div key={k} className="sw-item"><SwordArt lv={k} size={70} /><div style={{ flex: 1 }}><b>{nm(k)}</b><div className="muted">{m.stored[k] ?? 0}자루</div></div>{(m.stored[k] ?? 0) > 0 && <button type="button" className="btn ghost" onClick={() => takeOut(k)}>꺼내기</button>}</div>)}
          <h4>🧱 특수 재료</h4>
          {itemList.length ? itemList.map(k => <div key={k} className="sw-item"><span className="sw-ico">{ITEMS[k].icon}</span><div style={{ flex: 1 }}><b>{ITEMS[k].name}</b></div><b>{m.items[k]}개</b></div>) : <div className="muted">아직 재료가 없어요. 검이 부서질 때 떨어지는 잡템을 주워보세요.</div>}
          <div className="muted" style={{ fontSize: 12 }}>💡 {ITEMS.soul.name}(+23 재료)·{ITEMS.axe.name}(+25 재료)·{ITEMS.clear.name}(+27 재료)는 꼭 모아두세요!</div>
        </div>}
        {view === "combo" && <div className="sw-panel">
          <div className="sw-top"><button type="button" className="sw-corner" onClick={() => setView("main")}>← 돌아가기</button><span className="muted">⚒️ 조합소</span></div>
          <div className="sw-inv">{(Object.keys(ITEMS) as Item[]).map(k => <span key={k} className={(m.items[k] ?? 0) ? "" : "zero"}>{ITEMS[k].icon} {m.items[k] ?? 0}</span>)}</div>
          {COMBOS.map((c, i) => { const n2 = c.n[mode], ok = (m.items[c.item] ?? 0) >= n2; return <div key={i} className="sw-item"><span className="sw-ico">{ITEMS[c.item].icon}</span><div style={{ flex: 1 }}><b>{ITEMS[c.item].name} {n2}개</b><div className="muted">→ {c.tickets ? `🛡️ 깨짐 방지권 ${c.tickets[mode]}개` : `${nm(c.sword!)} 1자루`}</div></div><button type="button" className="btn" disabled={!ok} onClick={() => combine(i)}>교환</button></div>; })}
          <div className="muted" style={{ fontSize: 12 }}>검을 받으면 지금 들고 있는 +1 검 대신 그 검을 들게 돼요.</div>
        </div>}
        {view === "shop" && <div className="sw-panel">
          <div className="sw-top"><button type="button" className="sw-corner" onClick={() => setView("main")}>← 돌아가기</button><span className="muted">🏪 상점 · 💰 {won(m.gold)}</span></div>
          {SHOP.map(it => <div key={it.id} className="sw-item"><span className="sw-ico">{"tickets" in it ? "🛡️" : "🌀"}</span><div style={{ flex: 1 }}><b>{it.label}</b><div className="muted">{"tickets" in it ? "실패해도 검이 안 부서지게 막아줘요" : `${it.desc} (성공률 ${WARP_RATE}%)`}</div></div><button type="button" className="btn" disabled={m.gold < it.price[mode]} onClick={() => buy(it)}>{won(it.price[mode])}</button></div>)}
        </div>}
      </div>
      <details className="sw-table"><summary>📋 {mode === "hard" ? "하드" : "이지"} 모드 강화표 보기</summary>
        <div className="sw-tbl">{NAMES.map((n, l) => { const x = row(mode, l), nd2 = need(mode, l); return <div key={l} className={l === m.lvl ? "on" : ""}><span>+{l}</span><span>{n}{STORABLE.includes(l) ? " 📦" : ""}</span><span>{l >= FINAL ? "-" : nd2 ? nd2.label : x?.cost ? won(x.cost) : "무료"}</span><span>{x ? x.rate + "%" : "-"}</span><span>{x?.sell ? won(x.sell) : l >= FINAL ? "-" : l ? "판매불가" : "-"}</span><span>{x ? (x.ticket > 0 ? x.ticket : x.ticket < 0 ? "불가" : "-") : "-"}</span></div>; })}</div>
      </details>
      <Board title="강화 명예의 전당" rows={ranks} fmt={r => "+" + r.value} />
    </div>
  );
}
