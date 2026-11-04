import Link from "next/link";
import { ago } from "@/lib/format";
import { dday } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import Avatar from "@/components/Avatar";
import { splitTags, tagLabel, SHARE_TAG } from "@/lib/jobTags";
import { factLine, type FactAgg } from "@/lib/hospFacts";
/** 💼 공고 카드 (채용 목록·3교대 탈출 공용) */
export default function JobCard({ j, pub, rv, fa, locked }: { j: any; pub: boolean; rv?: { id: number; avg: number; n: number }; fa?: FactAgg; locked?: boolean }) {
  const dd = j.closed ? "마감" : dday(j.deadline), hot = dd === "오늘 마감" || (dd.startsWith("D-") && Number(dd.slice(2)) <= 3), isNew = Date.now() - Date.parse(j.created_at) < 2 * 86400000;
  const title = pub ? (j.welfare || `${deptLabel(j.dept)} 채용`) : `${deptLabel(j.dept)} ${j.emp_type} 모집`;
  const tags = splitTags(j.body).tags, share = !pub && tags.includes(SHARE_TAG), ft = tags.filter(t => t !== SHARE_TAG).slice(0, 4);
  return <Link href={`/jobs/${j.id}`} className={"jb2-card" + (j.closed ? " closed" : "")}>
    <div className="jb2-h"><Avatar name={j.hospital} size={40} /><div className="jb2-hn"><b>{j.hospital}</b><small>{rv && rv.n ? <span className="jb2-star">★ {rv.avg.toFixed(1)} <em>리뷰 {rv.n}</em></span> : <span className="jb2-norev">리뷰 없음</span>} · {j.region}</small></div><span className={"jb2-dd" + (hot ? " hot" : "") + (dd === "마감" ? " end" : "")}>{dd}</span></div>
    <div className="jb2-t">{title}{isNew && !j.closed && <span className="n-badge">N</span>}</div>
    <div className="jb2-tags"><span className="dept">{deptLabel(j.dept)}</span><span>{j.emp_type}</span>{j.pay && <span>💰 {j.pay}</span>}{j.hours && <span>⏰ {j.hours}</span>}{!pub && j.welfare && <span>🎁 {j.welfare}</span>}{ft.map(t => <span key={t} className="ft">{tagLabel(t)}</span>)}</div>
    {factLine(fa, locked).length > 0 ? <div className={"jb2-facts" + (locked ? " lock" : "")}>{factLine(fa, locked).map(x => <span key={x}>{x}</span>)}</div> : !j.closed && <div className="jb2-facts none">🔎 실수령·분위기 아직 몰라요 — 다녀본 분 체크 기다리는 중</div>}
    <div className="jb2-f"><span className={pub ? "src pub" : "src"}>{pub ? "🏛️ 공공 채용 자동수집" : `${share ? "📢" : "🏥"} ${j.author ? `[${deptLabel(j.author.dept)}]${j.author.nickname}` : "회원"} ${share ? "히든 공고 제보" : "구인"}`}</span><span>{ago(j.created_at)} · 조회 {j.views ?? 0}</span></div>
  </Link>;
}
