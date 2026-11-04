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
export const dynamic = "force-dynamic";

export default async function HospitalPage({ params, searchParams }: { params: { id: string }; searchParams: { write?: string; checked?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: h }, { data: revs }] = await Promise.all([
    d.from("hospitals").select("*").eq("id", id).maybeSingle(),
    d.from("hospital_reviews").select("*").eq("hospital_id", id).eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  if (h && memoOnce(`hv:${id}:${s.id}`, 3600000)) d.from("events").insert({ kind: "hview", user_id: s.id, text: String(id) }).then(() => {}, () => {});
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원 리뷰</Link><div className="empty">없는 병원이에요.</div></div>;
  const { data: myHidden } = await d.from("hospital_reviews").select("id").eq("hospital_id", id).eq("user_id", s.id).eq("hidden", true).maybeSingle();
  const rs = (revs ?? []).sort((a, b) => Number(b.verified) - Number(a.verified)), mine = rs.find(r => r.user_id === s.id);
  const { data: myProof } = mine ? await d.from("review_proofs").select("status").eq("review_id", mine.id).eq("status", "pending").maybeSingle() : { data: null };
  const proofState = mine?.verified ? "verified" : myProof ? "pending" : null;
  const vN = rs.filter(r => r.verified).length;
  const { data: myJobs } = await d.from("jobs").select("id,dept,emp_type").eq("closed", false).eq("hidden", false).eq("hospital", h.name).eq("region", h.region).limit(3);
  const cur = rs.filter(r => r.status === "재직").length;
  const [facts, { data: myFact }, brags] = await Promise.all([loadFacts([id]), d.from("game_state").select("user_id").eq("user_id", s.id).eq("game", factKey(id)).maybeSingle(), loadBrags(s.id, { hid: id })]);
  const { data: myV } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", vKey(id)).maybeSingle(); const vstat = (myV?.state as any)?.status ?? null; const [contributed, distm, npsm] = await Promise.all([hasContributed(s.id, s.role), loadDistricts([id]), loadNps([id])]); const nps = npsm[id]; const locked = !contributed, gu = distm[id]; const fa = facts[id] ?? aggregate([]); const score = fa.starN >= MIN_N ? fa.overallAvg : rs.length ? overall(rs) : 0;
  return (
    <div className="detail hs-detail">
      <div className="hh">
        <div className="hh-top"><Link href="/hospitals" className="hh-back" aria-label="뒤로">‹</Link><ShareHosp hid={id} name={h.name} /></div>
        <div className="hh-badges">{!!myJobs?.length && <a href="#jobs" className="hh-b job">💼 채용 중 {myJobs.length}</a>}{(fa.verified + vN) > 0 && <span className="hh-b vf">✅ 인증 {fa.verified + vN}</span>}</div>
        <div className="hh-name"><span className="hh-logo">🏥</span><div><h2>{h.name}</h2><small>{h.region}{gu ? ` ${gu}` : ""} · {h.kind} <LiveViewers kind="hospital" id={String(id)} /></small></div></div>
        <div className="hh-score">★ <b>{score ? score.toFixed(1) : "-"}</b><small>{fa.n ? `실체 체크 ${fa.n}` : ""}{fa.n && rs.length ? " · " : ""}{rs.length ? `리뷰 ${rs.length}` : ""}{!fa.n && !rs.length ? "아직 평가 없음" : ""}</small></div>
      </div>
      <nav className="hh-tabs"><a href="#sum">요약</a><a href="#rev">리뷰 {rs.length || ""}</a><a href="#brag">자랑 {brags.length || ""}</a><a href="#jobs">채용 {myJobs?.length || ""}</a></nav>
      <div id="sum" />
      {searchParams.checked && <div className="fb-thanks">🙏 고마워요! 다음에 이 병원 지원할 누군가가 덕분에 덜 막막할 거예요. <b>+50 XP</b>{vstat !== "approved" && <> · <Link href={`/hospitals/verify?id=${id}`} className="link"><b>✅ 명찰/서류로 인증하면 더 믿을 만해져요 →</b></Link></>}</div>}
      <NpsBox n={nps} />
      {s.role === "admin" && <NpsAdmin hid={id} linked={!!nps} />}
      <FactBox a={fa} hid={id} mine={!!myFact} vstat={vstat} locked={locked} />
      <div className="bg-sec" id="brag"><div className="bg-sec-h"><b>🏆 현직자 자랑 {brags.length || ""}</b><Link href={`/hospitals/brag/new?id=${id}`} className="link">📸 자랑하기</Link></div>
        {brags.length ? <div className="bg-row">{brags.map(b => <BragCard key={b.owner} b={b} me={s.id} admin={s.role === "admin"} showHosp={false} />)}</div> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>이 병원 다니는데 자랑할 게 있다면 사진 한 장 올려주세요.</p>}</div>
      <div className="hs-summary" id="rev">
        <div className="hs-big"><b>{rs.length ? overall(rs).toFixed(1) : "-"}</b><span className="hs-stars">{stars(overall(rs))}</span><small className="muted">리뷰 {rs.length}개 · ✅ 인증 {vN} · 재직 {cur} / 퇴사 {rs.length - cur}</small></div>
        <div className="hs-bars big">{RATING_KEYS.map(k => <span key={k.key} className="hs-bar"><i>{k.icon} {k.name}</i><em style={{ width: `${avg(rs, k.key) / 5 * 100}%` }} /><small>{avg(rs, k.key).toFixed(1)}</small></span>)}</div>
      </div>
      <div id="jobs" />{!!myJobs?.length && <div className="jb-revlink">💼 이 병원 채용 중: {myJobs.map((j: any, i: number) => <Link key={j.id} href={`/jobs/${j.id}`} className="link">{i ? " · " : ""}{j.dept} {j.emp_type}</Link>)}</div>}
      {myHidden ? <div className="card fb-wait"><b>🔎 내 리뷰는 신고가 들어와 검토 중이에요</b><p>운영팀이 확인하는 동안(최대 30일) 다른 사람에게 보이지 않고, 수정도 잠시 막혀요. 결과는 알림으로 알려드려요.</p></div> : <details className="card ss-details" open={!!searchParams.write || rs.length === 0}><summary><b>{mine ? "✏️ 내 리뷰 수정" : "⭐ 리뷰 쓰기"}</b> <span className="muted">— 닉네임 비공개, +40 XP</span></summary><ReviewForm hospital={{ id: h.id, name: h.name, region: h.region }} dept={s.dept} mine={mine} proofState={proofState as any} /></details>}
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
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>리뷰는 작성자 개인의 경험이에요. 사실과 다르거나 특정인을 비방하는 리뷰는 신고해주세요 — 즉시 블라인드 후 운영팀이 확인해요.</div>
      <Takedown hid={id} />
    </div>
  );
}
