"use client";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { sendConfession, saveDatingProfile, saveIntro, toggleLike, pickSolo, sendDm, deleteDatingProfile } from "@/lib/ssumActions";
import { DEPTS } from "@/lib/depts";

function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : label}</button>; }
const Msg = ({ st }: { st: any }) => st?.error ? <div className="error">{st.error}</div> : st?.ok ? <div className="ss-ok">{st.ok}</div> : null;

export function ConfessForm() {
  const [st, act] = useFormState(sendConfession, undefined);
  return (
    <form action={act} className="ss-form">
      <input name="to" placeholder="받는 사람 닉네임 (사이트 회원)" maxLength={20} required />
      <textarea name="text" placeholder="익명으로 전해져요. 상대가 수락해야 두 사람 닉네임이 공개돼요." maxLength={300} required style={{ minHeight: 70 }} />
      <Msg st={st} /><Submit label="💌 익명 고백 보내기" />
    </form>
  );
}

type P = { age?: number; region?: string | null; height?: number | null; personality?: string | null; hobby?: string | null; style?: string | null; want?: string | null; intro?: string | null; visible?: boolean };
const Fields = ({ p }: { p: P }) => (<>
  <div className="ss-grid2">
    <label>나이<input name="age" type="number" min={19} max={70} defaultValue={p.age} required /></label>
    <label>키(cm)<input name="height" type="number" min={130} max={210} defaultValue={p.height ?? undefined} /></label>
  </div>
  <label>지역<input name="region" maxLength={20} defaultValue={p.region ?? ""} placeholder="예: 서울 강남권" /></label>
  <label>성격<input name="personality" maxLength={60} defaultValue={p.personality ?? ""} placeholder="조용하지만 친해지면 장난이 많아요" /></label>
  <label>취미<input name="hobby" maxLength={60} defaultValue={p.hobby ?? ""} placeholder="헬스, 카페, 여행" /></label>
  <label>연애 스타일<input name="style" maxLength={60} defaultValue={p.style ?? ""} placeholder="편안하고 오래 만나는 연애" /></label>
  <label>원하는 상대<input name="want" maxLength={60} defaultValue={p.want ?? ""} placeholder="대화가 잘 통하는 분" /></label>
  <label>자기소개<textarea name="intro" maxLength={300} defaultValue={p.intro ?? ""} placeholder="퇴근 후 맛있는 거 먹으러 다닐 분 구합니다!" style={{ minHeight: 70 }} /></label>
  <div className="muted" style={{ fontSize: 12 }}>🔒 연락처·SNS 아이디는 적을 수 없어요. 서로 "관심 있어요"를 누르면 1:1 대화가 열려요.</div>
</>);

export function ProfileForm({ p }: { p: P | null }) {
  const [st, act] = useFormState(saveDatingProfile, undefined);
  const [, start] = useTransition(); const r = useRouter();
  return (
    <form action={act} className="ss-form">
      <Fields p={p ?? {}} />
      <label className="ss-check"><input type="checkbox" name="visible" defaultChecked={p?.visible ?? true} /> 내 카드를 다른 회원에게 공개</label>
      <label className="ss-check"><input type="checkbox" name="adult" defaultChecked={!!p} required /> 만 19세 이상이에요</label>
      <Msg st={st} />
      <div className="row"><Submit label={p ? "카드 저장" : "카드 만들기"} />{p && <button type="button" className="btn ghost" onClick={() => { if (confirm("프로필 카드를 지울까요?")) start(async () => { await deleteDatingProfile(); r.refresh(); }); }}>카드 삭제</button>}</div>
    </form>
  );
}

export function IntroForm() {
  const [st, act] = useFormState(saveIntro, undefined);
  return (
    <form action={act} className="ss-form">
      <label>지인 직종<select name="dept" defaultValue=""><option value="">선택 안 함</option>{DEPTS.map(d => <option key={d}>{d}</option>)}<option>병원 외 직장인</option></select></label>
      <Fields p={{}} />
      <label className="ss-check"><input type="checkbox" name="consent" required /> 소개할 분께 <b>동의</b>를 받았어요 (만 19세 이상)</label>
      <Msg st={st} /><Submit label="🤝 지인 소개 올리기" />
    </form>
  );
}

export function LikeButton({ kind, target, liked: l0, label = "관심 있어요" }: { kind: "profile" | "intro"; target: string; liked: boolean; label?: string }) {
  const [liked, setLiked] = useState(l0), [mutual, setMutual] = useState(false), [p, start] = useTransition();
  return <button type="button" className={"btn" + (liked ? "" : " ghost")} disabled={p} onClick={() => start(async () => { const r = await toggleLike(kind, target); setLiked(r.liked); setMutual(r.mutual); })}>{liked ? (mutual ? "💘 연결됐어요!" : "💗 관심 보냄") : `🤍 ${label}`}</button>;
}

export function PickSolo({ userId }: { userId: string }) {
  const [p, start] = useTransition(); const r = useRouter();
  return <button type="button" className="link" disabled={p} onClick={() => { const c = prompt("요미 한마디 (선택)") ?? ""; start(async () => { await pickSolo(userId, c); r.refresh(); }); }}>⭐ 오늘의 솔로로 픽</button>;
}

export function DmForm({ other }: { other: string }) {
  const [t, setT] = useState(""), [p, start] = useTransition(); const r = useRouter();
  return <form className="composer ss-dmform" onSubmit={e => { e.preventDefault(); const v = t; setT(""); start(async () => { await sendDm(other, v); r.refresh(); }); }}>
    <input value={t} onChange={e => setT(e.target.value)} maxLength={500} placeholder="메시지" autoComplete="off" /><button className="btn" disabled={p || !t.trim()}>보내기</button>
  </form>;
}
