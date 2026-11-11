import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { topicOf } from "@/lib/depts";
export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "메디화이트 소개 — 이직 전에 그 병원 실수령 확인하는 곳" } };

export default async function AboutPage() {
  const s = await getSession();
  const d = db(), week = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recent } = await d.from("posts").select("id,title,topic,category,created_at,pinned,author:users(nickname,dept)").eq("hidden", false).neq("category", "썸").gte("created_at", week).order("created_at", { ascending: false }).limit(120);
  const ids = (recent ?? []).map(p => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids)]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const r of rc ?? []) nR[(r as any).target_id] = (nR[(r as any).target_id] ?? 0) + 1;
  const posts = (recent ?? []).map((p: any) => ({ ...p, nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0, score: (nR[p.id] ?? 0) * 3 + (nC[p.id] ?? 0) * 2 }));
  const hot = [...posts].filter(p => !p.pinned).sort((a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const info = posts.filter(p => ["hospital", "pay"].includes(p.topic)).slice(0, 5);
  const Row = ({ p }: { p: any }) => <Link href={`/board/${p.id}`} className="mainlive-row"><span className="mainlive-topic">{topicOf(p.topic).icon}</span><span className="mainlive-title">{p.title}</span><span className="mainlive-meta">{p.author ? `[${p.author.dept}]` : ""} · 💬{p.nc} 👍{p.nr}</span></Link>;
  const join = "/login?mode=signup";
  return (
    <div className="about">
      <section className="about-hero">
        <div className="about-hero-in">
          <div className="about-kicker">병원 직원 익명 커뮤니티</div>
          <h1>메디화이트</h1>
          <p><b>병원 사람들의 진짜 이야기.</b><br />공고에 없는 세후 실수령과 병원 분위기, 정규직 전환 실태까지.</p>
          <div className="about-btns">
            {s ? <Link className="about-btn" href="/hospitals">병원 리뷰 보러 가기</Link> : <><Link className="about-btn" href={join}>30초 가입하고 시작하기</Link><Link className="about-btn line" href="/login">이미 회원이에요</Link></>}
          </div>
          <div className="about-safe">🔒 실명·전화번호 없이 익명 · 병원에서 일하는 사람들의 커뮤니티</div>
        </div>
      </section>

      <section className="about-grid">
        <div className="about-card"><div className="about-ico">🛡️</div><h3>2년 뒤, 정규직 될까?</h3><p>계약직 → 정규직 전환이 실제로 얼마나 되는지, 다녀본 사람이 직종별로 알려줘요. 병원마다 고용안정성 신호등으로 보여요.</p></div>
        <div className="about-card"><div className="about-ico">💰</div><h3>통장에 진짜 얼마 찍힐까?</h3><p>“내규에 따름” 뒤에 숨은 세후 실수령을 직종·연차별로 확인하세요. 연봉만 넣으면 실수령이 계산돼요.</p></div>
        <div className="about-card"><div className="about-ico">⏰</div><h3>진짜 몇 시에 퇴근할까?</h3><p>실제 퇴근 시간, 오버타임 수당, 인계와 잡무, 병원 분위기까지. 입사해야만 아는 것들을 미리 봐요.</p></div>
        <div className="about-card"><div className="about-ico">🔒</div><h3>익명으로, 안전하게</h3><p>실명 대신 [직종]닉네임. 이메일·전화번호를 받지 않아요. 환자 정보는 금지, 신고된 글은 바로 가려져요.</p></div>
      </section>

      <section className="mainlive about-live">
        <div className="mainlive-col">
          <h2>지금 많이 보는 글</h2>
          {hot.length ? hot.map(p => <Row key={p.id} p={p} />) : <div className="mainlive-empty">이번 주 첫 글을 기다리고 있어요.</div>}
        </div>
        <div className="mainlive-col">
          <h2>병원 리뷰 · 급여 이야기</h2>
          {info.length ? info.map(p => <Row key={p.id} p={p} />) : <div className="mainlive-empty">병원 분위기·복지·급여 이야기가 모이는 곳이에요.</div>}
          <Link href={s ? "/hospitals" : join} className="mainlive-more">병원 리뷰 보러 가기 →</Link>
        </div>
      </section>

      <section className="about-biz">
        <div><b>병원·채용 담당자이신가요?</b><div className="muted">채용 공고 게재, 제휴·광고 문의를 받고 있어요.</div></div>
        <Link className="about-btn line sm" href="/contact">문의하기</Link>
      </section>

      <section className="about-cta">
        {s ? <Link className="about-btn" href="/hospitals">병원 리뷰 보러 가기</Link> : <Link className="about-btn" href={join}>30초 가입하고 시작하기</Link>}
        <div className="about-count" style={{ marginTop: 12 }}>다녀본 병원 1곳만 알려주면 모든 병원이 열려요 · <Link href="/rules" style={{ color: "#93A59E" }}>커뮤니티 규칙</Link></div>
      </section>
    </div>
  );
}
