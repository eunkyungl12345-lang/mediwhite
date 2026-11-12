import { db } from "./supabase";
import type { VState } from "./hverify";
/** 🧹 심사가 30일 넘게 안 끝난 인증 사진(병원 재직·퇴사 인증, 골드뱃지 면허)을 지워요 — 개인정보처리방침 약속. 매일 새벽 자동 실행 + 관리자 화면 열 때도 */
export async function purgeOldVerifyPhotos(): Promise<{ hverify: number; badge: number }> {
  const s = db(), old = Date.now() - 30 * 86400000, oldIso = new Date(old).toISOString(); let hv = 0, bg = 0;
  const { data } = await s.from("game_state").select("user_id,game,state").like("game", "hverify:%").limit(2000);
  for (const r of (data ?? []).filter(r => (r.state as VState)?.status === "pending" && +new Date((r.state as VState).at) < old)) {
    const st = r.state as VState; if (st.path) await s.storage.from("badges").remove([st.path]);
    await s.from("game_state").update({ state: { ...st, status: "rejected", path: null, reason: "심사 기간(30일)이 지나 사진을 삭제했어요. 다시 신청해 주세요" }, updated_at: new Date().toISOString() }).eq("user_id", r.user_id).eq("game", r.game); hv++;
  }
  const { data: bs } = await s.from("badge_requests").select("id,id_path,lic_path,created_at").eq("status", "pending").lt("created_at", oldIso).limit(500);
  for (const b of bs ?? []) { await s.storage.from("badges").remove([b.id_path, b.lic_path].filter(Boolean) as string[]); await s.from("badge_requests").update({ status: "rejected", reason: "심사 기간(30일)이 지나 사진을 삭제했어요", decided_at: new Date().toISOString(), id_path: null, lic_path: null }).eq("id", b.id); bg++; }
  return { hverify: hv, badge: bg };
}
