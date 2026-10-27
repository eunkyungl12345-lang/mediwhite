import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT, DEPTS } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import Name from "@/components/Name";
import BoardTabs from "@/components/BoardTabs";
export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: { cat?: string; tab?: string } }) {
  const s = (await getSession())!;
  const cat = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : "전체";
  const isDept = (DEPTS as readonly string[]).includes(cat);
  const d = db();
  let q = d.from("posts").select("id,category,title,body,pinned,boosted,created_at,board_id,author:users(id,username,nickname,dept,xp)").limit(300);
  if (cat !== "전체") q = q.eq("category", cat);
  const tab = isDept ? (searchParams.tab || "") : "";
  if (isDept) q = tab ? q.eq("board_id", tab) : q.is("board_id", null);
  const [{ data: raw }, leaders, commanders, { data: boards }] = await Promise.all([
    q, deptLeaders(), deptCommanders(), isDept ? d.from("boards").select("id,name,dept").eq("dept", cat).order("created_at") : Promise.resolve({ data: [] as any[] }),
  ]);
  // 정렬: 공지 고정 → 밀어올림 → 작성자 계급 높은 순 → 최신순
  const posts = (raw ?? []).map((p: any) => ({ ...p, r: rankFor(p.author, leaders) }))
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (Number(b.boosted) - Number(a.boosted)) || (b.r.index - a.r.index) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  const leader = isDept ? commanders.find(c => c.dept === cat) : null;
  const canManage = isDept && (s.role === "admin" || leader?.id === s.id);
  return (
    <>
      <div className="cats">
        {["전체", ...CATS].map(c => <Link key={c} href={c === "전체" ? "/board" : `/board?cat=${encodeURIComponent(c)}`} aria-current={c === cat ? "true" : undefined}>{c === NOTICE_CAT ? "📢 공지" : c}</Link>)}
      </div>
      {isDept && <BoardTabs dept={cat} boards={boards ?? []} current={tab} canManage={!!canManage} leaderName={leader ? `[${leader.dept}]${leader.nickname}` : null} />}
      <div className="bar"><span className="muted">{cat}{tab && boards?.find((b: any) => b.id === tab) ? ` › ${boards!.find((b: any) => b.id === tab)!.name}` : ""} · {posts.length}개</span>
        <Link className="btn" href={`/board/new${cat !== "전체" ? `?cat=${encodeURIComponent(cat)}${tab ? `&tab=${tab}` : ""}` : ""}`}>글쓰기</Link></div>
      <div className="posts">
        {!posts.length && <div className="empty">{cat === "전체" ? "아직 글이 없어요. 첫 글을 올려보세요." : `${cat} 칸에 아직 글이 없어요.`}</div>}
        {posts.map((p: any) => (
          <Link key={p.id} href={`/board/${p.id}`} className={`post t${p.r.tier}`}>
            <div className="meta">{p.pinned && <span className="pin">📌 공지</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}<span className="tag">{p.category}</span>
              {p.author ? <Name r={p.r} dept={p.author.dept} nickname={p.author.nickname} /> : <span>탈퇴한 회원</span>}<span className="time">{fmt(p.created_at)}</span></div>
            <h3>{p.title}</h3><p>{p.body}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
