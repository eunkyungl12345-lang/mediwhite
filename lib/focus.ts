import { db } from "./supabase";
import { JOB_REGIONS } from "./jobs";
/** 📍 집중 지역 — 한 지역부터 병원 실체 지도를 꽉 채우기 (관리자 화면에서 설정, settings.focus_region) */
export type Focus = { region: string; label: string; goal: number };
export async function getFocus(): Promise<Focus | null> {
  const { data } = await db().from("settings").select("value").eq("key", "focus_region").maybeSingle();
  try { const f = JSON.parse(data?.value ?? ""); if ((JOB_REGIONS as readonly string[]).includes(f.region)) return { region: f.region, label: f.label || f.region, goal: Math.max(10, Number(f.goal) || 100) }; } catch {}
  return null;
}
