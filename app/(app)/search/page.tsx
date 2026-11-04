import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { dday, JOB_DEPTS } from "@/lib/jobs";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { loadNps } from "@/lib/nps";
import { loadDistricts } from "@/lib/districtDb";
import { MIN_N, factLine } from "@/lib/hospFacts";
import JobCard from "@/components/jobs/JobCard";
export const dynamic = "force-dynamic";
/** 🔍 통합 검색 — 잡플래닛처럼 전체 · 병원 · 채용 공고 탭 + 키워드 */
export default async function SearchPage({ searchParams }: { searchParams: { q?: string; tab?: string } }) {
  const s = (await getSession())!; const d = db(); const q = (searchParams.q ?? "").trim().slice(0, 30), tab = ["hosp", "jobs"].includes(searchParams.tab ?? "") ? searchParams.tab! : "all";
  const dept = JOB_DEPTS.find(x => q && (x === q || q.includes(x)));
  const [{ data: hs }, { data: js }, contributed] = q ? await Promise.all([
    d.from("hospitals").select("id,name,region,kind").ilike("name", `%${q}%`).limit(30),
    (dept ? d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,body,author:users!jobs_author_id_fkey(nickname,dept,username)").eq("dept", dept) : d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,body,author:users!jobs_author_id_fkey(nickname,dept,username)").or(`hospital.ilike.%${q}%,welfare.ilike.%${q}%`)).eq("hidden", false).eq("closed", false).order("created_at", { ascending: false }).limit(40),
    hasContributed(s.id, s.role)]) : [{ data: [] as any[] }, { data: [] as any[] }, true];
  const jobs = (js ?? []).filter(j => dday(j.deadline) !== "마감"), ids = (hs ?? []).map(h => h.id);
  const [facts, nps, dist, revs] = await Promise.all([loadFacts(ids), loadNps(ids), loadDistricts(ids), ids.length ? d.from("hospital_reviews").select("hospital_id").in("hospital_id", ids).eq("hidden", false).then(r => r.data ?? []) : Promise.resolve([] as any[])]);
  const rvN = (id: number) => revs.filter((r: any) => r.hospital_id === id).length;
  const T = (k: string, n: string, c?: number) => <Link href={`/search?${new URLSearchParams({ q, ...(k !== "all" ? { tab: k } : {}) })}`} className={tab === k ? "on" : ""}>{n}{c != null ? <small> {c}</small> : null}</Link>;
  return <div className="sr">
    <form action="/search" className="ht-search"><input name="q" defaultValue={q} placeholder="어느 병원이 궁금해요? (병원·약국·직종)" autoFocus={!q} /><button aria-label="검색">⌕</button></form>
    <div className="sr-kw"><b>키워드</b><Link href="/jobs/day">☀️ 3교대 탈출</Link><Link href="/jobs?t=신규가능">🐣 신규 가능</Link><Link href="/jobs?t=상근">☀️ 상근</Link><Link href="/jobs?src=share">🤫 히든 공고</Link><Link href="/jobs?soon=1">⏰ 곧 마감</Link></div>
    {!q ? <p className="muted" style={{ fontSize: 13.5 }}>병원 이름(예: 서울아산, 척척마취), 직종(예: 간호사, 방사선)으로 찾아보세요.</p> : <>
      <nav className="sr-tabs">{T("all", "전체")}{T("hosp", "병원", hs?.length ?? 0)}{T("jobs", "채용 공고", jobs.length)}</nav>
      {tab !== "jobs" && <section><h3 className="sr-h">병원 <small>{hs?.length ?? 0}</small></h3>
        {(hs ?? []).length ? <div className="sr-list">{(hs ?? []).slice(0, tab === "all" ? 6 : 30).map(h => { const a = facts[h.id], n = nps[h.id], score = a && a.starN >= (a.need ?? MIN_N) ? a.overallAvg : 0, lines = factLine(a, !contributed).slice(0, 2);
          return <Link key={h.id} href={`/hospitals/${h.id}`} className="sr-h-card"><span className="sr-logo">🏥</span><div><b>{h.name}</b>
            <small>{score ? <em>★ {score.toFixed(1)}</em> : null}{h.kind} · {h.region}{dist[h.id] ? ` ${dist[h.id]}` : ""}</small>
            <small className="sr-meta">{[n?.cnt ? `👥 ${n.cnt}명` : "", a?.n ? `🔎 체크 ${a.n}` : "", rvN(h.id) ? `리뷰 ${rvN(h.id)}` : ""].filter(Boolean).join(" · ") || "아직 정보가 없어요 — 첫 체크를 남겨주세요"}</small>
            {lines.length > 0 && <div className="jb2-facts">{lines.map(x => <span key={x}>{x}</span>)}</div>}</div></Link>; })}</div>
          : <div className="fb fb-wait"><b>‘{q}’ 병원이 아직 없어요</b><p>다녀본 병원이라면 처음 등록하고 체크해 주세요.</p><Link href="/hospitals/check" className="btn">🔎 병원 등록하고 체크</Link></div>}
        {tab === "all" && (hs?.length ?? 0) > 6 && <Link className="link" href={`/search?q=${encodeURIComponent(q)}&tab=hosp`}>병원 더보기 ›</Link>}</section>}
      {tab !== "hosp" && <section><h3 className="sr-h">채용 공고 <small>{jobs.length}</small></h3>
        {jobs.length ? <div className="jb2-list">{jobs.slice(0, tab === "all" ? 5 : 40).map(j => <JobCard key={j.id} j={j} pub={(j.author as any)?.username === "mw_bot"} locked={!contributed} />)}</div> : <p className="muted" style={{ fontSize: 13 }}>모집 중인 공고가 없어요.</p>}
        {tab === "all" && jobs.length > 5 && <Link className="link" href={`/search?q=${encodeURIComponent(q)}&tab=jobs`}>공고 더보기 ›</Link>}</section>}
    </>}
  </div>;
}
