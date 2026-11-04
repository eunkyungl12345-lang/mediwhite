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
import { aggregate, factKey } from "@/lib/hospFacts";
import { vKey } from "@/lib/hverify";
export const dynamic = "force-dynamic";

export default async function HospitalPage({ params, searchParams }: { params: { id: string }; searchParams: { write?: string; checked?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: h }, { data: revs }] = await Promise.all([
    d.from("hospitals").select("*").eq("id", id).maybeSingle(),
    d.from("hospital_reviews").select("*").eq("hospital_id", id).eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원 리뷰</Link><div className="empty">없는 병원이에요.</div></div>;
  const { data: myHidden } = await d.from("hospital_reviews").select("id").eq("hospital_id", id).eq("user_id", s.id).eq("hidden", true).maybeSingle();
  const rs = (revs ?? []).sort((a, b) => Number(b.verified) - Number(a.verified)), mine = rs.find(r => r.user_id === s.id);
  const { data: myProof } = mine ? await d.from("review_proofs").select("status").eq("review_id", mine.id).eq("status", "pending").maybeSingle() : { data: null };
  const proofState = mine?.verified ? "verified" : myProof ? "pending" : null;
  const vN = rs.filter(r => r.verified).length;
  const { data: myJobs } = await d.from("jobs").select("id,dept,emp_type").eq("closed", false).eq("hidden", false).eq("hospital", h.name).eq("region", h.region).limit(3);
  const cur = rs.filter(r => r.status === "재직").length;
  const [facts, { data: myFact }, brags] = await Promise.all([loadFacts([id]), d.from("game_state").select("user_id").eq("user_id", s.id).eq("game", factKey(id)).maybeSingle(), loadBrags(s.id, { hid: id })]);
  const { data: myV } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", vKey(id)).maybeSingle(); const vstat = (myV?.state as any)?.status ?? null; const [contributed, distm] = await Promise.all([hasContributed(s.id, s.role), loadDistricts([id])]); const locked = !contributed, gu = distm[id];
  return (
    <div className="detail hs-detail">
      <Link className="link" href="/hospitals">← 병원 리뷰</Link>
      <h2 style={{ margin: "8px 0 2px" }}>{h.name}</h2><div className="muted" style={{ fontSize: 13 }}>📍 {h.region}{gu ? ` ${gu}` : ""} · {h.kind} <LiveViewers kind="hospital" id={String(id)} /></div>
      {searchParams.checked && <div className="fb-thanks">🙏 고마워요! 다음에 이 병원 지원할 누군가가 덕분에 덜 막막할 거예요. <b>+50 XP</b>{vstat !== "approved" && <> · <Link href={`/hospitals/verify?id=${id}`} className="link"><b>✅ 명찰/서류로 인증하면 더 믿을 만해져요 →</b></Link></>}</div>}
      <FactBox a={facts[id] ?? aggregate([])} hid={id} mine={!!myFact} vstat={vstat} locked={locked} />
      <div className="row" style={{ justifyContent: "flex-end" }}><ShareHosp hid={id} name={h.name} /></div>
      <div className="bg-sec"><div className="bg-sec-h"><b>🏆 현직자 자랑 {brags.length || ""}</b><Link href={`/hospitals/brag/new?id=${id}`} className="link">📸 자랑하기</Link></div>
        {brags.length ? <div className="bg-row">{brags.map(b => <BragCard key={b.owner} b={b} me={s.id} admin={s.role === "admin"} showHosp={false} />)}</div> : <p className="muted" style={{ fontSize: 13, margin: 0 }}>이 병원 다니는데 자랑할 게 있다면 사진 한 장 올려주세요.</p>}</div>
      <div className="hs-summary">
        <div className="hs-big"><b>{rs.length ? overall(rs).toFixed(1) : "-"}</b><span className="hs-stars">{stars(overall(rs))}</span><small className="muted">리뷰 {rs.length}개 · ✅ 인증 {vN} · 재직 {cur} / 퇴사 {rs.length - cur}</small></div>
        <div className="hs-bars big">{RATING_KEYS.map(k => <span key={k.key} className="hs-bar"><i>{k.icon} {k.name}</i><em style={{ width: `${avg(rs, k.key) / 5 * 100}%` }} /><small>{avg(rs, k.key).toFixed(1)}</small></span>)}</div>
      </div>
      {!!myJobs?.length && <div className="jb-revlink">💼 이 병원 채용 중: {myJobs.map((j: any, i: number) => <Link key={j.id} href={`/jobs/${j.id}`} className="link">{i ? " · " : ""}{j.dept} {j.emp_type}</Link>)}</div>}
      {myHidden ? <div className="card fb-wait"><b>🔎 내 리뷰는 신고가 들어와 검토 중이에요</b><p>운영팀이 확인하는 동안(최대 30일) 다른 사람에게 보이지 않고, 수정도 잠시 막혀요. 결과는 알림으로 알려드려요.</p></div> : <details className="card ss-details" open={!!searchParams.write || rs.length === 0}><summary><b>{mine ? "✏️ 내 리뷰 수정" : "⭐ 리뷰 쓰기"}</b> <span className="muted">— 닉네임 비공개, +40 XP</span></summary><ReviewForm hospital={{ id: h.id, name: h.name, region: h.region }} dept={s.dept} mine={mine} proofState={proofState as any} /></details>}
      <div className="hs-revs">{rs.map(r => <div key={r.id} className={"hs-rev" + (r.user_id === s.id ? " mine" : "")}>
        <div className="meta">{r.verified ? <span className="tag vf">✅ 재직 인증</span> : <span className="tag" style={{ opacity: .6 }}>미인증</span>}<span className="tag">{r.dept}</span><span className={"tag " + (r.status === "재직" ? "cur" : "")}>{r.status}</span><b style={{ color: "#C98A00" }}>★ {overall([r]).toFixed(1)}</b><span className="time">{r.created_at.slice(0, 7).replace("-", "년 ")}월</span>{r.user_id === s.id && <span className="tag">내 리뷰</span>}</div>
        <div className="hs-mini">{RATING_KEYS.map(k => <span key={k.key} title={k.name}>{k.icon}{r[k.key]}</span>)}</div>
        <div className="hs-pc"><b>👍 장점</b><p>{r.pros}</p></div>
        <div className="hs-pc"><b>👎 단점</b><p>{r.cons}</p></div>
        {r.tip && <div className="hs-pc tip"><b>💡 팁</b><p>{r.tip}</p></div>}
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>{r.user_id === s.id || s.role === "admin" ? <ReviewDelete id={r.id} /> : <ReportButton kind="review" id={String(r.id)} />}</div>
      </div>)}</div>
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>리뷰는 작성자 개인의 경험이에요. 사실과 다르거나 특정인을 비방하는 리뷰는 신고해주세요 — 즉시 블라인드 후 운영팀이 확인해요.</div>
      <Takedown hid={id} />
    </div>
  );
}
