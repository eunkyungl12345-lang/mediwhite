"use client";
/** ⚠️ 되돌리기 어려운 폼 버튼 — 누르면 한 번 더 물어보고, 취소하면 제출하지 않아요 */
export default function ConfirmSubmit({ msg, children, className = "link", style }: { msg: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <button type="submit" className={className} style={style} onClick={e => { if (!window.confirm(msg)) e.preventDefault(); }}>{children}</button>;
}
