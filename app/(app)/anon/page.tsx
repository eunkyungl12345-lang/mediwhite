import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ANON_CAT, ANON_TOPICS } from "@/lib/depts";
import { fmt } from "@/lib/format";
export const dynamic = "force-dynamic";
const DAY = 86400000;
const topicOf = (k: string | null) => ANON_TOPICS.find(t => t.key === k) ?? ANON_TOPICS[0];

export default async function AnonPage({ searchParams }: { searchParams: { topic?: string; sort?: string; q?: string } }) {
  const s = (await getSession())!; const d = db();
  const topic = ANON_TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic! : "";
  const sort = searchParams.sort === "best" ? "best" : "new";
  const kw = (searchParams.q ?? "").trim().slice(0, 40).replace(/[%,()]/g, " ");
  let q = d.from("posts").select("id,title,body,topic,created_at,views,hidden,author_id").eq("category", ANON_CAT).order("created_at", { ascending: false }).limit(200);
  if (s.role !== "admin") q = q.eq("hidden", false);
  if (topic) q = q.eq("topic", topic);
  if (kw) q = q.or(`title.ilike.%${kw}%,body.ilike.%${kw}%`);
  const { data: raw } = await q;
  const ids = (raw ?? []).map(p => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids.map(String))]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const r of rc ?? []) nR[(r as any).target_id] = (nR[(r as any).target_id] ?? 0) + 1;
  const posts = (raw ?? []).map(p => ({ ...p, nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0, score: (nR[p.id] ?? 0) * 3 + (nC[p.id] ?? 0) * 2 + Math.floor((p.views ?? 0) / 10) }))
    .filter(p => sort !== "best" || Date.now() - new Date(p.created_at).getTime() < 7 * DAY)
    .sort((a, b) => sort === "best" ? b.score - a.score : 0);
  const href = (o: Record<string, string>) => { const u = new URLSearchParams(Object.entries({ ...(topic ? { topic } : {}), ...(sort !== "new" ? { sort } : {}), ...(kw ? { q: kw } : {}), ...o }).filter(([, v]) => v)); return `/anon${u.toString() ? "?" + u : ""}`; };
  return (
    <div className="cafe an">
      <div className="an-head">
        <div><h2>🕶️ 익명 게시판</h2><div className="muted" style={{ fontSize: 12.5 }}>닉네임·직종·계급이 전혀 안 보여요. 글쓴이도 댓글도 서로 모르게. 속 시원하게 털어놓되 실명·병원명은 금지예요. (신고된 글만 운영팀이 확인해요)</div></div>
      </div>
      <div className="topics scroll">
        <Link href={href({ topic: "" })} className={"topic" + (!topic ? " on" : "")}><span>✨</span>전체</Link>
        {ANON_TOPICS.map(t => <Link key={t.key} href={href({ topic: t.key })} className={"topic" + (topic === t.key ? " on" : "")}><span>{t.icon}</span>{t.name}</Link>)}
      </div>
      <div className="bd-bar"><span className="muted">{kw ? `‘${kw}’ 검색 ` : ""}{posts.length}개</span><div className="sorts">{[["new", "최신"], ["best", "인기"]].map(([k, n]) => <Link key={k} href={href({ sort: k === "new" ? "" : k })} aria-current={sort === k ? "true" : undefined}>{n}</Link>)}</div><Link className="btn" href={`/anon/new${topic ? `?topic=${topic}` : ""}`}>익명으로 글쓰기</Link></div>
      <div className="posts">
        {!posts.length && <div className="empty">아직 글이 없어요. 첫 비밀을 털어놔 보세요 🕶️</div>}
        {posts.map(p => <Link key={p.id} href={`/anon/${p.id}`} className={"post cf-post an-post" + (p.hidden ? " dim" : "")}>
          <div className="post-top"><span className="topic-tag">{topicOf(p.topic).icon} {topicOf(p.topic).name}</span>{Date.now() - new Date(p.created_at).getTime() < DAY && <span className="cf-n">N</span>}{p.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff" }}>블라인드</span>}</div>
          <h3>{p.title}</h3>
          {p.body && <p>{p.body}</p>}
          <div className="post-meta"><span className="an-who">🕶️ 익명</span><span>· {fmt(p.created_at)}</span></div>
          <div className="cf-cnt"><span>♡ {p.nr}</span><span>💬 {p.nc}</span><span>👁 {p.views ?? 0}</span></div>
        </Link>)}
      </div>
    </div>
  );
}
