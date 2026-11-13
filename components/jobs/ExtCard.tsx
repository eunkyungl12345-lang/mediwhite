import Link from "next/link";
import Avatar from "@/components/Avatar";
import { extSrc, extTags, splitArea, extCheckedLabel, type ExtJob } from "@/lib/extJobs";
import { tagLabel } from "@/lib/jobTags";
import { posBadges, type FactAgg } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
/** 🔗 다른 곳에 올라온 공고 카드 (채용 목록용, 누르면 원문으로) */
export default function ExtCard({ e, hid, fa, nc }: { e: ExtJob; hid?: number; fa?: FactAgg; nc?: number }) {
  return <div className="jb3 ex-card">
    <a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="jb3-top" style={{ color: "inherit", textDecoration: "none" }}><Avatar name={e.h} size={44} /><div className="jb3-main">
      <span className={"ex-src s-" + extSrc(e)}>{extSrc(e)}</span><b className="jb3-t">{e.h}</b><small className="jb3-h">{e.dept} · ⏰ {e.time}</small></div>
      <span className="jb2-dd">{e.until ? `~${e.until.slice(5).replace("-", "/")}` : extCheckedLabel()}</span></a>
    <div className="jb3-meta">{splitArea(e.area).r} · 💰 {e.pay}{splitArea(e.area).st && <span className="ex-sta">🚇 {splitArea(e.area).st}</span>}</div>
    {extTags(e.id).length > 0 && <div className="jb3-tags">{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}
    <PosBadges list={posBadges(fa)} max={3} />
    <div className="jb3-f">☀️ {e.note}{e.warn ? ` · ⚠️ ${e.warn}` : ""}{nc !== undefined && <> · <Link href={`/jobs/ext/${e.id}#jc`} className={"jc-cnt" + (nc ? " on" : "")}>{nc ? `💬 댓글 ${nc}` : "💬 질문하기"}</Link></>}</div>
    <Link href={hid ? `/hospitals/${hid}` : `/search?q=${encodeURIComponent(e.h.replace(/\s.*$/, ""))}`} className="ex-real"><span aria-hidden="true">👀</span><div><b>이 병원 세후 실수령 & 고용안정성 신호등 보기</b><small>사람인엔 없는, 다녀본 사람들의 정규직 전환율·실수령·퇴근 시간</small></div><em>›</em></Link>
    <Link href={hid ? `/hospitals/${hid}?t=intv` : `/hospitals/interview?ext=${e.id}`} className="ex-real ex-iv"><span aria-hidden="true">🎤</span><div><b>이 병원 면접 질문 & 분위기 후기</b><small>면접 가봤다면 1분 만에 후기 남기기</small></div><em>›</em></Link>
    <div className="ex-acts"><a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="btn ghost">원문 지원하기 ↗</a></div>
  </div>;
}
