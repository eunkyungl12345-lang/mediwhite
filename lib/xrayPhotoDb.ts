import { db } from "./supabase";
import type { XPhoto } from "./xrayPhoto";
export type XPhotoRow = XPhoto & { uid: string; game: string; url: string };
async function sign(rows: { user_id: string; game: string; state: any }[]): Promise<XPhotoRow[]> {
  const d = db(), paths = rows.map(r => r.state?.path).filter(Boolean); if (!paths.length) return [];
  const { data: su } = await d.storage.from("badges").createSignedUrls(paths, 3600); const m = new Map((su ?? []).map(x => [x.path, x.signedUrl]));
  return rows.map(r => ({ ...(r.state as XPhoto), uid: r.user_id, game: r.game, url: m.get(r.state.path) ?? "" })).filter(x => x.url);
}
/** 이 촬영법의 승인 사진 + 내가 올린 심사 중 사진 */
export async function loadXrayPhotos(slug: string, me: string) {
  const { data } = await db().from("game_state").select("user_id,game,state").like("game", `xrimg:${slug}:%`).order("updated_at", { ascending: true }).limit(60);
  const rows = (data ?? []).filter(r => (r.state as any)?.status === "approved" || r.user_id === me); return sign(rows);
}
export async function pendingXrayPhotos() {
  const { data } = await db().from("game_state").select("user_id,game,state").like("game", "xrimg:%").eq("state->>status", "pending").order("updated_at", { ascending: true }).limit(40);
  return sign(data ?? []);
}
