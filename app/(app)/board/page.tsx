import Link from "next/link";
import { guidesForDept, GUIDES } from "@/lib/deptGuides";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT, DEPTS } from "@/lib/depts";
import { TOPICS, topicOf } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import Name from "@/components/Name";
import { CafeHeader, NoticeFold, CafeBottom, QuerySelect, type NavItem } from "@/components/CafeNav";
import BoardSearch from "@/components/BoardSearch";

export const dynamic = "force-dynamic";
const SEL = "id,category,title,body,pinned,boosted,created_at,board_id,topic,hidden,views,author:users(id,username,nickname,dept,xp,blue_badge)";
const DAY = 86400000;

export default async function BoardPage({ searchParams }: { searchParams: { cat?: string; tab?: string; topic?: string; sort?: string; q?: string; new?: string } }) {
  const s = (await getSession())!;
  const cat = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : "전체";
  const isDept = (DEPTS as readonly string[]).includes(cat);
  const topic = searchParams.topic && TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic : "";
  const fresh = searchParams.new === "1";
  const sort = fresh ? "new" : ["rank", "new", "best"].includes(searchParams.sort ?? "") ? searchParams.sort! : "rank";
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
  const items: NavItem[] = [
    { href: "/board", name: "전체글", icon: "✨", group: "게시판" },
    { href: `/board?cat=${enc(NOTICE_CAT)}`, name: "공지사항", icon: "📢", group: "게시판" },
    { href: "/anon", name: "익명 게시판", icon: "🕶️", group: "게시판" },
    { href: "/jobs", name: "채용공고", icon: "💼", group: "게시판" },
    { href: "/hospitals", name: "병원 리뷰", icon: "🏥", group: "게시판" },
    ...[s.dept, ...DEPTS.filter(x => x !== s.dept)].filter(x => (DEPTS as readonly string[]).includes(x)).map(x => ({ href: `/board?cat=${enc(x)}`, name: `${x} 라운지`, icon: x === s.dept ? "🏷️" : "🏥", group: "직종 라운지" })),
    ...TOPICS.map(t => ({ href: `/board?topic=${t.key}`, name: t.name, icon: t.icon, group: "주제별" })),
    { href: "/guide/xray", name: "방사선 촬영법", icon: "📖", group: "실무 가이드" },
    ...GUIDES.map(g => ({ href: `/guide/${g.slug}`, name: g.title.replace(" 가이드", ""), icon: g.icon, group: "실무 가이드" })),
    { href: "/ssum", name: "썸", icon: "💘", group: "커뮤니티" }, { href: "/food", name: "맛집", icon: "🍽️", group: "커뮤니티" },
    { href: "/news", name: "오늘의 핫뉴스", icon: "📰", group: "커뮤니티" }, { href: "/games", name: "게임", icon: "🎮", group: "커뮤니티" },
  ];
  const here = cat !== "전체" ? `/board?cat=${enc(cat)}` : topic ? `/board?topic=${topic}` : "/board";
  const title = cat === NOTICE_CAT ? "📢 공지사항" : cat !== "전체" ? `${cat} 라운지` : topic ? `${topicOf(topic).icon} ${topicOf(topic).name}` : "✨ 전체글";
  const qs = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ ...(cat !== "전체" ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}), ...(sort !== "rank" ? { sort } : {}), ...o }).filter(([, v]) => v)); return `/board${p.toString() ? "?" + p : ""}`; };
  const writeHref = `/board/new?${new URLSearchParams({ ...(cat !== "전체" ? { cat } : {}), ...(tab ? { tab } : {}), ...(topic ? { topic } : {}) })}`;
  const meta = (p: any) => <>{p.author ? <Name r={p.r} dept={p.author.dept} nickname={p.author.nickname} badge={p.author.blue_badge} /> : <span>탈퇴한 회원</span>}<span>· {fmt(p.created_at)}</span></>;

  return (
    <div className="cafe">
      <CafeHeader title={title} here={here} items={items} me={<><b>{s.nickname}</b><span className="muted"> · {s.dept}</span></>} />
      {guidesForDept(cat).map(g => <Link key={g.href} href={g.href} className="xg-promo"><span>{g.icon}</span><div><b>{g.title}</b><small>{g.blurb}</small></div><span>›</span></Link>)}
      <div className="cf-info">
        <span>{kw ? <>‘{kw}’ 검색 <b>{posts.length}</b> · <Link href={qs({ q: "" })}>해제</Link></> : fresh ? <>24시간 새글 <b>{posts.length}</b> · <Link href={qs({})}>전체 보기</Link></> : <>새글 <b className="cf-red">{nNew}</b>/{posts.length.toLocaleString()}</>}</span>
        <QuerySelect label="말머리" value={topic} options={[["", "말머리 전체"], ...TOPICS.map(t => [t.key, `${t.icon} ${t.name}`] as [string, string])]} hrefs={Object.fromEntries([["", qs({ topic: "" })], ...TOPICS.map(t => [t.key, qs({ topic: t.key })])])} />
        <BoardSearch cat={cat} q={kw} />
        <QuerySelect label="정렬" value={sort} options={[["rank", "계급순"], ["new", "최신순"], ["best", "인기순"]]} hrefs={{ rank: qs({ sort: "" }), new: qs({ sort: "new" }), best: qs({ sort: "best" }) }} />
      </div>
      <NoticeFold count={notices.length}>
        {notices.map((p: any) => <Link key={p.id} href={`/board/${p.id}`} className="cf-nrow"><span className="cf-nb">공지</span><div><b>{p.title}</b><small>{meta(p)}<span>· 조회 {p.views ?? 0}</span></small></div><span className="cf-bub">{p.nc}</span></Link>)}
      </NoticeFold>
      <div className="posts">
        {!posts.length && <div className="empty">{kw ? "검색 결과가 없어요." : fresh ? "최근 24시간 새글이 없어요." : cat === "전체" ? "아직 글이 없어요. 첫 글을 올려보세요." : `${cat} 칸에 아직 글이 없어요.`}</div>}
        {posts.map((p: any) => (
          <Link key={p.id} href={`/board/${p.id}`} className={`post cf-post t${p.r.tier}${p.pinned ? " pinned" : ""}`}>
            <div className="post-top">{isHot(p) && <span className="cf-hot">HOT</span>}{p.pinned ? <span className="pin">📌 공지</span> : <span className="topic-tag">{topicOf(p.topic).icon} {topicOf(p.topic).name}</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}{cat === "전체" && !p.pinned && p.category !== NOTICE_CAT && <span className="bd-cat">{p.category}</span>}{p.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff" }}>블라인드</span>}{Date.now() - new Date(p.created_at).getTime() < DAY && <span className="cf-n">N</span>}</div>
            <h3>{p.title}</h3>
            {p.body && <p>{p.body}</p>}
            <div className="post-meta">{meta(p)}</div>
            <div className="cf-cnt"><span>♡ {p.nr}</span><span>💬 {p.nc}</span><span>👁 {p.views ?? 0}</span></div>
          </Link>
        ))}
      </div>
      <CafeBottom writeHref={writeHref} newHref={qs({ new: "1", sort: "" })} cat={cat} q={kw} newCount={(raw ?? []).filter((p: any) => !p.hidden && Date.now() - Date.parse(p.created_at) < DAY).length} />
    </div>
  );
}
