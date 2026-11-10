"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitWelfare } from "@/lib/welfare.actions";
import { WEL_CATS, type Welfare } from "@/lib/welfare";
import { textProblem } from "@/lib/textQuality";
const W = ["", "별로예요", "아쉬워요", "보통", "좋아요", "최고예요"];
function Send({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : edit ? "✏️ 수정 완료" : "🎁 복지 평가 남기기 +30"}</button>; }
/** 카테고리마다 한 화면: 써본 복지를 누르면 별점 칸이 열려요 → 마지막에 사용 경험 */
export default function WelfareForm({ hid, name, mine }: { hid: number; name: string; mine?: Welfare | null }) {
  const [st, act] = useFormState(submitWelfare, undefined);
  const [items, setItems] = useState<Record<string, number>>(mine?.items ?? {}), [text, setText] = useState(mine?.text ?? ""), [status, setStatus] = useState(mine?.status ?? "재직");
  const [i, setI] = useState(0), [err, setErr] = useState(""), [add, setAdd] = useState("");
  const [extra, setExtra] = useState<Record<string, string[]>>(() => { const o: Record<string, string[]> = {}; for (const k of Object.keys(mine?.items ?? {})) if (k.startsWith("+")) (o.etc ??= []).push(k); return o; });
  const n = WEL_CATS.length + 1, last = i === n - 1, cat = WEL_CATS[i];
  const toggle = (k: string) => setItems(p => { const c = { ...p }; if (k in c) delete c[k]; else c[k] = 0; return c; });
  const check = () => {
    if (!last) { const un = Object.entries(items).filter(([k, v]) => !v && (cat.items as readonly string[]).concat(extra[cat.k] ?? []).includes(k)); return un.length ? `‘${un[0][0].replace(/^\+/, "")}’ 별점을 매겨주세요` : ""; }
    const picked = Object.entries(items).filter(([, v]) => v > 0); if (!picked.length) return "써본 복지를 하나 이상 골라주세요 (이전으로 돌아가서)";
    if (Object.values(items).some(v => !v)) return "고른 복지에 모두 별점을 매겨주세요";
    return textProblem(text, 20) ?? "";
  };
  const next = () => { const e = check(); setErr(e); if (!e) { setI(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const Row = ({ k }: { k: string }) => { const on = k in items, v = items[k] ?? 0; return <div className={"wf-item" + (on ? " on" : "")}>
    <button type="button" className="wf-name" onClick={() => toggle(k)}>{k.replace(/^\+/, "")}{on && <span aria-hidden>✕</span>}</button>
    {on && <span className="hc-stars big">{[1, 2, 3, 4, 5].map(s => <button key={s} type="button" className={v >= s ? "on" : ""} onClick={() => setItems(p => ({ ...p, [k]: s }))} aria-label={`${s}점`}>★</button>)}<em className="hc-sw">{W[v]}</em></span>}</div>; };
  const picked = Object.keys(items).length;
  return <form action={act} className="form hc wiz" onSubmit={e => { const x = check(); if (x) { e.preventDefault(); setErr(x); } }}>
    <input type="hidden" name="hid" value={hid} /><input type="hidden" name="items" value={JSON.stringify(items)} /><input type="hidden" name="status" value={status} />
    <div className="wz-top"><div className="wz-bar"><i style={{ width: `${(i + 1) / n * 100}%` }} /></div><small><b>{i + 1}</b> / {n}</small></div>
    <div className="wz-h"><b>{name}</b><small>{picked ? `고른 복지 ${picked}개` : ""}</small></div>
    {!last ? <div className="wz-step"><h3>실제 써본 <em className="wf-em">{cat.icon} {cat.name}</em> 복지</h3><p>써본 것만 눌러서 별점을 매겨주세요. 없으면 그냥 <b>다음</b>을 눌러요.</p>
      <div className="wf-list">{(cat.items as readonly string[]).map(k => <Row key={k} k={k} />)}{(extra[cat.k] ?? []).map(k => <Row key={k} k={k} />)}</div>
      <div className="wf-add"><input value={add} onChange={e => setAdd(e.target.value)} maxLength={20} placeholder="+ 목록에 없는 복지 (예: 출산 축하금)" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget.nextSibling as HTMLButtonElement)?.click(); } }} />
        <button type="button" className="btn ghost" onClick={() => { const v = add.trim(); if (v.length < 2) return; const k = "+" + v; setExtra(p => ({ ...p, [cat.k]: [...(p[cat.k] ?? []).filter(x => x !== k), k] })); setItems(p => ({ ...p, [k]: p[k] ?? 0 })); setAdd(""); }}>추가</button></div>
    </div>
    : <div className="wz-step"><h3>✍️ 써본 복지, 실제로는 어땠나요?</h3><p>신청 과정, 실제 금액·조건, 눈치 보이는지까지 적어주면 다음 사람에게 큰 도움이 돼요.</p>
      <div className="hc-chips">{["재직", "퇴사"].map(x => <label key={x}><input type="radio" checked={status === x} onChange={() => setStatus(x)} /><span>{x === "재직" ? "지금 다녀요" : "다녔어요"}</span></label>)}</div>
      <textarea name="text" rows={6} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={"예) 본인 진료비는 50% 감면인데 비급여는 안 돼요. 기숙사는 신규 1년만 되고 2인 1실이에요."} />
      <small className="muted" style={{ textAlign: "right" }}><b style={{ color: text.trim().length >= 20 ? "#1F9D63" : "#D33" }}>{text.length}</b> / 최대 1,000자</small></div>}
    {(err || st?.error) && <div className="error">{err || st?.error}</div>}
    <div className="wz-nav">{i > 0 && <button type="button" className="btn ghost wz-prev" onClick={() => { setErr(""); setI(i - 1); }}>이전으로</button>}
      {last ? <Send edit={!!mine} /> : <button type="button" className="btn wz-next" onClick={next}>다음</button>}</div>
  </form>;
}
