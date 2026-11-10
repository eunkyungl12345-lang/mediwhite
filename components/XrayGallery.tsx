"use client";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadXrayPhoto, decideXrayPhoto, deleteMyXrayPhoto } from "@/lib/xrayPhoto.actions";
import { XP_KINDS } from "@/lib/xrayPhoto";
import { shrinkImage } from "@/lib/shrink";
type P = { uid: string; game: string; url: string; kind: string; note?: string; status: string };
function Send() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "📤 사진 올리기"}</button>; }
/** 큰 그림 + 아래 썸네일 줄 (첫 장은 포지셔닝 도식) · 회원 사진은 승인 후 공개 */
export default function XrayGallery({ slug, fig, photos, me }: { slug: string; fig: React.ReactNode; photos: P[]; me: string }) {
  const [i, setI] = useState(0), [st, act] = useFormState(uploadXrayPhoto, undefined), [prev, setPrev] = useState<string[]>([]); const upRef = useRef<HTMLDetailsElement>(null);
  const need = XP_KINDS.slice(0, 4).filter(k => !photos.some(p => p.kind === k)); // 비어 있는 칸: 콘솔처럼 5칸(도식 + 사진 4)을 채워요
  const cur = i === 0 ? null : photos[i - 1];
  return <div className="xg2">
    <div className="xg2-main">{cur ? <><img src={cur.url} alt={cur.kind} />{cur.status === "pending" && <em className="xg2-pend">심사 중 · 나만 보여요</em>}<small className="xg2-cap">{cur.kind}{cur.note ? ` · ${cur.note}` : ""}</small></> : fig}</div>
    <div className="xg2-thumbs"><button type="button" className={i === 0 ? "on" : ""} onClick={() => setI(0)}>📐<br />도식</button>
      {photos.map((p, k) => <button key={p.game} type="button" className={i === k + 1 ? "on" : ""} onClick={() => setI(k + 1)}><img src={p.url} alt={p.kind} />{p.status === "pending" && <i>심사</i>}</button>)}
      {need.slice(0, Math.max(0, 4 - photos.length)).map(k => <button key={k} type="button" className="xg2-empty" onClick={() => { if (upRef.current) { upRef.current.open = true; upRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } }} aria-label={`${k} 사진 올리기`}>＋<br /><small>{k.replace(" (익명)", "")}</small></button>)}</div>
    {cur && cur.uid === me && <button type="button" className="link" style={{ fontSize: 12.5, color: "var(--muted)", justifySelf: "start" }} onClick={async () => { if (confirm("이 사진을 지울까요?")) { await deleteMyXrayPhoto(cur.game); setI(0); } }}>🗑 내 사진 지우기</button>}
    <details className="xg2-up" ref={upRef}><summary>📸 이 촬영법 사진 올리기 <small>승인되면 +20 XP</small></summary>
      {st?.ok ? <p className="fb-thanks" style={{ margin: 0 }}>🙏 고마워요! 운영팀 확인 뒤 공개돼요.</p> : <form action={act} className="form" style={{ gap: 8 }}><input type="hidden" name="slug" value={slug} />
        <select name="kind" defaultValue="">{[<option key="" value="" disabled>사진 종류</option>, ...XP_KINDS.map(k => <option key={k}>{k}</option>)]}</select>
        <input type="file" name="photo" accept="image/*" multiple onChange={async e => { const inp = e.target, fs = Array.from(inp.files ?? []).slice(0, 3); if (!fs.length) return; const sm = await Promise.all(fs.map(f => shrinkImage(f, 1600, .85))); try { const dt = new DataTransfer(); sm.forEach(f => dt.items.add(f)); inp.files = dt.files; } catch {} setPrev(sm.map(f => URL.createObjectURL(f))); }} />
        {prev.length > 0 && <div className="xg2-thumbs">{prev.map(u => <span key={u}><img src={u} alt="" /></span>)}</div>}
        <input name="note" maxLength={100} placeholder="한 줄 설명 (선택) 예: 앉은 자세로 찍을 때" />
        <label className="xg2-agree"><input type="checkbox" name="agree" /><span>환자 이름·등록번호·생년월일·날짜 같은 <b>개인정보를 모두 지웠고</b>, 사람이 나오면 얼굴을 가렸거나 동의를 받았어요.</span></label>
        {st?.error && <div className="error">{st.error}</div>}<Send /></form>}
    </details>
  </div>;
}
/** 관리자: 심사 대기 사진 */
export function XrayPhotoAdmin({ rows }: { rows: (P & { slug: string })[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  if (!rows.length) return <p className="muted" style={{ fontSize: 13 }}>심사 대기 사진이 없어요.</p>;
  return <div className="xg2-adm">{rows.map(r => <div key={r.game}><img src={r.url} alt="" /><small>{r.slug} · {r.kind}{r.note ? ` · ${r.note}` : ""}</small>
    {done[r.game] ? <b>{done[r.game]}</b> : <span><button type="button" className="btn" onClick={async () => { await decideXrayPhoto(r.uid, r.game, true); setDone(d => ({ ...d, [r.game]: "승인" })); }}>승인</button><button type="button" className="btn ghost" onClick={async () => { await decideXrayPhoto(r.uid, r.game, false); setDone(d => ({ ...d, [r.game]: "반려" })); }}>반려</button></span>}</div>)}</div>;
}
