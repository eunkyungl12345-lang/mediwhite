import { db } from "./supabase";
import { REPEAT, rankOf } from "./ranks";
import { deptLeaders } from "./ranksvc";
import { display } from "./depts";

/** 경험치 지급. key가 있으면 1회성(중복 시 0). kind는 반복 상한 계산용. 진급하면 이벤트 기록. */
export async function awardXp(userId: string, amount: number, key: string | null, kind = "quest"): Promise<number> {
  const s = db();
  if (key) {
    const { error } = await s.from("xp_log").insert({ user_id: userId, key, amount, kind });
    if (error) return 0;
  } else {
    await s.from("xp_log").insert({ user_id: userId, key: null, amount, kind });
  }
  const { data: u } = await s.from("users").select("id,nickname,dept,xp").eq("id", userId).single();
  if (!u) return amount;
  const before = u.xp, after = before + amount;
  await s.from("users").update({ xp: after }).eq("id", userId);
  if (rankOf(after).index > rankOf(before).index) {
    const leaders = await deptLeaders();
    const r = rankOf(after, leaders[u.dept] === u.id);
    if (r.index > rankOf(before, leaders[u.dept] === u.id).index)
      await s.from("events").insert({ kind: "promotion", text: `${display(u.dept, u.nickname)}님이 ${r.name}${r.index >= 14 ? "(" + "★".repeat(Math.min(4, r.index - 13)) + ")" : ""}으로 진급하셨습니다.|${r.index}|${u.dept}|${u.nickname}` });
  }
  return amount;
}

/** 반복 보상(하루 상한 적용). 지급액 반환 */
export async function repeatXp(userId: string, kind: keyof typeof REPEAT): Promise<number> {
  const cfg = REPEAT[kind]; if (!cfg) return 0;
  const since = new Date(); since.setUTCHours(since.getUTCHours() + 9); since.setUTCHours(0, 0, 0, 0); since.setUTCHours(since.getUTCHours() - 9); // KST 자정
  const { data } = await db().from("xp_log").select("amount").eq("user_id", userId).eq("kind", kind).gte("created_at", since.toISOString());
  const today = (data ?? []).reduce((a, r) => a + r.amount, 0);
  if (today + cfg.each > cfg.dailyCap) return 0;
  return awardXp(userId, cfg.each, null, kind);
}
