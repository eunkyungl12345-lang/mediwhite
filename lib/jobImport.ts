import { db } from "./supabase";
import { dataKey } from "./dataKey";
import { guessTags, joinTags } from "./jobTags";
/** 🏛️ 공공기관 채용정보(잡알리오, 공공데이터포털) → 병원 공고만 골라 채용 게시판에 자동 등록
 *  - 환경변수 DATA_GO_KR_KEY 필요 (data.go.kr '재정경제부_공공기관 채용정보 조회서비스' 활용신청, 개발키 자동승인)
 *  - 국립대병원·지방의료원·보훈병원 등 공공병원 공고가 들어와요. 원문 링크(contact)로 중복 확인 */
const BASE = "https://apis.data.go.kr/1051000/recruitment/list";
const HOSP = /병원|의료원|의료센터|암센터|재활원|보훈|적십자|치과|약국/;
const DEPT_RULES: [RegExp, string][] = [
  [/간호조무/, "간호조무사"], [/간호/, "간호사"], [/방사선/, "방사선"], [/물리치료/, "물리치료"], [/작업치료/, "작업치료사"], [/임상병리/, "임상병리"],
  [/응급구조/, "응급구조"], [/치과위생/, "치과위생사"], [/치과기공/, "치과기공사"], [/한의/, "한의사"], [/약사|약제/, "약사"], [/전문의|전공의|의사|의무직|촉탁의|임상교수|진료교수/, "의사"],
  [/원무|행정|사무|일반직|회계|전산|시설|기술직|보건직|운영직/, "원무"],
];
const REGIONS: [RegExp, string][] = [[/서울/, "서울"], [/인천/, "인천"], [/경기/, "경기 남부"], [/부산/, "부산"], [/대구/, "대구"], [/대전/, "대전"], [/광주/, "광주"], [/울산/, "울산"], [/세종/, "세종"], [/강원/, "강원"], [/충청|충북|충남/, "충청"], [/전라|전북|전남/, "전라"], [/경상|경북|경남/, "경상"], [/제주/, "제주"]];
const pick = (r: any, ...k: string[]) => { for (const x of k) if (r?.[x] != null && r[x] !== "") return String(r[x]); return ""; };
const ymd = (s: string) => { const m = s.replace(/\D/g, "").slice(0, 8); return m.length === 8 ? `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)}` : null; };
function items(doc: any): any[] { if (Array.isArray(doc)) return doc; if (doc && typeof doc === "object") { for (const k of ["result", "items", "item", "data", "list"]) { const v = doc[k]; if (Array.isArray(v)) return v; if (v && typeof v === "object") { const f = items(v); if (f.length) return f; } } for (const v of Object.values(doc)) if (v && typeof v === "object") { const f = items(v); if (f.length) return f; } } return []; }
export type ImportResult = { ok: boolean; fetched: number; hospitals: number; added: number; error?: string };
/** 중복 판정용 정규화 키 — 공백·구두점·대소문자를 무시한 (병원|제목|마감일) */
const norm = (v?: string | null) => String(v ?? "").replace(/[\s·・,.()\[\]{}'"`~!?\-]/g, "").toLowerCase();
const pubJobKey = (hospital: string, welfare: string | null, deadline: string | null) => `${norm(hospital)}|${norm(welfare)}|${deadline ?? ""}`;
export async function importPublicJobs(maxPages = 6): Promise<ImportResult> {
  const key = await dataKey(); if (!key) return { ok: false, fetched: 0, hospitals: 0, added: 0, error: "DATA_GO_KR_KEY 환경변수가 없어요" };
  const s = db(); const { data: bot } = await s.from("users").select("id").eq("username", "mw_bot").maybeSingle(); if (!bot) return { ok: false, fetched: 0, hospitals: 0, added: 0, error: "mw_bot 계정이 없어요" };
  let rows: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const u = `${BASE}?${new URLSearchParams({ serviceKey: key, resultType: "json", numOfRows: "100", pageNo: String(page), ongoingYn: "Y" })}`;
    let doc: any; try { const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(20000) }); const t = await r.text(); doc = JSON.parse(t); } catch (e: any) { if (page === 1) return { ok: false, fetched: 0, hospitals: 0, added: 0, error: "API 응답을 못 받았어요: " + String(e?.message ?? e).slice(0, 120) }; break; }
    const it = items(doc); if (!it.length) { if (page === 1) return { ok: false, fetched: 0, hospitals: 0, added: 0, error: "API 오류: " + JSON.stringify(doc).slice(0, 160) }; break; }
    rows = rows.concat(it); if (it.length < 100) break;
  }
  const hosp = rows.filter(r => HOSP.test(pick(r, "instNm", "pblntInstNm", "insttNm")));
  // 🔁 중복 방지 — 같은 공고를 매번 새로 INSERT하지 않도록 기존 공공 공고를 한 번에 읽어 두고
  //    (원문 URL) + (병원·제목·마감일 정규화 키) 두 기준으로 건너뛴다.
  //    (예전엔 contact 하나로 maybeSingle()을 썼는데, 중복이 2개 이상이 되면 쿼리가 실패해 매 실행마다 한 건씩 더 쌓였다)
  const seenUrl = new Set<string>(), seenKey = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data: have, error: haveErr } = await s.from("jobs").select("contact,hospital,welfare,deadline").eq("author_id", bot.id).order("id").range(from, from + 999);
    if (haveErr) break;
    for (const x of have ?? []) { if (x.contact) seenUrl.add(String(x.contact).trim()); seenKey.add(pubJobKey(x.hospital ?? "", x.welfare, x.deadline)); }
    if ((have ?? []).length < 1000) break;
    if (from > 20000) break;
  }
  let added = 0;
  for (const r of hosp) {
    const inst = pick(r, "instNm", "pblntInstNm", "insttNm"), title = pick(r, "recrutPbancTtl", "pbancTtl", "title"), ncs = pick(r, "ncsCdNmLst", "ncsCdLst", "ncsNm");
    const url = pick(r, "srcUrl", "url", "pbancUrl") || `https://job.alio.go.kr/recruitview.do?idx=${pick(r, "recrutPblntSn", "pblntSn", "sn")}`;
    const text = `${title} ${ncs}`; const dept = DEPT_RULES.find(([re]) => re.test(text))?.[1] ?? "기타";
    const rg = pick(r, "workRgnNmLst", "workRgnLst"), region = REGIONS.find(([re]) => re.test(rg))?.[1] ?? "서울";
    const hire = pick(r, "hireTypeNmLst", "hireTypeLst"), emp = /인턴/.test(hire) ? "인턴" : /비정규|계약|기간제/.test(hire) ? "계약직" : /정규|무기/.test(hire) ? "정규직" : "계약직";
    const nope = pick(r, "recrutNope", "nope"), qual = pick(r, "aplyQlfcCn", "aplyQlfc"), pref = pick(r, "prefCondCn", "prefCn");
    const deadline = ymd(pick(r, "pbancEndYmd", "endYmd", "rceptEndYmd")), key = pubJobKey(inst, title.slice(0, 80), deadline);
    if (seenUrl.has(url.trim()) || seenKey.has(key)) continue;
    const body = `${nope ? `👥 모집 인원: ${nope}명\n` : ""}${ncs ? `🗂️ 직무: ${ncs}\n` : ""}${qual ? `\n✅ 지원 자격\n${qual.slice(0, 600)}\n` : ""}${pref ? `\n⭐ 우대 사항\n${pref.slice(0, 400)}\n` : ""}`;
    const { error } = await s.from("jobs").insert({ author_id: bot.id, hospital: inst, region, dept, emp_type: emp, deadline, contact: url, body: joinTags(guessTags(`${title} ${qual} ${pref}`), body), welfare: title.slice(0, 80) });
    if (!error) { added++; seenUrl.add(url.trim()); seenKey.add(key); }
  }
  return { ok: true, fetched: rows.length, hospitals: hosp.length, added };
}
