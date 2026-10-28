"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { AREAS, FOOD_TAGS, PRICES } from "./foodData";
import { personMention } from "./safety";
import { awardXp, repeatXp } from "./xp";
import { bump } from "./daily";

type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function addRestaurant(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login");
  const region = clean(fd.get("region"), 10), district = clean(fd.get("district"), 20);
  if (!AREAS[region]?.includes(district)) return { error: "지역을 골라주세요" };
  const name = clean(fd.get("name"), 40), comment = clean(fd.get("comment"), 200);
  if (!name || !comment) return { error: "가게 이름과 한 줄 평을 적어주세요" };
  if (personMention(comment)) return { error: "사람을 특정하는 표현은 빼주세요" };
  const price = clean(fd.get("price"), 20), tags = fd.getAll("tags").map(String).filter(t => FOOD_TAGS.some(x => x.key === t));
  const s = db();
  const { count } = await s.from("restaurants").select("id", { count: "exact", head: true }).eq("author_id", u.id).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= 10) return { error: "하루 10곳까지 올릴 수 있어요" };
  await s.from("restaurants").insert({ author_id: u.id, region, district, station: clean(fd.get("station"), 20) || null, name, menu: clean(fd.get("menu"), 40) || null, price: PRICES.includes(price) ? price : null, comment, tags });
  await Promise.all([awardXp(u.id, 50, "food_1"), repeatXp(u.id, "comment"), bump(u.id, "write")]);
  revalidatePath("/food"); return { ok: `${name} 등록 완료! 🍚` };
}
export async function likeRestaurant(id: number) {
  const u = await getSession(); if (!u) return null; const s = db();
  const { data: cur } = await s.from("restaurant_likes").select("user_id").eq("user_id", u.id).eq("rest_id", id).maybeSingle();
  if (cur) await s.from("restaurant_likes").delete().eq("user_id", u.id).eq("rest_id", id);
  else { await s.from("restaurant_likes").insert({ user_id: u.id, rest_id: id }); const { data: r } = await s.from("restaurants").select("author_id").eq("id", id).maybeSingle(); if (r?.author_id && r.author_id !== u.id) repeatXp(r.author_id, "liked").catch(() => {}); }
  const { count } = await s.from("restaurant_likes").select("user_id", { count: "exact", head: true }).eq("rest_id", id);
  return { liked: !cur, count: count ?? 0 };
}
export async function deleteRestaurant(id: number) {
  const u = await getSession(); if (!u) return; const q = db().from("restaurants").delete().eq("id", id);
  await (u.role === "admin" ? q : q.eq("author_id", u.id)); revalidatePath("/food");
}
