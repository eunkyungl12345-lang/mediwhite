import { db } from "./supabase";
import { memo } from "./memo";
/** 💬 공고 익명 댓글·질문 — 새 테이블 없이 game_state에 한 줄씩 저장 (game = "jc:<공고키>:<고유값>", 공고키 = j<DB공고id> | x<외부공고id>).
 *  화면에는 작성자 대신 "익명(직종)"만 내려가요. 작성자 id는 서버에서만 써요 (내 글 표시·삭제·신고) */
export type JC = { key: string; dept: string; text: string; at: string; mine: boolean; hidden?: boolean };
export const jobKey = (kind: "j" | "x", id: number | string) => `${kind}${id}`;
export async function loadJobComments(jk: string, me?: string): Promise<JC[]> {
  const { data } = await db().from("game_state").select("user_id,game,state").like("game", `jc:${jk}:%`).limit(500);
  return (data ?? []).map(r => { const st = r.state as any; return { key: r.game, dept: st?.dept ?? "", text: st?.textHidden ? "" : st?.text ?? "", at: st?.at ?? "", mine: r.user_id === me, hidden: !!st?.textHidden }; })
    .filter(c => c.text || c.mine).sort((a, b) => a.at.localeCompare(b.at));
}
/** 목록 카드용 공고별 댓글 수 (가려진 건 빼고) */
export async function jobCommentCounts(): Promise<Record<string, number>> {
  return memo("jc_counts", 30_000, async () => { const { data } = await db().from("game_state").select("game,state").like("game", "jc:%").limit(5000); const m: Record<string, number> = {};
    for (const r of data ?? []) { if ((r.state as any)?.textHidden) continue; const k = r.game.split(":")[1]; m[k] = (m[k] ?? 0) + 1; } return m; });
}
