import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { RATING_KEYS, avg, overall, stars } from "@/lib/jobs";
import ReviewForm from "@/components/jobs/ReviewForm";
import ReportButton from "@/components/ReportButton";
import { ReviewDelete } from "@/components/jobs/Buttons";
export const dynamic = "force-dynamic";

export default async function HospitalPage({ params, searchParams }: { params: { id: string }; searchParams: { write?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: h }, { data: revs }] = await Promise.all([
    d.from("hospitals").select("*").eq("id", id).maybeSingle(),
    d.from("hospital_reviews").select("*").eq("hospital_id", id).eq("hidden", false).order("created_at", { ascending: false }),
  ]);
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원 리뷰</Link><div className="empty">없는 병원이에요.</div></div>;
  const rs = (revs ?? []).sort((a, b) => Number(b.verified) - Number(a.verified)), mine = rs.find(r => r.user_id === s.id);
  const { data: myProof } = mine ? await d.from("review_proofs").select("status").eq("review_id", mine.id).eq("status", "pending").maybeSingle() : { data: null };
  const proofState = mine?.verified ? "verified" : myProof ? "pending" : null;
  const vN = rs.filter(r => r.verified).length;
  const { data: myJobs } = await d.from("jobs").select("id,dept,emp_type").eq("closed", false).eq("hidden", false).ilike("hospital", h.name).limit(3);
  const cur = rs.filter(r => r.status === "재직").length;
  return (
    <div className="detail hs-detail">
      <Link className="link" href="/hospitals">← 병원 리뷰</Link>
      <h2 style={{ margin: "8px 0 2px" }}>{h.name}</h2><div className="muted" style={{ fontSize: 13 }}>📍 {h.region} · {h.kind}</div>
      <div className="hs-summary">
        <div className="hs-big"><b>{rs.length ? overall(rs).toFixed(1) : "-"}</b><span className="hs-stars">{stars(overall(rs))}</span><small className="muted">리뷰 {rs.length}개 · ✅ 인증 {vN} · 재직 {cur} / 퇴사 {rs.length - cur}</small></div>
        <div className="hs-bars big">{RATING_KEYS.map(k => <span key={k.key} className="hs-bar"><i>{k.icon} {k.name}</i><em style={{ width: `${avg(rs, k.key) / 5 * 100}%` }} /><small>{avg(rs, k.key).toFixed(1)}</small></span>)}</div>
      </div>
      {!!myJobs?.length && <div className="jb-revlink">💼 이 병원 채용 중: {myJobs.map((j: any, i: number) => <Link key={j.id} href={`/jobs/${j.id}`} className="link">{i ? " · " : ""}{j.dept} {j.emp_type}</Link>)}</div>}
      <details className="card ss-details" open={!!searchParams.write || rs.length === 0}><summary><b>{mine ? "✏️ 내 리뷰 수정" : "⭐ 리뷰 쓰기"}</b> <span className="muted">— 닉네임 비공개, +40 XP</span></summary><ReviewForm hospital={{ id: h.id, name: h.name, region: h.region }} dept={s.dept} mine={mine} proofState={proofState as any} /></details>
      <div className="hs-revs">{rs.map(r => <div key={r.id} className={"hs-rev" + (r.user_id === s.id ? " mine" : "")}>
        <div className="meta">{r.verified ? <span className="tag vf">✅ 재직 인증</span> : <span className="tag" style={{ opacity: .6 }}>미인증</span>}<span className="tag">{r.dept}</span><span className={"tag " + (r.status === "재직" ? "cur" : "")}>{r.status}</span><b style={{ color: "#C98A00" }}>★ {overall([r]).toFixed(1)}</b><span className="time">{fmt(r.created_at)}</span>{r.user_id === s.id && <span className="tag">내 리뷰</span>}</div>
        <div className="hs-mini">{RATING_KEYS.map(k => <span key={k.key} title={k.name}>{k.icon}{r[k.key]}</span>)}</div>
        <div className="hs-pc"><b>👍 장점</b><p>{r.pros}</p></div>
        <div className="hs-pc"><b>👎 단점</b><p>{r.cons}</p></div>
        {r.tip && <div className="hs-pc tip"><b>💡 팁</b><p>{r.tip}</p></div>}
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>{r.user_id === s.id || s.role === "admin" ? <ReviewDelete id={r.id} /> : <ReportButton kind="review" id={String(r.id)} />}</div>
      </div>)}</div>
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>리뷰는 작성자 개인의 경험이에요. 사실과 다르거나 특정인을 비방하는 리뷰는 신고해주세요 — 즉시 블라인드 후 운영팀이 확인해요.</div>
    </div>
  );
}
