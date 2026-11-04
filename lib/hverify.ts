/** ✅ 병원 재직·퇴사 인증 — 재직: 명찰 + 닉네임 포스트잇 / 퇴사: 자격득실확인서(경력증명서) + 닉네임 포스트잇
 *  저장: game_state(game = "hverify:<병원id>", state = { kind, status, path?, at, reason? }) · 사진은 심사 후 즉시 삭제 */
export type VKind = "work" | "exit";
export type VState = { kind: VKind; status: "pending" | "approved" | "rejected"; path?: string | null; at: string; reason?: string; decided?: string };
export const vKey = (hid: number) => `hverify:${hid}`;
export const V_LABEL: Record<VKind, string> = { work: "✅ 재직 인증", exit: "✅ 퇴사 인증" };
