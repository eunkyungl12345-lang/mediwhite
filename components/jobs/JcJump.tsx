"use client";
import { useRouter } from "next/navigation";
/** 카드 전체가 링크라 안쪽에 링크를 못 넣어서, 눌렀을 때 댓글 위치로 바로 이동 */
export default function JcJump({ href, n }: { href: string; n: number }) {
  const r = useRouter();
  return <span role="link" tabIndex={0} className={"jc-cnt" + (n ? " on" : "")} onClick={e => { e.preventDefault(); e.stopPropagation(); r.push(href); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); r.push(href); } }}>{n ? `💬 댓글 ${n}` : "💬 질문하기"}</span>;
}
