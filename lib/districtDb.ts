import { db } from "./supabase";
import { distKey, isGu } from "./district";
/** 새 병원 등록 시 구 저장 (서울만) */
export async function saveDistrict(hid: number, region: string, gu: string) { if (region === "서울" && isGu(gu)) await db().from("settings").upsert({ key: distKey(hid), value: gu }); }
export async function loadDistricts(hids?: number[]): Promise<Record<number, string>> {
  let q = db().from("settings").select("key,value").like("key", "hdist:%").limit(10000); if (hids) { if (!hids.length) return {}; q = q.in("key", hids.map(distKey)); }
  const { data } = await q; return Object.fromEntries((data ?? []).map(r => [Number(String(r.key).slice(6)), r.value]));
}
