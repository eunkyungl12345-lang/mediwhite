import { db } from "./supabase";
import type { Brag } from "./brag";
/** 자랑 목록 (+사진 서명 URL, 좋아요 수) */
export async function loadBrags(me: string, opt: { hid?: number; sort?: "top" | "new"; limit?: number } = {}): Promise<Brag[]> {
  const d = db(); let q = d.from("game_state").select("user_id,game,state").like("game", opt.hid ? `brag:${opt.hid}` : "brag:%").limit(500);
  const [{ data: rows }, { data: likes }, { data: vs }] = await Promise.all([q, d.from("game_state").select("user_id,game").like("game", "bragx:%").limit(20000), d.from("game_state").select("user_id,game,state").like("game", opt.hid ? `hverify:${opt.hid}` : "hverify:%").limit(5000)]);
  const vok = new Set((vs ?? []).filter(v => (v.state as any)?.status === "approved").map(v => `${v.user_id}:${String(v.game).slice(8)}`));
  const list = (rows ?? []).filter(r => /^brag:\d+$/.test(r.game)); if (!list.length) return [];
  const hids = Array.from(new Set(list.map(r => Number(r.game.slice(5)))));
  const { data: hs } = await d.from("hospitals").select("id,name,region").in("id", hids); const hm = new Map((hs ?? []).map(h => [h.id, h]));
  const lc: Record<string, number> = {}, mine = new Set<string>(); for (const l of likes ?? []) { const k = l.game.slice(6); lc[k] = (lc[k] ?? 0) + 1; if (l.user_id === me) mine.add(k); }
  let out: Brag[] = list.map(r => { const s: any = r.state ?? {}, hid = Number(r.game.slice(5)), h = hm.get(hid), k = `${r.user_id}:${hid}`;
    return { owner: r.user_id, hid, hospital: h?.name ?? "병원", region: h?.region ?? "", tags: s.tags ?? [], text: s.text ?? "", photos: s.photos ?? [], urls: [], dept: s.dept, at: s.at ?? "", likes: lc[k] ?? 0, liked: mine.has(k), verified: vok.has(k) }; }).filter(b => hm.has(b.hid));
  out.sort((a, b) => opt.sort === "new" ? b.at.localeCompare(a.at) : (b.likes - a.likes) || b.at.localeCompare(a.at)); out = out.slice(0, opt.limit ?? 60);
  const paths = out.flatMap(b => b.photos); if (paths.length) { const { data: su } = await d.storage.from("badges").createSignedUrls(paths, 3600); const um = new Map((su ?? []).map(x => [x.path, x.signedUrl])); for (const b of out) b.urls = b.photos.map(p => um.get(p) ?? "").filter(Boolean); }
  return out;
}
