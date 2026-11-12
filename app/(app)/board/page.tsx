import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT, DEPTS } from "@/lib/depts";
import { TOPICS, topicOf } from "@/lib/depts";
import { fmt, ago } from "@/lib/format";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import Name from "@/components/Name";
import Avatar from "@/components/Avatar";
import BlueBadge from "@/components/BlueBadge";
import { CafeHeader, NoticeFold, CafeBottom, QuerySelect, type NavItem } from "@/components/CafeNav";
import BoardSearch from "@/components/BoardSearch";
import { liveCounts } from "@/lib/live";
import { boardNavItems } from "@/lib/boardNav";

export const metadata = { title: "커뮤니티" };
export const dynamic = "force-dynamic";
const SEL = "id,category,title,body,pinned,boosted,created_at,board_id,topic,hidden,views,author:users(id,username,nickname,dept,xp,blue_badge)";
const DAY = 86400000;

export default async function BoardPage({ searchParams }: { searchParams: { cat?: string; tab?: string; topic?: string; sort?: string; q?: string; new?: string } }) {
  const s = (await getSession())!;
  const cat = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : "전체";
  const isDept = (DEPTS as readonly string[]).includes(cat);
  const topic = searchParams.topic && TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic : "";
  const fresh = searchParams.new === "1";
  const sort = fresh ? "new" : ["rank", "new", "best"].includes(searchParams.sort ?? "") ? searchParams.sort! : "new";
  const kw = (searchParams.q ?? "").trim().slice(0, 40).replace(/[%,()]/g, " ");
  const tab = isDept ? (searchParams.tab || "") : "";
  const d = db();
  let q = d.from("posts").select(SEL).limit(300).neq("category", "썸").neq("category", "익명");
  if (s.role !== "admin") q = q.eq("hidden", false);
  if (topic) q = q.eq("topic", topic);
  if (cat !== "전체") q = q.eq("category", cat);
  if (kw) q = q.or(`title.ilike.%${kw}%,body.ilike.%${kw}%`);
  if (fresh) q = q.gte("created_at", new Date(Date.now() - DAY).toISOString());
  const nq = d.from("posts").select(SEL).eq("pinned", true).eq("hidden", false).in("category", cat === "전체" || cat === NOTICE_CAT ? [NOTICE_CAT] : [NOTICE_CAT, cat]).order("created_at", { ascending: false }).limit(5);
  const [{ data: raw }, { data: nraw }, leaders, commanders] = await Promise.all([
    q, kw || fresh ? Promise.resolve({ data: [] as any[] }) : nq, deptLeaders(), deptCommanders(),
  ]);
  const noticeIds = new Set((nraw ?? []).map((p: any) => p.id));
  const all = [...(nraw ?? []), ...(raw ?? []).filter((p: any) => !noticeIds.has(p.id))];
  const ids = all.map((p: any) => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids.map(String))]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const r of rc ?? []) nR[(r as any).target_id] = (nR[(r as any).target_id] ?? 0) + 1;
  const deco = (p: any) => ({ ...p, r: rankFor(p.author, leaders), nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0 });
  const score = (p: any) => p.nr * 3 + p.nc * 2 + Math.floor((p.views ?? 0) / 10);
  const isHot = (p: any) => score(p) >= 12 && Date.now() - new Date(p.created_at).getTime() < 3 * DAY;
  const notices = (nraw ?? []).map(deco);
  const posts = (raw ?? []).filter((p: any) => !noticeIds.has(p.id)).map(deco)
    .filter((p: any) => sort !== "best" || Date.now() - new Date(p.created_at).getTime() < 7 * DAY)
    .sort((a: any, b: any) => (Number(b.pinned) - Number(a.pinned)) || (Number(b.boosted) - Number(a.boosted))
      || (sort === "best" ? score(b) - score(a) : 0)
      || (sort === "rank" ? (b.r.index - a.r.index) : 0)
      || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  const nNew = posts.filter((p: any) => Date.now() - new Date(p.created_at).getTime() < DAY).length;
  const leader = isDept ? commanders.find(c => c.dept === cat) : null;
  const canManage = isDept && (s.role === "admin" || leader?.id === s.id);

  const enc = encodeURIComponent;
  const items = boardNavItems(s.dept);
  const here = cat !== "전체" ? `/board?cat=${enc(cat)}` : topic ? `/board?topic=${topic}` : "/board";
  const title = cat === NOTICE_CAT ? "📢 공지사항" : cat !== "전체" ? `${cat} 라운지` : topic ? `${topicOf(topic).icon} ${topicOf(topic).name}` : "✨ 전체글";
  const qs = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ ...(cat !== "전체" ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}), ...(sort !== "new" ? { sort } : {}), ...o }).filter(([, v]) => v)); return `/board${p.toString() ? "?" + p : ""}`; };
  const writeHref = `/board/new?${new URLSearchParams({ ...(cat !== "전체" ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}) })}`;
  const live = await liveCounts("post", posts.map((p: any) => p.id));
  const meta = (p: any) => <>{p.author ? <Name r={p.r} dept={p.author.dept} nickname={p.author.nickname} badge={p.author.blue_badge} /> : <span>탈퇴한 회원</span>}<span>· {fmt(p.created_at)}</span></>;

  const hot = [...posts].filter((p: any) => Date.now() - new Date(p.created_at).getTime() < 7 * DAY && !p.pinned).sort((x: any, y: any) => score(y) - score(x)).slice(0, 6).filter((p: any) => score(p) > 0);
  const tabs: [string, string][] = [["", "전체"], ...TOPICS.map(t => [t.key, t.name] as [string, string])];
  return (
    <div className="cm">
      <Link href="/ssum" className="cm-ssum"><span className="cm-ssum-ico" aria-hidden="true">💘</span><div><b>썸·소개팅</b><small>병원 사람끼리 셀소·번개 · 병원 밖 1:1 소개팅까지</small></div><em aria-hidden="true">›</em></Link>
      <nav className="cm-tabs">{tabs.map(([k, n]) => <Link key={k} href={qs({ topic: k })} className={topic === k ? "on" : ""}>{n}</Link>)}</nav>
      <div className="cm-chips">
        <Link href={qs({ sort: "" })} className={sort === "new" ? "on" : ""}>최신</Link><Link href={qs({ sort: "best" })} className={sort === "best" ? "on" : ""}>인기</Link>
        <Link href="/hospitals">병원 리뷰</Link>
        <QuerySelect label="라운지" value={cat === "전체" ? "" : cat} options={[["", "직종 라운지"], [NOTICE_CAT, "📢 공지"], ...DEPTS.map(x => [x, x] as [string, string])]} hrefs={Object.fromEntries([["", `/board${topic ? `?topic=${topic}` : ""}`], [NOTICE_CAT, `/board?cat=${enc(NOTICE_CAT)}`], ...DEPTS.map(x => [x, `/board?cat=${enc(x)}`])])} />
        <span className="cm-sp" /><BoardSearch cat={cat} q={kw} />
      </div>
      {(cat !== "전체" || kw || fresh) && <div className="cm-ctx">{cat !== "전체" && <b>{cat === NOTICE_CAT ? "📢 공지사항" : `${cat} 라운지`}</b>}{kw && <span>‘{kw}’ 검색 {posts.length}개</span>}{fresh && <span>24시간 새글</span>}<Link href="/board">✕ 해제</Link></div>}
      {!kw && hot.length > 0 && sort !== "best" && <div className="cm-hot">{hot.map((p: any) => <Link key={p.id} href={`/board/${p.id}`} className="cm-hc"><span className="cm-badge">인기</span><b>{p.title}</b><div className="cm-cnt"><span>👍 {p.nr}</span><span>💬 {p.nc}</span><span className="r">👁 {p.views ?? 0}</span></div></Link>)}</div>}
      {notices.length > 0 && <div className="cm-notice">{notices.map((p: any) => <Link key={p.id} href={`/board/${p.id}`}><em>공지</em>{p.title}</Link>)}</div>}
      <div className="cm-list">
        {!posts.length && <div className="empty">{kw ? "검색 결과가 없어요." : fresh ? "최근 24시간 새글이 없어요." : "아직 글이 없어요. 첫 글을 올려보세요."}</div>}
        {posts.map((p: any) => <Link key={p.id} href={`/board/${p.id}`} className={"cm-row" + (p.author && p.r?.tier > 0 ? ` rkb rk${p.r.tier}` : "")}>
          <div className="cm-tags"><span>{topicOf(p.topic).name}</span>{p.category !== "전체" && p.category !== NOTICE_CAT && <span className="g">{p.category}</span>}{isHot(p) && <span className="h">HOT</span>}{p.hidden && <span>🔒 블라인드</span>}</div>
          <h3>{p.title}{(live[p.id] ?? 0) >= 2 && <span className="live-eye sm"><i /> {live[p.id]}명 보는 중</span>}</h3>
          {p.body && <p>{p.body}</p>}
          <div className="cm-by">{p.author ? <><Name r={p.r} dept={p.author.dept} nickname={p.author.nickname} badge={p.author.blue_badge} size={13} /><em className="cm-rk">{p.r.name}</em></> : <span>탈퇴한 회원</span>}</div>
          <div className="cm-cnt"><span>👍 {p.nr}</span><span>💬 {p.nc}</span><span>👁 {p.views ?? 0}</span><span className="r">{ago(p.created_at)}</span></div>
        </Link>)}
      </div>
    </div>
  );
}
