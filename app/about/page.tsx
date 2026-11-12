import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HospMarquee from "@/components/HospMarquee";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "메디화이트 소개 — 이직 전에 그 병원 실수령 확인하는 곳" } };

/** 소개 랜딩 — 밝은 톤. 숫자는 실제 집계만, 후기 예시는 '예시'로 표시 (지어낸 통계·후기를 진짜처럼 쓰지 않아요) */
const FACTS = [
  { ico: "🛡️", c: "g", t: "계약직 정규직 전환율", d: "“전환 가능”이라 쓰고 2년 만기퇴사 시키는 희망고문 병원을 구별해요." },
  { ico: "💰", c: "y", t: "통장 실수령 & 상여금", d: "‘내규에 따름’ 뒤에 숨겨진 직종·연차별 세후 실수령 팩트." },
  { ico: "⏰", c: "b", t: "실제 퇴근시간 & 분위기", d: "공고는 6시 칼퇴, 실제 오버타임·차팅·인계·당직 분위기까지." },
];
const PILLARS = [
  { n: "1st", t: "익명 보장", d: "실명이나 전화번호 없이 [직종]닉네임으로만 활동해요. 환자·개인을 특정하는 글은 금지예요." },
  { n: "2nd", t: "사실 기반 팩트 체크", d: "비방이 아니라 실제 통장 실수령과 고용 조건 중심의 제보만 모아요." },
  { n: "3rd", t: "안전한 인증 서류 관리", d: "재직 인증 사진은 확인 즉시 삭제하고, 심사가 늦어져도 30일 안에 완전히 지워요." },
];
export default async function AboutPage() {
  const s = await getSession(); const d = db();
  const [{ count: nH }, { count: nF }, { count: nR }] = await Promise.all([
    d.from("hospitals").select("id", { count: "exact", head: true }),
    d.from("game_state").select("user_id", { count: "exact", head: true }).or("game.like.hfact:%,game.like.hx:%"),
    d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("hidden", false)]);
  const join = "/login?mode=signup", find = s ? "/hospitals" : "/#find", tips = (nF ?? 0) + (nR ?? 0);
  return (
    <div className="lp">
      <header className="lp-nav"><Link href="/" className="lp-brand" aria-label="메디화이트 홈"><BrandLogo /></Link>{s ? <Link href="/home" className="lp-login">홈으로</Link> : <Link href="/login" className="lp-login">로그인 · 가입</Link>}</header>
      <section className="lp-hero">
        <h1>병원 이직 전,<br />채용공고 뒤에 숨은 <em>실체</em>를 확인하세요</h1>
        <div className="lp-badges">
          <div className="lp-badge"><span aria-hidden="true">🛡️</span><div><b>익명 보장</b><small>실명·전화번호 수집 0%</small></div></div>
          <div className="lp-badge"><span aria-hidden="true">📊</span><div><b>공고에 없는 팩트 데이터</b><small>체감 정규직 전환율 & 세후 실수령</small></div></div>
        </div>
        <p>공고에는 없는 계약직 전환율, 세후 실수령, 실제 퇴근 시간까지. 다녀본 선배들의 진짜 병원 데이터를 클릭 한 번에 확인하세요. 전국 어느 병원이든 검색하고 제보할 수 있어요.</p>
        <Link href={find} className="lp-cta">🏥 궁금한 병원 검색하기 →</Link>
      </section>

      <HospMarquee />

      <section className="lp-sec"><h2>공고에는 절대 안 나오는 3가지</h2>
        <div className="lp-facts">{FACTS.map(f => <div key={f.t} className="lp-card"><span className={"lp-ico " + f.c} aria-hidden="true">{f.ico}</span><h3>{f.t}</h3><p>{f.d}</p></div>)}</div>
      </section>

      <section className="lp-sec">
        <span className="lp-count"><i aria-hidden="true" />지금 병원 {(nH ?? 0).toLocaleString()}곳 등록 · 제보 {tips.toLocaleString()}건 (실시간 집계)</span>
        <figure className="lp-quote"><span className="lp-ex">이런 제보가 올라와요 · 예시</span>
          <blockquote>“공고엔 정규직 전환 가능이라고 해서 들어왔는데, 선배들이 전부 2년 만기퇴사였어요.”</blockquote>
          <figcaption><b>방사선사 · 현직</b><span className="lp-chip">🚨 0% 만기퇴사</span></figcaption></figure>
      </section>

      <section className="lp-sec"><h2>안심하고 쓸 수 있게, 3가지 원칙</h2>
        <div className="lp-pillars">{PILLARS.map(p => <div key={p.n} className="lp-pillar"><em>{p.n}</em><h3>{p.t}</h3><p>{p.d}</p></div>)}</div>
      </section>

      <section className="lp-end"><h2>지원서 넣기 전에, 먼저 확인하세요</h2>
        <div className="lp-end-b"><Link href={find} className="lp-cta">🏥 궁금한 병원 검색하기 →</Link>{!s && <Link href={join} className="lp-cta line">30초 가입하기</Link>}</div>
        <div className="lp-biz"><b>병원·채용 담당자이신가요?</b> 채용 공고 게재, 제휴·광고 문의를 받고 있어요. <Link href="/contact">문의하기 ›</Link></div>
      </section>
      <footer className="lp-foot"><Link href="/rules">커뮤니티 규칙</Link><Link href="/terms">이용약관</Link><Link href="/privacy"><b>개인정보처리방침</b></Link><Link href="/contact">문의</Link><span>© 메디화이트</span></footer>
    </div>
  );
}
