import Link from "next/link";
import { MIN_N, isField, isReal, type FactAgg } from "@/lib/hospFacts";
/** 🔎 병원 실체 체크 집계 (병원 상세) */
export default function FactBox({ a, hid, mine, vstat, locked, hideTop }: { a: FactAgg; hid: number; mine: boolean; vstat?: string | null; locked?: boolean; hideTop?: boolean }) {
  const cta = <Link href={`/hospitals/check?id=${hid}`} className="btn">{mine ? "✏️ 내 체크 수정" : "🔎 이 병원 다녀봤어요 · 30초 체크 +50"}</Link>;
  const vcta = mine && vstat !== "approved" ? <Link href={`/hospitals/verify?id=${hid}`} className="link fb-vlink">{vstat === "pending" ? "⏳ 인증 심사 중" : "✅ 내 응답 인증하기 (+50)"}</Link> : null;
  const M = a.need ?? MIN_N;
  if (a.n < M) return <div className="fb fb-wait"><b>🔎 실체 체크</b>{vcta}<p>{M > MIN_N ? "직원이 적은 곳이라 누가 썼는지 알 수 없도록 5명이 모여야 공개돼요. " : ""}{a.n ? `${a.n}명이 체크했어요. ${M - a.n}명만 더 모이면 실수령·분위기·리스크가 공개돼요.` : "아직 아무도 체크 안 했어요. 실수령·분위기·입사해야만 아는 리스크를 처음 알려주세요."}</p>{cta}</div>;
  if (locked) return <div className="fb fb-lock">
    <div className="fb-h"><b>🔎 실체 체크 <small>{a.n}명 응답{a.exit.n ? ` · 퇴사자 ${a.exit.n}명` : ""}{a.verified ? ` · ✅ 인증 ${a.verified}명` : ""}</small></b></div>
    <div className="fb-blur" aria-hidden><div className="fb-sec"><b>💰 세후 실수령 보통 ███만원</b><div className="fb-pay">{[30, 60, 100, 70, 40, 20, 10].map((h, i) => <div key={i}><i style={{ height: `${h}%` }} /><small>···</small></div>)}</div></div><div className="fb-risk"><span>⚠️ █████ ████ ███</span><em>█/{a.n}</em></div><div className="fb-risk"><span>⚠️ ███ ██ ████</span><em>█/{a.n}</em></div></div>
    <div className="fb-lockmsg"><b>🔒 체크 하나 남기고 6개월간 모든 병원 자유롭게</b><span>다녔던(다니는) 병원 하나만 체크하면 이 병원을 포함해 <b>모든 병원</b>의 실수령·분위기·별점·리스크가 6개월 동안 열려요. 익명이에요.</span><Link href="/hospitals/check" className="btn">🔎 체크하고 전체 보기</Link></div>
  </div>;
  const maxPay = Math.max(...a.pay.map(p => p.n)), idx = a.pay.map((p, i) => p.n ? i : -1).filter(i => i >= 0), lo = Math.max(0, (idx[0] ?? 0) - 1), hi = Math.min(a.pay.length - 1, (idx[idx.length - 1] ?? 6) + 1), payShow = a.pay.slice(lo, Math.max(hi, lo + 4) + 1);
  return <div className="fb">
    <div className="fb-h"><b>🔎 실체 체크 <small>{a.n}명 응답{a.verified ? ` · ✅ 인증 ${a.verified}명 포함` : ""}</small></b><span>입사해야만 알던 것들</span></div>
    {!hideTop && <div className="fb-head">{a.starN > 0 && <div><b>{a.overallAvg.toFixed(1)}</b><span>★ 총평점</span></div>}{a.recN > 0 && <div className="fb-donut" style={{ ["--p" as any]: a.recPct }}><i><b>{a.recPct}%</b></i><span>👍 추천률</span></div>}{a.payMid && <div><b>{a.payMid}</b><span>💰 실수령(만원)</span></div>}</div>}
    <div className="fb-sec"><b>💰 내부 급여 (세후 실수령) <em>보통 {a.payMid}만원</em></b><div className="fb-pay" style={{ gridTemplateColumns: `repeat(${payShow.length},1fr)` }}>{payShow.map(p => <div key={p.range} className={p.n === maxPay && p.n ? "top" : ""}><i style={{ height: `${maxPay ? p.n / maxPay * 100 : 0}%` }} /><small>{p.range}</small></div>)}</div></div>
    <div className="fb-sec"><b>😶 내부 분위기</b>{a.mood.filter(m => !isField(m) && !isReal(m)).map(m => <div key={m.k} className="fb-mood"><span>{m.q}</span><div className="fb-seg">{m.counts.map((c, i) => c ? <i key={i} className={"s" + i} style={{ flex: c }} title={`${m.opts[i]} ${c}명`}>{m.opts[i]} {c}</i> : null)}</div></div>)}</div>
    {a.mood.some(m => isField(m) && m.counts.some(c => c)) && <div className="fb-sec"><b>🏥 현장 지표 <em>의료계만의 진짜 근무 조건</em></b>{a.mood.filter(m => isField(m) && m.counts.some(c => c)).map(m => <div key={m.k} className="fb-mood"><span>{m.q}</span><div className="fb-seg">{m.counts.map((c, i) => c ? <i key={i} className={"s" + i} style={{ flex: c }} title={`${m.opts[i]} ${c}명`}>{m.opts[i]} {c}</i> : null)}</div></div>)}</div>}
    {a.mood.some(m => isReal(m) && m.counts.some(c => c)) && <div className="fb-sec"><b>💼 공고와 현실 <em>실제 퇴근·잡무·인센티브</em></b>{a.mood.filter(m => isReal(m) && m.counts.some(c => c)).map(m => <div key={m.k} className="fb-mood"><span>{m.q}</span><div className="fb-seg">{m.counts.map((c, i) => c ? <i key={i} className={"s" + i} style={{ flex: c }} title={`${m.opts[i]} ${c}명`}>{m.opts[i]} {c}</i> : null)}</div></div>)}</div>}
    {!hideTop && a.starN >= M && <div className="fb-sec"><b>⭐ 별점 <em>평균 {a.starAvg.toFixed(1)} · {a.starN}명</em></b><div className="fb-stars">{a.stars.map(st => <div key={st.k}><span>{st.icon} {st.name}</span><i><em style={{ width: `${st.avg / 5 * 100}%` }} /></i><b>{st.avg.toFixed(1)}</b></div>)}</div></div>}
    <div className="fb-sec"><b>⚠️ 입사 전에 알았으면 좋았을 것</b>{a.risks.length ? a.risks.map(r => <div key={r.k} className="fb-risk"><span>{r.label}</span><em>{r.n}/{a.n}명</em></div>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 체크된 리스크가 없어요{a.good ? ` · 👍 괜찮은 곳이라고 ${a.good}명` : ""}</p>}</div>
    {a.exit.n > 0 && a.exit.n < M && <div className="fb-sec"><b>🚪 퇴사자 내부 평가</b><p className="muted" style={{ margin: 0, fontSize: 13 }}>퇴사자 {M}명 이상 모이면 퇴사 사유가 공개돼요 (누가 썼는지 알 수 없게)</p></div>}
    {a.exit.n >= M && <div className="fb-sec"><b>🚪 퇴사 사유 <em>퇴사자 {a.exit.n}명</em></b>
      {a.exit.reasons.length > 0 && <div className="fb-reasons"><small>퇴사 사유</small>{a.exit.reasons.map(r => <span key={r.r}>{r.r} <em>{r.n}</em></span>)}</div>}</div>}
    {!hideTop && a.words.length > 0 && <div className="fb-sec"><b>💬 한줄평</b>{a.words.map((w, k) => <div key={k} className="fb-last">“{w}”</div>)}</div>}
    <div className="fb-foot"><small>회원 개인 경험을 합친 숫자예요. ✅ 인증은 그 병원 재직·퇴사만 확인한 것이고, 내용 자체를 확인한 건 아니에요.</small>{vcta}{cta}</div>
  </div>;
}
