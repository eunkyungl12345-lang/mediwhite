import Link from "next/link";
import Avatar from "@/components/Avatar";
import { EXT_SRC, extTags, splitArea, type ExtJob } from "@/lib/extJobs";
import { tagLabel } from "@/lib/jobTags";
import { posBadges, type FactAgg } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
/** 🔗 다른 곳에 올라온 공고 카드 (채용 목록용, 누르면 원문으로) */
export default function ExtCard({ e, hid, fa }: { e: ExtJob; hid?: number; fa?: FactAgg }) {
  return <div className="jb3 ex-card">
    <a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="jb3-top" style={{ color: "inherit", textDecoration: "none" }}><Avatar name={e.h} size={44} /><div className="jb3-main">
      <b className="jb3-t">{e.dept} · {e.time}</b><small className="jb3-h">{e.h}</small></div>
      <span className="jb2-dd">{e.until ? `~${e.until.slice(5).replace("-", "/")}` : "채용 시"}</span></a>
    <div className="jb3-meta">{splitArea(e.area).r} · 💰 {e.pay}{splitArea(e.area).st && <span className="ex-sta">🚇 {splitArea(e.area).st}</span>}</div>
    {extTags(e.id).length > 0 && <div className="jb3-tags">{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}
    <PosBadges list={posBadges(fa)} max={3} />
    <div className="jb3-f">☀️ {e.note}{e.warn ? ` · ⚠️ ${e.warn}` : ""}</div>
    <div className="ex-acts" style={{ paddingLeft: 56 }}><a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="btn">{EXT_SRC} 지원 ↗</a><Link href={hid ? `/hospitals/${hid}` : `/search?q=${encodeURIComponent(e.h.replace(/\s.*$/, ""))}`} className="btn ghost">👀 이 병원 진짜 분위기 보기</Link></div>
  </div>;
}
