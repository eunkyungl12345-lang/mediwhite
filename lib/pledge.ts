import { db } from "./supabase";
/** ✍️ 작성 원칙 서약 + 진료 후기 차단 — 병원 리뷰·체크·면접·복지 후기 공통 (서버 전용) */
export const PLEDGE_TEXT = "직접 경험한 사실만 쓰고, 특정인을 비방하거나 알아볼 수 있게 쓰지 않을게요";
const TREAT = /(진료|치료|시술|수술|처방)\s*(를|을)?\s*받(았|고\s*왔|으러|은\s*후|은\s*뒤|았는데)|환자로\s*(갔|방문|내원)|내원(했|해서|했는데)|(의사|원장)\s*(선생)?님(이|께서)\s*(친절|불친절|설명)/;
/** 진료·치료 '받은' 사람의 후기인지 — 메디화이트는 직장으로서의 병원만 다뤄요 */
export function treatmentProblem(fd: FormData): string | null {
  for (const [k, v] of fd.entries()) { if (typeof v !== "string" || v.length < 6 || k === "name") continue; const m = v.match(TREAT);
    if (m) return `메디화이트는 '직장으로서의 병원' 후기만 받아요. 진료·치료를 받은 환자 후기("${m[0]}")는 쓸 수 없어요`; }
  return null;
}
/** 서약 체크 확인 + 처음 동의한 시각 기록(분쟁 대비 근거) */
export async function pledgeGate(uid: string, fd: FormData, treat = true): Promise<string | null> {
  if (fd.get("pledge") !== "on") return "작성 원칙에 동의해 주세요 (직접 경험한 사실만, 특정인 비방 없이)";
  const s = db(); const { data } = await s.from("game_state").select("user_id").eq("user_id", uid).eq("game", "pledge").maybeSingle();
  if (!data) { const now = new Date().toISOString(); await s.from("game_state").upsert({ user_id: uid, game: "pledge", state: { text: PLEDGE_TEXT, at: now }, updated_at: now }).then(() => {}, () => {}); }
  return treat ? treatmentProblem(fd) : null; // 복지 후기는 "직원 독감주사·검진 받았어요" 같은 말이 자연스러워 제외
}
