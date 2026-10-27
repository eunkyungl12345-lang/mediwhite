import { db } from "./supabase";
import { awardXp } from "./xp";

/** 데일리 퀘스트: 매일 자정(KST) 초기화. 활동 카운터는 activity 테이블. */
export const DAILY = [
  { key: "chat", title: "실시간 채팅 3번", target: 3, xp: 20, icon: "💬" },
  { key: "game", title: "게임 아무거나 1판", target: 1, xp: 30, icon: "🎮" },
  { key: "write", title: "글 또는 댓글 1개", target: 1, xp: 30, icon: "✍️" },
] as const;
export type DailyKey = typeof DAILY[number]["key"];
export const DAILY_BONUS = 50, STREAK_BONUS = 150;
export const kstDay = (d = new Date()) => new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10);

/** 활동 1 증가. 목표 도달 시 경험치 + 팝업 이벤트, 3개 다 하면 보너스. */
export async function bump(userId: string, key: DailyKey | "visit") {
  const s = db(), day = kstDay();
  const { data, error } = await s.rpc("bump_activity", { p_user: userId, p_day: day, p_key: key });
  if (error) return;
  const n = Number(data ?? 0);
  if (key === "visit") { if (n === 1) await checkStreak(userId, day); return; }
  const q = DAILY.find(q => q.key === key)!;
  if (n !== q.target) return;
  const xp = await awardXp(userId, q.xp, `dq:${day}:${key}`, "daily");
  if (xp) await s.from("events").insert({ kind: "quest", user_id: userId, text: `오늘의 퀘스트 · ${q.title}|${xp}|dq_${key}` });
  const { data: rows } = await s.from("activity").select("key,n").eq("user_id", userId).eq("day", day);
  const done = DAILY.every(q => (rows ?? []).some(r => r.key === q.key && r.n >= q.target));
  if (done) { const b = await awardXp(userId, DAILY_BONUS, `dq:${day}:all`, "daily"); if (b) await s.from("events").insert({ kind: "quest", user_id: userId, text: `오늘의 퀘스트 올클리어 보너스|${b}|dq_all` }); }
}

async function checkStreak(userId: string, day: string) {
  const st = await streak(userId, day);
  if (st > 0 && st % 7 === 0) { const b = await awardXp(userId, STREAK_BONUS, `streak:${day}`, "daily"); if (b) await db().from("events").insert({ kind: "quest", user_id: userId, text: `${st}일 연속 출석!|${b}|streak` }); }
}

/** 오늘 포함 연속 출석 일수 */
export async function streak(userId: string, day = kstDay()) {
  const { data } = await db().from("activity").select("day").eq("user_id", userId).eq("key", "visit").order("day", { ascending: false }).limit(60);
  const days = new Set((data ?? []).map(r => String(r.day)));
  let n = 0; const d = new Date(day + "T00:00:00Z");
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

export async function dailyStatus(userId: string) {
  const day = kstDay();
  const [{ data: rows }, st] = await Promise.all([db().from("activity").select("key,n").eq("user_id", userId).eq("day", day), streak(userId, day)]);
  const counts: Record<string, number> = {}; for (const r of rows ?? []) counts[r.key] = r.n;
  const quests = DAILY.map(q => ({ ...q, n: Math.min(q.target, counts[q.key] ?? 0), done: (counts[q.key] ?? 0) >= q.target }));
  return { day, quests, all: quests.every(q => q.done), streak: st };
}
