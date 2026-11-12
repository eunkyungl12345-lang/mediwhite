import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { dday, overall } from "@/lib/jobs";
import { memoOnce } from "@/lib/memo";
import { splitTags, tagLabel, SHARE_TAG, splitMeta, META } from "@/lib/jobTags";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import FactBox from "@/components/jobs/FactBox";
import { aggregate } from "@/lib/hospFacts";
import ReportButton from "@/components/ReportButton";
import LiveViewers from "@/components/LiveViewers";
import { JobOwnerButtons } from "@/components/jobs/Buttons";
import Avatar from "@/components/Avatar";
import { deptLabel } from "@/lib/depts";
import JobComments from "@/components/jobs/JobComments";
import { jobKey } from "@/lib/jobComments";
export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const { data: j } = await d.from("jobs").select("*,author:users!jobs_author_id_fkey(id,nickname,dept,username)").eq("id", id).maybeSingle();
  if (!j || (j.hidden && s.role !== "admin")) return <div className="detail"><Link className="link" href="/jobs">← 채용</Link><div className="empty">없거나 블라인드된 공고예요.</div></div>;
  const pub = j.author?.username === "mw_bot", { tags, rest } = splitTags(j.body), shared = tags.includes(SHARE_TAG);
  if (memoOnce(`jobv:${id}:${s.id}`, 3600000)) await Promise.all([d.from("jobs").update({ views: (j.views ?? 0) + 1 }).eq("id", id), d.from("events").insert({ kind: "jobview", user_id: s.id, text: `${j.dept}|${j.region}|${pub ? "pub" : shared ? "share" : "own"}|${id}` }).then(() => {}, () => {})]);
  const { data: hosp } = await d.from("hospitals").select("id,name,region").eq("name", j.hospital.trim()).eq("region", j.region).limit(1).maybeSingle();
  const { data: revs } = hosp ? await d.from("hospital_reviews").select("r_welfare,r_balance,r_pay,r_culture,r_growth").eq("hospital_id", hosp.id).eq("hidden", false) : { data: [] as any[] };
  const [facts, contributed] = await Promise.all([hosp ? loadFacts([hosp.id]) : Promise.resolve({} as Record<number, any>), hasContributed(s.id, s.role, hosp?.id)]);
  const dd = dday(j.deadline), mine = j.author_id === s.id || s.role === "admin";
  const { meta, text: rest2 } = splitMeta(rest);
  const bodyText = pub ? rest2.split("\n").filter(l => !/^🏛️ 공공기관 채용정보|^📌 /.test(l.trim())).join("\n").trim() : rest2;
  const ftags = tags.filter(t => t !== SHARE_TAG), career = ftags.includes("신규가능") ? "신규 가능" : ftags.includes("경력만") ? "경력만" : null;
  const title = pub ? (j.welfare || `${deptLabel(j.dept)} 채용`) : `${deptLabel(j.dept)} ${j.emp_type} 모집`, fa = hosp ? facts[hosp.id] ?? aggregate([]) : null;
  const score = fa && fa.starN >= (fa.need ?? 3) ? fa.overallAvg : revs?.length ? Number(overall(revs)) : 0;
  const I = (d: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />;
  const ic = { cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', job: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>', lvl: '<path d="M6 20v-4M12 20v-9M18 20V5"/>', emp: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', loc: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', pay: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S9 3 7 4.5 9 8 12 8zm0 0s3-5 5-3.5S15 8 12 8z"/>' };
  const rows: [string, string, React.ReactNode | null][] = [
    [ic.cal, "마감일", j.closed ? "마감" : j.deadline && dd !== "상시" ? <>{j.deadline.replaceAll("-", ".")} <em className="jd-dd">{dd}</em></> : "상시 채용"],
    [ic.job, "직무", deptLabel(j.dept)], [ic.lvl, "경력", career], [ic.emp, "고용형태", j.emp_type], [ic.loc, "근무지역", j.region],
    [ic.pay, "급여", j.pay], [ic.time, "근무시간", j.hours], [ic.gift, "복지", pub ? null : j.welfare]];
  const link = j.contact && /^https?:\/\//.test(j.contact);
  return (
    <div className="detail jd">
      <Link className="jd-back" href="/jobs" aria-label="채용 목록">‹</Link>
      <header className="jd-h"><Avatar name={j.hospital} size={52} /><div><h2>{title}</h2>
        <div className="jd-sub">{hosp ? <Link href={`/hospitals/${hosp.id}`}>{j.hospital}</Link> : <span>{j.hospital}</span>}<i>|</i><span>{j.region}</span>{score > 0 && <><i>|</i><b>★ {score.toFixed(1)}</b></>}</div></div></header>
      {Object.keys(meta).length > 0 && <section className="jd-facts">{META.filter(m => meta[m.k]).map(m => <div key={m.k}><span>{m.icon} {m.label}</span><b>{meta[m.k]}</b></div>)}</section>}
      <section className="jd-sum"><h3>요약</h3>{rows.filter(r => r[2]).map(([d, k, v]) => <div key={k} className="jd-row">{I(d)}<span>{k}</span><div>{v}</div></div>)}
        {ftags.filter(t => t !== "신규가능" && t !== "경력만").length > 0 && <div className="jd-tags">{ftags.filter(t => t !== "신규가능" && t !== "경력만").map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}</section>
      {bodyText.trim() && <section className="jd-body"><h3>상세 내용</h3><div style={{ whiteSpace: "pre-wrap" }}>{bodyText}</div></section>}
      {j.contact && !link && <section className="jd-body"><h3>지원 방법</h3><div style={{ whiteSpace: "pre-wrap" }}>{j.contact}</div></section>}
      <section className="jd-body"><h3>이 병원은 어때요?</h3>
        {hosp ? <Link href={`/hospitals/${hosp.id}`} className="jb-revlink">🏥 {j.hospital} 리뷰·급여·면접 보러 가기 →</Link> : <Link href="/hospitals/check" className="jb-revlink">🏥 아직 리뷰가 없어요. 다녀본 적 있다면 첫 리뷰를 남겨주세요 →</Link>}
        {hosp && fa && <FactBox a={fa} hid={hosp.id} mine={false} locked={!contributed} />}</section>
      <div className="jd-meta"><span>{pub ? "출처: 잡알리오(공공기관 채용정보)" : shared ? "회원 제보" : j.author ? `[${j.author.dept}]${j.author.nickname}` : "회원"} · {fmt(j.created_at)} · 조회 {j.views}</span><LiveViewers kind="job" id={String(id)} /></div>
      <div className="row" style={{ gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>{mine ? <JobOwnerButtons id={id} closed={j.closed} /> : <span />}<ReportButton kind="job" id={String(id)} /></div>
      <JobComments jk={jobKey("j", id)} me={s.id} admin={s.role === "admin"} back={`/jobs/${id}`} />
      <div className="muted" style={{ fontSize: 12 }}>⚠️ 지원 전 근로계약서·급여 조건을 꼭 서면으로 확인하세요. 선입금·개인정보(계좌·신분증) 먼저 요구하면 신고해주세요.</div>
      {!j.closed && (link ? <div className="jd-apply"><a href={`/api/jobout?id=${id}`} target="_blank" rel="noopener noreferrer" className="btn">{pub ? "원문 공고에서 지원하기" : "지원하기"}</a></div>
        : hosp ? <div className="jd-apply"><Link href={`/hospitals/${hosp.id}`} className="btn ghost">병원 리뷰 먼저 보기</Link></div> : null)}
    </div>
  );
}
