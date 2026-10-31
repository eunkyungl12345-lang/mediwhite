"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { createMeetup, joinMeetup, leaveMeetup, sendMeetMsg, answerJoin } from "@/lib/meetupActions";
import { MEET_KINDS, MEET_AREAS, needsBadge } from "@/lib/meetup";
import BlueBadge from "@/components/BlueBadge";

const localMin = (addMin: number) => { const d = new Date(Date.now() + addMin * 60000 + 9 * 3600000); if (d.getUTCMinutes() > 0) d.setUTCHours(d.getUTCHours() + 1); d.setUTCMinutes(0, 0, 0); return d.toISOString().slice(0, 16); };
export function MeetForm({ defaultArea, badge }: { defaultArea?: string; badge?: boolean }) {
  const [st, action] = useFormState(createMeetup, undefined), [kind, setKind] = useState("coffee"), ref = useRef<HTMLFormElement>(null); const r = useRouter();
  useEffect(() => { if (st?.ok) { ref.current?.reset(); const det = ref.current?.closest("details"); if (det) det.open = false; r.refresh(); } }, [st]); // eslint-disable-line
  return (
    <form ref={ref} action={action} className="form mt-form">
      <input type="hidden" name="kind" value={kind} />
      <div className="mt-kinds">{MEET_KINDS.map(k => { const lock = needsBadge(k.key) && !badge; return <button key={k.key} type="button" className={"topic" + (kind === k.key ? " on" : "") + (lock ? " lock" : "")} title={lock ? "골드뱃지 회원만" : undefined} onClick={() => { if (lock) { setKind(k.key); return; } setKind(k.key); }}><span>{lock ? "🔒" : k.key === "coffeechat" ? <BlueBadge size={15} /> : k.icon}</span>{k.name}</button>; })}</div>
      {kind === "coffeechat" && (badge ? <div className="mt-tip"><BlueBadge size={14} className="bb" /> <b>커피챗</b> — 직무 고민·이직·커리어 수다. 골드뱃지 회원이 여는 믿을 수 있는 자리예요.</div> : <div className="mt-tip warn">🔒 커피챗은 <b>골드뱃지</b>(운전면허증+면허·자격증 인증) 회원만 열 수 있어요. <a className="link" href="/badge">지금 인증하기 →</a></div>)}
      <input name="title" maxLength={40} placeholder="제목 — 예: 오늘 오프, 동탄에서 커피 한잔 하실 분" required />
      <div className="row" style={{ gap: 6 }}>
        <select name="area" defaultValue={defaultArea && (MEET_AREAS as readonly string[]).includes(defaultArea) ? defaultArea : "경기 남부"} required>{MEET_AREAS.map(a => <option key={a} value={a}>{a}</option>)}</select>
        <input name="place" maxLength={30} placeholder="동네·장소 (예: 동탄역 근처)" style={{ flex: 1 }} />
      </div>
      <div className="row" style={{ gap: 6 }}>
        <label className="mt-lab">언제<input name="when" type="datetime-local" defaultValue={localMin(180)} min={localMin(0)} required /></label>
        <label className="mt-lab">인원<select name="cap" defaultValue="4">{[2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}명</option>)}</select></label>
        <label className="mt-lab">성별<select name="gender" defaultValue=""><option value="">누구나</option><option value="여">여성만</option><option value="남">남성만</option></select></label>
      </div>
      <textarea name="note" maxLength={200} rows={2} placeholder="한마디 (선택) — 분위기, 더치페이 여부, 나이대 등. 실명·병원명·연락처는 X" />
      {st?.error && <div className="error">{st.error}</div>}{st?.ok && <div className="muted">{st.ok}</div>}
      <button className="btn" disabled={kind === "coffeechat" && !badge}>⚡ 번개 열기 (+30 XP)</button>
    </form>
  );
}
export function JoinButton({ id, joined, pending, host, full, closed, waiting }: { id: number; joined: boolean; pending?: boolean; host: boolean; full: boolean; closed: boolean; waiting?: number }) {
  const [p, start] = useTransition(), [msg, setMsg] = useState(""), [open, setOpen] = useState(false), [note, setNote] = useState(""), [sent, setSent] = useState(false); const r = useRouter();
  if (closed) return <span className="tag">마감</span>;
  if (host) return <span className="row" style={{ gap: 6 }}><a className="btn" href={`/ssum/meet/${id}`}>💬 모임방{waiting ? <span className="mt-wait">신청 {waiting}</span> : null}</a><button type="button" className="link" disabled={p} onClick={() => { if (confirm("번개를 취소할까요? 참여자에게 알림이 가요")) start(async () => { await leaveMeetup(id); r.refresh(); }); }}>취소</button></span>;
  if (joined) return <span className="row" style={{ gap: 6 }}><a className="btn" href={`/ssum/meet/${id}`}>💬 모임방</a><button type="button" className="link" disabled={p} onClick={() => start(async () => { await leaveMeetup(id); r.refresh(); })}>빠지기</button></span>;
  if (pending || sent) return <span className="row" style={{ gap: 6, alignItems: "center" }}><span className="tag">⏳ 수락 대기 중</span><button type="button" className="link" disabled={p} onClick={() => start(async () => { await leaveMeetup(id); r.refresh(); })}>신청 취소</button></span>;
  if (full) return <span className="tag">정원 마감</span>;
  if (!open) return <button type="button" className="btn" onClick={() => setOpen(true)}>🙋 참여 신청</button>;
  return <form className="mt-apply" onSubmit={e => { e.preventDefault(); start(async () => { const x = await joinMeetup(id, note); setMsg(x.error ?? x.ok ?? ""); if (x.ok) { setOpen(false); setSent(true); } r.refresh(); }); }}>
    <input value={note} onChange={e => setNote(e.target.value)} maxLength={100} placeholder="모임장에게 한마디 (선택) — 예: 야간 끝나고 갈게요!" autoComplete="off" />
    <span className="row" style={{ gap: 6 }}><button className="btn" disabled={p}>신청 보내기</button><button type="button" className="link" onClick={() => setOpen(false)}>닫기</button></span>
    {msg && <small className={msg.includes("신청했") ? "muted" : "error"}>{msg}</small>}
  </form>;
}
export function PendingRow({ id, userId, name, msg }: { id: number; userId: string; name: string; msg?: string | null }) {
  const [p, start] = useTransition(), [err, setErr] = useState(""); const r = useRouter();
  return <div className="mt-pend"><div><b>{name}</b>{msg ? <div className="muted" style={{ fontSize: 13 }}>“{msg}”</div> : null}{err && <small className="error">{err}</small>}</div>
    <span className="row" style={{ gap: 6 }}><button type="button" className="btn" disabled={p} onClick={() => start(async () => { const x = await answerJoin(id, userId, true); setErr(x.error ?? ""); r.refresh(); })}>✅ 수락</button><button type="button" className="btn ghost" disabled={p} onClick={() => start(async () => { await answerJoin(id, userId, false); r.refresh(); })}>거절</button></span></div>;
}
export function MeetChat({ id }: { id: number }) {
  const [t, setT] = useState(""), [p, start] = useTransition(); const r = useRouter();
  return <form className="composer" onSubmit={e => { e.preventDefault(); const v = t; setT(""); start(async () => { await sendMeetMsg(id, v); r.refresh(); }); }}>
    <input value={t} onChange={e => setT(e.target.value)} maxLength={300} placeholder="모임 멤버끼리 대화 — 장소·시간 조율" autoComplete="off" /><button className="btn" disabled={p || !t.trim()}>보내기</button>
  </form>;
}
