import { db } from "./supabase";
import { REPEAT, rankOf, RANKS, GENERAL, QUESTS } from "./ranks";
import { deptLeaders } from "./ranksvc";
import { display } from "./depts";
import { pushToUsers } from "./push";

/** 경험치 지급(DB 함수 한 번). 진급하면 이벤트 기록. */
async function grant(userId: string, amount: number, key: string | null, kind: string, cap: number): Promise<number> {
  const s = db();
  const { data, error } = await s.rpc("grant_xp", { p_user: userId, p_amount: amount, p_key: key, p_kind: kind, p_cap: cap });
  if (error || !data?.[0]) return 0;
  const { old_xp, new_xp, granted } = data[0] as { old_xp: number; new_xp: number; granted: number };
  if (!granted) return 0;
  // 퀘스트 달성 이벤트 (본인에게만 팝업)
  if (key) { const q = QUESTS.find(q => q.key === key); if (q) await s.from("events").insert({ kind: "quest", user_id: userId, text: `${q.title}|${granted}|${key}` }); }
  const bi = rankOf(old_xp).index, ai = rankOf(new_xp).index;
  if (ai > bi) {
    const { data: u } = await s.from("users").select("id,nickname,dept").eq("id", userId).single();
    if (u) {
      let leader = true;
      if (ai >= GENERAL) { const l = await deptLeaders(); leader = l[u.dept] === u.id; }
      const r = rankOf(new_xp, leader);
      if (r.index > rankOf(old_xp, leader).index)
        { await s.from("events").insert({ kind: "promotion", text: `${display(u.dept, u.nickname)}님이 ${r.name}${r.index >= 15 ? "(" + "★".repeat(Math.min(4, r.index - 14)) + ")" : ""}으로 진급하셨습니다.|${r.index}|${u.dept}|${u.nickname}` });
          pushToUsers([u.id], { title: "🎖️ 진급!", body: `${r.name}(으)로 진급하셨습니다. 축하해요!`, url: "/rank", tag: "promo" }).catch(() => {}); }
    }
  }
  return granted;
}
/** 1회성 퀘스트 */
export const awardXp = (userId: string, amount: number, key: string | null, kind = "quest") => grant(userId, amount, key, kind, 0);
/** 반복 보상(하루 상한) */
export function repeatXp(userId: string, kind: keyof typeof REPEAT) { const c = REPEAT[kind]; return c ? grant(userId, c.each, null, kind, c.dailyCap) : Promise.resolve(0); }
