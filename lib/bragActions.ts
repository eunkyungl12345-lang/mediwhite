"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { personMention } from "./safety";
import { awardXp } from "./xp";
import { JOB_REGIONS, HOSP_KINDS } from "./jobs";
import { BRAG_TAGS, bragKey, likeKey } from "./brag";
type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const okImg = (f: unknown): f is File => f instanceof File && f.size > 0 && f.size <= 5_000_000 && /^image\//.test(f.type);
export async function submitBrag(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login"); const s = db();
  let hid = Number(fd.get("hospital_id")) || 0; const name = clean(fd.get("name"), 40), region = clean(fd.get("region"), 10), kind = clean(fd.get("kind"), 10);
  if (!hid) {
    if (!name || !(JOB_REGIONS as readonly string[]).includes(region) || !(HOSP_KINDS as readonly string[]).includes(kind)) return { error: "병원을 찾거나, 새 병원 이름·지역·종류를 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", name).eq("region", region).maybeSingle();
    if (ex) hid = ex.id; else { const { data: h, error } = await s.from("hospitals").insert({ name, region, kind, created_by: u.id }).select("id").single(); if (error || !h) return { error: "병원 등록에 실패했어요" }; hid = h.id; }
  }
  const tags = fd.getAll("tag").map(String).filter(t => (BRAG_TAGS as readonly string[]).includes(t)).slice(0, 6), text = clean(fd.get("text"), 300);
  if (!tags.length) return { error: "자랑 포인트를 하나 이상 골라주세요" };
  if (text.length < 10) return { error: "자랑 한마디를 10자 이상 적어주세요" };
  const pm = personMention(text); if (pm) return { error: `특정인을 알 수 있는 표현("${pm}")은 빼주세요` };
  const files = fd.getAll("photo").filter(okImg).slice(0, 3);
  const key = bragKey(hid); const { data: prev } = await s.from("game_state").select("state").eq("user_id", u.id).eq("game", key).maybeSingle();
  let photos: string[] = (prev?.state as any)?.photos ?? [];
  if (files.length) {
    photos = [];
    for (const f of files) { const path = `brag/${u.id}/${crypto.randomUUID()}.jpg`; const r = await s.storage.from("badges").upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type }); if (!r.error) photos.push(r.data.path); }
    const old: string[] = (prev?.state as any)?.photos ?? []; if (old.length) await s.storage.from("badges").remove(old);
  }
  if (!photos.length) return { error: "병원 사진을 1장 이상 올려주세요" };
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: key, state: { tags, text, photos, dept: u.dept, at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요" };
  if (!prev) await awardXp(u.id, 30, `brag:${hid}`, "quest");
  revalidatePath("/hospitals/brag"); revalidatePath(`/hospitals/${hid}`); redirect(`/hospitals/brag?new=${hid}`);
}
export async function toggleBragLike(owner: string, hid: number) {
  const u = await getSession(); if (!u || owner === u.id) return; const s = db(), k = likeKey(owner, hid);
  const { data: ex } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", k).maybeSingle();
  if (ex) await s.from("game_state").delete().eq("user_id", u.id).eq("game", k); else await s.from("game_state").upsert({ user_id: u.id, game: k, state: {}, updated_at: new Date().toISOString() });
  revalidatePath("/hospitals/brag"); revalidatePath(`/hospitals/${hid}`);
}
export async function deleteBrag(owner: string, hid: number) {
  const u = await getSession(); if (!u || (owner !== u.id && u.role !== "admin")) return; const s = db();
  const { data: b } = await s.from("game_state").select("state").eq("user_id", owner).eq("game", bragKey(hid)).maybeSingle();
  const ph: string[] = (b?.state as any)?.photos ?? []; if (ph.length) await s.storage.from("badges").remove(ph);
  await s.from("game_state").delete().eq("user_id", owner).eq("game", bragKey(hid)); await s.from("game_state").delete().like("game", `bragx:${owner}:${hid}`);
  revalidatePath("/hospitals/brag"); revalidatePath(`/hospitals/${hid}`);
}
