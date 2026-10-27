"use client";
import { useEffect, useState } from "react";
import { saveScore } from "@/lib/actions";
import Board, { type Row } from "./Board";

const NAMES = ["녹슨 검", "무쇠 검", "강철 검", "은빛 검", "기사의 검", "명검", "보검", "전설의 검", "용살검", "성검", "신검"];
const ART = ["🗡️", "🗡️", "🗡️", "⚔️", "⚔️", "⚔️", "✨", "✨", "🔥", "🔥", "🌟"];
type S = { mode: "easy" | "hard"; gold: number; lvl: number; best: number; protect?: number };
const START = 1_000_000;
const INIT: S = { mode: "easy", gold: START, lvl: 0, best: 0 };
const won = (n: number) => { if (n >= 100_000_000) { const eok = Math.floor(n / 100_000_000), man = Math.floor((n % 100_000_000) / 10000); return `${eok.toLocaleString()}억${man ? " " + man.toLocaleString() + "만" : ""}원`; } return n >= 10000 ? `${Math.floor(n / 10000).toLocaleString()}만${n % 10000 ? " " + (n % 10000).toLocaleString() : ""}원` : `${n.toLocaleString()}원`; };

export default function Sword({ ranks }: { ranks: Row[] }) {
  const [sw, setSw] = useState<S>(INIT);
  const [log, setLog] = useState<{ t: string; c: string }>({ t: "강화를 시작해보세요.", c: "" });
  const [shake, setShake] = useState(0);
  useEffect(() => { try { const x = JSON.parse(localStorage.getItem("mw-sword") || "null"); if (x && typeof x.gold === "number") setSw(x.gold < 100000 && x.lvl === 0 && x.best === 0 ? { ...x, gold: START } : x); } catch {} }, []);
  const save = (n: S) => { setSw(n); try { localStorage.setItem("mw-sword", JSON.stringify(n)); } catch {} };
  const cost = (l: number) => Math.round(100_000 * Math.pow(1.55, l) / 1000) * 1000 * (sw.mode === "hard" ? 2 : 1);
  const rate = (l: number) => sw.mode === "hard" ? Math.max(5, 88 - l * 8) : Math.max(10, 95 - l * 6);
  const price = (l: number) => l === 0 ? 30_000 : Math.round(80_000 * Math.pow(2.1, l) / 1000) * 1000;
  const protectCost = (l: number) => cost(l) * 3;
  const name = (l: number) => `+${l} ${NAMES[Math.min(l, NAMES.length - 1)]}${l >= NAMES.length ? ` (${l}강)` : ""}`;

  function enhance() {
    const c = cost(sw.lvl); if (sw.gold < c) return;
    const n = { ...sw, gold: sw.gold - c };
    if (Math.random() * 100 < rate(sw.lvl)) { n.lvl++; setLog({ t: `성공! ${name(n.lvl)} 획득`, c: "good" }); if (n.lvl > n.best) { n.best = n.lvl; saveScore("sword", n.lvl, n.mode).catch(() => {}); } }
    else if (sw.lvl >= 5 && (sw.protect ?? 0) > 0) { n.protect = (sw.protect ?? 0) - 1; setLog({ t: `실패했지만 🛡️ 깨짐 방지권이 막아줬어요! (남은 방지권 ${n.protect}장)`, c: "good" }); setShake(s => s + 1); }
    else if (sw.lvl >= 10) { n.lvl = 0; setLog({ t: "쨍그랑… 검이 산산조각 났어요. +0부터 다시", c: "bad" }); setShake(s => s + 1); }
    else if (sw.lvl >= 5) { n.lvl--; setLog({ t: `실패! 한 단계 내려가서 ${name(n.lvl)}`, c: "bad" }); setShake(s => s + 1); }
    else { setLog({ t: "실패… 다행히 검은 무사해요", c: "bad" }); setShake(s => s + 1); }
    save(n);
  }
  const sell = () => { const p = price(sw.lvl); setLog({ t: `${name(sw.lvl)}을(를) ${won(p)}에 팔았어요. 새 검 지급`, c: "good" }); save({ ...sw, gold: sw.gold + p, lvl: 0 }); };
  const poor = sw.gold < cost(sw.lvl);
  const buyProtect = () => { const c = protectCost(sw.lvl); if (sw.gold < c) return; save({ ...sw, gold: sw.gold - c, protect: (sw.protect ?? 0) + 1 }); setLog({ t: `🛡️ 깨짐 방지권 구매 (보유 ${(sw.protect ?? 0) + 1}장). 다음 실패 1회를 막아줘요`, c: "good" }); };
  return (
    <div className="card">
      <div><h3>검 강화하기</h3><div className="muted">시작 자금 100만 원으로 검을 강화하세요. 단계가 오를수록 비싸지고 성공률은 떨어져요. +5부터는 실패하면 한 단계 내려가고, +10부터는 깨져요. 🛡️ 깨짐 방지권(강화비의 3배)을 사두면 실패 1회를 막아줘요. 돈이 모자라면 팔아서 메꾸세요. +5/+10/+15 달성 시 퀘스트 경험치.</div></div>
      <div className="row" role="radiogroup" aria-label="난이도">
        <button className="cats-btn" type="button" aria-pressed={sw.mode === "easy"} onClick={() => save({ ...sw, mode: "easy" })}>이지</button>
        <button className="cats-btn" type="button" aria-pressed={sw.mode === "hard"} onClick={() => save({ ...sw, mode: "hard" })}>하드</button>
      </div>
      <div className="sword">
        <div key={shake} className={"sword-art" + (shake ? " shake" : "")} aria-hidden="true">{ART[Math.min(sw.lvl, ART.length - 1)]}</div>
        <div className="sword-lvl">{name(sw.lvl)}{(sw.protect ?? 0) > 0 && <span className="tag" style={{ marginLeft: 8, verticalAlign: "middle" }}>🛡️ 방지권 {sw.protect}장</span>}</div>
        <div className="sword-stats"><span>보유 <b>{won(sw.gold)}</b></span><span>강화비 <b>{won(cost(sw.lvl))}</b></span><span>성공률 <b>{rate(sw.lvl)}</b>%</span><span>판매가 <b>{won(price(sw.lvl))}</b></span></div>
        <div className={"sword-log " + log.c}>{log.t}</div>
      </div>
      <div className="row">
        <button className="btn" style={{ flex: 1 }} type="button" disabled={poor} onClick={enhance}>{poor ? "자금 부족" : `강화 (${won(cost(sw.lvl))})`}</button>
        <button className="btn ghost" type="button" onClick={sell}>팔기</button>
        <button className="btn ghost" type="button" disabled={sw.gold < protectCost(sw.lvl)} onClick={buyProtect} title="실패해도 하락·파괴를 1회 막아줘요 (+5부터 효과)">🛡️ 방지권 ({won(protectCost(sw.lvl))})</button>
        <button className="btn ghost" type="button" onClick={() => { save({ ...sw, gold: START, lvl: 0, protect: 0 }); setLog({ t: "처음부터 다시. 자금 100만원", c: "" }); }}>처음부터</button>
      </div>
      <Board title="강화 명예의 전당" rows={ranks} fmt={r => "+" + r.value} />
    </div>
  );
}
