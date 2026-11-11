import Link from "next/link";
import { promoUntil, founderLeft, FOUNDER_MAX } from "@/lib/hospFactsDb";
/** 🏅 창립 멤버 모집 배너 — 마감일이 설정돼 있고 자리가 남았을 때만 */
export default async function OpenPromo({ href }: { href?: string }) {
  const u = await promoUntil(); if (!u) return null; const left = await founderLeft(); if (!left) return null; const md = `${Number(u.slice(5, 7))}월 ${Number(u.slice(8))}일`;
  const body = <><span>🏅</span><div><b>창립 멤버 선착순 {FOUNDER_MAX}명 모집 중 · {left}자리 남음</b><small>{md}까지 다녀본 병원 1곳만 10초 제보하면 창립 멤버 배지 + 모든 병원 평생 열람</small></div></>;
  return href ? <Link href={href} className="op">{body}</Link> : <div className="op">{body}</div>;
}
