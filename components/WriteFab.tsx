"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
/** 모바일 우하단 ‘✏️ 글쓰기’ 알약 버튼 — 홈·게시판 목록에서만 */
export default function WriteFab() {
  const p = usePathname();
  const show = p === "/home" || p === "/board" || p === "/anon" || p === "/jobs" || p === "/hospitals";
  if (!show) return null;
  const href = p === "/anon" ? "/anon/new" : p === "/jobs" ? "/jobs/new" : p === "/hospitals" ? "/hospitals/new" : "/board/new";
  return <Link href={href} className="wfab"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>글쓰기</Link>;
}
