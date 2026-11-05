import Link from "next/link";
import { openExtJobs, isG3, extTags } from "@/lib/extJobs";
/** 📍 강남 3구 상근 공고 배너 */
export default function G3Banner({ href = "/jobs/day?g3=1#ext" }: { href?: string }) {
  const g = openExtJobs().filter(isG3), early = g.filter(e => extTags(e.id).includes("조기퇴근")).length;
  return <Link href={href} className="g3b"><span>📍</span><div><b>분위기 확인하고 지원하는 강남 3구 상근 공고</b><small>강남·서초·송파 {g.length}곳{early ? ` · 5시 전 퇴근 ${early}곳` : ""} · 실수령·인센·연차까지</small></div><em>›</em></Link>;
}
