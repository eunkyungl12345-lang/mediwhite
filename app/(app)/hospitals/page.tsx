import { RevMark } from "@/components/jobs/RevCardParts";
import { REC3, hireChip } from "@/lib/hospExtra";
import Link from "next/link";
import { db } from "@/lib/supabase";
import { memo } from "@/lib/memo";
import { getSession } from "@/lib/auth";
import { JOB_REGIONS, overall } from "@/lib/jobs";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { factPubKey, ivPubKey } from "@/lib/helpKey";
import { MIN_N, factLine, posBadges, hireSignal } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
import HospFilterSelect from "@/components/jobs/HospFilterSelect";
import { loadDistricts } from "@/lib/districtDb";
import { type Interview, IV_LEVEL, IV_FOLLOW, ivResultTone, ivResultShort } from "@/lib/interview";
export const metadata = { title: "병원 리뷰 — 실수령·분위기 팩트체크" };
export const dynamic = "force-dynamic";

/** 🏥 병원 리뷰 — 검색 + 메디화이트 시그널 칩 · 리뷰 피드(전체/내 직종/내 병원) · 병원 순위
 *  카드는 '병원 차트' 피드 — 머리(병원명·지역·종별·별점 스탬프) / 시그널 띠(직종·긍정 태그·실수령·전환)
 *  / 본문(✨ 좋았던 점 · ⚠️ 아쉬운 점 = 좌측 컬러 라인) / 꼬리(병원 차트 보기 · 출처) */
const SIGS = [
  { k: "", name: "전체" },
  { k: "hire", name: "🚦 정규직 전환" },
  { k: "pay", name: "💰 실수령 공개" },
  { k: "intv", name: "🎤 면접 후기" },
  { k: "clinic", name: "🏥 의원급" },
] as const;
type Sig = typeof SIGS[number]["k"];
type Item = { key: string; hid: number; title: string; pros?: string; cons?: string; star: number; meta: string[]; dept?: string; cat?: string; rec3?: number; at: string; v?: boolean; uid?: string; status?: string };

export default async function HospitalsPage({ searchParams }: { searchParams: { tab?: string; sig?: string; sort?: string; region?: string; st?: string; q?: string } }) {
  const s = (await getSession())!; const d = db();
  const q = (searchParams.q ?? "").trim().slice(0, 30), qn = q.replace(/\s/g, "").toLowerCase(), hit = (name: string) => !qn || name.replace(/\s/g, "").toLowerCase().includes(qn);
  const tab = ["mine", "my", "rank"].includes(searchParams.tab ?? "") ? searchParams.tab! : "all";
  const sig = (SIGS.find(x => x.k === searchParams.sig)?.k ?? "") as Sig;
  const sort = searchParams.sort === "top" ? "top" : searchParams.sort === "low" ? "low" : "new", region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", st = ["재직", "퇴사"].includes(searchParams.st ?? "") ? searchParams.st! : "";
  const [{ data: revs }, { data: hfs }, contributed] = await Promise.all([
    memo("hosp_feed_r", 60_000, async () => await d.from("hospital_reviews").select("id,hospital_id,user_id,dept,status,pros,cons,verified,created_at,r_welfare,r_balance,r_pay,r_culture,r_growth").eq("hidden", false).order("created_at", { ascending: false }).limit(400).then(r => ({ data: r.data }))),
    memo("hosp_feed_f", 60_000, async () => await d.from("game_state").select("user_id,game,state,updated_at").like("game", "hfact:%").order("updated_at", { ascending: false }).limit(2000).then(r => ({ data: r.data }))),
    hasContributed(s.id, s.role)]);
  // 🎤 면접 후기·💰 급여 제보 병원 집합 — 그 칩을 눌렀을 때만 조회
  const [{ data: ivG }, { data: payG }] = await Promise.all([
    sig === "intv" ? d.from("game_state").select("user_id,game,state,updated_at").like("game", "hintv:%").order("updated_at", { ascending: false }).limit(3000) : Promise.resolve({ data: [] as any[] }),
    sig === "pay" ? d.from("game_state").select("game").like("game", "hx:pay:%").limit(3000) : Promise.resolve({ data: [] as any[] }),
  ]);
  const hidOf = (g: string, p: string) => Number(String(g).slice(p.length));
  // 🎤 면접 후기 한 줄 = 후기 하나(사용자·병원). 병원 단위가 아니라 후기 단위로 카드를 그린다
  const ivRows = (ivG ?? []).map((r: any) => ({ uid: String(r.user_id), hid: hidOf(r.game, "hintv:"), x: r.state as Interview, at: String((r.state as any)?.at ?? r.updated_at ?? "") }))
    .filter(r => r.hid > 0 && r.x && r.x.result);
  const intvHids = new Set<number>(ivRows.map(r => r.hid));
  const payHids = new Set<number>((payG ?? []).map((r: any) => hidOf(r.game, "hx:pay:")).filter(n => n > 0));
  const hidsAll = Array.from(new Set([...(revs ?? []).map(r => r.hospital_id), ...(hfs ?? []).map(f => Number(String(f.game).slice(6))), ...Array.from(intvHids)]));
  const [{ data: hs }, facts, dist] = await Promise.all([hidsAll.length ? d.from("hospitals").select("id,name,region,kind").in("id", hidsAll) : Promise.resolve({ data: [] as any[] }), loadFacts(hidsAll), loadDistricts(hidsAll)]);
  const H = new Map((hs ?? []).map(h => [h.id, h]));
  const myH = new Set([...(revs ?? []).filter(r => r.user_id === s.id).map(r => r.hospital_id), ...(hfs ?? []).filter(f => f.user_id === s.id).map(f => Number(String(f.game).slice(6)))]);
  const ym = (t: string) => `${t.slice(0, 4)}. ${t.slice(5, 7)}`;
  // 피드: 병원 리뷰(개별 공개) + 실체 체크 한줄평(그 병원 공개 기준을 넘은 경우만, 직종·연차 없이)
  const items: Item[] = [
    ...(revs ?? []).map(r => ({ key: "r" + r.id, hid: r.hospital_id, title: r.pros.split(/[.!?\n]/)[0].slice(0, 60), pros: r.pros, cons: r.cons, star: overall([r]), meta: [], dept: r.dept, at: r.created_at, v: r.verified, uid: r.user_id, status: r.status })),
    ...(hfs ?? []).map(f => ({ f, hid: Number(String(f.game).slice(6)) })).filter(({ f, hid }) => !(f.state as any)?.textHidden && ((f.state as any)?.last || (f.state as any)?.pros || (f.state as any)?.cons) && (facts[hid]?.n ?? 0) >= (facts[hid]?.need ?? MIN_N))
      .map(({ f, hid }) => ({ key: factPubKey(String(f.user_id), hid), hid, title: (f.state as any).last ?? "", pros: (f.state as any).pros, cons: (f.state as any).cons, star: (f.state as any).overall ?? 0, meta: [], dept: (f.state as any).dept, cat: hireChip((f.state as any).regular) ?? (f.state as any).cat, rec3: (f.state as any).rec3, at: (f.state as any).at ?? f.updated_at, uid: f.user_id, status: (f.state as any).status })),
  ].filter(x => H.has(x.hid)) as any[];
  // 🚦 메디화이트 시그널 칩 — 병원 단위 조건
  const sigOk = (hid: number): boolean => sig === "" ? true
    : sig === "clinic" ? H.get(hid)?.kind === "의원"
    : sig === "intv" ? intvHids.has(hid)
    : sig === "pay" ? (!!facts[hid]?.pay.some(p => p.n > 0) || payHids.has(hid))
    : !!facts[hid]?.hire.some(h => h.total > 0);
  let feed = items.filter((x: any) => hit(H.get(x.hid)!.name) && sigOk(x.hid) && (tab !== "mine" || x.dept === s.dept) && (tab !== "my" || myH.has(x.hid)) && (!region || H.get(x.hid)!.region === region) && (!st || x.status === st));
  feed.sort((a, b) => sort === "top" ? b.star - a.star : sort === "low" ? a.star - b.star : b.at.localeCompare(a.at)); feed = feed.slice(0, 60);
  // 🎤 면접 후기 칩 — 후기 하나를 '병원 차트' 카드로 (리뷰가 없어도 후기만 있으면 보여요)
  const ivHit = intvHids.size ? ivRows.filter(r => H.has(r.hid) && hit(H.get(r.hid)!.name)).sort((a, b) => b.at.localeCompare(a.at)) : [];
  const ivCards = ivHit.filter(r => !region || H.get(r.hid)!.region === region).slice(0, 40);
  const ivAny = ivRows.filter(r => H.has(r.hid)).length;
  // 병원 순위
  const rank = Array.from(H.values()).map(h => { const rs = (revs ?? []).filter(r => r.hospital_id === h.id), a = facts[h.id], ok = a && a.starN >= (a.need ?? MIN_N);
    return { h, n: rs.length + (a?.n ?? 0), score: ok ? a!.overallAvg : rs.length ? overall(rs) : 0 }; }).filter(x => x.n && hit(x.h.name) && sigOk(x.h.id)).sort((a, b) => b.score - a.score || b.n - a.n);
  // 🔎 검색: 리뷰가 아직 없는 병원도 이름이 맞으면 바로 갈 수 있게
  const { data: found } = q ? await d.from("hospitals").select("id,name,region,kind").ilike("name", `%${q.replace(/[%_]/g, "")}%`).order("name").limit(8) : { data: [] as any[] };
  const link = (p: Record<string, string>) => `/hospitals?${new URLSearchParams(Object.entries({ tab: tab === "all" ? "" : tab, sig, sort: sort === "new" ? "" : sort, region, st, q, ...p }).filter(([, v]) => v))}`;
  // 시그널 띠에 붙는 한 줄 팩트 칩 (잠금 상태면 'n명 제보'만)
  const sigChips = (hid: number): { t: string; k: string }[] => {
    const a = facts[hid], need = a?.need ?? MIN_N; if (!a || a.n < need) return [];
    if (!contributed) return [{ t: `🔒 ${a.n}명 제보`, k: "lock" }];
    const out: { t: string; k: string }[] = [];
    if (a.payMid) out.push({ t: `💰 실수령 ${a.payMid}만`, k: "pay" });
    const hr = a.hire.find(h => h.total > 0); if (hr) { const g = hireSignal(hr); out.push({ t: `${g.icon} ${hr.dept} ${g.tag}`, k: "hire" }); }
    if (a.recN >= need) out.push({ t: `👍 추천 ${a.recPct}%`, k: "ok" });
    return out.slice(0, 3);
  };
  return (
    <div className="rf">
      {/* 1) 검색이 페이지 맨 위 */}
      <form action="/hospitals" className="rf-search" role="search">{tab !== "all" && <input type="hidden" name="tab" value={tab} />}{sig && <input type="hidden" name="sig" value={sig} />}{region && <input type="hidden" name="region" value={region} />}{st && <input type="hidden" name="st" value={st} />}
        <input name="q" defaultValue={q} placeholder="궁금한 병원을 검색해 보세요" aria-label="병원 이름 검색" autoComplete="off" /><button className="btn">검색</button></form>

      {/* 2) 메디화이트 시그널 칩 — 잡플래닛엔 없는 '이 병원이 어떤지' 기준 */}
      <div className="rf-sig">{SIGS.map(x => <Link key={x.k} href={link({ sig: x.k, tab: "" })} className={"rf-sigc" + (x.k === sig ? " on" : "") + (x.k ? " " + x.k : "")}>{x.name}</Link>)}</div>

      {q && <div className="rf-found"><div className="rf-found-h"><b>‘{q}’ 병원 {found?.length ?? 0}곳</b><Link href={link({ q: "" })}>✕ 검색 해제</Link></div>
        {found?.length ? found.map((h: any) => <Link key={h.id} href={`/hospitals/${h.id}`} className="rf-found-r"><span>🏥</span><div><b>{h.name}</b><small>{h.kind} · {h.region}{facts[h.id]?.n ? ` · 평가 ${facts[h.id].n}` : " · 아직 평가 없음"}</small></div><em>›</em></Link>)
          : <p className="muted" style={{ margin: 0, fontSize: 13 }}>찾는 병원이 없어요. <Link href="/hospitals/check">리뷰를 쓰면서 새 병원을 등록</Link>할 수 있어요.</p>}</div>}

      <nav className="rf-tabs"><Link href={link({ tab: "" })} className={tab === "all" ? "on" : ""}>전체</Link><Link href={link({ tab: "mine" })} className={tab === "mine" ? "on" : ""}>내 직종</Link><Link href={link({ tab: "my" })} className={tab === "my" ? "on" : ""}>내 병원</Link><Link href={link({ tab: "rank" })} className={tab === "rank" ? "on" : ""}>병원 순위</Link></nav>

      {tab === "rank" ? <div className="sal-list">{rank.length ? rank.slice(0, 50).map((x, i) => <Link key={x.h.id} href={`/hospitals/${x.h.id}`} className="sal-row"><b>{i + 1}</b><div><strong>{x.h.name}</strong><small>{x.h.kind} · {x.h.region}{dist[x.h.id] ? ` ${dist[x.h.id]}` : ""} · 평가 {x.n}</small>
          <PosBadges list={posBadges(facts[x.h.id])} max={3} />{factLine(facts[x.h.id], !contributed).length > 0 && <div className={"jb2-facts" + (!contributed ? " lock" : "")}>{factLine(facts[x.h.id], !contributed).map(t => <span key={t}>{t}</span>)}</div>}</div><em>{x.score ? `★ ${x.score.toFixed(1)}` : "-"}</em></Link>) : <p className="muted" style={{ padding: 14, margin: 0 }}>{sig ? "이 조건에 맞는 병원이 아직 없어요." : "아직 평가된 병원이 없어요."}</p>}</div>
      : sig === "intv" ? <>
        <div className="rf-filters"><HospFilterSelect value={region} /><span className="iv-filter-n" style={{ marginLeft: "auto" }}>면접 후기 <b>{ivCards.length}</b>건{ivCards.length !== ivHit.length && <> <em>/ 전체 {ivHit.length}건</em></>}</span></div>
        {ivCards.length ? <div className="mc-list">{ivCards.map(r => { const h = H.get(r.hid)!; const ok = contributed || r.uid === s.id; const F = IV_FOLLOW[r.x.result];
          const clip = (t?: string, n = 170) => { const v = (t ?? "").trim(); return v.length > n ? v.slice(0, n).trimEnd() + "…" : v; };
          return <article key={ivPubKey(String(r.uid), r.hid)} className="mc-card mc-iv">
            {/* 머리 — 병원명(→ 면접 탭 직행) + 결과 배지 · 난이도 */}
            <header className="mc-head">
              <Link href={`/hospitals/${r.hid}?t=intv`} className="mc-hosp">🏥 {h.name}</Link>
              <span className="mc-stamp"><em className={"mc-res " + ivResultTone(r.x.result)}>{ivResultShort(r.x.result)}</em><span className="mc-lv">난이도 {IV_LEVEL[Math.min(4, Math.max(0, (r.x.level || 3) - 1))]}</span></span>
            </header>
            <div className="mc-sub"><span>{h.region}{dist[r.hid] ? ` ${dist[r.hid]}` : ""} · {h.kind}</span><span>{r.x.year}년 · {r.x.route}</span>{r.uid === s.id && <em>내 후기</em>}<span className="mc-when">{r.at ? ym(r.at) : ""}</span></div>
            {/* 시그널 띠 — 직종 · 입사 여부 · 내정자/조건 변경 경고 */}
            <div className="mc-sig">
              {r.x.dept && <span className="mc-dept">🪪 {r.x.dept}</span>}
              {r.x.result?.startsWith("합격") && <span className={"mc-chip " + (r.x.result === "합격 후 입사" ? "ok" : "hire")}>{r.x.result === "합격 후 입사" ? "입사" : "입사 안 함"}</span>}
              {typeof r.x.wait === "number" && r.x.wait > 0 && <span className="mc-chip hire">⏳ 발표 {r.x.wait >= 60 ? "한 달+" : `${r.x.wait}일`}</span>}
              {r.x.fair === 2 && <span className="mc-chip warn">🙈 내정자·병풍</span>}
              {r.x.gap && <span className="mc-chip warn">⚠️ 공고와 다른 조건</span>}
            </div>
            {/* 본문 — 잠금 정책은 리뷰와 동일: 제보했거나 내 후기만 열린다 */}
            {ok ? <div className="mc-body">
              {r.x.q && <div className="iv-qa"><span className="iv-qb">Q</span><p className="iv-q">{clip(r.x.q)}</p></div>}
              {r.x.tip && <div className="iv-tip"><span aria-hidden>💡</span><p>{clip(r.x.tip, 140)}</p></div>}
              {r.x.follow && F && <div className="iv-qa"><span className="iv-ab">A</span><div><em className="iv-atag">{F.tag}</em><p className="iv-a">{clip(r.x.follow, 140)}</p></div></div>}
              {!r.x.q && !r.x.tip && !r.x.follow && <p className="muted" style={{ margin: 0, fontSize: 13 }}>질문 본문은 비어 있고, 위 시그널만 남겼어요.</p>}
            </div> : <div className="iv-lock mc-lock">
              <div className="iv-qa" aria-hidden><span className="iv-qb">Q</span><p className="iv-q">1분 자기소개와 지원 동기, 그리고 이 병원만의 단골 질문이 여기에 있어요</p></div>
              <div className="iv-qa" aria-hidden><span className="iv-ab">A</span><div><em className="iv-atag">{F?.tag ?? "조언"}</em><p className="iv-a">면접 때 실제로 들은 처우·근무 조건에 대한 솔직한 이야기</p></div></div>
              <Link href="/hospitals/check" className="btn">🎤 제보 하나 남기고 6개월간 모든 면접 후기 보기</Link>
            </div>}
            <footer className="mc-foot"><Link href={`/hospitals/${r.hid}?t=intv`} className="mc-more">면접 후기 전체 보기 ›</Link><RevMark /></footer>
          </article>; })}</div>
          : <div className="fb fb-wait"><b>{q && ivAny ? `‘${q}’ 병원 면접 후기가 없어요` : region && ivHit.length ? "이 지역엔 면접 후기가 아직 없어요" : "아직 면접 후기가 없어요"}</b><p>{q && ivAny ? "다른 병원 이름으로 검색하거나, 전체 면접 후기를 보세요." : region && ivHit.length ? `다른 지역엔 ${ivHit.length}건이 있어요.` : "면접 봤던 병원 하나만 골라 질문·분위기 한 줄만 남겨주세요. 다음 지원자의 하루가 달라져요."}</p>
            <div className="row" style={{ justifyContent: "center" }}>{q && ivAny ? <Link href={link({ q: "", region: "" })} className="btn ghost">전체 면접 후기 보기</Link> : region && ivHit.length > 0 ? <Link href={link({ region: "" })} className="btn ghost">전체 지역 면접 후기 보기</Link> : null}<Link href="/hospitals/interview" className="btn">🎤 면접 후기 남기기</Link></div></div>}
      </> : <>
        <div className="rf-filters">
          <Link href={link({ sort: sort === "new" ? "top" : sort === "top" ? "low" : "" })} className="on">{sort === "new" ? "최신순" : sort === "top" ? "별점 높은순" : "별점 낮은순"} ⇅</Link>
          <HospFilterSelect value={region} />
          <Link href={link({ st: st === "재직" ? "퇴사" : st === "퇴사" ? "" : "재직" })} className={st ? "on" : ""}>{st ? (st === "재직" ? "현직원" : "전직원") : "재직 상태"}</Link>
        </div>
        {tab === "mine" && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{s.dept} 직종이 쓴 리뷰만 보여요</p>}
        {!feed.length ? <div className="fb fb-wait"><b>{sig ? "이 조건에 맞는 리뷰가 아직 없어요" : tab === "my" ? "내가 제보·리뷰한 병원이 아직 없어요" : "아직 리뷰가 없어요"}</b>          <p>{sig ? <>다른 조건으로 보거나, 다니는(다녔던) 병원을 제보하면 이 자리가 채워져요.</> : <>다니는(다녔던) 병원 하나만 제보하면 6개월간 모든 리뷰가 열려요.</>}</p>
          <div className="row" style={{ justifyContent: "center" }}>{sig && <Link href={link({ sig: "" })} className="btn ghost">전체 리뷰 보기</Link>}<Link href="/hospitals/check" className="btn">🔎 병원 제보하기</Link></div></div>
          : <div className="mc-list">{feed.map(x => { const h = H.get(x.hid)!; const now = x.status === "재직" || x.status === "현직원", lab = x.status ? (now ? "현직" : "전직") : "";
            return <article key={x.key} className="mc-card">
              {/* 머리 — 병원명 + 지역·종별 + 별점/추천 스탬프 */}
              <header className="mc-head">
                <Link href={`/hospitals/${x.hid}`} className="mc-hosp">🏥 {h.name}</Link>
                <span className="mc-stamp">{x.star > 0 && <b>★ {x.star.toFixed(1)}</b>}{typeof x.rec3 === "number" && <em className={"mc-rec r" + x.rec3}>{REC3[x.rec3]}</em>}</span>
              </header>
              <div className="mc-sub"><span>{h.region}{dist[x.hid] ? ` ${dist[x.hid]}` : ""} · {h.kind}</span>{x.v && <em>✅ 인증</em>}<span className="mc-when">{ym(x.at)}</span></div>
              {/* 시그널 띠 — 직종(현직/전직) · 긍정 태그 · 실수령/전환 한 줄 */}
              <div className="mc-sig">
                {(x.dept || lab) && <span className={"mc-dept" + (now ? " now" : "")}>🪪 {x.dept ?? "직종 미상"}{lab && <em>{lab}</em>}</span>}
                {x.cat && <span className="mc-cat">{x.cat}</span>}
                <PosBadges list={posBadges(facts[x.hid])} max={3} />
                {sigChips(x.hid).map(c => <span key={c.t} className={"mc-chip " + c.k}>{c.t}</span>)}
              </div>
              {(contributed || x.uid === s.id) && x.title && <h3 className="mc-title">{x.title}</h3>}
              {/* 본문 — 좋았던 점 / 아쉬운 점 (좌측 컬러 라인) */}
              {(x.pros || x.cons) && (contributed || x.uid === s.id
                ? <div className="mc-body">{x.pros && <p className="mc-p good"><span className="mc-k">✨ 좋았던 점</span><span className="mc-v">{x.pros}</span></p>}{x.cons && <p className="mc-p bad"><span className="mc-k">⚠️ 아쉬운 점</span><span className="mc-v">{x.cons}</span></p>}</div>
                : <div className="mc-lock"><p className="mc-p good fb-blur"><span className="mc-k">✨ 좋았던 점</span><span className="mc-v">이 병원에서 일하며 좋았던 점에 대한 현직자의 솔직한 이야기</span></p>
                  <Link href="/hospitals/check" className="btn">제보 하나 남기고 6개월간 모든 리뷰 보기</Link></div>)}
              <footer className="mc-foot"><Link href={`/hospitals/${x.hid}`} className="mc-more">병원 차트 보기 ›</Link><RevMark /></footer>
            </article>; })}</div>}
      </>}
    </div>
  );
}
