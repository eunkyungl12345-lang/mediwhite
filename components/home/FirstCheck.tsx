import Link from "next/link";
import { db } from "@/lib/supabase";
import { promoUntil } from "@/lib/hospFactsDb";
/** 🔎 첫 체크 유도 — 아직 병원 체크·리뷰가 하나도 없는 회원에게만. 무료 기간이 끝나도 계속 열람하려면 1곳 체크 */
export default async function FirstCheck({ userId, role }: { userId: string; role?: string }) {
  if (role === "admin") return null;
  const d = db();
  const [{ count: a }, { count: b }] = await Promise.all([
    d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).like("game", "hfact:%"),
    d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if ((a ?? 0) + (b ?? 0) > 0) return null;
  const u = await promoUntil();
  return <Link href="/hospitals/check" className="fc">
    <span className="fc-ico">🔎</span>
    <div><b>다녔던 병원 1곳만 1분 체크해 주세요</b><small>{u ? "무료 기간이 끝나도 모든 병원 실수령·분위기를 계속 볼 수 있어요" : "체크한 날부터 6개월간 모든 병원 실수령·분위기가 열려요"} · <em>+50 XP</em></small></div>
    <span className="fc-go">›</span>
  </Link>;
}
