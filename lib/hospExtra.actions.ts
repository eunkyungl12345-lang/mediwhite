"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { saveDistrict } from "./districtDb";
import { reviewProblem } from "./safety";
import { JOB_REGIONS, JOB_DEPTS, HOSP_KINDS } from "./jobs";
import { xKey, X_YEARS, CONTRACT, PAY_YEAR, ALBA_UNIT, ALBA_TAX, ALBA_MEAL, ALBA_LOAD, HOBONG, WORK_AREA, PAY_SUB } from "./hospExtra";
type R = { error?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const inList = (list: readonly string[], v: string) => list.includes(v);
/** 💰 연봉 리뷰 · ⏱ 알바 리뷰 저장 (병원은 고르거나 새로 등록) */
export async function submitHospExtra(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login"); const s = db();
  const kind = clean(fd.get("xkind"), 6); if (kind !== "pay" && kind !== "alba") return { error: "리뷰 종류를 골라주세요" };
  let hid = Number(fd.get("hospital_id")) || 0; const name = clean(fd.get("name"), 40), region = clean(fd.get("region"), 10), hk = clean(fd.get("kind"), 10);
  const dept = clean(fd.get("dept"), 10); if (!inList(JOB_DEPTS, dept)) return { error: "직종을 골라주세요" };
  let state: Record<string, any>;
  if (kind === "pay") {
    const years = clean(fd.get("years"), 12), contract = clean(fd.get("contract"), 10), year = clean(fd.get("year"), 10), annual = Math.round(Number(fd.get("annual"))), hours = Math.round(Number(fd.get("hours")) || 0), star = Number(fd.get("star")), word = clean(fd.get("word"), 200);
    if (!(annual >= 1000 && annual <= 30000)) return { error: "세전 연봉을 만 원 단위로 적어주세요 (예: 4200)" };
    if (!inList(X_YEARS, years)) return { error: "연차를 골라주세요" };
    if (!inList(CONTRACT, contract)) return { error: "계약 형태를 골라주세요" };
    if (!inList(PAY_YEAR, year)) return { error: "언제 기준인지 골라주세요" };
    if (!(star >= 1 && star <= 5)) return { error: "연봉 만족도를 골라주세요" };
    if (hours && !(hours >= 10 && hours <= 80)) return { error: "주 근무시간은 10~80 사이로 적어주세요" };
    if (word) { const rp = reviewProblem(word); if (rp) return { error: rp }; }
    const hobong = clean(fd.get("hobong"), 12), area = clean(fd.get("area"), 12), rec = fd.get("rec") === null || fd.get("rec") === "" ? undefined : Number(fd.get("rec"));
    const sub: Record<string, number> = {}; for (const p of PAY_SUB) { const v = Number(fd.get("sub_" + p.k)); if (v >= 1 && v <= 5) sub[p.k] = v; }
    state = { kind, dept, years, contract, year, annual, hours: hours || undefined, star, word: word || undefined, hobong: inList(HOBONG, hobong) ? hobong : undefined, area: inList(WORK_AREA, area) ? area : undefined, sub: Object.keys(sub).length ? sub : undefined, rec: rec === 0 || rec === 1 ? rec : undefined };
  } else {
    const unit = clean(fd.get("unit"), 4), amount = Math.round(Number(fd.get("amount"))), time = clean(fd.get("time"), 30), days = clean(fd.get("days"), 30), tax = clean(fd.get("tax"), 12), meal = clean(fd.get("meal"), 8), load = clean(fd.get("load"), 8), again = Number(fd.get("again")), work = clean(fd.get("work"), 500), note = clean(fd.get("note"), 500);
    if (!inList(ALBA_UNIT, unit)) return { error: "일급인지 시급인지 골라주세요" };
    if (!(amount >= 1 && amount <= 200)) return { error: unit === "일급" ? "일급을 만 원 단위로 적어주세요 (예: 15)" : "시급을 만 원 단위로 적어주세요 (예: 2 또는 1.5 → 2)" };
    if (!time) return { error: "근무 시간을 적어주세요 (예: 09~18시)" };
    if (!inList(ALBA_TAX, tax) || !inList(ALBA_MEAL, meal) || !inList(ALBA_LOAD, load)) return { error: "세금 처리·식사·근무 강도를 골라주세요" };
    if (![0, 1].includes(again) || fd.get("again") === null) return { error: "또 갈 의향이 있는지 골라주세요" };
    for (const t of [work, note, time, days]) if (t) { const rp = reviewProblem(t); if (rp) return { error: rp }; }
    const cases = Math.round(Number(fd.get("cases")) || 0), star = Number(fd.get("star"));
    if (cases && !(cases >= 1 && cases <= 2000)) return { error: "하루 건수는 1~2000 사이로 적어주세요" };
    state = { kind, dept, unit, amount, time, days: days || undefined, tax, meal, load, again, work: work || undefined, note: note || undefined, cases: cases || undefined, star: star >= 1 && star <= 5 ? star : undefined };
  }
  if (!hid) {
    if (!name || !inList(JOB_REGIONS, region) || !inList(HOSP_KINDS, hk)) return { error: "병원을 찾거나, 새 병원 이름·지역·종류를 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", name).eq("region", region).maybeSingle();
    if (ex) hid = ex.id; else { const { data: h, error } = await s.from("hospitals").insert({ name, region, kind: hk, created_by: u.id }).select("id").single(); if (error || !h) return { error: "병원 등록에 실패했어요" }; hid = h.id; await saveDistrict(h.id, region, String(fd.get("gu") ?? "")).catch(() => {}); }
  }
  const key = xKey(kind, hid); const { data: prev } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", key).maybeSingle();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: key, state: { ...state, at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요. 잠시 후 다시" };
  if (!prev) await awardXp(u.id, 30, key, "quest");
  (await import("./memo")).memoDel("fresh:" + u.id);
  revalidatePath(`/hospitals/${hid}`); redirect(`/hospitals/${hid}?xdone=${kind}#x-${kind}`);
}
