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
  const [{ data: posts }, { count: cc }] = await Promise.all([
    d.from("posts").select("id,category,title,body,created_at").eq("author_id", u.id).order("created_at", { ascending: false }).limit(100),
    d.from("comments").select("id", { count: "exact", head: true }).eq("author_id", u.id),
  ]);
  return (
    <div className="games">
      <div className={`card t${r.tier}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><Name r={r} dept={u.dept} nickname={u.nickname} size={22} badge={u.blue_badge} />{u.field && <span className="tag">🏢 {u.field}</span>}<RankBadge r={r} /></div>
        <div className="bio">{u.bio || <span className="muted">아직 한줄소개가 없어요.</span>}</div>
        <div className="meta"><span>{u.xp.toLocaleString()} XP</span><span>글 {posts?.length ?? 0}</span><span>댓글 {cc ?? 0}</span><span>{new Date(u.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} 입대</span></div>
        {u.id === s.id && <Link className="link" href="/rank">내 정보 수정</Link>}
      </div>
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
