"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { personMention } from "./safety";
import { textProblem } from "./textQuality";
import { NOTE_SECS, noteKey } from "./handover";
import { notePubKey } from "./helpKey";
type R = { error?: string; ok?: boolean } | undefined;
export async function saveNote(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" }; const s = db();
  const hid = Number(fd.get("hid")) || 0, sec = String(fd.get("sec") ?? ""); if (!NOTE_SECS.some(x => x.k === sec)) return { error: "칸을 골라주세요" };
  const { data: h } = await s.from("hospitals").select("id").eq("id", hid).maybeSingle(); if (!h) return { error: "병원을 찾을 수 없어요" };
  const text = String(fd.get("text") ?? "").trim().slice(0, 300), key = noteKey(hid, sec);
  if (!text) { await s.from("game_state").delete().eq("user_id", u.id).eq("game", key); revalidatePath(`/hospitals/${hid}`); return { ok: true }; }
  const tq = textProblem(text, 10); if (tq) return { error: tq };
  const pm = personMention(text); if (pm) return { error: `특정인을 알 수 있는 표현("${pm}")은 빼주세요` };
  const { data: prev } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", key).maybeSingle();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: key, state: { text, status: fd.get("status") === "퇴사" ? "퇴사" : "재직", at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요" };
  if (!prev) await awardXp(u.id, 10, key, "quest");
  revalidatePath(`/hospitals/${hid}`); revalidatePath("/handover"); return { ok: true };
}
/** 관리자: 공개 키로 노트 지우기 (작성자 id는 화면에 안 나가요) */
export async function adminDeleteNote(hid: number, sec: string, pub: string): Promise<R> {
  const u = await getSession(); if (u?.role !== "admin") return { error: "권한이 없어요" }; const s = db();
  const { data } = await s.from("game_state").select("user_id").eq("game", noteKey(hid, sec)); const row = (data ?? []).find(r => notePubKey(r.user_id, hid, sec) === pub);
  if (!row) return { error: "못 찾았어요" }; await s.from("game_state").delete().eq("user_id", row.user_id).eq("game", noteKey(hid, sec)); revalidatePath(`/hospitals/${hid}`); return { ok: true };
}
export async function saveOpsNote(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (u?.role !== "admin") return { error: "권한이 없어요" };
  await db().from("settings").upsert({ key: "ops_notes", value: JSON.stringify({ text: String(fd.get("text") ?? "").slice(0, 2000), at: new Date().toISOString() }) });
  revalidatePath("/handover"); return { ok: true };
}
