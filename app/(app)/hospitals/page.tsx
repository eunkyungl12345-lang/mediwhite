import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { JOB_REGIONS, RATING_KEYS, avg, overall } from "@/lib/jobs";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { factLine } from "@/lib/hospFacts";
import FocusCard from "@/components/jobs/FocusCard";
import ThemeRow from "@/components/jobs/ThemeRow";
import { loadDistricts } from "@/lib/districtDb";
export const dynamic = "force-dynamic";

export default async function HospitalsPage({ searchParams }: { searchParams: { region?: string; q?: string; sort?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", q = (searchParams.q ?? "").trim().slice(0, 30), sort = searchParams.sort === "new" ? "new" : "top";
  let hq = d.from("hospitals").select("id,name,region,kind,created_at").limit(200);
  if (region) hq = hq.eq("region", region); if (q) hq = hq.ilike("name", `%${q}%`);
  const [{ data: hs }, { count: jobsN }] = await Promise.all([hq, d.from("jobs").select("id", { count: "exact", head: true }).eq("closed", false).eq("hidden", false)]);
  const ids = (hs ?? []).map(h => h.id);
  const { data: revs } = ids.length ? await d.from("hospital_reviews").select("hospital_id,r_welfare,r_balance,r_pay,r_culture,r_growth,created_at,verified").in("hospital_id", ids).eq("hidden", false) : { data: [] as any[] };
  const [facts, contributed, dist] = await Promise.all([loadFacts(ids), hasContributed(s.id, s.role), loadDistricts(ids)]);
  const by = (id: number) => (revs ?? []).filter(r => r.hospital_id === id);
  const list = (hs ?? []).map(h => ({ ...h, n: by(h.id).length, score: overall(by(h.id)), last: Math.max(0, ...by(h.id).map(r => Date.parse(r.created_at))) })).filter(h => h.n > 0 || facts[h.id]?.n || q);
  list.sort((a, b) => sort === "new" ? b.last - a.last : (b.score - a.score) || (b.n - a.n));
  const link = (p: Record<string, string>) => `/hospitals?${new URLSearchParams({ ...(region ? { region } : {}), ...(q ? { q } : {}), ...(sort !== "top" ? { sort } : {}), ...p })}`;
  return (
    <div className="games jb-page">
      <FocusCard />
      {contributed && <ThemeRow hs={hs ?? []} facts={facts} />}
      <Link href="/hospitals/brag" className="hc-banner gold"><span>🏆</span><div><b>천하제일 우리병원 자랑대회</b><small>휴게실·식당·뷰… 사진 한 장으로 우리 병원 자랑</small></div><em>+30</em></Link>
      <div className="jb-hero"><div><h2 style={{ margin: 0 }}>🏥 병원·약국 리뷰</h2><p className="muted" style={{ margin: "4px 0 0" }}>복지·워라밸·급여·분위기·성장 — 다녀본 사람만 아는 진짜 후기. 닉네임 없이 직종만 표시돼요.</p></div><Link href="/hospitals/new" className="btn">＋ 리뷰 쓰기</Link></div>
      <form className="row" style={{ gap: 6 }} action="/hospitals"><input name="q" defaultValue={q} placeholder="병원명 검색" style={{ flex: 1 }} />{region && <input type="hidden" name="region" value={region} />}<button className="btn ghost">검색</button></form>
      <div className="topics scroll">{["", ...JOB_REGIONS].map(r => <Link key={r} href={`/hospitals?${new URLSearchParams({ ...(r ? { region: r } : {}), ...(q ? { q } : {}) })}`} className={"topic" + (region === r ? " on" : "")}>{r || "전체 지역"}</Link>)}</div>
      <div className="row" style={{ gap: 6, fontSize: 13 }}><Link href={link({ sort: "top" })} className={"link" + (sort === "top" ? " b" : "")}>⭐ 평점순</Link><span className="muted">·</span><Link href={link({ sort: "new" })} className={"link" + (sort === "new" ? " b" : "")}>🆕 최신 리뷰순</Link></div>
      {list.length === 0 && <div className="ss-empty-box" style={{ padding: "30px 20px" }}><span style={{ fontSize: 36 }}>🏥</span><b>{q ? `"${q}" 리뷰가 아직 없어요` : "아직 리뷰가 없어요"}</b><p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>다녔던 병원 첫 리뷰 남기면 +40 XP. 후배들이 진짜 고마워해요 🙏</p><Link href={`/hospitals/new${q ? `?name=${encodeURIComponent(q)}` : ""}`} className="btn" style={{ marginTop: 8 }}>리뷰 쓰기</Link></div>}
      <div className="jb-list">{list.map(h => { const rs = by(h.id); return <Link key={h.id} href={`/hospitals/${h.id}`} className="hs-row">
        <div className="hs-score"><b>{h.n ? h.score.toFixed(1) : "-"}</b><small>★ {h.n}개{by(h.id).filter((r: any) => r.verified).length ? ` · ✅${by(h.id).filter((r: any) => r.verified).length}` : ""}</small></div>
        <div className="hs-body"><b className="jb-title">{h.name}</b><div className="jb-meta">📍 {h.region}{dist[h.id] ? ` ${dist[h.id]}` : ""} · {h.kind}{facts[h.id]?.n ? ` · 🔎 체크 ${facts[h.id].n}` : ""}</div>
          {factLine(facts[h.id], !contributed).length > 0 && <div className={"jb2-facts" + (!contributed ? " lock" : "")}>{factLine(facts[h.id], !contributed).map(x => <span key={x}>{x}</span>)}</div>}
          {h.n > 0 && <div className="hs-bars">{RATING_KEYS.map(k => <span key={k.key} className="hs-bar" title={k.name}><i>{k.icon}</i><em style={{ width: `${avg(rs, k.key) / 5 * 100}%` }} /><small>{avg(rs, k.key).toFixed(1)}</small></span>)}</div>}
        </div></Link>; })}</div>
    </div>
  );
}
