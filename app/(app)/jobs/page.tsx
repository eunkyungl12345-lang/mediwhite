import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ago } from "@/lib/format";
import { JOB_REGIONS, JOB_DEPTS, dday, overall } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import Avatar from "@/components/Avatar";
import ImportButton from "@/components/jobs/ImportButton";
import RegionSelect from "@/components/jobs/RegionSelect";
export const dynamic = "force-dynamic";

/** 💼 의료인 채용 — 파트별 탭 · 공공병원 자동수집 + 현직자 제보 · 병원 리뷰 평점 같이 보기 (의료계의 블라인드) */
export default async function JobsPage({ searchParams }: { searchParams: { region?: string; dept?: string; src?: string; q?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", dept = JOB_DEPTS.includes(searchParams.dept as any) ? searchParams.dept! : "";
  const src = searchParams.src === "public" || searchParams.src === "member" ? searchParams.src : "", kw = (searchParams.q ?? "").trim().slice(0, 30);
  let q = d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,author:users!jobs_author_id_fkey(nickname,dept,username)").eq("hidden", false).order("closed").order("created_at", { ascending: false }).limit(150);
  if (region) q = q.eq("region", region); if (dept) q = q.eq("dept", dept); if (kw) q = q.ilike("hospital", `%${kw}%`);
  const [{ data: all }, { count: hospN }, { data: hosps }, { data: deptCounts }] = await Promise.all([q, d.from("hospital_reviews").select("id", { count: "exact", head: true }), d.from("hospitals").select("id,name"), d.from("jobs").select("dept").eq("hidden", false).eq("closed", false).limit(1000)]);
  const isPublic = (j: any) => j.author?.username === "mw_bot";
  let jobs = (all ?? []).filter(j => src === "public" ? isPublic(j) : src === "member" ? !isPublic(j) : true);
  const open = jobs.filter(j => !j.closed && dday(j.deadline) !== "마감"), closed = jobs.filter(j => j.closed || dday(j.deadline) === "마감");
  // 병원 리뷰 평점 붙이기 (이름이 같거나 포함)
  const names = Array.from(new Set(open.map(j => j.hospital))); const hmap: Record<string, { id: number; avg: number; n: number }> = {};
  const matched = (hosps ?? []).filter(h => names.some(n => n === h.name || n.includes(h.name) || h.name.includes(n)));
  if (matched.length) { const { data: revs } = await d.from("hospital_reviews").select("hospital_id,r_welfare,r_balance,r_pay,r_culture,r_growth").in("hospital_id", matched.map(h => h.id)).eq("hidden", false);
    for (const h of matched) { const rv = (revs ?? []).filter(r => r.hospital_id === h.id); for (const n of names) if (n === h.name || n.includes(h.name) || h.name.includes(n)) hmap[n] = { id: h.id, avg: overall(rv), n: rv.length }; } }
  const cnt: Record<string, number> = {}; for (const r of deptCounts ?? []) cnt[r.dept] = (cnt[r.dept] ?? 0) + 1;
  const link = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ region, dept, src, q: kw, ...o }).filter(([, v]) => v)); return `/jobs${p.toString() ? "?" + p : ""}`; };
  const soon = open.filter(j => { const x = dday(j.deadline); return x === "오늘 마감" || (x.startsWith("D-") && Number(x.slice(2)) <= 3); }).length;
  return (
    <div className="jb2">
      <div className="jb2-hero">
        <div><h2>💼 의료인 채용</h2><p>공공병원 공고는 자동으로 모이고, 현직자가 직접 올린 공고도 함께. <b>지원 전에 그 병원 리뷰부터</b> 확인하세요.</p></div>
        <Link href="/jobs/new" className="btn">✏️ 공고 올리기</Link>
      </div>
      <div className="jb2-switch"><Link href="/jobs" className="on">💼 채용공고 <small>{open.length}</small></Link><Link href="/hospitals">🏥 병원 리뷰 <small>{hospN ?? 0}</small></Link></div>
      <form className="jb2-search" action="/jobs">{dept && <input type="hidden" name="dept" value={dept} />}{region && <input type="hidden" name="region" value={region} />}<input name="q" defaultValue={kw} placeholder="병원 이름으로 찾기 (예: 서울대, 의료원)" /><button className="btn">검색</button></form>
      <div className="jb2-tabs" role="tablist">{["", ...JOB_DEPTS].map(x => <Link key={x} href={link({ dept: x })} className={dept === x ? "on" : ""}>{x ? deptLabel(x) : "전체"}{x && cnt[x] ? <small>{cnt[x]}</small> : null}</Link>)}</div>
      <div className="jb2-filters">
        <Link href={link({ src: "" })} className={!src ? "on" : ""}>전체</Link><Link href={link({ src: "public" })} className={src === "public" ? "on" : ""}>🏛️ 대학·공공병원</Link><Link href={link({ src: "member" })} className={src === "member" ? "on" : ""}>👤 현직자 제보</Link>
        <RegionSelect value={region} />
      </div>
      <div className="jb2-sum"><span>모집 중 <b>{open.length}</b></span>{soon > 0 && <span className="hot">⏰ 3일 안에 마감 {soon}</span>}{kw && <span>‘{kw}’ 검색 · <Link href={link({ q: "" })}>해제</Link></span>}</div>
      {s.role === "admin" && <ImportButton />}
      {open.length === 0 ? <div className="jb2-empty"><span>💼</span><b>{dept ? `${deptLabel(dept)} 공고가 아직 없어요` : "아직 올라온 공고가 없어요"}</b><p>우리 병원에서 사람 구하면 첫 공고를 올려주세요. 공공병원 공고는 자동 수집이 켜지면 여기에 모여요.</p></div>
        : <div className="jb2-list">{open.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[j.hospital]} />)}</div>}
      {closed.length > 0 && <details className="jb2-closed"><summary>마감된 공고 {closed.length}개</summary><div className="jb2-list">{closed.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[j.hospital]} />)}</div></details>}
    </div>
  );
}
function JobCard({ j, pub, rv }: { j: any; pub: boolean; rv?: { id: number; avg: number; n: number } }) {
  const dd = j.closed ? "마감" : dday(j.deadline), hot = dd === "오늘 마감" || (dd.startsWith("D-") && Number(dd.slice(2)) <= 3), isNew = Date.now() - Date.parse(j.created_at) < 2 * 86400000;
  const title = pub ? (j.welfare || `${deptLabel(j.dept)} 채용`) : `${deptLabel(j.dept)} ${j.emp_type} 모집`;
  return <Link href={`/jobs/${j.id}`} className={"jb2-card" + (j.closed ? " closed" : "")}>
    <div className="jb2-h"><Avatar name={j.hospital} size={40} /><div className="jb2-hn"><b>{j.hospital}</b><small>{rv && rv.n ? <span className="jb2-star">★ {rv.avg.toFixed(1)} <em>리뷰 {rv.n}</em></span> : <span className="jb2-norev">리뷰 없음</span>} · {j.region}</small></div><span className={"jb2-dd" + (hot ? " hot" : "") + (dd === "마감" ? " end" : "")}>{dd}</span></div>
    <div className="jb2-t">{title}{isNew && !j.closed && <span className="n-badge">N</span>}</div>
    <div className="jb2-tags"><span className="dept">{deptLabel(j.dept)}</span><span>{j.emp_type}</span>{j.pay && <span>💰 {j.pay}</span>}{j.hours && <span>⏰ {j.hours}</span>}{!pub && j.welfare && <span>🎁 {j.welfare}</span>}</div>
    <div className="jb2-f"><span className={pub ? "src pub" : "src"}>{pub ? "🏛️ 공공 채용 자동수집" : `👤 ${j.author ? `[${deptLabel(j.author.dept)}]${j.author.nickname}` : "회원"} 제보`}</span><span>{ago(j.created_at)} · 조회 {j.views ?? 0}</span></div>
  </Link>;
}
