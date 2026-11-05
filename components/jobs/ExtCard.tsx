import Link from "next/link";
import Avatar from "@/components/Avatar";
import { EXT_SRC, extTags, type ExtJob } from "@/lib/extJobs";
import { tagLabel } from "@/lib/jobTags";
import { posBadges, type FactAgg } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
/** 🔗 다른 곳에 올라온 공고 카드 (채용 목록용, 누르면 원문으로) */
export default function ExtCard({ e, hid, fa }: { e: ExtJob; hid?: number; fa?: FactAgg }) {
  return <div className="jb3 ex-card">
    <a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="jb3-top" style={{ color: "inherit", textDecoration: "none" }}><Avatar name={e.h} size={44} /><div className="jb3-main">
      <b className="jb3-t">{e.dept} · {e.time}</b><small className="jb3-h">{e.h}</small></div>
      <span className="jb2-dd">{e.until ? `~${e.until.slice(5).replace("-", "/")}` : "채용 시"}</span></a>
    <div className="jb3-meta">{e.area} · 💰 {e.pay}</div>
    {extTags(e.id).length > 0 && <div className="jb3-tags">{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}
    <PosBadges list={posBadges(fa)} max={3} />
    <div className="jb3-f">☀️ {e.note}{e.warn ? ` · ⚠️ ${e.warn}` : ""}</div>
    <div className="jb3-f">🔗 {EXT_SRC} 공고 · <a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="link">원문 보고 지원 ↗</a>{hid ? <> · <Link href={`/hospitals/${hid}`} className="link">이 병원 리뷰</Link></> : null}</div>
  </div>;
}
