"use client";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { sendConfession, saveDatingProfile, saveIntro, toggleLike, pickSolo, sendDm, deleteDatingProfile, uploadSsumPhoto } from "@/lib/ssumActions";
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

type P = { photo?: string | null; photo_blur?: string | null; photo_public?: boolean; gender?: string | null; age?: number; region?: string | null; height?: number | null; personality?: string | null; hobby?: string | null; style?: string | null; want?: string | null; intro?: string | null; visible?: boolean };
const Fields = ({ p }: { p: P }) => (<>
  <div className="ss-gender">{["남", "여"].map(g => <label key={g}><input type="radio" name="gender" value={g} defaultChecked={p.gender === g} required /><span>{g === "남" ? "🙋‍♂️ 남" : "🙋‍♀️ 여"}</span></label>)}</div>
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
      <PhotoField p={p ?? {}} />
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
      <PhotoField p={{}} who="지인" />
      <Fields p={{}} />
      <label className="ss-check"><input type="checkbox" name="consent" required /> 소개할 분께 <b>동의</b>를 받았어요 (사진 포함, 만 19세 이상)</label>
      <Msg st={st} /><Submit label="🤝 지인 소개 올리기" />
    </form>
  );
}

export function LikeButton({ kind, target, liked: l0, label = "관심 있어요", dm }: { kind: "profile" | "intro"; target: string; liked: boolean; label?: string; dm?: string }) {
  const [liked, setLiked] = useState(l0), [mutual, setMutual] = useState(false), [p, start] = useTransition();
  const toggle = () => start(async () => { const r = await toggleLike(kind, target); setLiked(r.liked); setMutual(r.mutual); });
  if (dm && liked) return <span className="row" style={{ gap: 8, alignItems: "center" }}><a className="btn" href={`/ssum/dm/${dm}`}>💬 소개해준 분과 대화하기 →</a><button type="button" className="link" disabled={p} onClick={toggle}>취소</button></span>;
  return <button type="button" className={"btn" + (liked ? "" : " ghost")} disabled={p} onClick={toggle}>{liked ? (mutual ? "💘 연결됐어요!" : "💗 관심 보냄") : `🤍 ${label}`}</button>;
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

/** 사진 고르기: 브라우저에서 1080px로 줄이고 흐린본(32px)도 만들어 업로드. 위치정보(EXIF)는 이 과정에서 사라져요 */
async function shrink(file: File, max: number, q: number): Promise<Blob> {
  const img = await createImageBitmap(file);
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(b => res(b!), "image/jpeg", q));
}
export function PhotoField({ p, who = "내" }: { p: P; who?: string }) {
  const [photo, setPhoto] = useState(p.photo ?? ""), [blur, setBlur] = useState(p.photo_blur ?? ""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const pick = async (f?: File) => {
    if (!f) return; if (!f.type.startsWith("image/")) { setErr("이미지 파일만 올릴 수 있어요"); return; }
    setBusy(true); setErr("");
    try {
      const [full, small] = await Promise.all([shrink(f, 1080, .82), shrink(f, 32, .6)]);
      const fd = new FormData(); fd.append("full", new File([full], "p.jpg", { type: "image/jpeg" })); fd.append("blur", new File([small], "b.jpg", { type: "image/jpeg" }));
      const r = await uploadSsumPhoto(fd); if (r.error) setErr(r.error); else { setPhoto(r.photo!); setBlur(r.blur!); }
    } catch { setErr("사진을 읽지 못했어요"); } finally { setBusy(false); }
  };
  return (
    <div className="ss-photo-field">
      <input type="hidden" name="photo" value={photo} /><input type="hidden" name="photo_blur" value={blur} />
      <label className="ss-photo-pick">
        {photo ? <img src={photo} alt="" /> : <span>{busy ? "올리는 중…" : "📷"}</span>}
        <input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0])} disabled={busy} />
      </label>
      <div style={{ display: "grid", gap: 4, flex: 1 }}>
        <b style={{ fontSize: 13, color: "var(--ink)" }}>{who} 사진 (선택)</b>
        <span className="muted" style={{ fontSize: 12 }}>사진 속 위치정보는 자동으로 지워져요.</span>
        <label className="ss-check"><input type="checkbox" name="photo_public" defaultChecked={p.photo_public ?? false} /> 모두에게 선명하게 공개 <span className="muted" style={{ fontSize: 11 }}>(끄면 서로 관심 전엔 흐리게)</span></label>
        {photo && <button type="button" className="link" style={{ justifySelf: "start" }} onClick={() => { setPhoto(""); setBlur(""); }}>사진 빼기</button>}
        {err && <span className="error">{err}</span>}
      </div>
    </div>
  );
}
