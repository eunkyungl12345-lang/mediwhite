import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { JOB_REGIONS, JOB_DEPTS, dday } from "@/lib/jobs";
export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: { region?: string; dept?: string; closed?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", dept = JOB_DEPTS.includes(searchParams.dept as any) ? searchParams.dept! : "";
  let q = d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,author:users!jobs_author_id_fkey(nickname,dept)").eq("hidden", false).order("closed").order("created_at", { ascending: false }).limit(80);
  if (region) q = q.eq("region", region); if (dept) q = q.eq("dept", dept);
  const [{ data: jobs }, { count: hospN }] = await Promise.all([q, d.from("hospital_reviews").select("id", { count: "exact", head: true })]);
  const link = (r: string, dp: string) => `/jobs?${new URLSearchParams({ ...(r ? { region: r } : {}), ...(dp ? { dept: dp } : {}) })}`;
  const open = (jobs ?? []).filter(j => !j.closed && dday(j.deadline) !== "마감"), closed = (jobs ?? []).filter(j => j.closed || dday(j.deadline) === "마감");
  return (
    <div className="games jb-page">
      <div className="jb-hero"><div><h2 style={{ margin: 0 }}>💼 채용</h2><p className="muted" style={{ margin: "4px 0 0" }}>병원 사람이 직접 올리는 구인 공고. 지원 전에 <Link href="/hospitals" className="link">🏥 병원 리뷰</Link>도 꼭 확인!</p></div><Link href="/jobs/new" className="btn">＋ 공고 올리기</Link></div>
      <div className="jb-tabs"><Link href="/jobs" className="topic on">💼 채용공고</Link><Link href="/hospitals" className="topic">🏥 병원 리뷰 {hospN ? <small className="muted">{hospN}</small> : null}</Link></div>
      <div className="topics scroll">{["", ...JOB_REGIONS].map(r => <Link key={r} href={link(r, dept)} className={"topic" + (region === r ? " on" : "")}>{r || "전체 지역"}</Link>)}</div>
      <div className="topics scroll">{["", ...JOB_DEPTS].map(x => <Link key={x} href={link(region, x)} className={"topic" + (dept === x ? " on" : "")}>{x || "전체 직종"}</Link>)}</div>
      {open.length === 0 && <div className="ss-empty-box" style={{ padding: "30px 20px" }}><span style={{ fontSize: 36 }}>💼</span><b>아직 올라온 공고가 없어요</b><p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>우리 병원 사람 구하면 첫 공고 올려주세요 (+20 XP). 총괄·원무 분들 환영!</p></div>}
      <div className="jb-list">{open.map(j => <JobRow key={j.id} j={j} />)}</div>
      {closed.length > 0 && <details className="card" style={{ padding: 10 }}><summary className="muted">마감된 공고 {closed.length}개</summary><div className="jb-list" style={{ marginTop: 8, opacity: .7 }}>{closed.map(j => <JobRow key={j.id} j={j} />)}</div></details>}
      <div className="card jb-public"><b>🏛️ 고용24·잡아바 공공 채용정보</b><p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>공공데이터 연동 준비 중이에요. 연동되면 보건의료 직종 공고가 여기에 자동으로 모여요.</p></div>
    </div>
  );
}
function JobRow({ j }: { j: any }) {
  const dd = dday(j.deadline), isNew = Date.now() - Date.parse(j.created_at) < 3 * 86400000;
  return <Link href={`/jobs/${j.id}`} className={"jb-row" + (j.closed ? " closed" : "")}>
    <div className="jb-top"><span className="tag jb-dept">{j.dept}</span><span className="tag">{j.emp_type}</span><span className={"jb-dd" + (dd.startsWith("D-") && Number(dd.slice(2)) <= 3 ? " soon" : "")}>{j.closed ? "마감" : dd}</span></div>
    <b className="jb-title">{j.hospital}{isNew && !j.closed && <span className="n-badge">N</span>}</b>
    <div className="jb-meta">📍 {j.region}{j.pay ? ` · 💰 ${j.pay}` : ""}{j.hours ? ` · ⏰ ${j.hours}` : ""}</div>
    {j.welfare && <div className="jb-welfare">🎁 {j.welfare}</div>}
    <div className="jb-foot muted">{j.author ? `[${j.author.dept}]${j.author.nickname}` : "회원"} · {fmt(j.created_at)} · 👁 {j.views}</div>
  </Link>;
}
