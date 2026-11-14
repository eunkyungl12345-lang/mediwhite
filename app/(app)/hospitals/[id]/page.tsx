import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { RATING_KEYS, avg, overall, stars } from "@/lib/jobs";
import ReviewForm from "@/components/jobs/ReviewForm";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deleteFactCard } from "@/lib/actions";
import ReportButton from "@/components/ReportButton";
import LiveViewers from "@/components/LiveViewers";
import { ReviewDelete } from "@/components/jobs/Buttons";
import FactBox from "@/components/jobs/FactBox";
import ExtraReviews from "@/components/jobs/ExtraReviews";
import { loadFacts, hasContributed, founderOf } from "@/lib/hospFactsDb";
import ShareHosp from "@/components/jobs/ShareHosp";
export async function generateMetadata({ params }: { params: { id: string } }) { const { data } = await db().from("hospitals").select("name").eq("id", Number(params.id)).maybeSingle(); return { title: data?.name ? `${data.name} 리뷰 — 실수령·분위기` : "병원 리뷰" }; }
import { loadDistricts } from "@/lib/districtDb";
import Takedown from "@/components/jobs/Takedown";
import { aggregate, factKey, MIN_N } from "@/lib/hospFacts";
import { vKey } from "@/lib/hverify";
import { loadNps } from "@/lib/nps";
import { memoOnce } from "@/lib/memo";
import NpsBox from "@/components/jobs/NpsBox";
import NpsAdmin from "@/components/jobs/NpsAdmin";
import { ivKey, type Interview } from "@/lib/interview";
import InterviewBoard, { type IvItem, type IvRel } from "@/components/jobs/InterviewBoard";
import HsWriteBtn from "@/components/jobs/HsWriteBtn";
import { PAY } from "@/lib/hospFacts";
import { dday } from "@/lib/jobs";
import { welAgg, welKey, type Welfare } from "@/lib/welfare";
import { factPubKey } from "@/lib/helpKey";
import { HelpBtn, More } from "@/components/jobs/RvBits";
import NoteBoard from "@/components/jobs/NoteBoard";
import { RevHead, RevMark } from "@/components/jobs/RevCardParts";
import { REC3, hireChip } from "@/lib/hospExtra";
import HireSignal from "@/components/jobs/HireSignal";
import PosBadges from "@/components/jobs/PosBadges";
import { posBadges } from "@/lib/hospFacts";
export const dynamic = "force-dynamic";

export default async function HospitalPage({ params, searchParams }: { params: { id: string }; searchParams: { write?: string; checked?: string; t?: string; done?: string; xdone?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: h }, { data: revs }] = await Promise.all([
    d.from("hospitals").select("*").eq("id", id).maybeSingle(),
    d.from("hospital_reviews").select("*").eq("hospital_id", id).eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  if (h && memoOnce(`hv:${id}:${s.id}`, 3600000)) d.from("events").insert({ kind: "hview", user_id: s.id, text: String(id) }).then(() => {}, () => {});
  if (!h) notFound();
  const { data: myHidden } = await d.from("hospital_reviews").select("id").eq("hospital_id", id).eq("user_id", s.id).eq("hidden", true).maybeSingle();
  const { count: blindN } = await d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("hospital_id", id).eq("hidden", true);
  const rs = (revs ?? []).sort((a, b) => Number(b.verified) - Number(a.verified)), mine = rs.find(r => r.user_id === s.id);
  const { data: myProof } = mine ? await d.from("review_proofs").select("status").eq("review_id", mine.id).eq("status", "pending").maybeSingle() : { data: null };
  const proofState = mine?.verified ? "verified" : myProof ? "pending" : null;
  const vN = rs.filter(r => r.verified).length;
  const { data: myJobs } = await d.from("jobs").select("id,dept,emp_type,deadline,welfare,author:users!jobs_author_id_fkey(username)").eq("closed", false).eq("hidden", false).eq("hospital", h.name).eq("region", h.region).limit(30);
  const cur = rs.filter(r => r.status === "재직").length;
  const [facts, { data: myFact }] = await Promise.all([loadFacts([id]), d.from("game_state").select("user_id").eq("user_id", s.id).eq("game", factKey(id)).maybeSingle()]);
  const { data: myV } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", vKey(id)).maybeSingle(); const vstat = (myV?.state as any)?.status ?? null; const [contributed, distm, npsm] = await Promise.all([hasContributed(s.id, s.role, id), loadDistricts([id]), loadNps([id])]); const nps = npsm[id]; const locked = !contributed, gu = distm[id], founderNo = searchParams.checked ? await founderOf(s.id, true) : null; const fa = facts[id] ?? aggregate([]); const score = fa.starN >= (fa.need ?? MIN_N) ? fa.overallAvg : rs.length ? overall(rs) : 0;
  const t = ["pay", "intv", "welfare", "note", "jobs"].includes(searchParams.t ?? "") ? searchParams.t! : "rev";
  const [{ data: ivRows }, { data: hfFull }] = await Promise.all([d.from("game_state").select("user_id,state").eq("game", ivKey(id)).limit(500), d.from("game_state").select("user_id,state").eq("game", factKey(id)).limit(1000)]);
  const ivs = (ivRows ?? []).map(r => ({ uid: r.user_id, ...(r.state as Interview) })).sort((a, b) => b.at.localeCompare(a.at)), myIv = ivs.some(x => x.uid === s.id);
  // 🎤 면접 탭 — 잠금 상태면 남의 후기 본문은 서버에서 아예 빼고 내려보낸다 (블러 예시 카드만)
  const ivItems: IvItem[] = ivs.map((x, i) => { const ok = !locked || x.uid === s.id; return {
    key: `${x.uid}-${i}`, dept: x.dept, year: x.year, route: x.route, steps: Array.isArray(x.steps) ? x.steps : [], level: x.level, result: x.result, feel: x.feel,
    wait: ok ? x.wait : undefined, q: ok ? x.q : undefined, tip: ok ? x.tip : undefined, follow: ok ? x.follow : undefined, fair: x.fair, gap: x.gap,
    at: x.at, mine: x.uid === s.id, locked: !ok }; });
  // 🏥 같은 지역(없으면 같은 종별) 병원 추천 — 실제 DB만 조회, 후기 수는 실제 집계
  let rels: IvRel[] = []; const relTitle = `🏥 ${h.region || h.kind}의 다른 병원도 확인해 보세요`;
  if (t === "intv") {
    const { data: sameR } = await d.from("hospitals").select("id,name,region,kind").eq("region", h.region).neq("id", id).order("name").limit(12);
    let cand = sameR ?? [];
    if (cand.length < 6) { const { data: sameK } = await d.from("hospitals").select("id,name,region,kind").eq("kind", h.kind).neq("id", id).order("name").limit(12); const seen = new Set(cand.map(c => c.id)); cand = [...cand, ...(sameK ?? []).filter(c => !seen.has(c.id))]; }
    cand = cand.slice(0, 6);
    if (cand.length) { const cids = cand.map(c => c.id);
      const [{ data: rvC }, { data: ivC }] = await Promise.all([
        d.from("hospital_reviews").select("hospital_id").in("hospital_id", cids).eq("hidden", false).limit(3000),
        d.from("game_state").select("game").in("game", cids.map(c => ivKey(c))).limit(3000),
      ]);
      const rc = new Map<number, number>(); (rvC ?? []).forEach(r => rc.set(r.hospital_id, (rc.get(r.hospital_id) ?? 0) + 1));
      const ic = new Map<number, number>(); (ivC ?? []).forEach(r => { const k = Number(String(r.game).split(":")[1]); ic.set(k, (ic.get(k) ?? 0) + 1); });
      rels = cand.map(c => ({ ...c, rv: rc.get(c.id) ?? 0, iv: ic.get(c.id) ?? 0 })).sort((a, b) => (b.iv + b.rv) - (a.iv + a.rv) || a.name.localeCompare(b.name));
    }
  }
  const need = fa.need ?? MIN_N, payByDept = Object.entries((hfFull ?? []).map(r => r.state as any).filter(x => x?.pay).reduce((m: Record<string, string[]>, x) => ((m[x.dept ?? "기타"] ??= []).push(x.pay), m), {})).filter(([, v]) => v.length >= Math.max(need, 2))
    .map(([k, v]) => { const idx = v.map(p => PAY.indexOf(p as any)).sort((a, b) => a - b); return { dept: k, n: v.length, mid: PAY[idx[Math.floor((idx.length - 1) / 2)]], lo: PAY[idx[0]], hi: PAY[idx[idx.length - 1]] }; });
  const [{ data: welRows }, { data: helpRows }] = await Promise.all([d.from("game_state").select("user_id,state").eq("game", welKey(id)).limit(1000), d.from("events").select("user_id,text").eq("kind", "rvhelp").like("text", `${id}:%`).limit(5000)]);
  const wa = welAgg((welRows ?? []).map(r => r.state as Welfare)), myWel = (welRows ?? []).some(r => r.user_id === s.id);
  const help = new Map<string, { n: number; me: boolean }>(); for (const e of helpRows ?? []) { const k = String(e.text).slice(String(id).length + 1), c = help.get(k) ?? { n: 0, me: false }; c.n++; if (e.user_id === s.id) c.me = true; help.set(k, c); }
  const ym = (t?: string) => t ? `${t.slice(0, 4)}. ${t.slice(5, 7)} 작성` : "";
  type LI = { key: string; rid?: number; dept?: string; status?: string; cat?: string; rec3?: number; meta: string[]; star: number; title?: string; pros?: string; cons?: string; tip?: string; v?: boolean; mine: boolean; at: string };
  const list: LI[] = [
    ...rs.map(r => ({ key: "r" + r.id, rid: r.id, dept: r.dept, status: r.status, meta: [h.region, ym(r.created_at)], star: overall([r]), pros: r.pros, cons: r.cons, tip: r.tip, v: r.verified, mine: r.user_id === s.id, at: r.created_at })),
    ...(fa.n >= need ? (hfFull ?? []).filter(r => { const x = r.state as any; return !x?.textHidden && (x?.last || x?.pros || x?.cons); }).map(r => { const x = r.state as any; return { key: factPubKey(r.user_id, id), dept: x.dept, status: x.status === "퇴사" ? "퇴사" : "재직", cat: hireChip(x.regular) ?? x.cat, rec3: x.rec3, meta: [ym(x.at)], star: x.overall ?? 0, title: x.last, pros: x.pros, cons: x.cons, v: x.v, mine: r.user_id === s.id, at: x.at ?? "" }; }) : []),
  ].sort((a, b) => Number(!!b.v) - Number(!!a.v) || b.at.localeCompare(a.at));
  const recOk = fa.recN >= need, statBars = fa.starN >= need ? fa.stars.map(x => ({ name: x.name, avg: x.avg })) : rs.length ? RATING_KEYS.map(k => ({ name: k.name, avg: avg(rs, k.key) })).sort((a, b) => Number(/분위기/.test(b.name)) - Number(/분위기/.test(a.name))) : [];
  const tabHref = (k: string) => `/hospitals/${id}${k === "rev" ? "" : `?t=${k}`}`;
  const welfStar = fa.stars.find(x => x.k === "welfare"), revWelf = rs.length ? avg(rs, "r_welfare") : 0;
  return (
    <div className="detail hs-detail">
      <div className="hh">
        <div className="hh-top"><Link href="/hospitals" className="hh-back" aria-label="뒤로">‹</Link><span className="hh-top-r"><HsWriteBtn /><ShareHosp hid={id} name={h.name} /></span></div>
        <div className="hh-badges">{!!myJobs?.length && <a href={tabHref("jobs")} className="hh-b job">💼 채용 중 {myJobs.length}</a>}{(fa.verified + vN) > 0 && <span className="hh-b vf">✅ 인증 {fa.verified + vN}</span>}</div>
        <div className="hh-name"><span className="hh-logo">🏥</span><div><h2>{h.name}</h2><small>{h.region}{gu ? ` ${gu}` : ""} · {h.kind} <LiveViewers kind="hospital" id={String(id)} /></small></div></div>
        <HireSignal a={fa} hid={id} locked={locked} after2={[0, 1, 2].map(k => (hfFull ?? []).filter(r => (r.state as any)?.after2 === k).length)} />
        <PosBadges list={posBadges(fa)} max={6} />
        <div className="hh-score">★ <b>{score ? score.toFixed(1) : "-"}</b><small>{fa.n + rs.length ? `리뷰 ${fa.n + rs.length}` : "아직 평가 없음"}</small></div>
      </div>
      <nav className="hh-tabs">{([["rev", `리뷰 ${rs.length + fa.n || ""}`], ["pay", "급여"], ["intv", `면접 ${ivs.length || ""}`], ["welfare", "복지"], ["note", "인계장"], ["jobs", `채용 ${myJobs?.length || ""}`]] as [string, string][]).map(([k, n]) => <Link key={k} href={tabHref(k)} className={t === k ? "on" : ""} scroll={false}>{n}</Link>)}</nav>
      {searchParams.checked && founderNo && <div className="fb-thanks fd">🏅 <b>창립 멤버 {founderNo}호</b>가 되셨어요! 이제 모든 병원을 평생 볼 수 있어요.</div>}
      {searchParams.checked && <div className="fb-thanks">🙏 고마워요! 다음에 이 병원 지원할 누군가가 덕분에 덜 막막할 거예요.{vstat !== "approved" && <> · <Link href={`/hospitals/verify?id=${id}`} className="link"><b>✅ 명찰/서류로 인증하면 더 믿을 만해져요 →</b></Link></>}</div>}
      {t === "rev" && <>
      <section className="rv2-stat">
        <h3><em>전체</em> 만족도 통계 <small>({rs.length + fa.n}개)</small></h3>
        {statBars.length || score ? <>
          <div className="rv2-big"><b>{score ? score.toFixed(1) : "-"}</b><span className="rf-stars">{[1, 2, 3, 4, 5].map(i => <i key={i} className={score >= i - .25 ? "on" : ""}>★</i>)}</span></div>
          <div className="rv2-grid">{recOk && <div className="fb-donut" style={{ ["--p" as any]: fa.recPct }}><i><b>{fa.recPct}%</b></i><span>추천률</span></div>}
            <div className="rv2-bars">{statBars.map(x => <div key={x.name}><span>{x.name}</span><i><em style={{ width: `${x.avg / 5 * 100}%` }} /></i><b>★ {x.avg.toFixed(1)}</b></div>)}</div></div>
          {fa.starN > 0 && fa.starN < need && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>항목별 별점은 {need}명이 모이면 보여요 (지금 {fa.starN}명)</p>}
        </> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>아직 평가가 없어요. 바로 아래 <b>10초 제보</b>가 첫 리뷰가 돼요.</p>}
      </section>
      <FactBox a={fa} hid={id} mine={!!myFact} vstat={vstat} locked={locked} hideTop />
      <ExtraReviews hid={id} locked={locked} done={searchParams.xdone} me={s.id} />
      {myHidden && <div className="card fb-wait"><b>🔎 내 리뷰는 신고가 들어와 검토 중이에요</b><p>운영팀이 확인하는 동안(최대 30일) 다른 사람에게 보이지 않고, 수정도 잠시 막혀요. 결과는 알림으로 알려드려요.</p></div>}
      {mine && !myHidden && <details id="review-edit" className="card ss-details" open={!!searchParams.write}><summary><b>✏️ 예전에 쓴 내 리뷰 수정</b></summary><ReviewForm hospital={{ id: h.id, name: h.name, region: h.region }} dept={s.dept} mine={mine} proofState={proofState as any} /></details>}
      {(blindN ?? 0) > 0 && <div className="rv-blind">🔒 신고·권리침해 요청으로 <b>{blindN}개</b> 리뷰가 운영팀 검토 중이라 잠시 가려져 있어요 (최대 30일). 검토 후 다시 보이거나 삭제돼요.</div>}
      <div className="rv2-head"><b>리뷰 <em>{list.length}</em></b>{vN + fa.verified > 0 && <small>✅ 인증 {vN + fa.verified}</small>}</div>
      {!list.length ? <div className="fb fb-wait"><b>아직 공개된 리뷰가 없어요</b><p>{fa.n ? `${fa.n}명이 남겼어요 — ${need}명이 모이면 한줄평·장단점이 공개돼요.` : "이 병원을 다녀봤다면 첫 리뷰를 남겨주세요. 딱 세 가지면 돼요."}</p><Link href={`/hospitals/check?id=${id}`} className="btn">＋ 리뷰 작성</Link></div>
      : <div className="rv2-list">{list.map(x => <article key={x.key} className={"rv2" + (x.mine ? " mine" : "")}>
        <RevHead hospital={h.name} dept={x.dept} status={x.status} cat={x.cat} />
        <div className="rf-meta">{x.meta.join("  |  ")}{x.v ? <em>✅ 인증</em> : null}{x.mine ? <em className="me">내 리뷰</em> : null}</div>
        {x.star > 0 && <div className="rf-score"><b>{x.star.toFixed(1)}</b><span className="rf-stars">{[1, 2, 3, 4, 5].map(i => <i key={i} className={x.star >= i - .25 ? "on" : ""}>★</i>)}</span>{typeof x.rec3 === "number" && <span className={"rc-rec r" + x.rec3}>{REC3[x.rec3]}</span>}</div>}
        {x.title && <h3 className="rf-title">{x.title}</h3>}
        {(x.pros || x.cons) && (locked && !x.mine ? <div className="rf-lock"><p className="rf-pc fb-blur"><em className="g">장점</em>이 병원에서 일하며 좋았던 점에 대한 솔직한 이야기</p><Link href={`/hospitals/check?id=${id}`} className="btn">체크 하나 남기고 6개월간 모든 리뷰 보기</Link></div>
          : <More long={(x.pros?.length ?? 0) + (x.cons?.length ?? 0) + (x.tip?.length ?? 0) > 140}>{x.pros && <p className="rf-pc"><em className="g">장점</em>{x.pros}</p>}{x.cons && <p className="rf-pc"><em className="b">단점</em>{x.cons}</p>}{x.tip && <p className="rf-pc"><em className="t">팁</em>{x.tip}</p>}</More>)}
        <div className="rv2-foot"><HelpBtn hid={id} k={x.key} n={help.get(x.key)?.n ?? 0} on={!!help.get(x.key)?.me} />
          <RevMark /><span className="rv2-act">{x.mine && <Link href={x.rid ? `/hospitals/${id}?write=1#review-edit` : `/hospitals/check?id=${id}`} className="rv2-edit">✏️ 수정</Link>}{x.rid ? (x.mine || s.role === "admin" ? <ReviewDelete id={x.rid} /> : <ReportButton kind="review" id={String(x.rid)} />) : x.mine || s.role === "admin" ? <form action={deleteFactCard.bind(null, id, x.key)}><ConfirmSubmit className="rv2-del" msg={x.mine ? "내 제보를 삭제할까요? 신호등·실수령 집계에서도 빠지고 되돌릴 수 없어요." : "이 한줄평 글을 지울까요? (평가 숫자는 남아요)"}>🗑️ 삭제</ConfirmSubmit></form> : null}{!x.mine && !x.rid && <ReportButton kind="fact" id={`${id}:${x.key}`} />}</span></div>
      </article>)}</div>}
      </>}
      {t === "pay" && <>
      <NpsBox n={nps} />
      {s.role === "admin" && <NpsAdmin hid={id} linked={!!nps} />}
        <div className="fb"><div className="fb-h"><b>💰 직종별 세후 실수령</b><span>{need}명 이상 모인 직종만</span></div>
          {payByDept.length ? (locked ? <div className="fb-lockmsg"><b>🔒 체크 하나 남기고 6개월간 모든 병원 급여 보기</b><Link href={`/hospitals/check?id=${id}`} className="btn">🔎 체크하고 보기</Link></div>
            : payByDept.map(x => <div key={x.dept} className="fb-risk" style={{ background: "var(--bg)" }}><span>{x.dept} <small className="muted">({x.n}명 · {x.lo}~{x.hi})</small></span><em style={{ color: "#1F7A4C" }}>보통 {x.mid}만</em></div>))
            : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 직종별로 공개할 만큼 모이지 않았어요.</p>}
          <Link href={`/hospitals/check?id=${id}`} className="btn ghost" style={{ justifySelf: "start" }}>💰 내 실수령 알려주기</Link></div>
      </>}
      {t === "intv" && <InterviewBoard hid={id} items={ivItems} mine={myIv} rels={rels} relTitle={relTitle} big={["상급종합", "종합병원"].includes(h.kind)} />}
      {t === "welfare" && <>
        {searchParams.done && <div className="fb-thanks">🙏 복지 평가 고마워요!</div>}
        <section className="rv2-stat"><h3>🎁 직원들이 실제로 쓴 복지 <small>({wa.n}명)</small></h3>
          {wa.n >= need ? <>
            <div className="wf-agg">{wa.items.slice(0, 12).map(x => <div key={x.name}><span>{x.cat ?? "➕"} {x.name}</span><i><em style={{ width: `${x.n / wa.n * 100}%` }} /></i><small>{x.n}명 써봤어요</small><b>★ {x.avg.toFixed(1)}</b></div>)}</div>
            {wa.texts.length > 0 && (locked ? <div className="rf-lock"><p className="rf-pc fb-blur"><em className="g">후기</em>복지를 실제로 신청해 본 과정과 조건에 대한 이야기</p><Link href={`/hospitals/check?id=${id}`} className="btn">체크 하나 남기고 복지 후기 보기</Link></div>
              : <div className="wf-texts">{wa.texts.map((x, k) => <More key={k} long={x.length > 140}><p className="rf-pc"><em className="g">후기</em>{x}</p></More>)}</div>)}
          </> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>{wa.n ? `${wa.n}명이 평가했어요. ${need - wa.n}명만 더 모이면 공개돼요.` : "진료비 감면, 기숙사, 식당, 보수교육비… 실제로 써본 복지를 처음 알려주세요."}</p>}
          <Link href={`/hospitals/welfare?id=${id}`} className="btn" style={{ justifySelf: "start" }}>{myWel ? "✏️ 내 복지 평가 수정" : "🎁 복지 평가하기"}</Link>
        </section>
        <div className="fb-head">{welfStar && fa.starN >= need && <div><b>{welfStar.avg.toFixed(1)}</b><span>🎁 복지 별점(체크)</span></div>}{rs.length > 0 && <div><b>{revWelf.toFixed(1)}</b><span>🎁 복지 별점(리뷰)</span></div>}</div>
      </>}
      {t === "note" && <NoteBoard hid={id} me={s.id} admin={s.role === "admin"} />}
      {t === "jobs" && <div className="sal-list">{myJobs?.length ? myJobs.map((j: any) => <Link key={j.id} href={`/jobs/${j.id}`} className="sal-row"><b>💼</b><div><strong>{(j.author as any)?.username === "mw_bot" ? (j.welfare || j.dept) : `${j.dept} ${j.emp_type} 모집`}</strong><small>{j.dept} · {j.emp_type}</small></div><em>{dday(j.deadline)}</em></Link>)
        : <div style={{ padding: 14 }}><p className="muted" style={{ margin: "0 0 8px", fontSize: 13 }}>지금 이 병원 채용 공고가 없어요.</p><Link href="/jobs/new?tip=1" className="btn ghost">🤫 이 병원 공고 봤어요 (제보)</Link></div>}</div>}
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>리뷰는 작성자 개인의 경험이에요. 사실과 다르거나 특정인을 비방하는 리뷰는 신고해주세요 — 즉시 블라인드 후 운영팀이 확인해요.</div>
      <Takedown hid={id} />
    </div>
  );
}
