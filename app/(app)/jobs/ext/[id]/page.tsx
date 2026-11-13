import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { EXT_JOBS, extSrc, extTags, splitArea, extCheckedLabel } from "@/lib/extJobs";
import { tagLabel } from "@/lib/jobTags";
import Avatar from "@/components/Avatar";
import JobComments from "@/components/jobs/JobComments";
import { jobKey } from "@/lib/jobComments";
export const dynamic = "force-dynamic";
export function generateMetadata({ params }: { params: { id: string } }) { const e = EXT_JOBS.find(x => x.id === Number(params.id)); return { title: e ? `${e.h} ${e.dept} 공고` : "공고" }; }
/** 🔗 외부(메디잡 등) 공고 요약 + 익명 댓글. 지원은 원문으로 */
export default async function ExtJobPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const e = EXT_JOBS.find(x => x.id === Number(params.id)); if (!e) notFound();
  const { data: h } = await db().from("hospitals").select("id").eq("name", e.h).maybeSingle(); const a = splitArea(e.area);
  return <div className="detail jd">
    <Link className="link" href="/jobs">← 채용</Link>
    <div className="jd-head"><Avatar name={e.h} size={52} /><div><span className={"ex-src s-" + extSrc(e)}>{extSrc(e)}</span><h2 style={{ margin: "2px 0" }}>{e.h}</h2><div className="muted">{e.dept}</div></div></div>
    <section className="jd-body"><h3>근무 조건</h3><div className="jd-kv"><div><b>지역</b>{a.r}{a.st ? ` · ${a.st}` : ""}</div><div><b>근무</b>{e.time}</div><div><b>급여</b>{e.pay}</div><div><b>마감</b>{e.until ?? `채용 시 마감 (${extCheckedLabel()})`}</div></div>
      {extTags(e.id).length > 0 && <div className="jb3-tags" style={{ marginTop: 8 }}>{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}
      <p style={{ margin: "10px 0 0" }}>☀️ {e.note}{e.warn ? ` · ⚠️ ${e.warn}` : ""}</p></section>
    <Link href={h ? `/hospitals/${h.id}` : `/search?q=${encodeURIComponent(e.h.replace(/\s.*$/, ""))}`} className="ex-real"><span aria-hidden="true">👀</span><div><b>이 병원 세후 실수령 & 고용안정성 신호등 보기</b><small>다녀본 사람들의 정규직 전환율·실수령·퇴근 시간</small></div><em>›</em></Link>
    <Link href={h ? `/hospitals/${h.id}?t=intv` : `/hospitals/interview?ext=${e.id}`} className="ex-real ex-iv"><span aria-hidden="true">🎤</span><div><b>이 병원 면접 질문 & 분위기 후기</b><small>면접 가봤다면 1분 만에 후기 남기기 · 합격/불합격/대기중</small></div><em>›</em></Link>
    <div className="jd-apply"><a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="btn">{extSrc(e)} 원문 지원하기 ↗</a></div>
    <JobComments jk={jobKey("x", e.id)} me={s.id} admin={s.role === "admin"} back={`/jobs/ext/${e.id}`} />
    <div className="muted" style={{ fontSize: 12 }}>공고 내용은 {extSrc(e)} 원문을 요약한 거예요. 지원 전 원문과 근로계약서를 꼭 확인하세요.</div>
  </div>;
}
