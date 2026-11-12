import { loadJobComments } from "@/lib/jobComments";
import { deleteJobComment } from "@/lib/jobComments.actions";
import { deptLabel } from "@/lib/depts";
import { ago } from "@/lib/format";
import ReportButton from "@/components/ReportButton";
import JobCommentForm from "./JobCommentForm";
/** 💬 이 공고 한줄평 & 익명 질문 — 공고 상세 아래 */
export default async function JobComments({ jk, me, admin, back }: { jk: string; me: string; admin?: boolean; back: string }) {
  const list = await loadJobComments(jk, me);
  return <section className="jc" id="jc"><h3>💬 이 공고 한줄평 & 익명 질문 <small>{list.length || ""}</small></h3>
    <p className="jc-d">닉네임 없이 <b>익명(직종)</b>으로만 보여요. 다녀본 분, 면접 본 분의 한마디가 다음 지원자에게 제일 큰 도움이 돼요.</p>
    <JobCommentForm jk={jk} back={back} />
    {list.length ? <ul className="jc-list">{list.map(c => <li key={c.key} className={c.mine ? "mine" : ""}>
      <div className="jc-h"><b>익명({c.dept ? deptLabel(c.dept) : "회원"}){c.mine && <em>내 글</em>}</b><span>{c.at ? ago(c.at) : ""}</span></div>
      {c.hidden ? <p className="muted">신고로 가려진 글이에요.</p> : <p>{c.text}</p>}
      <div className="jc-act">{c.mine || admin ? <form action={deleteJobComment.bind(null, c.key, back)}><button className="jc-del">삭제</button></form> : <ReportButton kind="jobc" id={c.key} />}</div>
    </li>)}</ul> : <p className="jc-empty">아직 질문이 없어요. 궁금한 걸 먼저 물어보세요.</p>}
  </section>;
}
