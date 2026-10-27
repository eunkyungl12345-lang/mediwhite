import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { RANKS } from "@/lib/ranks";
import Insignia from "@/components/Insignia";
export const dynamic = "force-dynamic";
export const metadata = { title: "소개" };

export default async function AboutPage() {
  const s = await getSession();
  const { count } = await db().from("users").select("id", { count: "exact", head: true }).eq("stealth", false);
  const n = count ?? 0;
  return (
    <div className="about">
      <section className="about-hero">
        <div className="about-hero-in">
          <div className="about-kicker">병원 직원 라운지</div>
          <h1>메디화이트웹</h1>
          <p>퇴근하고, 당직 서다, 점심시간에 — 심심할 때 들어와서 노는 곳.<br />채팅하고, 글 쓰고, 게임하면 계급이 올라가요.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            {s ? <Link className="btn" href="/board">라운지로 들어가기</Link> : <><Link className="btn" href="/login">가입하고 입장</Link><Link className="btn ghost about-ghost" href="/login">이미 회원이에요</Link></>}
          </div>
          <div className="about-count">지금 {n}명 입대 · 빨리 가입할수록 보너스 경험치가 커요</div>
        </div>
      </section>

      <section className="about-grid">
        <div className="about-card"><div className="about-ico">💬</div><h3>실시간 채팅</h3><p>어느 화면에서든 하단에 항상 켜져 있어요. 채팅만 해도 경험치가 쌓여요.</p></div>
        <div className="about-card"><div className="about-ico">🎖️</div><h3>군대 계급</h3><p>이병에서 참모총장까지 18단계. 글 앞에 계급장이 붙고, 높을수록 글이 위로 올라가고 빛나요. 파트별 참모총장은 단 한 명.</p></div>
        <div className="about-card"><div className="about-ico">🏥</div><h3>파트별 게시판</h3><p>의사·총괄·방사선·물리치료·임상병리·응급구조·간호·원무. 파트 리더가 탭을 만들어 파트를 꾸려가요.</p></div>
        <div className="about-card"><div className="about-ico">🎮</div><h3>미니게임</h3><p>총알 피하기, 검 강화하기, 병동 사수 디펜스, 커피 룰렛. 기록은 명예의 전당에, 퀘스트는 경험치로.</p></div>
        <div className="about-card"><div className="about-ico">🏆</div><h3>파트 응원전</h3><p>파트에 응원 포인트를 모으면 1위 파트 글이 대표 파트 탭에 상위노출돼요. 파트 대항전의 시작.</p></div>
        <div className="about-card"><div className="about-ico">🔒</div><h3>직원끼리만</h3><p>실명 대신 [직종]닉네임. 이메일·전화번호 안 받아요. 환자 정보는 금지, 19금·욕설은 훈련병 강등.</p></div>
      </section>

      <section className="about-ranks">
        <h2>계급장</h2>
        <div className="about-rank-row">{RANKS.map(([name], i) => <div key={name} className="about-rank"><Insignia index={i} size={22} /><span>{name}</span></div>)}</div>
        <p className="muted">훈련병(강등) → 병사 4단계 → 부사관 4단계 → 위관 3단계 → 영관 3단계 → 장성 4단계. 하루 열심히 하면 약 100 XP: 일병 하루, 하사 열흘, 소위 한 달 반, 소령 넉 달, 참모총장 1년 반.</p>
      </section>

      <section className="about-cta">
        {s ? <Link className="btn" href="/board">라운지로</Link> : <Link className="btn" href="/login">지금 입대하기</Link>}
        <div className="muted" style={{ marginTop: 10 }}>협업 · 광고 · 문의 → <Link href="/contact">문의 페이지</Link></div>
      </section>
    </div>
  );
}
