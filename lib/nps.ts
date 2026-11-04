import { db } from "./supabase";
/** 📊 국민연금 가입 사업장 공공데이터 — 체크가 0개인 병원도 첫날부터 '직원 수·입퇴사·추정 평균 월급'
 *  공공데이터포털 '국민연금공단_국민연금 가입 사업장 내역 서비스' (DATA_GO_KR_KEY 하나로 같이 씀, 활용 신청 필요)
 *  응답 형식이 JSON/XML 어느 쪽이든, V2/구버전 오퍼레이션 이름 어느 쪽이든 동작하게 방어적으로 */
const BASES = ["https://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2"];
const OPS = { base: ["getBassInfoSearchV2"], detail: ["getDetailInfoSearchV2"], period: ["getPdAcctoSttusInfoSearchV2"] }; // V2: 검색은 wkplNm, 기간별은 data_crt_ym (2026-11 실제 응답으로 확인)
export const NPS_RATE = 0.095; // 2026년 국민연금 보험료율(근로자+사용자). 고지금액 ÷ 인원 ÷ 요율 ≈ 1인 평균 기준소득월액
export type NpsInfo = { seq: string; name: string; addr: string; cnt: number; amt: number; avgPay: number; inN: number; outN: number; months: number; ym: string; at: string };
export const npsKey = (hid: number) => `nps:${hid}`;
const SIDO: Record<string, string[]> = { 서울: ["11"], 부산: ["26"], 대구: ["27"], 인천: ["28"], 광주: ["29"], 대전: ["30"], 울산: ["31"], 세종: ["36"], "경기 남부": ["41"], "경기 북부": ["41"], 강원: ["42", "51"], 충청: ["43", "44"], 전라: ["45", "46", "52"], 경상: ["47", "48"], 제주: ["50"] };

function parseItems(text: string): Record<string, string>[] {
  try { const j = JSON.parse(text); const it = j?.response?.body?.items?.item ?? j?.response?.body?.items ?? j?.items ?? []; return (Array.isArray(it) ? it : [it]).filter(Boolean).map((o: any) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v ?? "")]))); } catch {}
  const out: Record<string, string>[] = []; for (const m of Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/g))) { const o: Record<string, string> = {}; for (const f of Array.from(m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g))) o[f[1]] = f[2].trim(); out.push(o); } return out;
}
async function call(kind: keyof typeof OPS, params: Record<string, string>): Promise<{ items: Record<string, string>[]; raw: string }> {
  const key = (process.env.DATA_GO_KR_KEY || "").trim(); if (!key) throw new Error("DATA_GO_KR_KEY 환경변수가 없어요");
  let last = "";
  for (const base of BASES) for (const op of OPS[kind]) {
    const u = `${base}/${op}?${new URLSearchParams({ serviceKey: key, pageNo: "1", numOfRows: "100", dataType: "json", ...params })}`;
    try { const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(15000) }); const t = await r.text(); last = t.slice(0, 300); if (!r.ok || /SERVICE_KEY|SERVICE ERROR|NOT_REGISTERED|Unexpected errors|API not found/i.test(t)) continue; return { items: parseItems(t), raw: t.slice(0, 300) }; } catch (e: any) { last = String(e?.message ?? e); }
  }
  throw new Error("국민연금 API 응답 오류: " + last);
}
const pick = (o: Record<string, string>, ...k: string[]) => { for (const x of k) if (o[x] != null && o[x] !== "") return o[x]; return ""; };
/** 병원 이름이 들어가도 병원이 아닌 사업장 (어린이집·금고·입점 매장·공사 현장 등) */
const NOISE = /어린이집|금고|노동조합|노조|파리바게뜨|뚜레쥬르|스타벅스|편의점|CU|GS25|세븐일레븐|식당|푸드|카페|건립|공사|상용|일용|주차|장례|매점|점$/;
const norm = (s: string) => s.replace(/[（(].*?[)）]|주식회사|의료법인|재단법인|사회복지법인|학교법인|\s/g, "");
/** 병원 이름으로 후보 찾기 (같은 시도·폐업 제외, 구 이름이 주소에 있으면 우선) */
export async function npsSearch(name: string, region: string, gu?: string) {
  const { items } = await call("base", { wkplNm: name.slice(0, 30) });
  const codes = SIDO[region] ?? [];
  return items.map(o => ({ seq: pick(o, "seq"), name: pick(o, "wkplNm"), addr: pick(o, "wkplRoadNmDtlAddr", "wkplRoadNmAddr"), sido: pick(o, "ldongAddrMgplDgCd"), status: pick(o, "wkplJnngStcd"), ym: pick(o, "dataCrtYm") }))
    .filter(c => c.seq && (!codes.length || !c.sido || codes.includes(c.sido.slice(0, 2))) && c.status !== "2" && !NOISE.test(c.name) && norm(c.name).includes(norm(name).slice(0, 12)))
    .sort((a, b) => Number(!!gu && b.addr.includes(gu)) - Number(!!gu && a.addr.includes(gu)) || Number(norm(b.name) === norm(name)) - Number(norm(a.name) === norm(name)));
}
/** seq 하나로 상세(가입자수·고지금액) + 최근 6개월 입사·퇴사 */
export async function npsFetch(seq: string, nameHint = "", addrHint = ""): Promise<NpsInfo> {
  const { items } = await call("detail", { seq }); const d = items[0] ?? {};
  const cnt = Number(pick(d, "jnngpCnt")) || 0, amt = Number(pick(d, "crrmmNtcAmt")) || 0;
  let inN = 0, outN = 0, months = 0; const now = new Date(Date.now() + 9 * 3600000);
  for (let k = 1; k <= 6; k++) { const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1)); const ym = `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
    try { const { items: p } = await call("period", { seq, data_crt_ym: ym }); if (p[0]) { inN += Number(pick(p[0], "nwAcqzrCnt")) || 0; outN += Number(pick(p[0], "lssJnngpCnt")) || 0; months++; } } catch {} }
  return { seq, name: pick(d, "wkplNm") || nameHint, addr: pick(d, "wkplRoadNmDtlAddr") || addrHint, cnt, amt, avgPay: cnt ? Math.round(amt / cnt / NPS_RATE / 10000) : 0, inN, outN, months, ym: pick(d, "dataCrtYm"), at: new Date().toISOString() };
}
export async function saveNps(hid: number, info: NpsInfo) { await db().from("settings").upsert({ key: npsKey(hid), value: JSON.stringify(info) }); }
export async function loadNps(hids: number[]): Promise<Record<number, NpsInfo>> {
  if (!hids.length) return {}; const { data } = await db().from("settings").select("key,value").in("key", hids.map(npsKey));
  const out: Record<number, NpsInfo> = {}; for (const r of data ?? []) try { out[Number(String(r.key).slice(4))] = JSON.parse(r.value); } catch {} return out;
}
/** 자동 연결: 이름이 같은 사업장 묶음이 딱 하나일 때만 (같은 이름이 여러 번 나오면 최신·가입자 많은 쪽) */
export async function autoLinkNps(hid: number, name: string, region: string, gu?: string): Promise<{ ok: boolean; msg: string; info?: NpsInfo }> {
  const c = await npsSearch(name, region, gu); const groups = new Map<string, typeof c>();
  for (const x of c) { const k = norm(x.name); groups.set(k, [...(groups.get(k) ?? []), x]); }
  let g = groups.size === 1 ? Array.from(groups.values())[0] : groups.get(norm(name)) ?? null;
  if (!g && gu) { const inGu = Array.from(groups.values()).filter(v => v.some(x => x.addr.includes(gu))); if (inGu.length === 1) g = inGu[0]; }
  if (!g) return { ok: false, msg: c.length ? `후보 ${groups.size}곳 — 관리자가 골라주세요` : "국민연금 사업장에서 못 찾았어요" };
  const tries = g.sort((a, b) => b.ym.localeCompare(a.ym)).slice(0, 4); let best: NpsInfo | null = null;
  for (const t of tries) { const info = await npsFetch(t.seq, t.name, t.addr); if (!best || info.cnt > best.cnt) best = info; }
  if (!best || !best.cnt) return { ok: false, msg: "가입자 0명 — 관리자가 확인해주세요" };
  await saveNps(hid, best); return { ok: true, msg: `${best.name} 연결`, info: best };
}
/** 스케줄러: 연결 안 된 병원 몇 곳씩 자동 연결 + 30일 지난 정보 새로고침 */
export async function npsSweep(limit = 8) {
  const d = db(); const { data: hs } = await d.from("hospitals").select("id,name,region").order("id", { ascending: false }).limit(300);
  const have = await loadNps((hs ?? []).map(h => h.id)); const { data: tried } = await d.from("settings").select("key").like("key", "npstry:%");
  const triedSet = new Set((tried ?? []).map(t => Number(String(t.key).slice(7)))); let n = 0;
  for (const h of hs ?? []) { if (n >= limit) break; const cur = have[h.id];
    if (cur && Date.now() - Date.parse(cur.at) < 30 * 86400000) continue;
    if (!cur && triedSet.has(h.id)) continue; n++;
    try { if (cur) await saveNps(h.id, await npsFetch(cur.seq, cur.name, cur.addr)); else { const { data: g } = await d.from("settings").select("value").eq("key", `hdist:${h.id}`).maybeSingle(); const r = await autoLinkNps(h.id, h.name, h.region, g?.value); if (!r.ok) await d.from("settings").upsert({ key: `npstry:${h.id}`, value: r.msg }); } } catch { break; } }
}
