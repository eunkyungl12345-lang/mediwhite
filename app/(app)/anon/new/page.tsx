import Link from "next/link";
import AnonPostForm from "@/components/AnonPostForm";
import { ANON_TOPICS } from "@/lib/depts";
import { getSession } from "@/lib/auth";
import { myRank } from "@/lib/ranksvc";
import { can, PERK, RANKS, IDX } from "@/lib/ranks";
export const dynamic = "force-dynamic";
export default async function AnonNew({ searchParams }: { searchParams: { topic?: string } }) {
  const topic = ANON_TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic! : "free";
  const s = (await getSession())!; const r = await myRank(s.id); const ok = s.role === "admin" || can(r, PERK.anonMin);
  const need = RANKS[IDX[PERK.anonMin]][1];
  return <div className="detail"><Link className="link" href="/anon">← 익명 게시판</Link><h2 style={{ marginTop: 8 }}>🕶️ 익명으로 글쓰기</h2>
    {ok ? <AnonPostForm defaultTopic={topic} /> : <div className="ss-empty-box" style={{ padding: "30px 20px" }}><span style={{ fontSize: 36 }}>🔒</span><b>익명 게시판 글쓰기는 {PERK.anonMin}부터</b><p className="muted" style={{ fontSize: 13, margin: "6px 0 0", lineHeight: 1.6 }}>지금 계급 <b>{r.name}</b> · {PERK.anonMin}까지 <b>{Math.max(0, need - (r.min + Math.round(r.progress * ((r.next ?? r.min) - r.min)))).toLocaleString()} XP</b> 남았어요.<br />익명 글은 책임이 무거워서 꾸준히 활동한 분께만 열어요. 댓글은 지금도 달 수 있어요!</p><div className="row" style={{ gap: 6, marginTop: 10, justifyContent: "center" }}><Link href="/rank" className="btn ghost">내 계급·혜택 보기</Link><Link href="/board/new" className="btn">일반 글쓰기</Link></div></div>}
  </div>;
}
