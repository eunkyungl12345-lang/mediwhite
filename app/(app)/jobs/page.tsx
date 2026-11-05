import Link from "next/link";
import { openExtJobs, extTags, isG3 } from "@/lib/extJobs";
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
import { QUICK, splitTags, tagLabel, SHARE_TAG } from "@/lib/jobTags";
import { VOICE_OPTS } from "@/lib/jobVoice";
import { loadFacts, hasContributed } from "@/lib/hospFactsDb";
import { factLine, type FactAgg } from "@/lib/hospFacts";
export const dynamic = "force-dynamic";

/** 💼 의료인 채용 — 파트별 탭 · 공공병원 자동수집 + 현직자 제보 · 병원 리뷰 평점 같이 보기 (의료계의 블라인드) */
export default async function JobsPage({ searchParams }: { searchParams: { region?: string; dept?: string; src?: string; q?: string; t?: string; soon?: string; g3?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = JOB_REGIONS.includes(searchParams.region as any) ? searchParams.region! : "", dept = JOB_DEPTS.includes(searchParams.dept as any) ? searchParams.dept! : "";
  const src = ["public", "member", "share", "ext"].includes(searchParams.src ?? "") ? searchParams.src! : "", tg = QUICK.some(x => x.id === searchParams.t) ? searchParams.t! : "", kw = (searchParams.q ?? "").trim().slice(0, 30);
  let q = d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,body,author:users!jobs_author_id_fkey(nickname,dept,username)").eq("hidden", false).order("closed").order("created_at", { ascending: false }).limit(150);
  if (region) q = q.eq("region", region); if (dept) q = q.eq("dept", dept); if (kw) q = q.ilike("hospital", `%${kw}%`); if (tg) q = q.ilike("body", `%#${tg}%`);
  const [{ data: all }, { count: hospN }, { data: hosps }, { data: deptCounts }, { data: voices }] = await Promise.all([q, d.from("hospital_reviews").select("id", { count: "exact", head: true }), d.from("hospitals").select("id,name,region"), d.from("jobs").select("dept").eq("hidden", false).eq("closed", false).limit(1000), d.from("events").select("user_id,text").eq("kind", "jobvoice").limit(2000)]);
  const isPublic = (j: any) => j.author?.username === "mw_bot";
  const isShare = (j: any) => !isPublic(j) && splitTags(j.body).tags.includes(SHARE_TAG);
  let jobs = (all ?? []).filter(j => src === "public" ? isPublic(j) : src === "member" ? !isPublic(j) : src === "share" ? isShare(j) : true).filter(j => searchParams.g3 !== "1" || /강남|서초|송파|잠실|역삼|신사|압구정|양재|방배|반포|문정|가락/.test(`${j.hospital} ${j.body ?? ""} ${j.welfare ?? ""}`));
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
  const link = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ region, dept, src, q: kw, t: tg, g3: searchParams.g3 === "1" ? "1" : "", ...o }).filter(([, v]) => v)); return `/jobs${p.toString() ? "?" + p : ""}`; };
  const EXK: Record<string, string> = { 간호: "간호사", 간호조무사: "간호조무사", 방사선: "방사선", 물리치료: "물리치료", 임상병리: "임상병리", 원무: "원무" };
  const exReg = (a: string) => a.startsWith("서울") ? "서울" : /고양|파주|의정부|남양주|구리|양주|동두천|포천|연천|김포/.test(a) ? "경기 북부" : a.startsWith("경기") ? "경기 남부" : "";
  const ext = (!src || src === "ext") && !soonOnly ? openExtJobs().filter(e => (!dept || EXK[e.k] === dept) && (!region || exReg(e.area) === region) && (!kw || e.h.includes(kw)) && (!tg || extTags(e.id).includes(tg)) && (searchParams.g3 !== "1" || isG3(e))).sort((a, b) => Number(isG3(b)) - Number(isG3(a))) : [];
  const { data: exH } = ext.length ? await d.from("hospitals").select("id,name").in("name", Array.from(new Set(ext.map(e => e.h)))) : { data: [] as any[] }; const EXH = new Map((exH ?? []).map(h => [h.name, h.id])); const exF = EXH.size ? await loadFacts(Array.from(EXH.values())) : {};
  const soon = open.filter(j => { const x = dday(j.deadline); return x === "오늘 마감" || (x.startsWith("D-") && Number(x.slice(2)) <= 3); }).length;
  return (
    <div className="jb2">
      <div className="jb-head"><h2>💼 의료 채용</h2><Link href="/jobs/new" className="btn">📤 공고 올리기</Link></div>
      <Link href="/jobs/day" className="day-banner"><span>☀️</span><div><b>3교대 탈출</b><small>나이트 없는 상근·낮 근무 공고 {openExtJobs().length}개 모아봤어요</small></div><em>›</em></Link>
      <form className="jb2-search" action="/jobs">{dept && <input type="hidden" name="dept" value={dept} />}{region && <input type="hidden" name="region" value={region} />}<input name="q" defaultValue={kw} placeholder="병원 이름으로 찾기 (예: 서울대, 의료원)" /><button className="btn">검색</button></form>
      <div className="jb2-tabs" role="tablist">{["", ...JOB_DEPTS].map(x => <Link key={x} href={link({ dept: x })} className={dept === x ? "on" : ""}>{x ? deptLabel(x) : "전체"}{x && cnt[x] ? <small>{cnt[x]}</small> : null}</Link>)}</div>
      <div className="jb2-filters">
        <Link href={link({ src: "" })} className={!src ? "on" : ""}>전체</Link><Link href={link({ src: "public" })} className={src === "public" ? "on" : ""}>🏛️ 대학·공공병원</Link><Link href={link({ src: "member" })} className={src === "member" ? "on" : ""}>👤 회원 공고</Link><Link href={link({ src: "share" })} className={src === "share" ? "on" : ""}>🤫 히든 공고</Link><Link href={link({ src: "ext" })} className={src === "ext" ? "on" : ""}>☀️ 상근 공고(외부)</Link>
        <RegionSelect value={region} />
      </div>
      <div className="jb2-quick"><Link href={link({ g3: searchParams.g3 === "1" ? "" : "1" })} className={"g3" + (searchParams.g3 === "1" ? " on" : "")}>📍 강남 3구</Link>{QUICK.map(x => <Link key={x.id} href={link({ t: tg === x.id ? "" : x.id })} className={tg === x.id ? "on" : ""}>{x.label}</Link>)}</div>
      <div className="jb2-sum"><span>모집 중 <b>{(src === "ext" ? 0 : open.length) + ext.length}</b></span>{soon > 0 && <span className="hot">⏰ 3일 안에 마감 {soon}</span>}{kw && <span>‘{kw}’ 검색 · <Link href={link({ q: "" })}>해제</Link></span>}</div>
      {s.role === "admin" && <ImportButton />}
      {ext.length > 0 && <><h3 className="dy-h" style={{ margin: "4px 0 0" }}>☀️ 상근·낮 근무 공고 <small>{ext.length}</small></h3><div className="jb2-list">{ext.map(e => <ExtCard key={e.id} e={e} hid={EXH.get(e.h)} fa={EXH.get(e.h) ? exF[EXH.get(e.h)!] : undefined} />)}</div></>}
      {src === "ext" ? null : open.length === 0 ? <div className="jb2-empty"><span>💼</span><b>{dept ? `${deptLabel(dept)} 공고가 아직 없어요` : "아직 올라온 공고가 없어요"}</b><p>단톡방에서 본 공고, 우리 병원 구인 — 첫 공고를 올려주세요. 공공병원 공고는 자동 수집이 켜지면 여기에 모여요.</p></div>
        : <div className="jb2-list">{open.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[nk(j.hospital, j.region)]} fa={fmap[nk(j.hospital, j.region)]} locked={!contributed} />)}</div>}
      {closed.length > 0 && src !== "ext" && <details className="jb2-closed"><summary>마감된 공고 {closed.length}개</summary><div className="jb2-list">{closed.map(j => <JobCard key={j.id} j={j} pub={isPublic(j)} rv={hmap[nk(j.hospital, j.region)]} />)}</div></details>}
      <JobVoice n={vN} top={vTop} answered={answered} />
    </div>
  );
}
