import Link from "next/link";
import { getSession } from "@/lib/auth";
import { loadResume, loadMyApplies, resumeText, statusOf } from "@/lib/resume";
import { JOB_DEPTS, JOB_REGIONS } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import { ago } from "@/lib/format";
import { ResumeForm, ResumeCopy } from "@/components/jobs/ResumeForms";
import { deleteResume } from "@/lib/resume.actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
export const metadata = { title: "내 이력서 · 간편 지원" };
export const dynamic = "force-dynamic";
/** 📄 내 이력서 — 1분 작성해 두면 직접 올라온 공고에 버튼 한 번으로 지원. 아래에 내 지원 현황 */
export default async function ResumePage({ searchParams }: { searchParams: { back?: string } }) {
  const s = (await getSession())!;
  const back = /^\/jobs\/(?:\d+|ext\/\d+)$/.test(searchParams.back ?? "") ? searchParams.back! : "";
  const [r, apps] = await Promise.all([loadResume(s.id), loadMyApplies(s.id)]);
  const chip = (st: string) => { const x = statusOf(st); return <span className={"iv-chip " + (x.k === "interview" ? "ok" : x.k === "no" ? "no" : "wait")}>{x.seeker}</span>; };
  return <div className="detail cv">
    <Link className="link" href={back || "/jobs"}>← {back ? "공고" : "채용"}</Link>
    <div className="sk-hero">
      <span className="sk-badge">📄 내 이력서</span>
      <h2>한 번 써두면, 공고에서 버튼 한 번으로 지원</h2>
      <p className="muted">이름·연락처·경력만 적으면 끝. 지원한 공고 작성자에게만 전달되고, 지원 취소하면 바로 지워져요.</p>
    </div>

    {back && <div className="cv-back">이 공고에 지원하려면 이력서만 있으면 돼요. 저장하고 <b>공고로 돌아가서 바로 지원</b>하세요.
      <Link href={back} className="link">공고로 가기 ›</Link></div>}

    <section className="card sk-me">
      <div className="cv-head">{r
        ? <><b>📄 내 이력서 · {r.name}</b><span className="muted">{deptLabel(r.dept)} · {r.years} · {r.want} · {r.region}</span></>
        : <><b>📄 내 이력서</b><span className="muted">아직 없어요 — 1분이면 끝나요</span></>}</div>
      <h3 style={{ margin: "0 0 10px" }}>{r ? "이력서 수정" : "이력서 만들기"}</h3>
      <div className="cv-body"><ResumeForm v={r} depts={JOB_DEPTS} regions={JOB_REGIONS} myDept={s.dept} back={back} /></div>
      {r && <div className="cv-tools">
        <form action={deleteResume}><ConfirmSubmit msg="이력서를 삭제할까요? 이미 보낸 지원서는 그대로 남아요.">🗑️ 이력서 삭제</ConfirmSubmit></form>
      </div>}
    </section>

    {r && <section className="card">
      <h3 style={{ margin: "0 0 6px" }}>📋 저장된 이력서 내용 <small className="muted">· 메디잡 등 외부 사이트에 붙여넣기</small></h3>
      <ResumeCopy text={resumeText(r)} />
    </section>}

    <section className="card" id="apps">
      <h3 style={{ margin: "0 0 10px" }}>📨 내가 지원한 공고 <b>{apps.length}</b></h3>
      {apps.length ? <div className="cv-apps">{apps.map(a => <Link key={a.jobId} href={`/jobs/${a.jobId}`} className="cv-app">
        <div className="cv-app-t"><b>{a.job?.hospital ?? "공고"}</b><span>{a.job ? deptLabel(a.job.dept) : ""}{a.job?.closed ? " · 마감" : ""}</span></div>
        <div className="cv-app-f">{chip(a.status)}<small className="muted">{ago(a.at)} 지원</small></div>
      </Link>)}</div>
        : <p className="muted" style={{ margin: 0, fontSize: 13 }}>{r ? "아직 지원한 공고가 없어요. 채용관에서 공고를 열고 [🚀 내 이력서로 바로 지원]을 눌러보세요." : "이력서를 먼저 저장하면 지원한 공고가 여기에 쌓여요."}
          <Link href="/jobs" className="link" style={{ marginLeft: 6 }}>채용관 가기 ›</Link></p>}
      <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>상태는 공고 작성자(병원)가 바꿔요. 바뀌면 알림으로 알려드려요. 지원을 취소하면 병원 목록에서도 바로 사라져요.</p>
    </section>
  </div>;
}
