import { db } from "./supabase";
import { JOB_REGIONS } from "./jobs";
import { isGu } from "./district";
/** 📍 집중 지역 — 한 지역부터 병원 실체 지도를 꽉 채우기 (관리자 화면에서 설정, settings.focus_region) */
export type Focus = { region: string; label: string; goal: number; gus: string[] };
export async function getFocus(): Promise<Focus | null> {
  const { data } = await db().from("settings").select("value").eq("key", "focus_region").maybeSingle();
  try { const f = JSON.parse(data?.value ?? ""); if ((JOB_REGIONS as readonly string[]).includes(f.region)) { const gus = f.region === "서울" ? (f.gus ?? []).filter(isGu) : []; return { region: f.region, label: f.label || (gus.length ? gus.map((g: string) => g.replace("구", "")).join("·") : f.region), goal: Math.max(10, Number(f.goal) || 100), gus }; } } catch {}
  return null;
}
