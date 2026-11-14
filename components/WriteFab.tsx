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
/** 병원 목록(/hospitals) 시트 항목 — 아직 병원을 고르기 전, 무엇을 남길지만 고른다 */
const LIST_ITEMS = [
  { icon: "🩺", label: "병원 근무 리뷰", sub: "별점 · 정규직 신호등 · 장단점", href: "/hospitals/check" },
  { icon: "💰", label: "실수령 급여 제보", sub: "직종별 세후 월급 · 수당", href: "/hospitals/check?t=pay" },
  { icon: "⏱️", label: "알바·단기 근무", sub: "시급 · 대타 분위기", href: "/hospitals/check?t=alba" },
  { icon: "🔍", label: "병원 찾아 면접·복지 쓰기", sub: "병원 검색해서 면접 · 복지 남기기", search: true },
] as const;
/** 모바일 우하단 ‘✏️ 글쓰기’ 알약 버튼 — 홈·게시판 목록에서만
 *  병원 상세·병원 목록에서는 아래에서 올라오는 메디화이트 작성 시트를 연다. */
export default function WriteFab() {
  const p = usePathname(), topic = useSearchParams()?.get("topic");
  const hid = /^\/hospitals\/(\d+)$/.exec(p)?.[1];
  const list = p === "/hospitals";
  const show = p === "/home" || p === "/board" || p === "/anon" || p === "/jobs" || list || p === "/study" || !!hid;
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
  /** 4번 항목 — 병원을 고른 뒤에 쓸 수 있는 면접·복지로 안내: 시트를 닫고 상단 검색창으로 */
  const spotSearch = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      const box = document.querySelector<HTMLFormElement>(".rf-search");
      const input = box?.querySelector<HTMLInputElement>("input[name=q]");
      input?.focus({ preventScroll: true });
      if (box && input) { box.classList.add("spot"); window.setTimeout(() => box.classList.remove("spot"), 2200); }
    }, 260);
  };
  const sheetHead = (title: string, sub: string) => <>
    <span className="wfab-sheet-grab" aria-hidden />
    <div className="wfab-sheet-h"><b>{title}</b><button type="button" className="wfab-sheet-x" aria-label="닫기" onClick={close}>✕</button></div>
    <p className="wfab-sheet-sub">{sub}</p>
  </>;
  const hidSheet = (
    <div className="wfab-sl" role="dialog" aria-modal="true" aria-label="이 병원에 남기기">
      <button type="button" className="wfab-sheet-bg" aria-label="닫기" onClick={close} tabIndex={-1} />
      <div className="wfab-sheet" onClick={e => e.stopPropagation()}>
        {sheetHead("이 병원에 남기기", "딱 하나만 남겨도 다음 사람에겐 큰 지도가 돼요")}
        <div className="wfab-sheet-list">
          {SHEET_ITEMS(hid!).map((it, i) => <Link key={it.href} href={it.href} className="wfab-item" ref={i === 0 ? firstRef : undefined} onClick={close}>
            <span className="wfab-ico" aria-hidden>{it.icon}</span>
            <div><b>{it.label}</b><small>{it.sub}</small></div>
            <span className="chev" aria-hidden>›</span>
          </Link>)}
        </div>
      </div>
    </div>
  );
  const listSheet = (
    <div className="wfab-sl" role="dialog" aria-modal="true" aria-label="리뷰 작성">
      <button type="button" className="wfab-sheet-bg" aria-label="닫기" onClick={close} tabIndex={-1} />
      <div className="wfab-sheet" onClick={e => e.stopPropagation()}>
        {sheetHead("어떤 이야기를 남길까요?", "완전 익명 · 딱 하나만 남겨도 큰 도움이 돼요")}
        <div className="wfab-sheet-list">
          {LIST_ITEMS.map((it, i) => "href" in it
            ? <Link key={it.label} href={it.href} className="wfab-item" ref={i === 0 ? firstRef : undefined} onClick={close}>
              <span className="wfab-ico" aria-hidden>{it.icon}</span>
              <div><b>{it.label}</b><small>{it.sub}</small></div>
              <span className="chev" aria-hidden>›</span>
            </Link>
            : <button key={it.label} type="button" className="wfab-item" onClick={spotSearch}>
              <span className="wfab-ico" aria-hidden>{it.icon}</span>
              <div><b>{it.label}</b><small>{it.sub}</small></div>
              <span className="chev" aria-hidden>›</span>
            </button>)}
        </div>
      </div>
    </div>
  );
  if (hid || list) return <>
    <button type="button" className="wfab wfab-hosp" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>{hid ? "리뷰 · 제보" : "리뷰 작성"}
    </button>
    {open && (hid ? hidSheet : listSheet)}
  </>;
  const href = p === "/anon" ? "/anon/new" : p === "/jobs" ? "/jobs/new" : p === "/study" ? "/board/new?topic=data" : "/board/new" + (p === "/board" && topic ? `?topic=${topic}` : "");
  const label = p === "/jobs" ? "공고 올리기" : "글쓰기";
  return <Link href={href} className="wfab"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>{label}</Link>;
}
