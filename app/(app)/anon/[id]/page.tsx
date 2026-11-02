import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { deletePost, deleteComment } from "@/lib/actions";
import { ANON_CAT, ANON_TOPICS } from "@/lib/depts";
import CommentForm from "@/components/CommentForm";
import CommentThread, { type CItem } from "@/components/CommentThread";
import { rankOf } from "@/lib/ranks";
import Reactions from "@/components/Reactions";
import ReportButton from "@/components/ReportButton";
import Linkify from "@/components/Linkify";
import { memoOnce } from "@/lib/memo";
export const dynamic = "force-dynamic";

/** 글마다 다른 익명 번호: 글쓴이는 '글쓴이', 댓글러는 등장 순서대로 익명1, 익명2… (같은 사람은 같은 번호) */
export default async function AnonPostPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const d = db();
  const { data: p } = await d.from("posts").select("id,title,body,topic,created_at,views,hidden,author_id,category").eq("id", params.id).eq("category", ANON_CAT).maybeSingle();
  if (!p) notFound();
  const admin = s.role === "admin", mine = p.author_id === s.id;
  if (p.hidden && !admin && !mine) return <div className="detail"><Link className="link" href="/anon">← 익명 게시판</Link><div className="empty" style={{ marginTop: 20 }}>🚩 신고가 접수되어 임시로 가려진 글이에요.</div></div>;
  const counted = memoOnce(`pv:${p.id}:${s.id}`, 6 * 3600_000); if (counted) d.rpc("bump_view", { p_id: p.id }).then(() => {}, () => {});
  const { data: comments } = await d.from("comments").select("id,author_id,text,created_at,hidden,parent_id").eq("post_id", p.id).order("created_at").limit(300);
  const cids = (comments ?? []).map(c => String(c.id));
  const [{ data: rxp }, { data: rxc }] = await Promise.all([d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "post").eq("target_id", p.id), cids.length ? d.from("reactions").select("kind,target_id,emoji,user_id").eq("kind", "comment").in("target_id", cids) : Promise.resolve({ data: [] as any[] })]);
  const rx = [...(rxp ?? []), ...(rxc ?? [])];
  const agg = (kind: string, id: string) => { const counts: Record<string, number> = {}; let my: string | null = null; for (const r of rx) if (r.kind === kind && String(r.target_id) === id) { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; if (r.user_id === s.id) my = r.emoji; } return { counts, mine: my }; };
  const order: string[] = []; const label = (uid: string) => { if (uid === p.author_id) return "글쓴이"; let i = order.indexOf(uid); if (i < 0) { order.push(uid); i = order.length - 1; } return `익명${i + 1}`; };
  const COLORS = ["#6E5BB8", "#2E7D6B", "#C2185B", "#F2A900", "#3D7DD8", "#8E3B3B", "#4FB59A", "#7A5B12"];
  const col = (uid: string) => uid === p.author_id ? "#2B2420" : COLORS[Math.max(0, order.indexOf(uid)) % COLORS.length];
  const t = ANON_TOPICS.find(x => x.key === p.topic) ?? ANON_TOPICS[0];
  return (
    <div className="detail pd an-detail">
      <Link className="link" href="/anon">← 익명 게시판</Link>
      <div className="meta" style={{ marginTop: 10 }}>
        <span className="topic-tag">{t.icon} {t.name}</span><span className="an-who">🕶️ 익명</span><span className="time">{fmt(p.created_at)}</span><span className="time">· 조회 {(p.views ?? 0) + (counted ? 1 : 0)}</span>
        {(admin || mine) && <form action={deletePost.bind(null, p.id)}><button className="link">글 삭제</button></form>}
        {!mine && <ReportButton kind="post" id={p.id} />}
        {p.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff" }}>블라인드 중</span>}
      </div>
      <h2>{p.title}</h2>
      <div className="body"><Linkify text={p.body} /></div>
      <Reactions kind="post" id={p.id} {...agg("post", p.id)} />
      <div className="comments-head"><b>댓글 {comments?.length ?? 0}</b><span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>댓글도 익명이에요 · 같은 사람은 같은 번호</span></div>
      <CommentThread postId={p.id} meId={s.id} admin={admin} anon items={(comments ?? []).map((c: any) => { const ag = agg("comment", String(c.id)), who = label(c.author_id); return { id: c.id, author_id: c.author_id, text: c.text, created: fmt(c.created_at), hidden: !!c.hidden, parent_id: c.parent_id ?? null, r: rankOf(0), author: null, label: (who === "글쓴이" ? "✍️ 글쓴이" : `🕶️ ${who}`) + (c.author_id === s.id ? " (나)" : ""), labelColor: col(c.author_id), counts: ag.counts, mine: ag.mine } as CItem; })} />
      <CommentForm postId={p.id} />
      <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>익명이어도 실명·병원명·비방은 신고 대상이에요. 신고가 쌓이면 임시 블라인드되고, 운영팀이 확인해요.</div>
    </div>
  );
}
