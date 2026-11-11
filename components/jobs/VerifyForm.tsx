"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestHVerify } from "@/lib/hverify.actions";
import { shrinkImage } from "@/lib/shrink";
function Send() { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "올리는 중…" : "📮 인증 신청하기"}</button>; }
const GUIDE = {
  work: "명찰, 사원증, 모바일 사원증, 명함, 급여명세서 중 편한 것 1장을 올려주세요.",
  exit: "건강보험 자격득실확인서, 경력증명서, 또는 퇴직증명서 캡처를 올려주세요.",
} as const;
/** ✅ 병원 재직/퇴사 인증 신청 */
export default function VerifyForm({ hid, kind0 }: { hid: number; nick?: string; kind0: "work" | "exit" }) {
  const [st, act] = useFormState(requestHVerify, undefined); const [kind, setKind] = useState(kind0), [prev, setPrev] = useState(""), [over, setOver] = useState(false), [msg, setMsg] = useState(""); const inp = useRef<HTMLInputElement>(null);
  /** 사진 1장 받기 — 고르기 · 끌어다 놓기 · 붙여넣기(Ctrl+V) 모두 여기로 */
  const take = useCallback(async (f?: File | null) => { if (!f) return; if (!f.type.startsWith("image/")) { setMsg("사진(이미지) 파일만 올릴 수 있어요"); return; } setMsg("");
    const sm = await shrinkImage(f, 1600, .85); try { const dt = new DataTransfer(); dt.items.add(sm); if (inp.current) inp.current.files = dt.files; } catch { setMsg("이 브라우저에선 붙여넣기가 안 돼요. ‘사진 고르기’를 눌러 주세요"); return; }
    setPrev(p => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(sm); }); }, []);
  useEffect(() => { const onPaste = (e: ClipboardEvent) => { const it = [...(e.clipboardData?.items ?? [])].find(x => x.kind === "file" && x.type.startsWith("image/")); if (it) { e.preventDefault(); take(it.getAsFile()); } };
    window.addEventListener("paste", onPaste); return () => window.removeEventListener("paste", onPaste); }, [take]);
  if (st?.ok) return <div className="fb-thanks">📮 {st.ok}</div>;
  return <form action={act} className="form hc">
    <input type="hidden" name="hid" value={hid} /><input type="hidden" name="kind" value={kind} />
    <div className="jb-who"><label className={kind === "work" ? "on" : ""} onClick={() => setKind("work")}><b>🏥 지금 다녀요</b><small>명찰·사원증 1장</small></label><label className={kind === "exit" ? "on" : ""} onClick={() => setKind("exit")}><b>🚪 퇴사했어요</b><small>증명서 캡처 1장</small></label></div>
    <div className="vf-guide"><b>{GUIDE[kind]}</b>
      <small>🙈 얼굴, 주민번호, 급여 등 민감한 정보는 펜이나 스티커로 가리셔도 돼요. 병원 이름만 확인되면 승인돼요.</small></div>
    <label className={"bg-up vf-drop" + (over ? " over" : "")} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}>
      {prev ? <span className="bg-prev"><img src={prev} alt="올린 인증 사진 미리보기" style={{ width: "60%" }} /><small>다른 사진으로 바꾸려면 다시 누르거나 붙여넣으세요</small></span> : <span><b>📷 사진 고르기</b><small className="vf-pc">또는 여기로 끌어다 놓기 · 캡처한 화면은 <kbd>Ctrl</kbd>+<kbd>V</kbd> 로 붙여넣기</small></span>}
      <input ref={inp} type="file" name="photo" accept="image/*" onChange={e => take(e.target.files?.[0])} /></label>
    {msg && <div className="error">{msg}</div>}
    <label className="vf-agree"><input type="checkbox" name="agree" /><span>사진은 운영자 1명만 확인하고, 승인·거절 즉시 삭제되는 데 동의해요. 인증 후엔 닉네임 대신 <b>{kind === "work" ? "✅ 재직 인증" : "✅ 퇴사 인증"}</b> 마크만 보여요.</span></label>
    {st?.error && <div className="error">{st.error}</div>}
    <Send />
  </form>;
}
