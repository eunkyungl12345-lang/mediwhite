import Link from "next/link";
import { MIN_N, type FactAgg } from "@/lib/hospFacts";
/** 🔎 병원 실체 체크 집계 (병원 상세) */
export default function FactBox({ a, hid, mine, vstat }: { a: FactAgg; hid: number; mine: boolean; vstat?: string | null }) {
  const cta = <Link href={`/hospitals/check?id=${hid}`} className="btn">{mine ? "✏️ 내 체크 수정" : "🔎 이 병원 다녀봤어요 · 30초 체크 +50"}</Link>;
  const vcta = mine && vstat !== "approved" ? <Link href={`/hospitals/verify?id=${hid}`} className="link fb-vlink">{vstat === "pending" ? "⏳ 인증 심사 중" : "✅ 내 응답 인증하기 (+50)"}</Link> : null;
  if (a.n < MIN_N) return <div className="fb fb-wait"><b>🔎 실체 체크</b>{vcta}<p>{a.n ? `${a.n}명이 체크했어요. ${MIN_N - a.n}명만 더 모이면 실수령·분위기·리스크가 공개돼요.` : "아직 아무도 체크 안 했어요. 실수령·분위기·입사해야만 아는 리스크를 처음 알려주세요."}</p>{cta}</div>;
  const maxPay = Math.max(...a.pay.map(p => p.n));
  return <div className="fb">
    <div className="fb-h"><b>🔎 실체 체크 <small>{a.n}명 응답{a.verified ? ` · ✅ 인증 ${a.verified}명 포함` : ""}</small></b><span>입사해야만 알던 것들</span></div>
    <div className="fb-sec"><b>💰 세후 실수령 <em>보통 {a.payMid}만원</em></b><div className="fb-pay">{a.pay.map(p => <div key={p.range} className={p.n === maxPay && p.n ? "top" : ""}><i style={{ height: `${maxPay ? p.n / maxPay * 100 : 0}%` }} /><small>{p.range}</small></div>)}</div></div>
    <div className="fb-sec"><b>😶 내부 분위기</b>{a.mood.map(m => <div key={m.k} className="fb-mood"><span>{m.q}</span><div className="fb-seg">{m.counts.map((c, i) => c ? <i key={i} className={"s" + i} style={{ flex: c }} title={`${m.opts[i]} ${c}명`}>{m.opts[i]} {c}</i> : null)}</div></div>)}</div>
    <div className="fb-sec"><b>⚠️ 입사 전에 알았으면 좋았을 것</b>{a.risks.length ? a.risks.map(r => <div key={r.k} className="fb-risk"><span>{r.label}</span><em>{r.n}/{a.n}명</em></div>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 체크된 리스크가 없어요{a.good ? ` · 👍 괜찮은 곳이라고 ${a.good}명` : ""}</p>}</div>
    {a.exit.n > 0 && <div className="fb-sec"><b>🚪 퇴사자 내부 평가 <em>{a.exit.n}명</em></b>
      <div className="fb-stars">{a.exit.stars.map(st => <div key={st.k}><span>{st.icon} {st.name}</span><i><em style={{ width: `${st.avg / 5 * 100}%` }} /></i><b>{st.avg.toFixed(1)}</b></div>)}</div>
      {a.exit.reasons.length > 0 && <div className="fb-reasons"><small>퇴사 사유</small>{a.exit.reasons.map(r => <span key={r.r}>{r.r} <em>{r.n}</em></span>)}</div>}</div>}
    {a.exit.last.length > 0 && <div className="fb-sec"><b>💬 마지막 한마디</b>{a.exit.last.map((l, i) => <div key={i} className="fb-last">“{l.text}”<small>{l.v ? "✅ 퇴사 인증 · " : ""}{l.dept} · {l.years}</small></div>)}</div>}
    <div className="fb-foot"><small>회원 개인 경험을 합친 숫자예요. ✅ 인증은 그 병원 재직·퇴사만 확인한 것이고, 내용 자체를 확인한 건 아니에요.</small>{vcta}{cta}</div>
  </div>;
}
