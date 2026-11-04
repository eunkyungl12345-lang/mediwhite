import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { RATING_KEYS, avg, overall, stars } from "@/lib/jobs";
import ReviewForm from "@/components/jobs/ReviewForm";
import ReportButton from "@/components/ReportButton";
import LiveViewers from "@/components/LiveViewers";
import { ReviewDelete } from "@/components/jobs/Buttons";
import FactBox from "@/components/jobs/FactBox";
import BragCard from "@/components/jobs/BragCard";
import { loadBrags } from "@/lib/bragDb";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import ShareHosp from "@/components/jobs/ShareHosp";
import { loadDistricts } from "@/lib/districtDb";
import Takedown from "@/components/jobs/Takedown";
import { aggregate, factKey, MIN_N } from "@/lib/hospFacts";
import { vKey } from "@/lib/hverify";
import { loadNps } from "@/lib/nps";
import { memoOnce } from "@/lib/memo";
import NpsBox from "@/components/jobs/NpsBox";
import NpsAdmin from "@/components/jobs/NpsAdmin";
import { ivKey, IV_LEVEL, IV_FEEL, type Interview } from "@/lib/interview";
import { PAY } from "@/lib/hospFacts";
import { dday } from "@/lib/jobs";
export const dynamic = "force-dynamic";

export default async function HospitalPage({ params, searchParams }: { params: { id: string }; searchParams: { write?: string; checked?: string; t?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: h }, { data: revs }] = await Promise.all([
    d.from("hospitals").select("*").eq("id", id).maybeSingle(),
    d.from("hospital_reviews").select("*").eq("hospital_id", id).eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  if (h && memoOnce(`hv:${id}:${s.id}`, 3600000)) d.from("events").insert({ kind: "hview", user_id: s.id, text: String(id) }).then(() => {}, () => {});
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원 리뷰</Link><div className="empty">없는 병원이에요.</div></div>;
  const { data: myHidden } = await d.from("hospital_reviews").select("id").eq("hospital_id", id).eq("user_id", s.id).eq("hidden", true).maybeSingle();
  const { count: blindN } = await d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("hospital_id", id).eq("hidden", true);
  const rs = (revs ?? []).sort((a, b) => Number(b.verified) - Number(a.verified)), mine = rs.find(r => r.user_id === s.id);
  const { data: myProof } = mine ? await d.from("review_proofs").select("status").eq("review_id", mine.id).eq("status", "pending").maybeSingle() : { data: null };
  const proofState = mine?.verified ? "verified" : myProof ? "pending" : null;
  const vN = rs.filter(r => r.verified).length;
  const { data: myJobs } = await d.from("jobs").select("id,dept,emp_type,deadline,welfare,author:users!jobs_author_id_fkey(username)").eq("closed", false).eq("hidden", false).eq("hospital", h.name).eq("region", h.region).limit(30);
  const cur = rs.filter(r => r.status === "재직").length;
  const [facts, { data: myFact }, brags] = await Promise.all([loadFacts([id]), d.from("game_state").select("user_id").eq("user_id", s.id).eq("game", factKey(id)).maybeSingle(), loadBrags(s.id, { hid: id })]);
  const { data: myV } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", vKey(id)).maybeSingle(); const vstat = (myV?.state as any)?.status ?? null; const [contributed, distm, npsm] = await Promise.all([hasContributed(s.id, s.role), loadDistricts([id]), loadNps([id])]); const nps = npsm[id]; const locked = !contributed, gu = distm[id]; const fa = facts[id] ?? aggregate([]); const score = fa.starN >= (fa.need ?? MIN_N) ? fa.overallAvg : rs.length ? overall(rs) : 0;
  const t = ["pay", "intv", "welfare", "jobs"].includes(searchParams.t ?? "") ? searchParams.t! : "rev";
  const [{ data: ivRows }, { data: hfRows }] = await Promise.all([d.from("game_state").select("user_id,state").eq("game", ivKey(id)).limit(500), d.from("game_state").select("state").eq("game", factKey(id)).limit(1000)]);
  const ivs = (ivRows ?? []).map(r => ({ uid: r.user_id, ...(r.state as Interview) })).sort((a, b) => b.at.localeCompare(a.at)), myIv = ivs.some(x => x.uid === s.id);
  const need = fa.need ?? MIN_N, payByDept = Object.entries((hfRows ?? []).map(r => r.state as any).filter(x => x?.pay).reduce((m: Record<string, string[]>, x) => ((m[x.dept ?? "기타"] ??= []).push(x.pay), m), {})).filter(([, v]) => v.length >= need)
    .map(([k, v]) => { const idx = v.map(p => PAY.indexOf(p as any)).sort((a, b) => a - b); return { dept: k, n: v.length, mid: PAY[idx[Math.floor((idx.length - 1) / 2)]], lo: PAY[idx[0]], hi: PAY[idx[idx.length - 1]] }; });
  const tabHref = (k: string) => `/hospitals/${id}${k === "rev" ? "" : `?t=${k}`}`;
  const welfStar = fa.stars.find(x => x.k === "welfare"), revWelf = rs.length ? avg(rs, "r_welfare") : 0;
  return (
    <div className="detail hs-detail">
      <div className="hh">
        <div className="hh-top"><Link href="/hospitals" className="hh-back" aria-label="뒤로">‹</Link><ShareHosp hid={id} name={h.name} /></div>
        <div className="hh-badges">{!!myJobs?.length && <a href={tabHref("jobs")} className="hh-b job">💼 채용 중 {myJobs.length}</a>}{(fa.verified + vN) > 0 && <span className="hh-b vf">✅ 인증 {fa.verified + vN}</span>}</div>
        <div className="hh-name"><span className="hh-logo">🏥</span><div><h2>{h.name}</h2><small>{h.region}{gu ? ` ${gu}` : ""} · {h.kind} <LiveViewers kind="hospital" id={String(id)} /></small></div></div>
        <div className="hh-score">★ <b>{score ? score.toFixed(1) : "-"}</b><small>{fa.n ? `실체 체크 ${fa.n}` : ""}{fa.n && rs.length ? " · " : ""}{rs.length ? `리뷰 ${rs.length}` : ""}{!fa.n && !rs.length ? "아직 평가 없음" : ""}</small></div>
      </div>
      <nav className="hh-tabs">{([["rev", `리뷰 ${rs.length + fa.n || ""}`], ["pay", "급여"], ["intv", `면접 ${ivs.length || ""}`], ["welfare", "복지·자랑"], ["jobs", `채용 ${myJobs?.length || ""}`]] as [string, string][]).map(([k, n]) => <Link key={k} href={tabHref(k)} className={t === k ? "on" : ""} scroll={false}>{n}</Link>)}</nav>
      {searchParams.checked && <div className="fb-thanks">🙏 고마워요! 다음에 이 병원 지원할 누군가가 덕분에 덜 막막할 거예요. <b>+50 XP</b>{vstat !== "approved" && <> · <Link href={`/hospitals/verify?id=${id}`} className="link"><b>✅ 명찰/서류로 인증하면 더 믿을 만해져요 →</b></Link></>}</div>}
      {t === "rev" && <>
      <FactBox a={fa} hid={id} mine={!!myFact} vstat={vstat} locked={locked} />
      <div className="hs-summary" id="rev">
        <div className="hs-big"><b>{rs.length ? overall(rs).toFixed(1) : "-"}</b><span className="hs-stars">{stars(overall(rs))}</span><small className="muted">리뷰 {rs.length}개 · ✅ 인증 {vN} · 재직 {cur} / 퇴사 {rs.length - cur}</small></div>
        <div className="hs-bars big">{RATING_KEYS.map(k => <span key={k.key} className="hs-bar"><i>{k.icon} {k.name}</i><em style={{ width: `${avg(rs, k.key) / 5 * 100}%` }} /><small>{avg(rs, k.key).toFixed(1)}</small></span>)}</div>
      </div>
      {myHidden ? <div className="card fb-wait"><b>🔎 내 리뷰는 신고가 들어와 검토 중이에요</b><p>운영팀이 확인하는 동안(최대 30일) 다른 사람에게 보이지 않고, 수정도 잠시 막혀요. 결과는 알림으로 알려드려요.</p></div> : <details className="card ss-details" open={!!searchParams.write || rs.length === 0}><summary><b>{mine ? "✏️ 내 리뷰 수정" : "⭐ 리뷰 쓰기"}</b> <span className="muted">— 닉네임 비공개, +40 XP</span></summary><ReviewForm hospital={{ id: h.id, name: h.name, region: h.region }} dept={s.dept} mine={mine} proofState={proofState as any} /></details>}
      {(blindN ?? 0) > 0 && <div className="rv-blind">🔒 신고·권리침해 요청으로 <b>{blindN}개</b> 리뷰가 운영팀 검토 중이라 잠시 가려져 있어요 (최대 30일). 검토 후 다시 보이거나 삭제돼요.</div>}
      <div className="hs-revs">{rs.map(r => <div key={r.id} className={"hs-rev" + (r.user_id === s.id ? " mine" : "")}>
        <div className="meta">{r.verified ? <span className="tag vf">✅ 재직 인증</span> : <span className="tag" style={{ opacity: .6 }}>미인증</span>}<span className="tag">{r.dept}</span><span className={"tag " + (r.status === "재직" ? "cur" : "")}>{r.status}</span><b style={{ color: "#C98A00" }}>★ {overall([r]).toFixed(1)}</b><span className="time">{r.created_at.slice(0, 7).replace("-", "년 ")}월</span>{r.user_id === s.id && <span className="tag">내 리뷰</span>}</div>
        <div className="hs-mini">{RATING_KEYS.map(k => <span key={k.key} title={k.name}>{k.icon}{r[k.key]}</span>)}</div>
        {locked && r.user_id !== s.id ? <div className="rv-lock"><div className="fb-blur"><div className="hs-pc"><b>👍 장점</b><p>{"이 병원의 좋은 점에 대한 현직자의 솔직한 이야기가 여기에 있어요. 체크 하나면 볼 수 있어요."}</p></div><div className="hs-pc"><b>👎 단점</b><p>{"아쉬운 점과 입사 전에 알았으면 좋았을 이야기가 여기에 있어요."}</p></div></div>
          <div className="rv-lockmsg"><b>체크 하나 남기고 6개월간 모든 리뷰를 자유롭게</b><Link href="/hospitals/check" className="btn">🔎 체크하고 전체 보기</Link></div></div>
        : <><div className="hs-pc"><b>👍 장점</b><p>{r.pros}</p></div>
        <div className="hs-pc"><b>👎 단점</b><p>{r.cons}</p></div>
        {r.tip && <div className="hs-pc tip"><b>💡 팁</b><p>{r.tip}</p></div>}</>}
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>{r.user_id === s.id || s.role === "admin" ? <ReviewDelete id={r.id} /> : <ReportButton kind="review" id={String(r.id)} />}</div>
      </div>)}</div>
      </>}
      {t === "pay" && <>
      <NpsBox n={nps} />
      {s.role === "admin" && <NpsAdmin hid={id} linked={!!nps} />}
        <div className="fb"><div className="fb-h"><b>💰 직종별 세후 실수령</b><span>{need}명 이상 모인 직종만</span></div>
          {payByDept.length ? (locked ? <div className="fb-lockmsg"><b>🔒 체크 하나 남기고 6개월간 모든 병원 급여 보기</b><Link href="/hospitals/check" className="btn">🔎 체크하고 보기</Link></div>
            : payByDept.map(x => <div key={x.dept} className="fb-risk" style={{ background: "var(--bg)" }}><span>{x.dept} <small className="muted">({x.n}명 · {x.lo}~{x.hi})</small></span><em style={{ color: "#1F7A4C" }}>보통 {x.mid}만</em></div>))
            : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 직종별로 공개할 만큼 모이지 않았어요.</p>}
          <Link href={`/hospitals/check?id=${id}`} className="btn ghost" style={{ justifySelf: "start" }}>💰 내 실수령 알려주기</Link></div>
      </>}
      {t === "intv" && <div className="iv-sec">
        {ivs.length > 0 && <div className="fb-head"><div><b>{(ivs.reduce((a, b) => a + b.level, 0) / ivs.length).toFixed(1)}</b><span>난이도 (5점)</span></div><div><b>{Math.round(ivs.filter(x => x.result === "합격").length / ivs.length * 100)}%</b><span>합격 후기</span></div><div><b>{Math.round(ivs.filter(x => x.feel === 0).length / ivs.length * 100)}%</b><span>😊 좋은 경험</span></div></div>}
        <Link href={`/hospitals/interview?id=${id}`} className="btn">{myIv ? "✏️ 내 면접 후기 수정" : "🎤 면접 후기 남기기 +30"}</Link>
        {!ivs.length ? <p className="muted" style={{ fontSize: 13 }}>아직 면접 후기가 없어요. 면접 본 적 있다면 받은 질문을 남겨주세요. 다음 지원자에게 제일 큰 도움이 돼요.</p>
          : ivs.map((x, i) => <article key={i} className="rf-item"><div className="rf-meta">{[x.dept, `${x.year}년`, x.route, x.result].join("  |  ")}</div>
            <div className="iv-tags"><span>난이도 {IV_LEVEL[x.level - 1]}</span><span>{IV_FEEL[x.feel]}</span>{x.steps.map(st => <span key={st}>{st}</span>)}</div>
            {locked && x.uid !== s.id ? <div className="rf-lock"><p className="rf-pc fb-blur"><em className="g">질문</em>1분 자기소개와 지원 동기, 그리고 이 병원만의 단골 질문이 여기에 있어요</p><Link href="/hospitals/check" className="btn">체크 하나 남기고 면접 후기 보기</Link></div>
              : <><p className="rf-pc"><em className="g">질문</em><span style={{ whiteSpace: "pre-wrap" }}>{x.q}</span></p>{x.tip && <p className="rf-pc"><em className="b" style={{ background: "#FFF3C4", color: "#7A5200" }}>팁</em>{x.tip}</p>}</>}
          </article>)}
      </div>}
      {t === "welfare" && <>
        <div className="fb-head">{welfStar && fa.starN >= need && <div><b>{welfStar.avg.toFixed(1)}</b><span>🎁 복지 별점(체크)</span></div>}{rs.length > 0 && <div><b>{revWelf.toFixed(1)}</b><span>🎁 복지 별점(리뷰)</span></div>}<div><b>{brags.length}</b><span>🏆 자랑</span></div></div>
      <div className="bg-sec" id="brag"><div className="bg-sec-h"><b>🏆 현직자 자랑 {brags.length || ""}</b><Link href={`/hospitals/brag/new?id=${id}`} className="link">📸 자랑하기</Link></div>
        {brags.length ? <div className="bg-row">{brags.map(b => <BragCard key={b.owner} b={b} me={s.id} admin={s.role === "admin"} showHosp={false} />)}</div> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>이 병원 다니는데 자랑할 게 있다면 사진 한 장 올려주세요.</p>}</div>
      </>}
      {t === "jobs" && <div className="sal-list">{myJobs?.length ? myJobs.map((j: any) => <Link key={j.id} href={`/jobs/${j.id}`} className="sal-row"><b>💼</b><div><strong>{(j.author as any)?.username === "mw_bot" ? (j.welfare || j.dept) : `${j.dept} ${j.emp_type} 모집`}</strong><small>{j.dept} · {j.emp_type}</small></div><em>{dday(j.deadline)}</em></Link>)
        : <div style={{ padding: 14 }}><p className="muted" style={{ margin: "0 0 8px", fontSize: 13 }}>지금 이 병원 채용 공고가 없어요.</p><Link href="/jobs/new?tip=1" className="btn ghost">🤫 이 병원 공고 봤어요 (제보)</Link></div>}</div>}
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>리뷰는 작성자 개인의 경험이에요. 사실과 다르거나 특정인을 비방하는 리뷰는 신고해주세요 — 즉시 블라인드 후 운영팀이 확인해요.</div>
      <Takedown hid={id} />
    </div>
  );
}
