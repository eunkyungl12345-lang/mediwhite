import Link from "next/link";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { togglePin, deletePost, deleteComment, boostPost } from "@/lib/actions";
import { boostInfo, BOOST_MAX } from "@/lib/boost";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { can } from "@/lib/ranks";
import Name from "@/components/Name";
import CommentForm from "@/components/CommentForm";
import CommentThread, { type CItem } from "@/components/CommentThread";
import Reactions from "@/components/Reactions";
export async function generateMetadata({ params }: { params: { id: string } }) { if (!/^[0-9a-f-]{36}$/i.test(params.id)) return { title: "커뮤니티" }; const { data } = await db().from("posts").select("title").eq("id", params.id).maybeSingle(); return { title: data?.title ? `${data.title} — 커뮤니티` : "커뮤니티" }; }
import { topicOf } from "@/lib/depts";
import ReportButton from "@/components/ReportButton";
import Linkify from "@/components/Linkify";
import LiveViewers from "@/components/LiveViewers";
import { memoOnce } from "@/lib/memo";
export const dynamic = "force-dynamic";

export default async function PostPage({ params, searchParams }: { params: { id: string }; searchParams: { bm?: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const s = (await getSession())!;
  const d = db();
  const [{ data: p }, leaders, { data: me }] = await Promise.all([
    d.from("posts").select("*,author:users(id,username,nickname,dept,xp,blue_badge),board:boards(name)").eq("id", params.id).maybeSingle(), deptLeaders(),
    d.from("users").select("id,dept,xp").eq("id", s.id).maybeSingle(),
  ]);
  if (!p) notFound();
  if (p.category === "익명" || p.category === "썸") redirect(`/anon/${p.id}`); // 🕶️ 썸 글도 완전 익명 화면으로
  const { data: comments } = await d.from("comments").select("id,author_id,dept,text,created_at,hidden,parent_id,author:users(id,username,nickname,dept,xp,blue_badge)").eq("post_id", p.id).order("created_at").limit(300);
  const cids = (comments ?? []).map(c => String(c.id));
  const [{ data: rxp }, { data: rxc }] = await Promise.all([d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "post").eq("target_id", p.id), cids.length ? d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "comment").in("target_id", cids) : Promise.resolve({ data: [] as any[] })]);
  const rx = [...(rxp ?? []), ...(rxc ?? [])];
  const agg = (kind: string, id: string) => { const counts: Record<string, number> = {}; let mine: string | null = null; for (const r of rx ?? []) if (r.kind === kind && String(r.target_id) === id) { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; if (r.user_id === s.id) mine = r.emoji; } return { counts, mine }; };
  const admin = s.role === "admin", mine = p.author_id === s.id;
  const bi = mine ? await boostInfo(s.id, p.id) : { n: 0, at: null }, bLeft = Math.max(0, BOOST_MAX - bi.n), bWait = !!bi.at && Date.now() - new Date(bi.at).getTime() < 24 * 3600e3;
  if (p.hidden && !admin && !mine) return <div className="detail"><Link className="link" href="/board">← 게시판</Link><div className="empty" style={{ marginTop: 20 }}>🚩 신고가 접수되어 임시로 가려진 글이에요.<br /><span className="muted">운영팀 확인 후 복구되거나 삭제돼요 (최대 30일).</span></div></div>;
  const counted = memoOnce(`pv:${p.id}:${s.id}`, 6 * 3600_000);
  if (counted) d.rpc("bump_view", { p_id: p.id }).then(() => {}, () => {});
  const r = rankFor((p as any).author, leaders), myR = rankFor(me, leaders);
  const a = (p as any).author;
  return (
    <div className={`detail pd t${r.tier}`}>
      <Link className="link" href={p.category === "썸" ? "/ssum" : `/board?cat=${encodeURIComponent(p.category)}${p.board_id ? `&tab=${p.board_id}` : ""}`}>← {p.category}{(p as any).board?.name ? ` › ${(p as any).board.name}` : ""}</Link>
      <div className="meta" style={{ marginTop: 10 }}>
        {p.pinned && <span className="pin">📌 공지</span>}{p.boosted && !p.pinned && <span className="pin">⬆ 밀어올림</span>}{!p.pinned && <span className="tag">{p.category}</span>}<Link href={`/board?topic=${(p as any).topic ?? "free"}`} className="topic-tag">{topicOf((p as any).topic).icon} {topicOf((p as any).topic).name}</Link>
        <span className="time">{fmt(p.created_at)}</span><LiveViewers kind="post" id={p.id} /><span className="time">· 조회 {((p as any).views ?? 0) + (counted ? 1 : 0)}</span>
        {p.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff" }}>블라인드 중</span>}
      </div>
      <h2>{p.title}</h2>
      <div className={"pd-by" + (a && r.tier > 0 ? ` rkb rk${r.tier}` : "")}>{a ? <><Name r={r} dept={a.dept} nickname={a.nickname} username={a.username} badge={a.blue_badge} size={16} /><em className="cm-rk">{r.name}</em></> : <span>탈퇴한 회원</span>}</div>
      <div className="body"><Linkify text={p.body} /></div>
      {mine && searchParams.bm && <div className="bm-msg" style={{ margin: "8px 0", fontSize: 13, padding: "8px 12px", borderRadius: 10, background: searchParams.bm === "ok" ? "#E8F7F0" : "#FFF4E5", color: searchParams.bm === "ok" ? "#12805B" : "#8A5A00" }}>{searchParams.bm === "ok" ? `⬆ 밀어올렸어요! 남은 횟수 ${bLeft}/${BOOST_MAX}회 · 다음은 24시간 뒤에 가능해요` : searchParams.bm === "cd" ? "⏳ 내일 다시 끌어올릴 수 있어요 (한 번 올리면 24시간 쿨타임)" : `이 글은 밀어올리기 ${BOOST_MAX}회를 다 썼어요`}</div>}
      <div className="pd-acts">
        {admin && <form action={togglePin.bind(null, p.id, !p.pinned)}><button className="link">{p.pinned ? "고정 해제" : "상단 고정"}</button></form>}
        {mine && (p.boosted ? <form action={boostPost.bind(null, p.id, false)}><button className="link">밀어올리기 해제</button></form>
          : bLeft > 0 ? <form action={boostPost.bind(null, p.id, true)}><button className="link" disabled={bWait}>{bWait ? "⏳ 내일 다시 끌어올릴 수 있어요" : `⬆ 밀어올리기 (${bLeft}/${BOOST_MAX}회)`}</button></form>
          : <span className="muted" style={{ fontSize: 13 }}>밀어올리기 3회를 다 썼어요</span>)}
        {(admin || mine) && <Link href={`/board/${p.id}/edit`} className="link">✏️ 글 수정</Link>}
        {(admin || mine) && <form action={deletePost.bind(null, p.id)}><ConfirmSubmit msg="이 글을 삭제할까요? 되돌릴 수 없어요.">🗑️ 글 삭제</ConfirmSubmit></form>}
        {!mine && <ReportButton kind="post" id={p.id} />}
      </div>
      <Reactions kind="post" id={p.id} {...agg("post", p.id)} />
      <div className="comments-head"><b>댓글 {comments?.length ?? 0}</b></div>
      <CommentThread postId={p.id} meId={s.id} admin={admin} items={(comments ?? []).map((c: any) => { const ag = agg("comment", String(c.id)); return { id: c.id, author_id: c.author_id, text: c.text, created: fmt(c.created_at), hidden: !!c.hidden, parent_id: c.parent_id ?? null, r: rankFor(c.author, leaders), author: c.author ? { dept: c.author.dept, nickname: c.author.nickname, username: c.author.username, blue_badge: c.author.blue_badge } : null, counts: ag.counts, mine: ag.mine } as CItem; })} />
      <CommentForm postId={p.id} />
    </div>
  );
}
