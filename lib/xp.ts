import { db } from "./supabase";
import { REPEAT, CHAT_DAILY_CAP, rankOf } from "./ranks";
import { deptLeaders } from "./ranksvc";
import { display } from "./depts";

/** 1회성(key) 또는 반복(key=null) 경험치 지급. 1회성은 이미 받았으면 0 반환. 진급하면 이벤트 기록. */
export async function awardXp(userId: string, amount: number, key: string | null): Promise<number> {
  const s = db();
  if (key) {
    const { error } = await s.from("xp_log").insert({ user_id: userId, key, amount });
    if (error) return 0;
  } else {
    await s.from("xp_log").insert({ user_id: userId, key: null, amount });
  }
  const { data: u } = await s.from("users").select("id,nickname,dept,xp").eq("id", userId).single();
  if (!u) return amount;
  const before = u.xp, after = before + amount;
  await s.from("users").update({ xp: after }).eq("id", userId);
  if (rankOf(after).index > rankOf(before).index) {
    const leaders = await deptLeaders();
    const r = rankOf(after, leaders[u.dept] === u.id);
    if (r.index > rankOf(before, leaders[u.dept] === u.id).index)
      await s.from("events").insert({ kind: "promotion", text: `${display(u.dept, u.nickname)}님이 ${r.name}${r.index >= 14 ? "(" + "★".repeat(r.index - 13) + ")" : ""}으로 진급하셨습니다.` });
  }
  return amount;
}

export async function chatXp(userId: string) {
  const s = db();
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const { data } = await s.from("xp_log").select("amount").eq("user_id", userId).is("key", null).gte("created_at", since.toISOString());
  const today = (data ?? []).filter(r => r.amount === REPEAT.chat).reduce((a, r) => a + r.amount, 0);
  const first = await awardXp(userId, 50, "first_chat");
  if (today < CHAT_DAILY_CAP) await awardXp(userId, REPEAT.chat, null);
  return first;
}
