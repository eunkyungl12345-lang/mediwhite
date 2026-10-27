import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { togglePin, deletePost, deleteComment, boostPost } from "@/lib/actions";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { can } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import CommentForm from "@/components/CommentForm";
export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!;
  const d = db();
  const [{ data: p }, leaders] = await Promise.all([d.from("posts").select("*,author:users(id,dept,xp)").eq("id", params.id).maybeSingle(), deptLeaders()]);
  if (!p) notFound();
  const { data: comments } = await d.from("comments").select("id,author_id,dept,text,created_at,author:users(id,dept,xp)").eq("post_id", p.id).order("created_at").limit(300);
  const admin = s.role === "admin", mine = p.author_id === s.id;
  const r = rankFor((p as any).author, leaders);
  const me = (await d.from("users").select("id,dept,xp").eq("id", s.id).maybeSingle()).data;
  const myR = rankFor(me, leaders);
  return (
    <div className={`detail t${r.tier}`}>
      <Link className="link" href="/board">← 목록으로</Link>
      <div className="meta" style={{ marginTop: 10 }}>
        {p.pinned && <span className="pin">📌 공지</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}<span className="tag">{p.category}</span><RankBadge r={r} /><span>{p.dept ? `[${p.dept}]` : ""}{mine ? "나" : "익명"}</span><span className="time">{fmt(p.created_at)}</span>
        {admin && <form action={togglePin.bind(null, p.id, !p.pinned)}><button className="link">{p.pinned ? "고정 해제" : "상단 고정"}</button></form>}
        {mine && can(myR, "소령") && <form action={boostPost.bind(null, p.id, !p.boosted)}><button className="link">{p.boosted ? "밀어올리기 해제" : "밀어올리기"}</button></form>}
        {(admin || mine) && <form action={deletePost.bind(null, p.id)}><button className="link">글 삭제</button></form>}
      </div>
      <h2>{p.title}</h2>
      <div className="body">{p.body}</div>
      <div className="comments">
        {!comments?.length && <div className="muted">첫 댓글을 남겨보세요.</div>}
        {comments?.map((c: any) => { const cr = rankFor(c.author, leaders); return (
          <div key={c.id} className={`comment t${cr.tier}`}>
            <div className="meta"><RankBadge r={cr} /><strong>[{c.dept}]{c.author_id === s.id ? "나" : "익명"}</strong><span className="time">{fmt(c.created_at)}</span>
              {(admin || c.author_id === s.id) && <form action={deleteComment.bind(null, c.id, p.id)}><button className="link">삭제</button></form>}
            </div>
            <div>{c.text}</div>
          </div>
        ); })}
      </div>
      <CommentForm postId={p.id} />
    </div>
  );
}
