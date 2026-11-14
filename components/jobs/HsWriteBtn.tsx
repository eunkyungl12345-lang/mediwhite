"use client";
/** PC(1080px+) 병원 상세 상단 — 떠 있는 버튼(.wfab)이 숨겨지는 대신 이 버튼으로 같은 작성 시트를 연다 */
export default function HsWriteBtn() {
  return <button type="button" className="hs-wbtn" aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event("mw:hosp-sheet"))}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>리뷰 · 제보
  </button>;
}
