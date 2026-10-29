import { db } from "./supabase";
import { memoOnce } from "./memo";

/** 접속이 있을 때마다 가볍게 확인: 오늘 슬롯이 아직 안 돌았으면 실행 (크론 없이). */
/** 임시조치 30일 경과 → 자동 복구 (운영팀이 처리 안 한 건) */
async function restoreExpiredBlinds() {
  const s = db(), cut = new Date(Date.now() - 30 * 86400000).toISOString();
  for (const t of ["posts", "comments"] as const) {
    const { data } = await s.from(t).select("id").eq("hidden", true).lt("hidden_at", cut).limit(50);
    for (const row of data ?? []) { await s.from(t).update({ hidden: false, hidden_at: null }).eq("id", row.id); await s.from("reports").update({ status: "restored", resolved_at: new Date().toISOString() }).eq("kind", t === "posts" ? "post" : "comment").eq("target_id", String(row.id)).eq("status", "open"); }
  }
}
export async function runSchedulers() {
  if (!memoOnce("sched", 60_000)) return; // 인스턴스당 1분에 한 번만 확인
  const s = db();
  const kst = new Date(Date.now() + 9 * 3600000); const day = kst.toISOString().slice(0, 10); const hour = kst.getUTCHours();
    const claim = async (name: string) => { const { error } = await s.from("daily_runs").insert({ day, slot: name }); return !error; };
  if (await claim("blinds")) restoreExpiredBlinds().catch(() => {});

}
