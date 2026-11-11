import Link from "next/link";
import { db } from "@/lib/supabase";
import { founderOf, founderLeft } from "@/lib/hospFactsDb";
/** 🔎 첫 체크 유도 — 아직 병원 체크·리뷰가 하나도 없는 회원에게만. 무료 기간이 끝나도 계속 열람하려면 1곳 체크 */
export default async function FirstCheck({ userId, role }: { userId: string; role?: string }) {
  if (role === "admin") return null;
  const d = db();
  const [{ count: a }, { count: b }] = await Promise.all([
    d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).or("game.like.hfact:%,game.like.hx:%"),
    d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const fn = await founderOf(userId);
  if (fn) return <div className="fc fc-fd"><span className="fc-ico">🏅</span><div><b>창립 멤버 {fn}호</b><small>모든 병원의 고용 현실·실수령을 평생 볼 수 있어요</small></div></div>;
  if ((a ?? 0) + (b ?? 0) > 0) return null;
  const left = await founderLeft();
  return <Link href="/hospitals/check" className="fc">
    <span className="fc-ico">{left ? "🏅" : "🔎"}</span>
    <div><b>다녔던 병원 1곳만 10초 제보해 주세요</b><small>{left ? `지금 제보하면 창립 멤버 · 모든 병원 평생 열람 (${left}자리 남음)` : "제보한 날부터 6개월간 모든 병원 실수령·고용 현실이 열려요"} · <em>+50 XP</em></small></div>
    <span className="fc-go">›</span>
  </Link>;
}
