import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { db } from "@/lib/supabase";
import { openExtJobs, isG3, extTags, EXT_SRC, splitArea, extCheckedLabel } from "@/lib/extJobs";
import PosBadges from "@/components/jobs/PosBadges";
import { tagLabel } from "@/lib/jobTags";
import { dday } from "@/lib/jobs";
import OpenPromo from "@/components/OpenPromo";
import PayCalc from "@/components/jobs/PayCalc";
/** 🌐 로그인 없이 보는 첫 화면 — 강남 3구 상근 공고 · 병원 검색 · 공고 목록. 지원·리뷰 자세히는 로그인 */
const DL: Record<string, string> = { 간호: "간호사", 간호조무사: "간호조무사", 방사선: "방사선사", 물리치료: "물리치료사", 임상병리: "임상병리사", 원무: "원무" };
export default async function PublicHome({ q, c, k, g3 }: { q?: string; c?: string; k?: string; g3?: boolean }) {
  const d = db(), kw = (q ?? "").trim().slice(0, 30);
  const [{ data: hs }, { data: jobs }] = await Promise.all([
    kw ? d.from("hospitals").select("id,name,region,kind").ilike("name", `%${kw}%`).limit(12) : Promise.resolve({ data: [] as any[] }),
    d.from("jobs").select("id,hospital,region,dept,emp_type,deadline,closed,welfare,author:users!jobs_author_id_fkey(username)").eq("hidden", false).eq("closed", false).order("created_at", { ascending: false }).limit(40)]);
  const CONDS = ["야간진료없음", "토요휴무", "연차별도", "조기퇴근", "인센티브", "잡무없음"];
  const all = openExtJobs(), kinds = Object.keys(DL).filter(x => all.some(e => e.k === x)), ek = kinds.includes(k ?? "") ? k! : "";
  const qs = (o: Record<string, string>) => { const u = new URLSearchParams(Object.entries({ k: ek, c: c ?? "", g3: g3 ? "1" : "", ...o }).filter(([, v]) => v)); return `/${u.toString() ? "?" + u : ""}#ext`; };
  const g3n = all.filter(e => isG3(e) && (!ek || e.k === ek)).length;
  const ext = all.filter(e => (!c || extTags(e.id).includes(c)) && (!ek || e.k === ek) && (!g3 || isG3(e))).sort((a, b) => Number(isG3(b)) - Number(isG3(a)));
  const { data: ehp } = await d.from("hospitals").select("id,name").in("name", Array.from(new Set(all.map(e => e.h)))); const EHP = new Map((ehp ?? []).map(h => [h.name, h.id]));
  const open = (jobs ?? []).filter(j => dday(j.deadline) !== "마감").slice(0, 12);
  const login = (next: string) => `/login?next=${encodeURIComponent(next)}`, signup = (next: string) => `/login?mode=signup&next=${encodeURIComponent(next)}`;
  return <div className="pub-bg"><div className="app"><main className="pub">
    <header className="pub-h"><Link href="/" className="pub-brand" aria-label="메디화이트 홈"><BrandLogo /></Link><Link href="/login" className="btn">로그인 · 가입</Link></header>
    <section className="pub-hero"><small className="pub-kicker">📍 강남 3구부터</small><h1>강남 3구 병원<br />실제 실수령액 &<br />분위기 팩트체크 🏥</h1><p>입사하기 전에 <b>원장 성향</b>과 <b>실제 퇴근 시간</b> 확인하고 가세요.</p>
      <div className="pub-pts"><span>💰 통장 실수령</span><span>🙆 원장 성향</span><span>⏰ 실제 퇴근</span><span>😶 태움</span><span>🌴 연차 방식</span></div>
      <form action="/" className="jb2-search"><input name="q" defaultValue={kw} placeholder="지원할 병원 이름 검색 (예: 연세, 정형외과)" /><button className="btn">검색</button></form>
      {kw && <div className="pub-hosp">{(hs ?? []).length ? (hs ?? []).map(h => <Link key={h.id} href={`/h/${h.id}`}><b>🏥 {h.name}</b><small>{h.region} · {h.kind}</small></Link>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>‘{kw}’ 병원이 아직 없어요. <Link href={signup("/hospitals/check")} className="link">처음 등록하고 리뷰 남기기</Link></p>}</div>}
    </section>
    <OpenPromo href="/login?mode=signup" />
    <section id="ext" className="pub-sec"><h2>🌙 저녁 약속 잡을 수 있는 알짜 병원 <small>{ext.length}</small></h2><div className="pb-ex"><small>다녀본 사람 리뷰가 모이면 이런 뱃지가 붙어요 <b>(예시)</b></small><PosBadges list={["⏰ 정시 퇴근", "🙆 원장 터치 적음", "🌴 주5일 + 연차 따로"]} /></div>
      <div className="dtab">{[["", "전체", all.length] as const, ...kinds.map(x => [x, DL[x], all.filter(e => e.k === x).length] as const)].map(([x, n, cnt]) => <Link key={x} href={qs({ k: x })} className={ek === x ? "on" : ""} scroll={false}>{n} <small>{cnt}</small></Link>)}</div>
      <div className="rf-kw ex-conds"><Link href={qs({ g3: g3 ? "" : "1" })} className={"ex-g3chip" + (g3 ? " on" : "")} scroll={false}>📍 강남 3구만 <small>{g3n}</small></Link>{CONDS.map(x => <Link key={x} href={qs({ c: c === x ? "" : x })} className={c === x ? "on" : ""} scroll={false}>{tagLabel(x)}</Link>)}</div>
      <div className="ex-list">{ext.slice(0, 6).map(e => <div key={e.id} className="ex">
        <div className="ex-top"><b>{e.h}</b>{isG3(e) && <span className="ex-g3">강남 3구</span>}</div>
        <div className="ex-meta">{e.dept} · {splitArea(e.area).r}{splitArea(e.area).st && <span className="ex-sta">🚇 {splitArea(e.area).st}</span>}</div>
        <div className="ex-row"><span>⏰ {e.time}</span><span>💰 {e.pay}</span></div>
        <PayCalc pay={e.pay} signup={signup(EHP.get(e.h) ? `/hospitals/${EHP.get(e.h)}` : "/hospitals/check")} />
        {extTags(e.id).length > 0 && <div className="ex-tags">{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}
        <p className="ex-note">☀️ {e.note}</p>{e.warn && <p className="ex-warn">⚠️ {e.warn}</p>}
        <div className="ex-acts"><a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="btn">{EXT_SRC}에서 보고 지원 ↗</a><Link href={EHP.get(e.h) ? `/h/${EHP.get(e.h)}` : `/?q=${encodeURIComponent(e.h.replace(/\s.*$/, ""))}`} className="btn ghost">👀 이 병원 진짜 분위기 보기</Link></div>
      </div>)}</div>
      {ext.length > 6 && <Link href={signup("/jobs/day")} className="btn ghost jb2-more">🌙 가입하고 {ext.length}곳 전부 보기 ›</Link>}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>🔄 {extCheckedLabel()} · {EXT_SRC}에 공개된 공고 중 낮 근무만 골라 핵심만 적었어요. 지원 전 원문을 꼭 확인하세요.</p>
    </section>
    {open.length > 0 && <section className="pub-sec"><h2>💼 메디화이트 채용 공고</h2>
      <div className="pub-jobs">{open.map(j => <Link key={j.id} href={login(`/jobs/${j.id}`)}><b>{(j.author as any)?.username === "mw_bot" ? (j.welfare || `${j.dept} 채용`) : `${j.dept} ${j.emp_type} 모집`}</b><small>{j.hospital} · {j.region}</small><em>{dday(j.deadline)}</em></Link>)}</div>
      <Link href={login("/jobs")} className="btn ghost" style={{ justifySelf: "start" }}>전체 공고·필터 보기 (로그인)</Link></section>}
    <section className="pub-cta"><b>다녀본 병원, 30초만 알려주세요</b><p>병원 하나 체크하면 6개월간 모든 병원의 실수령·분위기·리스크가 열려요. 아이디·닉네임만으로 가입, 실명·전화번호 안 받아요.</p><Link href={signup("/hospitals/check")} className="btn">가입하고 병원 체크하기</Link></section>
    <footer className="pub-f"><Link href="/about">소개</Link><Link href="/rules">이용규칙</Link><Link href="/contact">문의</Link></footer>
  </main></div></div>;
}
