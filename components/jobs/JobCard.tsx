import Link from "next/link";
import { ago } from "@/lib/format";
import { dday } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import Avatar from "@/components/Avatar";
import { splitTags, tagLabel, SHARE_TAG, splitMeta } from "@/lib/jobTags";
import { factLine, type FactAgg } from "@/lib/hospFacts";
/** 💼 공고 카드 (채용 목록·3교대 탈출 공용) */
export default function JobCard({ j, pub, rv, fa, locked }: { j: any; pub: boolean; rv?: { id: number; avg: number; n: number }; fa?: FactAgg; locked?: boolean }) {
  const dd = j.closed ? "마감" : dday(j.deadline), hot = dd === "오늘 마감" || (dd.startsWith("D-") && Number(dd.slice(2)) <= 3), isNew = Date.now() - Date.parse(j.created_at) < 2 * 86400000;
  const title = pub ? (j.welfare || `${deptLabel(j.dept)} 채용`) : `${deptLabel(j.dept)} ${j.emp_type} 모집`;
  const sp = splitTags(j.body), net = splitMeta(sp.rest).meta["실수령"], tags = sp.tags, share = !pub && tags.includes(SHARE_TAG), ft = tags.filter(t => t !== SHARE_TAG).slice(0, 4);
  const facts = factLine(fa, locked), meta = [deptLabel(j.dept), j.emp_type, j.region, net ? `실수령 ${net}` : j.pay].filter(Boolean).join(" · ");
  return <Link href={`/jobs/${j.id}`} className={"jb3" + (j.closed ? " closed" : "")}>
    <div className="jb3-top"><Avatar name={j.hospital} size={44} /><div className="jb3-main">
      <b className="jb3-t">{title}{isNew && !j.closed && <span className="n-badge">N</span>}</b>
      <small className="jb3-h">{j.hospital}{rv && rv.n ? <span className="jb2-star"> ★ {rv.avg.toFixed(1)}</span> : null}</small></div>
      <span className={"jb2-dd" + (hot ? " hot" : "") + (dd === "마감" ? " end" : "")}>{dd}</span></div>
    <div className="jb3-meta">{meta}</div>
    {(ft.length > 0 || (!pub && j.welfare)) && <div className="jb3-tags">{ft.map(t => <span key={t}>{tagLabel(t)}</span>)}{!pub && j.welfare && <span>🎁 {j.welfare}</span>}</div>}
    {facts.length > 0 && <div className={"jb2-facts" + (locked ? " lock" : "")}>{facts.map(x => <span key={x}>{x}</span>)}</div>}
    <div className="jb3-f">{pub ? "공공 채용" : share ? "📢 회원 제보" : "🏥 병원 직접 등록"} · {ago(j.created_at)}</div>
  </Link>;
}
