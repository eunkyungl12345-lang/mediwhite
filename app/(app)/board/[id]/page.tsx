import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { togglePin, deletePost, deleteComment, boostPost } from "@/lib/actions";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { can } from "@/lib/ranks";
import Name from "@/components/Name";
import CommentForm from "@/components/CommentForm";
import Reactions from "@/components/Reactions";
import { topicOf } from "@/lib/depts";
export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!;
  const d = db();
  const [{ data: p }, leaders, { data: me }] = await Promise.all([
    d.from("posts").select("*,author:users(id,username,nickname,dept,xp),board:boards(name)").eq("id", params.id).maybeSingle(), deptLeaders(),
    d.from("users").select("id,dept,xp").eq("id", s.id).maybeSingle(),
  ]);
  if (!p) notFound();
  const { data: comments } = await d.from("comments").select("id,author_id,dept,text,created_at,author:users(id,username,nickname,dept,xp)").eq("post_id", p.id).order("created_at").limit(300);
  const cids = (comments ?? []).map(c => String(c.id));
  const [{ data: rxp }, { data: rxc }] = await Promise.all([d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "post").eq("target_id", p.id), cids.length ? d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "comment").in("target_id", cids) : Promise.resolve({ data: [] as any[] })]);
  const rx = [...(rxp ?? []), ...(rxc ?? [])];
  const agg = (kind: string, id: string) => { const counts: Record<string, number> = {}; let mine: string | null = null; for (const r of rx ?? []) if (r.kind === kind && String(r.target_id) === id) { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; if (r.user_id === s.id) mine = r.emoji; } return { counts, mine }; };
  const admin = s.role === "admin", mine = p.author_id === s.id;
  const r = rankFor((p as any).author, leaders), myR = rankFor(me, leaders);
  const a = (p as any).author;
  return (
    <div className={`detail t${r.tier}`}>
      <Link className="link" href={`/board?cat=${encodeURIComponent(p.category)}${p.board_id ? `&tab=${p.board_id}` : ""}`}>← {p.category}{(p as any).board?.name ? ` › ${(p as any).board.name}` : ""}</Link>
      <div className="meta" style={{ marginTop: 10 }}>
        {p.pinned && <span className="pin">📌 공지</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}<span className="tag">{p.category}</span><Link href={`/board?topic=${(p as any).topic ?? "free"}`} className="topic-tag">{topicOf((p as any).topic).icon} {topicOf((p as any).topic).name}</Link>
        {a ? <Name r={r} dept={a.dept} nickname={a.nickname} username={a.username} /> : <span>탈퇴한 회원</span>}<span className="time">{fmt(p.created_at)}</span>
        {admin && <form action={togglePin.bind(null, p.id, !p.pinned)}><button className="link">{p.pinned ? "고정 해제" : "상단 고정"}</button></form>}
        {mine && can(myR, "소령") && <form action={boostPost.bind(null, p.id, !p.boosted)}><button className="link">{p.boosted ? "밀어올리기 해제" : "밀어올리기"}</button></form>}
        {(admin || mine) && <form action={deletePost.bind(null, p.id)}><button className="link">글 삭제</button></form>}
      </div>
      <h2>{p.title}</h2>
      <div className="body">{p.body}</div>
      <Reactions kind="post" id={p.id} {...agg("post", p.id)} />
      <div className="comments-head"><b>댓글 {comments?.length ?? 0}</b></div>
      <div className="comments">
        {!comments?.length && <div className="muted">첫 댓글을 남겨보세요.</div>}
        {comments?.map((c: any) => { const cr = rankFor(c.author, leaders); return (
          <div key={c.id} className={`comment t${cr.tier}`}>
            <div className="meta">{c.author ? <Name r={cr} dept={c.author.dept} nickname={c.author.nickname} username={c.author.username} /> : <span>탈퇴한 회원</span>}<span className="time">{fmt(c.created_at)}</span>
              {(admin || c.author_id === s.id) && <form action={deleteComment.bind(null, c.id, p.id)}><button className="link">삭제</button></form>}
            </div>
            <div>{c.text}</div>
            <Reactions kind="comment" id={String(c.id)} compact {...agg("comment", String(c.id))} />
          </div>
        ); })}
      </div>
      <CommentForm postId={p.id} />
    </div>
  );
}
