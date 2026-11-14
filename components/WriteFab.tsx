"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
/** 병원 상세에서 '리뷰·제보'를 고를 때 쓰는 시트 열기 이벤트 (PC 상단 버튼도 같은 시트를 연다) */
const SHEET_EVENT = "mw:hosp-sheet";
/** 병원 상세 시트 항목 — 이 병원에 남길 수 있는 네 가지 */
const SHEET_ITEMS = (hid: string) => [
  { icon: "🩺", label: "10초 병원 체크", sub: "신호등·실수령·별점 제보", href: `/hospitals/check?id=${hid}` },
  { icon: "🎤", label: "면접 후기 쓰기", sub: "면접 질문·난이도·처우 팁", href: `/hospitals/interview?id=${hid}` },
  { icon: "🎁", label: "복지 평가하기", sub: "실제로 써본 복지 선택", href: `/hospitals/welfare?id=${hid}` },
  { icon: "📋", label: "인계장 남기기", sub: "당직·동선·실무 인계 팁", href: `/hospitals/${hid}?t=note` },
];
/** 모바일 우하단 ‘✏️ 글쓰기’ 알약 버튼 — 홈·게시판 목록에서만
 *  병원 상세에서는 아래에서 올라오는 메디화이트 작성 시트를 연다. */
export default function WriteFab() {
  const p = usePathname(), topic = useSearchParams()?.get("topic");
  const hid = /^\/hospitals\/(\d+)$/.exec(p)?.[1];
  const show = p === "/home" || p === "/board" || p === "/anon" || p === "/jobs" || p === "/hospitals" || p === "/study" || !!hid;
  const [open, setOpen] = useState(false);
  const firstRef = useRef<HTMLAnchorElement>(null);
  const prevPath = useRef(p);
  // 다른 화면으로 이동하면 시트를 닫는다
  useEffect(() => { if (prevPath.current !== p) { prevPath.current = p; setOpen(false); } }, [p]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(SHEET_EVENT, onOpen);
    return () => window.removeEventListener(SHEET_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    document.body.classList.add("wfab-lock"); firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.body.classList.remove("wfab-lock"); window.removeEventListener("keydown", onKey); };
  }, [open]);
  if (!show) return null;
  const close = () => setOpen(false);
  const sheet = hid ? (
    <div className="wfab-sl" role="dialog" aria-modal="true" aria-label="이 병원에 남기기">
      <button type="button" className="wfab-sheet-bg" aria-label="닫기" onClick={close} tabIndex={-1} />
      <div className="wfab-sheet" onClick={e => e.stopPropagation()}>
        <span className="wfab-sheet-grab" aria-hidden />
        <div className="wfab-sheet-h"><b>이 병원에 남기기</b><button type="button" className="wfab-sheet-x" aria-label="닫기" onClick={close}>✕</button></div>
        <p className="wfab-sheet-sub">딱 하나만 남겨도 다음 사람에겐 큰 지도가 돼요</p>
        <div className="wfab-sheet-list">
          {SHEET_ITEMS(hid).map((it, i) => <Link key={it.href} href={it.href} className="wfab-item" ref={i === 0 ? firstRef : undefined} onClick={close}>
            <span className="wfab-ico" aria-hidden>{it.icon}</span>
            <div><b>{it.label}</b><small>{it.sub}</small></div>
            <span className="chev" aria-hidden>›</span>
          </Link>)}
        </div>
      </div>
    </div>
  ) : null;
  if (hid) return <>
    <button type="button" className="wfab wfab-hosp" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>리뷰 · 제보
    </button>
    {open && sheet}
  </>;
  const href = p === "/anon" ? "/anon/new" : p === "/jobs" ? "/jobs/new" : p === "/hospitals" ? "/hospitals/check" : p === "/study" ? "/board/new?topic=data" : "/board/new" + (p === "/board" && topic ? `?topic=${topic}` : "");
  const label = p === "/hospitals" ? "리뷰 작성" : p === "/jobs" ? "공고 올리기" : "글쓰기";
  return <Link href={href} className="wfab"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>{label}</Link>;
}
