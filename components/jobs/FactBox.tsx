import Link from "next/link";
import { MIN_N, type FactAgg } from "@/lib/hospFacts";
/** 🔎 병원 실체 체크 집계 (병원 상세) */
export default function FactBox({ a, hid, mine }: { a: FactAgg; hid: number; mine: boolean }) {
  const cta = <Link href={`/hospitals/check?id=${hid}`} className="btn">{mine ? "✏️ 내 체크 수정" : "🔎 이 병원 다녀봤어요 · 30초 체크 +50"}</Link>;
  if (a.n < MIN_N) return <div className="fb fb-wait"><b>🔎 실체 체크</b><p>{a.n ? `${a.n}명이 체크했어요. ${MIN_N - a.n}명만 더 모이면 실수령·분위기·리스크가 공개돼요.` : "아직 아무도 체크 안 했어요. 실수령·분위기·입사해야만 아는 리스크를 처음 알려주세요."}</p>{cta}</div>;
  const maxPay = Math.max(...a.pay.map(p => p.n));
  return <div className="fb">
    <div className="fb-h"><b>🔎 실체 체크 <small>{a.n}명 응답</small></b><span>입사해야만 알던 것들</span></div>
    <div className="fb-sec"><b>💰 세후 실수령 <em>보통 {a.payMid}만원</em></b><div className="fb-pay">{a.pay.map(p => <div key={p.range} className={p.n === maxPay && p.n ? "top" : ""}><i style={{ height: `${maxPay ? p.n / maxPay * 100 : 0}%` }} /><small>{p.range}</small></div>)}</div></div>
    <div className="fb-sec"><b>😶 내부 분위기</b>{a.mood.map(m => <div key={m.k} className="fb-mood"><span>{m.q}</span><div className="fb-seg">{m.counts.map((c, i) => c ? <i key={i} className={"s" + i} style={{ flex: c }} title={`${m.opts[i]} ${c}명`}>{m.opts[i]} {c}</i> : null)}</div></div>)}</div>
    <div className="fb-sec"><b>⚠️ 입사 전에 알았으면 좋았을 것</b>{a.risks.length ? a.risks.map(r => <div key={r.k} className="fb-risk"><span>{r.label}</span><em>{r.n}/{a.n}명</em></div>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 체크된 리스크가 없어요{a.good ? ` · 👍 괜찮은 곳이라고 ${a.good}명` : ""}</p>}</div>
    <div className="fb-foot"><small>회원 개인 경험을 합친 숫자예요. 사실 확인을 거친 정보는 아니에요.</small>{cta}</div>
  </div>;
}
