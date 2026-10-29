import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT, DEPTS } from "@/lib/depts";
import { TOPICS, topicOf } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import Name from "@/components/Name";
import BoardTabs from "@/components/BoardTabs";
import DeptSelect from "@/components/DeptSelect";

export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: { cat?: string; tab?: string; topic?: string; sort?: string } }) {
  const s = (await getSession())!;
  const TOP = "대표";
  const cat = searchParams.cat === TOP ? TOP : searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : "전체";
  const top: string | null = null; // 응원전·대표 파트 보류 (deptPools 사용 안 함)
  const isDept = (DEPTS as readonly string[]).includes(cat);
  const topic = searchParams.topic && TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic : "";
  const sort = ["rank", "new", "best"].includes(searchParams.sort ?? "") ? searchParams.sort! : "rank";
  const d = db();
  let q = d.from("posts").select("id,category,title,body,pinned,boosted,created_at,board_id,topic,hidden,author:users(id,username,nickname,dept,xp)").limit(300);
  if (s.role !== "admin") q = q.eq("hidden", false);
  q = q.neq("category", "썸");
  if (topic) q = q.eq("topic", topic);
  if (cat === TOP) { if (top) q = q.eq("category", top); else q = q.eq("category", "__none__"); } else if (cat !== "전체") q = q.eq("category", cat);
  const tab = isDept ? (searchParams.tab || "") : "";
  if (isDept) q = tab ? q.eq("board_id", tab) : q.is("board_id", null);
  const [{ data: raw }, leaders, commanders, { data: boards }] = await Promise.all([
    q, deptLeaders(), deptCommanders(), isDept ? d.from("boards").select("id,name,dept").eq("dept", cat).order("created_at") : Promise.resolve({ data: [] as any[] }),
  ]);
  // 정렬: 공지 고정 → 밀어올림 → 작성자 계급 높은 순 → 최신순
  const ids = (raw ?? []).map((p: any) => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids.map(String))]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const r of rc ?? []) nR[(r as any).target_id] = (nR[(r as any).target_id] ?? 0) + 1;
  const posts = (raw ?? []).map((p: any) => ({ ...p, r: rankFor(p.author, leaders), nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0 }))
    .filter((p: any) => sort !== "best" || Date.now() - new Date(p.created_at).getTime() < 7 * 86400000)
    .sort((a: any, b: any) => (Number(b.pinned) - Number(a.pinned)) || (Number(b.boosted) - Number(a.boosted))
      || (sort === "best" ? (b.nr * 3 + b.nc * 2) - (a.nr * 3 + a.nc * 2) : 0)
      || (sort === "rank" ? (b.r.index - a.r.index) : 0)
      || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  const leader = isDept ? commanders.find(c => c.dept === cat) : null;
  const canManage = isDept && (s.role === "admin" || leader?.id === s.id);
  return (
    <>
      <div className="filters">
        <DeptSelect value={isDept ? cat : "전체"} options={DEPTS} mine={s.dept} topic={topic} sort={sort} />
      </div>
      <div className="topics scroll">
        <Link href="/board?cat=%EA%B3%B5%EC%A7%80" className={"topic notice" + (cat === NOTICE_CAT ? " on" : "")}><span>📢</span>공지</Link>
        {[{ key: "", name: "전체", icon: "✨" }, ...TOPICS].map(t => <Link key={t.key} href={`/board?${new URLSearchParams({ ...(cat !== "전체" && cat !== NOTICE_CAT ? { cat } : {}), ...(tab ? { tab } : {}), ...(t.key ? { topic: t.key } : {}), ...(sort !== "rank" ? { sort } : {}) }).toString()}`} className={"topic" + (topic === t.key && cat !== NOTICE_CAT ? " on" : "")}><span>{t.icon}</span>{t.name}</Link>)}
      </div>
      {cat === "방사선" && <Link href="/guide/xray" className="xg-promo"><span>📖</span><div><b>일반촬영 포지셔닝 가이드</b><small>Chest·Skull·C/L-spine·상하지 23개 검사의 자세·CR·SID·평가 기준</small></div><span>›</span></Link>}
      {isDept && <BoardTabs dept={cat} boards={boards ?? []} current={tab} canManage={!!canManage} leaderName={leader ? `[${leader.dept}]${leader.nickname}` : null} />}
      <div className="bd-bar"><span className="muted">{cat === TOP ? "대표 파트" : cat}{tab && boards?.find((b: any) => b.id === tab) ? ` › ${boards!.find((b: any) => b.id === tab)!.name}` : ""} · {posts.length}</span><div className="sorts">{[["rank", "계급순"], ["new", "최신"], ["best", "인기"]].map(([k, n]) => <Link key={k} href={`/board?${new URLSearchParams({ ...(cat !== "전체" ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}), ...(k !== "rank" ? { sort: k } : {}) }).toString()}`} aria-current={sort === k ? "true" : undefined}>{n}</Link>)}</div>
        <Link className="btn" href={`/board/new?${new URLSearchParams({ ...(cat !== "전체" && cat !== TOP ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}) }).toString()}`}>글쓰기</Link></div>
      <div className="posts">
        {!posts.length && <div className="empty">{cat === "전체" ? "아직 글이 없어요. 첫 글을 올려보세요." : `${cat} 칸에 아직 글이 없어요.`}</div>}
        {posts.map((p: any) => (
          <Link key={p.id} href={`/board/${p.id}`} className={`post t${p.r.tier}${p.pinned ? " pinned" : ""}`}>
            <div className="post-top">{p.pinned ? <span className="pin">📌 공지</span> : <span className="topic-tag">{topicOf(p.topic).icon} {topicOf(p.topic).name}</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}{cat === "전체" && !p.pinned && p.category !== NOTICE_CAT && <span className="bd-cat">{p.category}</span>}{p.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff" }}>블라인드</span>}</div>
            <h3>{p.title}</h3>
            {p.body && <p>{p.body}</p>}
            <div className="post-meta">{p.author ? <Name r={p.r} dept={p.author.dept} nickname={p.author.nickname} /> : <span>탈퇴한 회원</span>}<span>· {fmt(p.created_at)}</span><span className="post-cnt">💬 {p.nc}　👍 {p.nr}</span></div>
          </Link>
        ))}
      </div>
    </>
  );
}
