import { createHash } from "crypto";
import { db } from "./supabase";
/** 🙋 구직 프로필("저 구해요") — game_state: 구직자 seek, 받은 제안은 보낸 사람 row soffer:<구직자 공개키> */
export const SEEK_WANT = ["상근(주5일)", "3교대", "2교대", "파트타임", "야간전담", "협의"] as const;
export const SEEK_YEARS = ["신입", "1~2년차", "3~5년차", "6~9년차", "10년차+"] as const;
export type Seek = { dept: string; years: string; region: string; want: string; skills: string; intro: string; open: boolean; at: string };
export type SeekRow = Seek & { key: string; mine: boolean; offers: number };
export type Offer = { key: string; hosp: string; msg: string; contact: string; at: string };
/** 화면에 내보내는 구직자 키 — user id 대신 해시 */
export const seekKey = (uid: string) => "s" + createHash("sha1").update(`${uid}:seek:mw`).digest("hex").slice(0, 14);
export async function loadSeekers(me: string): Promise<{ list: SeekRow[]; mine: Seek | null; myKey: string }> {
  const s = db();
  const [{ data }, { data: offs }] = await Promise.all([
    s.from("game_state").select("user_id,state").eq("game", "seek").limit(2000),
    s.from("game_state").select("user_id,game").like("game", "soffer:%").limit(5000),
  ]);
  const cnt = new Map<string, number>(); const sentByMe = new Set<string>();
  for (const o of offs ?? []) { const k = String(o.game).slice(7); cnt.set(k, (cnt.get(k) ?? 0) + 1); if (o.user_id === me) sentByMe.add(k); }
  let mine: Seek | null = null; const list: SeekRow[] = [];
  for (const r of data ?? []) {
    const st = r.state as Seek; const key = seekKey(r.user_id);
    if (r.user_id === me) mine = st;
    if (st.open || r.user_id === me) list.push({ ...st, key, mine: r.user_id === me, offers: sentByMe.has(key) ? -1 : cnt.get(key) ?? 0 });
  }
  list.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return { list, mine, myKey: seekKey(me) };
}
/** 내가 받은 채용 제안 */
export async function loadMyOffers(me: string): Promise<Offer[]> {
  const { data: rows } = await db().from("game_state").select("user_id,game,state").eq("game", `soffer:${seekKey(me)}`).order("updated_at", { ascending: false }).limit(100);
  return (rows ?? []).map(r => { const st = r.state as Omit<Offer, "key">; return { ...st, key: offerSenderKey(r.user_id) }; });
}
/** 구직자 공개키 → 실제 user id (보내기·푸시용, 서버 전용) */
export async function seekerByKey(key: string): Promise<{ uid: string; st: Seek } | null> {
  const { data } = await db().from("game_state").select("user_id,state").eq("game", "seek").limit(2000);
  const r = (data ?? []).find(x => seekKey(x.user_id) === key); return r ? { uid: r.user_id, st: r.state as Seek } : null;
}
export const offerSenderKey = (uid: string) => createHash("sha1").update(`${uid}:offer`).digest("hex").slice(0, 12);
