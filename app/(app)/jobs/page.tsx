import Link from "next/link";
import { openExtJobs, extTags, isG3, parsePay } from "@/lib/extJobs";
import ExtCard from "@/components/jobs/ExtCard";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ago } from "@/lib/format";
import { JOB_REGIONS, JOB_DEPTS, dday, overall } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import Avatar from "@/components/Avatar";
import ImportButton from "@/components/jobs/ImportButton";
import RegionSelect from "@/components/jobs/RegionSelect";
import JobVoice from "@/components/jobs/JobVoice";
import JobCard from "@/components/jobs/JobCard";
import { jobCommentCounts } from "@/lib/jobComments";
import { QUICK, splitTags, tagLabel, SHARE_TAG } from "@/lib/jobTags";
import { VOICE_OPTS } from "@/lib/jobVoice";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { factLine, type FactAgg } from "@/lib/hospFacts";
export const metadata = { title: "의료기사 전문 채용관" };
export const dynamic = "force-dynamic";

/** 💼 의료인 채용 — 파트별 탭 · 공공병원 자동수집 + 현직자 제보 · 병원 리뷰 평점 같이 보기 (의료계의 블라인드) */
export default async function JobsPage({ searchParams }: { searchParams: { region?: string; dept?: string; src?: string; q?: string; t?: string; soon?: string; g3?: string; sort?: string; th?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", dept = JOB_DEPTS.includes(searchParams.dept as any) ? searchParams.dept! : "";
  const src = ["public", "member", "share", "ext"].includes(searchParams.src ?? "") ? searchParams.src! : "", tg = QUICK.some(x => x.id === searchParams.t) ? searchParams.t! : "", kw = (searchParams.q ?? "").trim().slice(0, 30);
  let q = d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,body,author:users!jobs_author_id_fkey(nickname,dept,username)").eq("hidden", false).order("closed").order("created_at", { ascending: false }).limit(150);
  if (region) q = q.eq("region", region); if (dept) q = q.eq("dept", dept); if (kw) q = q.ilike("hospital", `%${kw}%`); if (tg) q = q.ilike("body", `%#${tg}%`);
  const [{ data: all }, { count: hospN }, { data: hosps }, { data: deptCounts }, { data: voices }] = await Promise.all([q, d.from("hospital_reviews").select("id", { count: "exact", head: true }), d.from("hospitals").select("id,name,region"), d.from("jobs").select("dept").eq("hidden", false).eq("closed", false).limit(1000), d.from("events").select("user_id,text").eq("kind", "jobvoice").limit(2000)]);
  const isPublic = (j: any) => j.author?.username === "mw_bot";
  const isShare = (j: any) => !isPublic(j) && splitTags(j.body).tags.includes(SHARE_TAG);
  let jobs = (all ?? []).filter(j => src === "public" ? isPublic(j) : src === "member" ? !isPublic(j) : src === "share" ? isShare(j) : true).filter(j => searchParams.g3 !== "1" || /강남|서초|송파|잠실|역삼|신사|압구정|양재|방배|반포|문정|가락/.test(`${j.hospital} ${j.body ?? ""} ${j.welfare ?? ""}`));
  // 🎯 테마 큐레이션 — 4대 핵심관으로 1줄 정돈 (신규·초보는 필터로 이동)
  const TH = [{ k: "head", n: "👑 총괄·실장관" }, { k: "day", n: "☀️ 3교대 탈출관" }, { k: "univ", n: "🏛️ 대학·상급병원관" }, { k: "pay", n: "💰 고연봉·인센티브" }] as const;
  const th = (TH.some(x => x.k === searchParams.th) || searchParams.th === "new") ? searchParams.th! : "";
  const txt = (j: any) => `${j.hospital ?? ""} ${j.emp_type ?? ""} ${j.hours ?? ""} ${j.pay ?? ""} ${j.welfare ?? ""} ${j.body ?? ""}`;
  const RX = { day: /상근|주간\s*근무|낮\s*근무|나이트\s*(없|X|x)|야간\s*(없|X|x)|당직\s*(없|X|x)|3교대\s*(없|X|x)|오프\s*고정/, univ: /대학교?병원|대병원|상급종합|의료원|세브란스|아산병원|삼성서울|성모병원|국립.*병원|암센터|보훈병원|원자력/, pay: /인센|C-?arm|초음파\s*수당/, head: /총괄|실장|팀장|관리자|과장|부장/, new: /신입|졸업\s*예정|졸예|국시|면허\s*취득\s*예정|경력\s*무관|경력무관|신규\s*(간호사|방사선사|임상병리사)?\s*(가능|환영)/ } as Record<string, RegExp>;
  const themeOk = (j: any) => !th ? true : th === "day" ? RX.day.test(txt(j)) : th === "univ" ? isPublic(j) || RX.univ.test(txt(j)) : th === "pay" ? parsePay(j.pay ?? "") >= 4500 || RX.pay.test(txt(j)) : th === "head" ? j.dept === "총괄" || RX.head.test(`${j.hospital ?? ""} ${j.emp_type ?? ""} ${(j.body ?? "").slice(0, 120)}`) : RX.new.test(txt(j));
  const extTheme = (e: any) => !th ? true : th === "day" ? true : th === "univ" ? RX.univ.test(e.h) : th === "pay" ? parsePay(e.pay) >= 4500 || RX.pay.test(`${e.pay} ${e.note}`) : th === "head" ? e.k === "총괄" || RX.head.test(e.dept) : RX.new.test(`${e.note} ${e.warn ?? ""} ${e.dept}`) || /경험 없어도|나이 무관/.test(e.note);
  jobs = jobs.filter(themeOk);
  // 설문 집계
  const vN = (voices ?? []).length, vc: Record<string, number> = {}; for (const v of voices ?? []) for (const id of String(v.text).split("|")[0].split(",").filter(Boolean)) vc[id] = (vc[id] ?? 0) + 1;
  const vTop = vN >= 3 ? VOICE_OPTS.map(o => ({ label: o.label, pct: Math.round((vc[o.id] ?? 0) / vN * 100) })).sort((a, b) => b.pct - a.pct).slice(0, 3) : [];
  const answered = (voices ?? []).some(v => v.user_id === s.id);
  const soonOnly = searchParams.soon === "1", isSoon = (j: any) => { const x = dday(j.deadline); return x === "오늘 마감" || (x.startsWith("D-") && Number(x.slice(2)) <= 3); };
  const open = jobs.filter(j => !j.closed && dday(j.deadline) !== "마감" && (!soonOnly || isSoon(j))).sort((a, b) => Number(isShare(b)) - Number(isShare(a))), closed = jobs.filter(j => j.closed || dday(j.deadline) === "마감");
  // 병원 리뷰 평점 붙이기 (이름이 같거나 포함)
  const nk = (name: string, region: string) => `${name.replace(/\s+/g, "")}|${region}`; // 이름(공백 무시)+지역이 정확히 같을 때만 같은 병원
  const names = Array.from(new Set(open.map(j => nk(j.hospital, j.region)))); const hmap: Record<string, { id: number; avg: number; n: number }> = {};
  const matched = (hosps ?? []).filter(h => names.includes(nk(h.name, h.region)));
  if (matched.length) { const { data: revs } = await d.from("hospital_reviews").select("hospital_id,r_welfare,r_balance,r_pay,r_culture,r_growth").in("hospital_id", matched.map(h => h.id)).eq("hidden", false);
    for (const h of matched) { const rv = (revs ?? []).filter(r => r.hospital_id === h.id); hmap[nk(h.name, h.region)] = { id: h.id, avg: overall(rv), n: rv.length }; } }
  const [facts, contributed] = await Promise.all([loadFacts(matched.map(h => h.id)), hasContributed(s.id, s.role)]); const fmap: Record<string, FactAgg> = {};
  for (const [k, v] of Object.entries(hmap)) if (facts[v.id]) fmap[k] = facts[v.id];
  const cnt: Record<string, number> = {}; for (const r of deptCounts ?? []) cnt[r.dept] = (cnt[r.dept] ?? 0) + 1;
  const byPay = searchParams.sort === "pay";
  const link = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ region, dept, src, q: kw, t: tg, g3: searchParams.g3 === "1" ? "1" : "", sort: byPay ? "pay" : "", th, ...o }).filter(([, v]) => v)); return `/jobs${p.toString() ? "?" + p : ""}`; };
  const EXK: Record<string, string> = { 간호: "간호사", 간호조무사: "간호조무사", 방사선: "방사선", 물리치료: "물리치료", 임상병리: "임상병리", 원무: "원무", 총괄: "총괄", 치과위생사: "치과위생사" };
  const matchDept = (e: any, d: string) => {
    if (!d) return true;
    const dt = `${e.dept ?? ""} ${e.note ?? ""}`;
    if (d === "간호사") {
      if (e.k === "간호조무사" && !/간호사/.test(e.dept)) return false;
      if (/조무사/.test(e.dept) && !/간호사/.test(e.dept)) return false;
      return e.k === "간호" || /간호사|간호\s*팀장|수술실|병동|외래\s*간호/.test(dt);
    }
    if (d === "간호조무사") {
      return e.k === "간호조무사" || /조무사/.test(dt);
    }
    if (EXK[e.k] === d) return true;
    if (d === "방사선" && /방사선|영상의학|C-?arm|X-?ray/i.test(dt)) return true;
    if (d === "물리치료" && /물리치료|도수/i.test(dt)) return true;
    if (d === "치과위생사" && /치과|위생사/i.test(dt)) return true;
    if (d === "임상병리" && /임상병리|진단검사/i.test(dt)) return true;
    if (d === "원무" && /원무|행정|보험청구|상담/i.test(dt)) return true;
    if (d === "총괄" && (e.k === "총괄" || /총괄|실장|팀장|관리자|과장|부장/.test(dt))) return true;
    return false;
  };
  const exReg = (a: string) => a.startsWith("서울") ? "서울" : /고양|파주|의정부|남양주|구리|양주|동두천|포천|연천|김포/.test(a) ? "경기 북부" : a.startsWith("경기") ? "경기 남부" : "";
  const ext = (!src || src === "ext") && !soonOnly ? openExtJobs().filter(e => matchDept(e, dept) && (!region || exReg(e.area) === region) && (!kw || e.h.includes(kw)) && (!tg || extTags(e.id).includes(tg)) && (searchParams.g3 !== "1" || isG3(e)) && extTheme(e)).sort((a, b) => byPay ? parsePay(b.pay) - parsePay(a.pay) : Number(isG3(b)) - Number(isG3(a))) : [];
  if (byPay) open.sort((a, b) => parsePay(b.pay ?? "") - parsePay(a.pay ?? ""));
  const { data: exH } = ext.length ? await d.from("hospitals").select("id,name").in("name", Array.from(new Set(ext.map(e => e.h)))) : { data: [] as any[] }; const EXH = new Map((exH ?? []).map(h => [h.name, h.id])); const exF = EXH.size ? await loadFacts(Array.from(EXH.values())) : {};
  const tabCounts: Record<string, number> = {};
  for (const r of deptCounts ?? []) {
    if (!th) tabCounts[r.dept] = (tabCounts[r.dept] ?? 0) + 1;
  }
  for (const e of openExtJobs()) {
    if (!extTheme(e)) continue;
    for (const x of JOB_DEPTS) {
      if (matchDept(e, x)) tabCounts[x] = (tabCounts[x] ?? 0) + 1;
    }
  }
  const jcn = await jobCommentCounts();
  const soon = open.filter(j => { const x = dday(j.deadline); return x === "오늘 마감" || (x.startsWith("D-") && Number(x.slice(2)) <= 3); }).length;
  return (
    <div className="jb2">
      <div className="jb2-head">
        <div>
          <h2>💼 병원 채용관</h2>
          <p>실제 퇴근시간 & 고용안정성 팩트 검증</p>
        </div>
        <div className="jb2-head-links">
          <Link href="/jobs/seek" className="btn ghost sm">🙋 구직 프로필</Link>
          <Link href="/jobs/new" className="btn sm">공고 등록</Link>
        </div>
      </div>
      <form className="jb2-search" action="/jobs">{dept && <input type="hidden" name="dept" value={dept} />}{region && <input type="hidden" name="region" value={region} />}<input name="q" defaultValue={kw} placeholder="병원 이름으로 찾기 (예: 서울대, 의료원)" /><button className="btn">검색</button></form>
      <nav className="jbx-th" aria-label="테마별 큐레이션">{TH.map(x => <Link key={x.k} href={link({ th: th === x.k ? "" : x.k })} className={th === x.k ? "on" : ""} aria-current={th === x.k ? "true" : undefined}>{x.n}</Link>)}</nav>
      <div className="jb2-tabs" role="tablist">{["", ...JOB_DEPTS].filter(x => x !== "총괄" && (!x || x === dept || (tabCounts[x] ?? 0) > 0)).map(x => <Link key={x} href={link({ dept: x })} className={dept === x ? "on" : ""}>{x ? deptLabel(x) : "전체"}{x && (tabCounts[x] ?? 0) ? <small>{tabCounts[x]}</small> : null}</Link>)}</div>
      <div className="jb2-toolbar">
        <RegionSelect value={region} />
        <Link href={link({ sort: byPay ? "" : "pay" })} className={"btn-tag" + (byPay ? " on" : "")} aria-pressed={byPay}>💰 급여순</Link>
        <Link href={link({ th: th === "new" ? "" : "new" })} className={"btn-tag" + (th === "new" ? " on" : "")}>🌱 초보환영</Link>
        <Link href={link({ g3: searchParams.g3 === "1" ? "" : "1" })} className={"btn-tag" + (searchParams.g3 === "1" ? " on" : "")}>📍 강남 3구</Link>
        <span className="jb2-count">모집 중 <b>{(src === "ext" ? 0 : open.length) + ext.length}</b></span>
      </div>
      {s.role === "admin" && <ImportButton />}
      {ext.length > 0 && <><h3 className="dy-h" style={{ margin: "4px 0 0" }}>{th === "head" ? "👑 엄선 총괄·실장 알짜 공고" : th === "univ" ? "🏛️ 상급·대학병원 공고" : th === "pay" ? "💰 고연봉·인센티브 공고" : "🌙 저녁 약속 잡을 수 있는 알짜 병원"} <small>{ext.length}</small></h3><div className="jb2-list">{(th || dept ? ext : ext.slice(0, 4)).map(e => <ExtCard key={e.id} e={e} hid={EXH.get(e.h)} fa={EXH.get(e.h) ? exF[EXH.get(e.h)!] : undefined} nc={jcn[`x${e.id}`] ?? 0} />)}</div>{!th && !dept && ext.length > 4 && <Link href="/jobs/day" className="btn ghost jb2-more">🌙 알짜 병원 {ext.length}곳 전부 보기 ›</Link>}</>}
      {open.length > 0 ? <div className="jb2-list">{open.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[nk(j.hospital, j.region)]} fa={fmap[nk(j.hospital, j.region)]} locked={!contributed} nc={jcn[`j${j.id}`] ?? 0} />)}</div> : ext.length === 0 && src !== "ext" ? <div className="jb2-empty"><span>💼</span><b>{dept ? `${deptLabel(dept)} 공고가 아직 없어요` : "아직 올라온 공고가 없어요"}</b><p>단톡방에서 본 공고, 우리 병원 구인 — 첫 공고를 올려주세요. 공공병원 공고는 자동 수집이 켜지면 여기에 모여요.</p></div> : null}
      {closed.length > 0 && src !== "ext" && <details className="jb2-closed"><summary>마감된 공고 {closed.length}개</summary><div className="jb2-list">{closed.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[nk(j.hospital, j.region)]} />)}</div></details>}
      <JobVoice n={vN} top={vTop} answered={answered} />
    </div>
  );
}
