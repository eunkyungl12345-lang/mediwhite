import { db } from "./supabase";
import { memo } from "./memo";
/** ☰ 메뉴 NEW 표시 — 최근 24시간 새 글·공고·평가가 있는 곳 (5분 캐시) */
export async function menuFresh(): Promise<string[]> {
  return memo("menu_fresh", 5 * 60_000, async () => {
    const d = db(), since = new Date(Date.now() - 86400000).toISOString(); const out = new Set<string>();
    const [{ data: ps }, { count: jb }, { data: gs }, { count: rv }] = await Promise.all([
      d.from("posts").select("category,topic").eq("hidden", false).gte("created_at", since).limit(500),
      d.from("jobs").select("id", { count: "exact", head: true }).eq("hidden", false).gte("created_at", since),
      d.from("game_state").select("game").gte("updated_at", since).or("game.like.hfact:*,game.like.hwel:*,game.like.hintv:*,game.like.hnote:*,game.like.brag:*").limit(500),
      d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("hidden", false).gte("created_at", since)]);
    for (const p of ps ?? []) { if (p.category === "익명") out.add("anon"); else if (p.category === "썸") out.add("ssum"); else { out.add("board"); if (p.topic) out.add("t:" + p.topic); } }
    if (jb) out.add("jobs"); if (rv) out.add("rev");
    for (const g of gs ?? []) { const k = String(g.game).split(":")[0]; out.add({ hfact: "rev", hwel: "rev", hintv: "rev", hnote: "note", brag: "brag" }[k] ?? k); }
    return Array.from(out);
  }).catch(() => []);
}
