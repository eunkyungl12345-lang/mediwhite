"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { createMeetup, joinMeetup, leaveMeetup, sendMeetMsg } from "@/lib/meetupActions";
import { MEET_KINDS, MEET_AREAS } from "@/lib/meetup";

const localMin = (addMin: number) => { const d = new Date(Date.now() + addMin * 60000 + 9 * 3600000); if (d.getUTCMinutes() > 0) d.setUTCHours(d.getUTCHours() + 1); d.setUTCMinutes(0, 0, 0); return d.toISOString().slice(0, 16); };
export function MeetForm({ defaultArea }: { defaultArea?: string }) {
  const [st, action] = useFormState(createMeetup, undefined), [kind, setKind] = useState("coffee"), ref = useRef<HTMLFormElement>(null); const r = useRouter();
  useEffect(() => { if (st?.ok) { ref.current?.reset(); const det = ref.current?.closest("details"); if (det) det.open = false; r.refresh(); } }, [st]); // eslint-disable-line
  return (
    <form ref={ref} action={action} className="form mt-form">
      <input type="hidden" name="kind" value={kind} />
      <div className="mt-kinds">{MEET_KINDS.map(k => <button key={k.key} type="button" className={"topic" + (kind === k.key ? " on" : "")} onClick={() => setKind(k.key)}><span>{k.icon}</span>{k.name}</button>)}</div>
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
      <button className="btn">⚡ 번개 열기 (+30 XP)</button>
    </form>
  );
}
export function JoinButton({ id, joined, host, full, closed }: { id: number; joined: boolean; host: boolean; full: boolean; closed: boolean }) {
  const [p, start] = useTransition(), [msg, setMsg] = useState(""); const r = useRouter();
  if (closed) return <span className="tag">마감</span>;
  if (host) return <span className="row" style={{ gap: 6 }}><a className="btn" href={`/ssum/meet/${id}`}>💬 모임방</a><button type="button" className="link" disabled={p} onClick={() => { if (confirm("번개를 취소할까요? 참여자에게 알림이 가요")) start(async () => { await leaveMeetup(id); r.refresh(); }); }}>취소</button></span>;
  if (joined) return <span className="row" style={{ gap: 6 }}><a className="btn" href={`/ssum/meet/${id}`}>💬 모임방</a><button type="button" className="link" disabled={p} onClick={() => start(async () => { await leaveMeetup(id); r.refresh(); })}>빠지기</button></span>;
  if (full) return <span className="tag">정원 마감</span>;
  return <span className="row" style={{ gap: 6, alignItems: "center" }}><button type="button" className="btn" disabled={p} onClick={() => start(async () => { const x = await joinMeetup(id); setMsg(x.error ?? ""); if (x.ok) r.push(`/ssum/meet/${id}`); else r.refresh(); })}>🙋 참여하기</button>{msg && <small className="error">{msg}</small>}</span>;
}
export function MeetChat({ id }: { id: number }) {
  const [t, setT] = useState(""), [p, start] = useTransition(); const r = useRouter();
  return <form className="composer" onSubmit={e => { e.preventDefault(); const v = t; setT(""); start(async () => { await sendMeetMsg(id, v); r.refresh(); }); }}>
    <input value={t} onChange={e => setT(e.target.value)} maxLength={300} placeholder="모임 멤버끼리 대화 — 장소·시간 조율" autoComplete="off" /><button className="btn" disabled={p || !t.trim()}>보내기</button>
  </form>;
}
