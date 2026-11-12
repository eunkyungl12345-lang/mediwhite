import { db } from "./supabase";
/** ⬆ 끌올 제한: 글당 최대 3회, 24시간 쿨타임 */
export const BOOST_MAX = 3;
export async function boostInfo(userId: string, postId: string): Promise<{ n: number; at: string | null }> {
  const { data } = await db().from("game_state").select("state").eq("user_id", userId).eq("game", `boost:${postId}`).maybeSingle();
  const st = (data?.state ?? {}) as { n?: number; at?: string }; return { n: st.n ?? 0, at: st.at ?? null };
}
