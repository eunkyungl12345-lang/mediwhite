import Link from "next/link";
import { db } from "@/lib/supabase";
import { X_MIN, PAY_SUB, type XPay, type XAlba } from "@/lib/hospExtra";
import { netMonthly } from "./PayCalc.calc";
const ago = (t?: string) => { if (!t) return ""; const d = Math.floor((Date.now() - new Date(t).getTime()) / 86400000); return d < 1 ? "오늘" : d < 30 ? `${d}일 전` : `${Math.floor(d / 30)}개월 전`; };
const fmt = (v: number) => v.toLocaleString("ko-KR");
/** 💰 연봉 리뷰(3명 이상 모이면 범위로만) · ⏱ 알바·단기 리뷰(익명 카드) — 병원 화면 아래쪽 */
export default async function ExtraReviews({ hid, locked, done }: { hid: number; locked?: boolean; done?: string }) {
  const { data } = await db().from("game_state").select("game,state").in("game", [`hx:pay:${hid}`, `hx:alba:${hid}`]).limit(500);
  const pays = (data ?? []).filter(r => r.game.startsWith("hx:pay:")).map(r => r.state as XPay), albas = (data ?? []).filter(r => r.game.startsWith("hx:alba:")).map(r => r.state as XAlba).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const a = pays.map(p => p.annual).sort((x, y) => x - y), med = a.length ? a[Math.floor((a.length - 1) / 2)] : 0, star = pays.length ? pays.reduce((s, p) => s + p.star, 0) / pays.length : 0;
  const subs = PAY_SUB.map(p => { const v = pays.map(x => x.sub?.[p.k]).filter((n): n is number => !!n); return { n: p.n as string, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, c: v.length }; }).filter(x => x.c > 0);
  const recs = pays.filter(p => p.rec === 0 || p.rec === 1), recN = recs.length, recY = recs.filter(p => p.rec === 1).length;
  return <>
    <section className="rv2-stat xr" id="x-pay">
      <h3>💰 연봉 리뷰 <small>({pays.length}명)</small></h3>
      {done === "pay" && <div className="xr-ok" role="status">✅ 연봉 리뷰가 올라갔어요. 고마워요! (+30 XP)</div>}
      {pays.length >= X_MIN ? (locked ? <p className="muted" style={{ margin: 0, fontSize: 13 }}>🔒 {pays.length}명이 연봉을 남겼어요. 다녔던 병원 1곳을 체크하면 범위가 보여요.</p> : <>
        <div className="xr-sum"><b>{fmt(a[0])}~{fmt(a[a.length - 1])}만 원</b><small>세전 연봉 · 가운데값 {fmt(med)}만 (실수령 약 {fmt(netMonthly(med))}만/월) · 만족도 ★ {star.toFixed(1)}</small></div>
        {subs.length > 0 && <div className="xr-subs">{subs.map(x => <span key={x.n}>{x.n.replace(/ \(.*/, "")} <b>★ {x.avg.toFixed(1)}</b></span>)}{recN > 0 && <span>취업 추천 <b>{Math.round(recY / recN * 100)}%</b></span>}</div>}
        {pays.some(p => p.word) && <div className="xr-list">{pays.filter(p => p.word).slice(0, 5).map((p, i) => <div key={i} className="xr-it"><header><span className="xr-tag">{p.dept}</span><span className="xr-tag">{p.years}</span><span className="xr-tag">{p.contract}</span>{p.area && <span className="xr-tag">{p.area}</span>}</header><p>{p.word}</p></div>)}</div>}
      </>) : pays.length ? (locked ? <p className="muted" style={{ margin: 0, fontSize: 13 }}>🔒 {pays.length}명이 연봉을 남겼어요. 다녔던 병원 1곳을 체크하면 보여요.</p> : <>
        <div className="xr-sum"><b>{[...new Set(a.map(v => Math.floor(v / 1000) * 1000))].map(v => `${fmt(v)}만 원대`).join(" · ")}</b><small>세전 연봉 · {pays.length}명 응답</small></div>
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>누가 썼는지 짐작되지 않게 {X_MIN}명이 모이기 전에는 천만 원 단위로만 보여줘요.</p></>)
        : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 없어요. 첫 연봉 리뷰를 남겨주세요.</p>}
    </section>
    <section className="rv2-stat xr" id="x-alba">
      <h3>⏱ 알바·단기 리뷰 <small>({albas.length}개)</small></h3>
      {done === "alba" && <div className="xr-ok" role="status">✅ 알바 리뷰가 올라갔어요. 고마워요! (+30 XP)</div>}
      {albas.length ? (locked ? <p className="muted" style={{ margin: 0, fontSize: 13 }}>🔒 알바 리뷰 {albas.length}개가 있어요. 다녔던 병원 1곳을 체크하면 볼 수 있어요.</p> : <div className="xr-list">{albas.slice(0, 20).map((x, i) => <article key={i} className="xr-it">
        <header><b>{x.unit} {fmt(x.amount)}만 원</b><span className="xr-tag">{x.dept}</span><span className="xr-tag">{x.time}</span>{x.days && <span className="xr-tag">{x.days}</span>}{x.cases ? <span className="xr-tag">하루 {x.cases}건</span> : null}{x.star ? <span className="xr-tag">★ {x.star}</span> : null}<span className="xr-tag">{x.again ? "👍 또 갈래요" : "👎 안 갈래요"}</span><small className="muted" style={{ marginLeft: "auto" }}>{ago(x.at)}</small></header>
        <p><small>세금</small>{x.tax} <small style={{ marginLeft: 10 }}>식사</small>{x.meal} <small style={{ marginLeft: 10 }}>강도</small>{x.load}</p>
        {x.work && <p><small>한 일</small>{x.work}</p>}
        {x.note && <p><small>인계</small>{x.note}</p>}
      </article>)}</div>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 없어요. 여기서 단기·알바로 일해봤다면 첫 리뷰를 남겨주세요.</p>}
      <div className="xr-add"><Link href={`/hospitals/check?id=${hid}&t=pay`}>💰 연봉 리뷰 쓰기</Link><Link href={`/hospitals/check?id=${hid}&t=alba`}>⏱ 알바 리뷰 쓰기</Link></div>
    </section>
  </>;
}
