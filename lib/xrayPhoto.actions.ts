"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { XP_KINDS, xpKey, type XPhoto } from "./xrayPhoto";
import { xvBySlug } from "./xrayAll";
type R = { error?: string; ok?: boolean } | undefined;
export async function uploadXrayPhoto(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" }; const s = db();
  const slug = String(fd.get("slug") ?? ""), kind = String(fd.get("kind") ?? ""), note = String(fd.get("note") ?? "").trim().slice(0, 100);
  if (!xvBySlug(slug)) return { error: "잘못된 촬영법이에요" }; if (!(XP_KINDS as readonly string[]).includes(kind)) return { error: "사진 종류를 골라주세요" };
  if (fd.get("agree") !== "on") return { error: "개인정보를 지웠는지 확인에 체크해주세요" };
  const files = fd.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  if (!files.length) return { error: "사진을 골라주세요" }; if (files.some(f => f.size > 6 * 1024 * 1024 || !f.type.startsWith("image/"))) return { error: "6MB 이하 사진만 올릴 수 있어요" };
  const { count } = await s.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", u.id).like("game", "xrimg:%").eq("state->>status", "pending");
  if ((count ?? 0) >= 15) return { error: "심사 중인 사진이 많아요. 승인된 뒤에 더 올려주세요" };
  for (const f of files) {
    const id = crypto.randomUUID().slice(0, 12), path = `xray/${u.id}/${id}.jpg`;
    const up = await s.storage.from("badges").upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type }); if (up.error) return { error: "업로드에 실패했어요" };
    const st: XPhoto = { slug, kind, path: up.data.path, note: note || undefined, status: "pending", at: new Date().toISOString() };
    await s.from("game_state").upsert({ user_id: u.id, game: xpKey(slug, id), state: st, updated_at: st.at });
  }
  revalidatePath(`/study/xray/${slug}`); return { ok: true };
}
/** 관리자 승인·반려 (반려하면 사진 파일도 지워요) */
export async function decideXrayPhoto(uid: string, game: string, ok: boolean): Promise<R> {
  const u = await getSession(); if (u?.role !== "admin") return { error: "권한이 없어요" }; const s = db();
  const { data } = await s.from("game_state").select("state").eq("user_id", uid).eq("game", game).maybeSingle(); const st = data?.state as XPhoto | undefined; if (!st) return { error: "없는 사진이에요" };
  if (ok) { await s.from("game_state").update({ state: { ...st, status: "approved" } }).eq("user_id", uid).eq("game", game); await awardXp(uid, 20, game, "quest"); }
  else { await s.storage.from("badges").remove([st.path]); await s.from("game_state").delete().eq("user_id", uid).eq("game", game); }
  revalidatePath(`/study/xray/${st.slug}`); revalidatePath("/admin"); return { ok: true };
}
/** 내가 올린 사진 지우기 */
export async function deleteMyXrayPhoto(game: string): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" }; const s = db();
  const { data } = await s.from("game_state").select("state").eq("user_id", u.id).eq("game", game).maybeSingle(); const st = data?.state as XPhoto | undefined; if (!st) return { error: "없는 사진이에요" };
  await s.storage.from("badges").remove([st.path]); await s.from("game_state").delete().eq("user_id", u.id).eq("game", game); revalidatePath(`/study/xray/${st.slug}`); return { ok: true };
}
