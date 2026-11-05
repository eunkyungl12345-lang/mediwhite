import Link from "next/link";
import { promoUntil } from "@/lib/hospFactsDb";
/** 🎉 오픈 기념 배너 — 마감일 설정돼 있을 때만 */
export default async function OpenPromo({ href }: { href?: string }) {
  const u = await promoUntil(); if (!u) return null; const md = `${Number(u.slice(5, 7))}월 ${Number(u.slice(8))}일`;
  const body = <><span>🎉</span><div><b>오픈 기념: 지금 가입하면 모든 병원 실수령 & 분위기 무료 열람!</b><small>{md}까지 체크 없이도 전부 열려요 · 그 뒤엔 다녀본 병원 하나만 체크하면 계속 열람</small></div></>;
  return href ? <Link href={href} className="op">{body}</Link> : <div className="op">{body}</div>;
}
