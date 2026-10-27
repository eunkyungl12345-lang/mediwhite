import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { RANKS } from "@/lib/ranks";
import { topicOf, display } from "@/lib/depts";
import Insignia from "@/components/Insignia";
import { fmt } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "메디화이트웹 — 병원 사람들의 익명 라운지" };

export default async function AboutPage() {
  const s = await getSession();
  const d = db(), week = new Date(Date.now() - 7 * 86400000).toISOString(), today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const [{ count }, { data: recent }, { data: promos }, { count: todayPosts }, { data: visits }] = await Promise.all([
    d.from("users").select("id", { count: "exact", head: true }).eq("stealth", false),
    d.from("posts").select("id,title,topic,category,created_at,pinned,author:users(nickname,dept)").eq("hidden", false).gte("created_at", week).order("created_at", { ascending: false }).limit(120),
    d.from("events").select("text,created_at").eq("kind", "promotion").gte("created_at", week).order("created_at", { ascending: false }).limit(5),
    d.from("posts").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    d.from("visits").select("user_id").eq("day", today),
  ]);
  const ids = (recent ?? []).map(p => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids)]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const r of rc ?? []) nR[(r as any).target_id] = (nR[(r as any).target_id] ?? 0) + 1;
  const posts = (recent ?? []).map((p: any) => ({ ...p, nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0, score: (nR[p.id] ?? 0) * 3 + (nC[p.id] ?? 0) * 2 }));
  const hot = [...posts].filter(p => !p.pinned).sort((a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const info = posts.filter(p => ["hospital", "pay"].includes(p.topic)).slice(0, 5);
  const items = posts.filter(p => p.topic === "item").slice(0, 4);
  const n = count ?? 0, online = new Set((visits ?? []).map((v: any) => v.user_id)).size;
  const href = (id: string) => `/board/${id}`;
  const Row = ({ p }: { p: any }) => <Link href={href(p.id)} className="mainlive-row"><span className="mainlive-topic">{topicOf(p.topic).icon}</span><span className="mainlive-title">{p.title}</span><span className="mainlive-meta">{p.author ? `[${p.author.dept}]` : ""} · 💬{p.nc} 👍{p.nr}</span></Link>;
  return (
    <div className="about">
      <section className="about-hero">
        <div className="about-hero-in">
          <div className="about-kicker">의료계 익명 커뮤니티</div>
          <h1>메디화이트웹</h1>
          <p><b>병원 사람들의 진짜 이야기.</b><br />익명 라운지 · 병원 리뷰 · 급여·연봉 · 제품 후기 · 채용 — 그리고 계급과 게임.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            {s ? <Link className="btn" href="/board">라운지로 들어가기</Link> : <><Link className="btn" href="/login">가입하고 입장</Link><Link className="btn ghost about-ghost" href="/login">이미 회원이에요</Link></>}
          </div>
          <div className="about-stats"><span><b>{n}</b>명 회원</span><span><b>{online}</b>명 오늘 접속</span><span><b>{todayPosts ?? 0}</b>개 24시간 새 글</span></div>
        </div>
      </section>

      <section className="mainlive">
        <div className="mainlive-col">
          <h2>🔥 지금 핫한 글</h2>
          {hot.length ? hot.map(p => <Row key={p.id} p={p} />) : <div className="mainlive-empty">이번 주 첫 핫한 글의 주인공이 되어보세요.</div>}
        </div>
        <div className="mainlive-col">
          <h2>🏥 병원 리뷰 · 💰 급여·연봉</h2>
          {info.length ? info.map(p => <Row key={p.id} p={p} />) : <div className="mainlive-empty">병원 분위기·복지·급여 이야기가 모이는 곳. 첫 글을 기다려요.</div>}
          <Link href={s ? "/board?topic=hospital" : "/login"} className="mainlive-more">리뷰 보러 가기 →</Link>
        </div>
        <div className="mainlive-col">
          <h2>🧤 제품 후기</h2>
          {items.length ? items.map(p => <Row key={p.id} p={p} />) : <div className="mainlive-empty">발 안 아픈 간호화, 야간 간식, 손 안 트는 핸드크림… 직접 써본 사람의 솔직 후기.</div>}
          <Link href={s ? "/board?topic=item" : "/login"} className="mainlive-more">후기 보러 가기 →</Link>
        </div>
        <div className="mainlive-col">
          <h2>🎖️ 이번 주 진급</h2>
          {promos?.length ? promos.map((e, i) => <div key={i} className="mainlive-row static"><span className="mainlive-topic">🎉</span><span className="mainlive-title">{e.text.split("|")[0]}</span><span className="mainlive-meta">{fmt(e.created_at)}</span></div>) : <div className="mainlive-empty">채팅·글·게임으로 경험치를 모으면 진급해요.</div>}
        </div>
      </section>

      <section className="about-grid">
        <div className="about-card"><div className="about-ico">🔒</div><h3>익명, 직원끼리만</h3><p>실명 대신 [직종]닉네임. 이메일·전화번호 안 받아요. 환자 정보 금지, 신고 시 즉시 임시조치.</p></div>
        <div className="about-card"><div className="about-ico">🏥</div><h3>직종 × 주제</h3><p>의사·간호사·간호조무사·방사선·물리치료·임상병리·응급구조·원무·총괄 — 자유·일상·병원 리뷰·급여·공부·정보·이직·채용·제품 후기.</p></div>
        <div className="about-card"><div className="about-ico">🎖️</div><h3>참여하면 진급</h3><p>훈련병부터 참모총장까지 19계급. 글 앞에 계급장이 붙고, 높을수록 글이 위로 올라가요. 파트별 참모총장은 단 한 명.</p></div>
        <div className="about-card"><div className="about-ico">🎮</div><h3>매일 들어올 이유</h3><p>우리 병원 키우기(접속 안 해도 돈이 쌓여요), 병동 사수, 번개 모드 등 12가지 게임 · 오늘의 퀘스트 · 실시간 채팅.</p></div>
      </section>

      <section className="about-ranks">
        <h2>계급장</h2>
        <div className="about-rank-row">{RANKS.map(([name], i) => <div key={name} className="about-rank"><Insignia index={i} size={22} /><span>{name}</span></div>)}</div>
      </section>

      <section className="about-biz">
        <div><b>병원·채용 담당자이신가요?</b><div className="muted">채용 공고 게재, 제휴·광고 문의를 받고 있어요.</div></div>
        <Link className="btn ghost about-ghost" href="/contact">문의하기</Link>
      </section>

      <section className="about-cta">
        {s ? <Link className="btn" href="/board">라운지로</Link> : <Link className="btn" href="/login">지금 입대하기</Link>}
        <div className="about-count" style={{ marginTop: 10 }}>빨리 가입할수록 보너스 경험치가 커요 · <Link href="/rules" style={{ color: "#93A59E" }}>커뮤니티 규칙</Link></div>
      </section>
    </div>
  );
}
