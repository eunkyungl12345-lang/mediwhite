import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import Name from "@/components/Name";
import RankBadge from "@/components/RankBadge";
export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const s = (await getSession())!;
  const d = db();
  const [{ data: u }, leaders] = await Promise.all([d.from("users").select("id,username,nickname,dept,xp,bio,seq,created_at,blue_badge,field").eq("username", decodeURIComponent(params.username)).maybeSingle(), deptLeaders()]);
  if (!u) notFound();
  const r = rankFor(u, leaders);
  // 🔒 익명 게시판·썸 탭 글은 누구의 프로필에도 나오지 않아요 (본인·관리자 포함). 가려진 글도 제외. 글·댓글 수도 공개 글 기준으로만 세요.
  const me = u.id === s.id;
  const [{ data: posts }, { count: pc }, { count: cc }] = await Promise.all([
    d.from("posts").select("id,category,title,body,created_at").eq("author_id", u.id).neq("category", "익명").neq("category", "썸").eq("hidden", false).order("created_at", { ascending: false }).limit(100),
    d.from("posts").select("id", { count: "exact", head: true }).eq("author_id", u.id).neq("category", "익명").neq("category", "썸").eq("hidden", false),
    d.from("comments").select("id,post:posts!inner(category)", { count: "exact", head: true }).eq("author_id", u.id).eq("hidden", false).neq("post.category", "익명").neq("post.category", "썸"),
  ]);
  return (
    <div className="games">
      <div className={`card t${r.tier}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><Name r={r} dept={u.dept} nickname={u.nickname} size={22} badge={u.blue_badge} />{u.field && <span className="tag">🏢 {u.field}</span>}<RankBadge r={r} /></div>
        <div className="bio">{u.bio || <span className="muted">아직 한줄소개가 없어요.</span>}</div>
        <div className="meta"><span>{u.xp.toLocaleString()} XP</span><span>글 {pc ?? posts?.length ?? 0}</span><span>댓글 {cc ?? 0}</span><span>{new Date(u.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} 입대</span></div>
        {me && <Link className="link" href="/rank">내 정보 수정</Link>}
      </div>
      {me && <p className="muted" style={{ margin: "-4px 4px 0", fontSize: 12.5, lineHeight: 1.5 }}>🔒 익명 게시판과 썸 탭에 쓴 글은 익명 보호를 위해 프로필에 노출되지 않아요.</p>}
      <div className="posts">
        {!posts?.length && <div className="empty">아직 쓴 글이 없어요.</div>}
        {posts?.map(p => (
          <Link key={p.id} href={`/board/${p.id}`} className={`post t${r.tier}`}>
            <div className="meta"><span className="tag">{p.category}</span><span className="time">{fmt(p.created_at)}</span></div>
            <h3>{p.title}</h3><p>{p.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
