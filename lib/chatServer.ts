import { createHash } from "crypto";
import { OFFICIAL } from "./depts";
import { db } from "./supabase";
import { memo } from "./memo";
import type { ChatMsg } from "./chatMsg";

/** 같은 사람끼리 묶어 보여줄 때 쓰는 익명 키 — user_id를 그대로 내보내지 않으려고 해시로 바꿔요 */
export function authorKey(userId?: string | null): string | null {
  if (!userId) return null;
  return createHash("sha256").update(process.env.CHAT_KEY_SALT || "mw-chat-v1").update(userId).digest("hex").slice(0, 12);
}

/** 운영팀 계정의 user_id → 표시 이름. 5분 캐시 (서버에서만 씀) */
export async function officialLabels(): Promise<Record<string, string>> {
  return memo("official_labels", 5 * 60_000, async () => {
    const { data } = await db().from("users").select("id,username").in("username", Object.keys(OFFICIAL));
    return Object.fromEntries((data ?? []).map((u: any) => [u.id as string, OFFICIAL[u.username as string]]));
  });
}

/** 내 아이디의 운영팀 라벨 (메시지 저장 직후 한 줄만 필요할 때) */
export function officialLabelOf(username?: string | null): string | null {
  return username ? OFFICIAL[username] ?? null : null;
}

/** DB 행(서버 전용: user_id 포함) → 클라이언트로 나가는 모양.
 *  받는 사람 관점의 mine, 운영팀 여부(official)를 여기서 계산해서 boolean/라벨로만 내려보내요. */
export function toChatMsg(row: any, meId: string, labels: Record<string, string> = {}): ChatMsg {
  const uid = (row?.user_id as string | null | undefined) ?? null;
  return {
    id: Number(row.id),
    nickname: row.nickname,
    dept: row.dept,
    text: row.text,
    created_at: row.created_at,
    rank: row.rank ?? null,
    mine: !!uid && uid === meId,
    official: uid ? labels[uid] ?? null : null,
    ak: authorKey(uid),
  };
}
