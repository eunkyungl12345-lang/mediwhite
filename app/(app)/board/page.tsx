import Link from "next/link";
import { db } from "@/lib/supabase";
import { CATS, NOTICE_CAT } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import RankBadge from "@/components/RankBadge";
export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: { cat?: string } }) {
  const cat = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : "전체";
  let q = db().from("posts").select("id,category,title,body,pinned,boosted,created_at,author:users(id,dept,xp)")
    .order("pinned", { ascending: false }).order("boosted", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (cat !== "전체") q = q.eq("category", cat);
  const [{ data: posts }, leaders] = await Promise.all([q, deptLeaders()]);
  return (
    <>
      <div className="cats">
        {["전체", ...CATS].map(c => <Link key={c} href={c === "전체" ? "/board" : `/board?cat=${encodeURIComponent(c)}`} aria-current={c === cat ? "true" : undefined}>{c === NOTICE_CAT ? "📢 공지" : c}</Link>)}
      </div>
      <div className="bar"><span className="muted">{cat} · {posts?.length ?? 0}개</span><Link className="btn" href={`/board/new${cat !== "전체" ? `?cat=${encodeURIComponent(cat)}` : ""}`}>글쓰기</Link></div>
      <div className="posts">
        {!posts?.length && <div className="empty">{cat === "전체" ? "아직 글이 없어요. 첫 글을 올려보세요." : `${cat} 칸에 아직 글이 없어요.`}</div>}
        {posts?.map((p: any) => { const r = rankFor(p.author, leaders); return (
          <Link key={p.id} href={`/board/${p.id}`} className={`post t${r.tier}`}>
            <div className="meta">{p.pinned && <span className="pin">📌 공지</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}<span className="tag">{p.category}</span><RankBadge r={r} /><span>{p.author?.dept ? `[${p.author.dept}]` : ""}익명</span><span className="time">{fmt(p.created_at)}</span></div>
            <h3>{p.title}</h3><p>{p.body}</p>
          </Link>
        ); })}
      </div>
    </>
  );
}
