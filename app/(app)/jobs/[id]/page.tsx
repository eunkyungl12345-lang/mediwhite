import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { dday, overall } from "@/lib/jobs";
import { memoOnce } from "@/lib/memo";
import ReportButton from "@/components/ReportButton";
import { JobOwnerButtons } from "@/components/jobs/Buttons";
export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const { data: j } = await d.from("jobs").select("*,author:users!jobs_author_id_fkey(id,nickname,dept,username)").eq("id", id).maybeSingle();
  if (!j || (j.hidden && s.role !== "admin")) return <div className="detail"><Link className="link" href="/jobs">← 채용</Link><div className="empty">없거나 블라인드된 공고예요.</div></div>;
  if (memoOnce(`jobv:${id}:${s.id}`, 3600000)) await d.from("jobs").update({ views: (j.views ?? 0) + 1 }).eq("id", id);
  const { data: hosp } = await d.from("hospitals").select("id,name,region").ilike("name", j.hospital).limit(1).maybeSingle();
  const { data: revs } = hosp ? await d.from("hospital_reviews").select("r_welfare,r_balance,r_pay,r_culture,r_growth").eq("hospital_id", hosp.id).eq("hidden", false) : { data: [] as any[] };
  const dd = dday(j.deadline), mine = j.author_id === s.id || s.role === "admin";
  const rows: [string, string | null][] = [["📍 지역", j.region], ["👩‍⚕️ 모집 직종", j.dept], ["📄 고용 형태", j.emp_type], ["💰 급여", j.pay], ["⏰ 근무 시간", j.hours], ["🎁 복지·혜택", j.welfare], ["📅 마감", j.deadline ? `${j.deadline} (${dd})` : "상시 채용"]];
  return (
    <div className="detail">
      <Link className="link" href="/jobs">← 채용</Link>
      <div className="jb-top" style={{ marginTop: 8 }}><span className="tag jb-dept">{j.dept}</span><span className="tag">{j.emp_type}</span><span className={"jb-dd" + (j.closed || dd === "마감" ? " end" : "")}>{j.closed ? "마감" : dd}</span></div>
      <h2 style={{ margin: "6px 0" }}>{j.hospital}</h2>
      <div className="meta"><span>{j.author ? `[${j.author.dept}]${j.author.nickname}` : "회원"}</span><span className="time">{fmt(j.created_at)}</span><span>👁 {j.views}</span></div>
      {hosp ? <Link href={`/hospitals/${hosp.id}`} className="jb-revlink">🏥 이 병원 리뷰 {revs?.length ? <>{revs.length}개 · 평균 <b>★ {overall(revs ?? [])}</b></> : "아직 없음 — 첫 리뷰 남기기"} →</Link> : <Link href={`/hospitals/new?name=${encodeURIComponent(j.hospital)}`} className="jb-revlink">🏥 이 병원 리뷰가 아직 없어요 — 다녀본 분이 첫 리뷰 남기기 →</Link>}
      <table className="jb-table"><tbody>{rows.filter(r => r[1]).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
      <div className="body" style={{ whiteSpace: "pre-wrap" }}>{j.body}</div>
      {j.contact && <div className="card jb-contact"><b>📮 지원 방법</b><div style={{ whiteSpace: "pre-wrap" }}>{j.contact}</div></div>}
      <div className="row" style={{ gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>{mine ? <JobOwnerButtons id={id} closed={j.closed} /> : <span />}<ReportButton kind="job" id={String(id)} /></div>
      <div className="muted" style={{ fontSize: 12 }}>⚠️ 지원 전 근로계약서·급여 조건을 꼭 서면으로 확인하세요. 선입금·개인정보(계좌·신분증) 먼저 요구하면 신고해주세요.</div>
    </div>
  );
}
