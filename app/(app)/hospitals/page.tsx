import { RevHead, RevMark } from "@/components/jobs/RevCardParts";
import { REC3, hireChip } from "@/lib/hospExtra";
import Link from "next/link";
import { db } from "@/lib/supabase";
import { memo } from "@/lib/memo";
import { getSession } from "@/lib/auth";
import { JOB_REGIONS, overall } from "@/lib/jobs";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { MIN_N, factLine, posBadges } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
import { loadDistricts } from "@/lib/districtDb";
export const metadata = { title: "병원 리뷰 — 실수령·분위기 팩트체크" };
export const dynamic = "force-dynamic";

/** 🏥 병원 리뷰 — 키워드별 TOP 카드 · 리뷰 피드(전체/내 직종/내 병원) · 병원 순위 */
const KW = [
  { k: "pay", name: "급여", icon: "💰", re: /급여|월급|연봉|수당|페이|보너스|상여|실수령/ },
  { k: "welfare", name: "복지", icon: "🎁", re: /복지|식대|밥|식당|기숙사|휴가|연차|명절|학자금|포인트/ },
  { k: "balance", name: "워라밸", icon: "🍀", re: /칼퇴|퇴근|워라밸|오프|야근|나이트|교대|근무시간|주4/ },
  { k: "people", name: "분위기", icon: "🤝", re: /분위기|동료|선배|태움|사람|프리셉터|팀워크|친절/ },
  { k: "growth", name: "교육·성장", icon: "📈", re: /배울|교육|성장|경력|커리어|세미나|술기/ },
] as const;
type Item = { key: string; hid: number; title: string; pros?: string; cons?: string; star: number; meta: string[]; dept?: string; cat?: string; rec3?: number; at: string; v?: boolean; uid?: string; status?: string };

export default async function HospitalsPage({ searchParams }: { searchParams: { tab?: string; kw?: string; sort?: string; region?: string; st?: string } }) {
  const s = (await getSession())!; const d = db();
  const tab = ["mine", "my", "rank"].includes(searchParams.tab ?? "") ? searchParams.tab! : "all", kw = KW.find(x => x.k === searchParams.kw) ?? KW[0];
  const sort = searchParams.sort === "top" ? "top" : searchParams.sort === "low" ? "low" : "new", region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", st = ["재직", "퇴사"].includes(searchParams.st ?? "") ? searchParams.st! : "";
  const [{ data: revs }, { data: hfs }, contributed] = await Promise.all([
    memo("hosp_feed_r", 60_000, async () => await d.from("hospital_reviews").select("id,hospital_id,user_id,dept,status,pros,cons,verified,created_at,r_welfare,r_balance,r_pay,r_culture,r_growth").eq("hidden", false).order("created_at", { ascending: false }).limit(400).then(r => ({ data: r.data }))),
    memo("hosp_feed_f", 60_000, async () => await d.from("game_state").select("user_id,game,state,updated_at").like("game", "hfact:%").order("updated_at", { ascending: false }).limit(2000).then(r => ({ data: r.data }))),
    hasContributed(s.id, s.role)]);
  const hidsAll = Array.from(new Set([...(revs ?? []).map(r => r.hospital_id), ...(hfs ?? []).map(f => Number(String(f.game).slice(6)))]));
  const [{ data: hs }, facts, dist] = await Promise.all([hidsAll.length ? d.from("hospitals").select("id,name,region,kind").in("id", hidsAll) : Promise.resolve({ data: [] as any[] }), loadFacts(hidsAll), loadDistricts(hidsAll)]);
  const H = new Map((hs ?? []).map(h => [h.id, h]));
  const myH = new Set([...(revs ?? []).filter(r => r.user_id === s.id).map(r => r.hospital_id), ...(hfs ?? []).filter(f => f.user_id === s.id).map(f => Number(String(f.game).slice(6)))]);
  const ym = (t: string) => `${t.slice(0, 4)}. ${t.slice(5, 7)}`;
  // 피드: 병원 리뷰(개별 공개) + 실체 체크 한줄평(그 병원 공개 기준을 넘은 경우만, 직종·연차 없이)
  const items: Item[] = [
    ...(revs ?? []).map(r => ({ key: "r" + r.id, hid: r.hospital_id, title: r.pros.split(/[.!?\n]/)[0].slice(0, 60), pros: r.pros, cons: r.cons, star: overall([r]), meta: [], dept: r.dept, at: r.created_at, v: r.verified, uid: r.user_id, status: r.status })),
    ...(hfs ?? []).map(f => ({ f, hid: Number(String(f.game).slice(6)) })).filter(({ f, hid }) => ((f.state as any)?.last || (f.state as any)?.pros || (f.state as any)?.cons) && (facts[hid]?.n ?? 0) >= (facts[hid]?.need ?? MIN_N))
      .map(({ f, hid }) => ({ key: "f" + f.user_id + hid, hid, title: (f.state as any).last ?? "", pros: (f.state as any).pros, cons: (f.state as any).cons, star: (f.state as any).overall ?? 0, meta: [], dept: (f.state as any).dept, cat: hireChip((f.state as any).regular) ?? (f.state as any).cat, rec3: (f.state as any).rec3, at: (f.state as any).at ?? f.updated_at, uid: f.user_id, status: (f.state as any).status })),
  ].filter(x => H.has(x.hid)) as any[];
  let feed = items.filter((x: any) => (tab !== "mine" || x.dept === s.dept) && (tab !== "my" || myH.has(x.hid)) && (!region || H.get(x.hid)!.region === region) && (!st || x.status === st));
  feed.sort((a, b) => sort === "top" ? b.star - a.star : sort === "low" ? a.star - b.star : b.at.localeCompare(a.at)); feed = feed.slice(0, 60);
  // 키워드 TOP 카드: 그 키워드가 장점에 나온 리뷰
  const kwCards = items.filter(x => x.pros && kw.re.test(x.pros)).sort((a, b) => b.star - a.star);
  const seen = new Set<number>(), kwTop = kwCards.filter(x => !seen.has(x.hid) && seen.add(x.hid)).slice(0, 6);
  // 병원 순위
  const rank = Array.from(H.values()).map(h => { const rs = (revs ?? []).filter(r => r.hospital_id === h.id), a = facts[h.id], ok = a && a.starN >= (a.need ?? MIN_N);
    return { h, n: rs.length + (a?.n ?? 0), score: ok ? a!.overallAvg : rs.length ? overall(rs) : 0 }; }).filter(x => x.n).sort((a, b) => b.score - a.score || b.n - a.n);
  const link = (p: Record<string, string>) => `/hospitals?${new URLSearchParams(Object.entries({ tab: tab === "all" ? "" : tab, kw: kw.k === "pay" ? "" : kw.k, sort: sort === "new" ? "" : sort, region, st, ...p }).filter(([, v]) => v))}`;
  const Stars = ({ n }: { n: number }) => <span className="rf-stars">{[1, 2, 3, 4, 5].map(i => <i key={i} className={n >= i - .25 ? "on" : ""}>★</i>)}</span>;
  return (
    <div className="rf">
      <section className="rf-top"><h2><em>#{kw.name}</em> 언급 TOP 병원</h2>
        <div className="rf-kw">{KW.map(x => <Link key={x.k} href={link({ kw: x.k === "pay" ? "" : x.k })} className={x.k === kw.k ? "on" : ""}>{x.icon} {x.name}</Link>)}</div>
        {kwTop.length ? <div className="rh-row">{kwTop.map(c => { const h = H.get(c.hid)!; return <Link key={c.key} href={`/hospitals/${c.hid}`} className="rh-card">
          <b>{c.title}</b>{c.pros && <p><em>장점</em>{contributed ? c.pros.slice(0, 26) + "…" : "체크 하나면 보여요"}</p>}<span className="rh-more">자세히 보기 ›</span>
          <div className="rh-h"><span>🏥</span><div><strong>{h.name}</strong><small>{h.kind} · {h.region}</small></div></div></Link>; })}</div>
          : <p className="muted" style={{ fontSize: 13 }}>아직 ‘{kw.name}’ 이야기가 담긴 리뷰가 없어요.</p>}
      </section>

      <nav className="rf-tabs"><Link href={link({ tab: "" })} className={tab === "all" ? "on" : ""}>전체</Link><Link href={link({ tab: "mine" })} className={tab === "mine" ? "on" : ""}>내 직종</Link><Link href={link({ tab: "my" })} className={tab === "my" ? "on" : ""}>내 병원</Link><Link href={link({ tab: "rank" })} className={tab === "rank" ? "on" : ""}>병원 순위</Link></nav>

      {tab === "rank" ? <div className="sal-list">{rank.length ? rank.slice(0, 50).map((x, i) => <Link key={x.h.id} href={`/hospitals/${x.h.id}`} className="sal-row"><b>{i + 1}</b><div><strong>{x.h.name}</strong><small>{x.h.kind} · {x.h.region}{dist[x.h.id] ? ` ${dist[x.h.id]}` : ""} · 평가 {x.n}</small>
          <PosBadges list={posBadges(facts[x.h.id])} max={3} />{factLine(facts[x.h.id], !contributed).length > 0 && <div className={"jb2-facts" + (!contributed ? " lock" : "")}>{factLine(facts[x.h.id], !contributed).map(t => <span key={t}>{t}</span>)}</div>}</div><em>{x.score ? `★ ${x.score.toFixed(1)}` : "-"}</em></Link>) : <p className="muted" style={{ padding: 14, margin: 0 }}>아직 평가된 병원이 없어요.</p>}</div>
      : <>
        <div className="rf-filters">
          <Link href={link({ sort: sort === "new" ? "top" : sort === "top" ? "low" : "" })} className="on">{sort === "new" ? "최신순" : sort === "top" ? "별점 높은순" : "별점 낮은순"} ⇅</Link>
          <form action="/hospitals" className="rf-sel">{tab !== "all" && <input type="hidden" name="tab" value={tab} />}{sort !== "new" && <input type="hidden" name="sort" value={sort} />}{st && <input type="hidden" name="st" value={st} />}
            <select name="region" defaultValue={region}><option value="">지역</option>{JOB_REGIONS.map(r => <option key={r}>{r}</option>)}</select><button className="rf-go">적용</button></form>
          <Link href={link({ st: st === "재직" ? "퇴사" : st === "퇴사" ? "" : "재직" })} className={st ? "on" : ""}>{st ? (st === "재직" ? "현직원" : "전직원") : "재직 상태"}</Link>
        </div>
        {tab === "mine" && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{s.dept} 직종이 쓴 리뷰만 보여요</p>}
        {!feed.length ? <div className="fb fb-wait"><b>{tab === "my" ? "내가 체크·리뷰한 병원이 아직 없어요" : "아직 리뷰가 없어요"}</b><p>다니는(다녔던) 병원 하나만 체크하면 6개월간 모든 리뷰가 열려요.</p><Link href="/hospitals/check" className="btn">🔎 병원 체크하기</Link></div>
          : <div className="rf-list">{feed.map(x => { const h = H.get(x.hid)!; return <article key={x.key} className="rf-item">
            <Link href={`/hospitals/${x.hid}`} className="rc-link"><RevHead hospital={h.name} dept={x.dept} status={x.status} cat={x.cat} /></Link>
            <PosBadges list={posBadges(facts[x.hid])} max={3} />
            <div className="rf-meta">{[...x.meta, `${h.region}${dist[x.hid] ? " " + dist[x.hid] : ""}`, ym(x.at)].join("  |  ")}{x.v ? <em>✅ 인증</em> : null}</div>
            {x.star > 0 && <div className="rf-score"><b>{x.star.toFixed(1)}</b><Stars n={x.star} />{typeof x.rec3 === "number" && <span className={"rc-rec r" + x.rec3}>{REC3[x.rec3]}</span>}</div>}
            {x.title && <h3 className="rf-title">{x.title}</h3>}
            {(x.pros || x.cons) && (contributed || x.uid === s.id ? <>{x.pros && <p className="rf-pc"><em className="g">장점</em>{x.pros}</p>}{x.cons && <p className="rf-pc"><em className="b">단점</em>{x.cons}</p>}</>
              : <div className="rf-lock"><p className="rf-pc fb-blur"><em className="g">장점</em>이 병원에서 일하며 좋았던 점에 대한 현직자의 솔직한 이야기</p><Link href="/hospitals/check" className="btn">체크 하나 남기고 6개월간 모든 리뷰 보기</Link></div>)}
            <div className="rc-foot"><Link href={`/hospitals/${x.hid}`} className="rf-more">이 병원 더보기 ›</Link><RevMark /></div>
          </article>; })}</div>}
      </>}
      <Link href="/hospitals/brag" className="hc-banner gold"><span>🏆</span><div><b>천하제일 우리병원 자랑대회</b><small>휴게실·식당·뷰… 사진 한 장으로 우리 병원 자랑</small></div><em>+30</em></Link>
    </div>
  );
}
