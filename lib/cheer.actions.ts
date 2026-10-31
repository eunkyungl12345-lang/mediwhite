"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { pushToUsers } from "./push";
/** 진급 신고식 축하: 축하한 사람 +3 XP(이벤트당 1회), 진급자 +5 XP(최대 10명까지) */
export async function cheer(eventId: number) {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const s = db();
  const { data: ev } = await s.from("events").select("id,user_id,text,created_at").eq("id", eventId).eq("kind", "promotion").maybeSingle();
  if (!ev) return { error: "없는 소식이에요" };
  if (ev.user_id === u.id) return { error: "본인 진급은 셀프 축하 금지 😆" };
  if (Date.now() - Date.parse(ev.created_at) > 7 * 86400000) return { error: "축하 기간(7일)이 지났어요" };
  const { error } = await s.from("cheers").insert({ event_id: eventId, user_id: u.id });
  if (error) return { error: "이미 축하했어요 🎉" };
  const { count } = await s.from("cheers").select("user_id", { count: "exact", head: true }).eq("event_id", eventId);
  await awardXp(u.id, 3, `cheer:${eventId}`, "quest");
  if (ev.user_id && (count ?? 0) <= 10) { await awardXp(ev.user_id, 5, `cheered:${eventId}:${u.id}`, "quest"); pushToUsers([ev.user_id], { title: "🎉 진급 축하 도착!", body: `${u.nickname}님이 진급을 축하했어요 (+5 XP)`, url: "/home", tag: "cheer" }).catch(() => {}); }
  revalidatePath("/home"); return { ok: true, count: count ?? 1 };
}
