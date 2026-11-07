import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { dday } from "@/lib/jobs";
import { MIN_N, factLine, posBadges } from "@/lib/hospFacts";
import PosBadges from "@/components/jobs/PosBadges";
import { loadFacts, hasContributed, shiftCompare } from "@/lib/hospFactsDb";
import { loadDistricts } from "@/lib/districtDb";
import { getFocus } from "@/lib/focus";
import JobCard from "@/components/jobs/JobCard";
import { openExtJobs, EXT_SRC, extTags, isG3, splitArea, extCheckedLabel } from "@/lib/extJobs";
import { QUICK, tagLabel } from "@/lib/jobTags";
export const dynamic = "force-dynamic";
/** ☀️ 3교대 탈출 — 나이트 없는 삶, 실수령은 얼마나 줄까? (교대 vs 상근 비교 · 상근 공고 · 상근 병원) */
export default async function DayPage({ searchParams }: { searchParams: { k?: string; c?: string; g3?: string } }) {
  const s = (await getSession())!; const d = db();
  const [cmp, contributed, focus, { data: jobs }] = await Promise.all([shiftCompare(), hasContributed(s.id, s.role), getFocus(),
    d.from("jobs").select("id,hospital,region,dept,emp_type,pay,hours,welfare,deadline,views,closed,created_at,contact,body,author:users!jobs_author_id_fkey(nickname,dept,username)").eq("hidden", false).eq("closed", false).or("body.ilike.%#상근%,body.ilike.%#주4일%,hours.ilike.%상근%,hours.ilike.%평일%").order("created_at", { ascending: false }).limit(60)]);
  const open = (jobs ?? []).filter(j => dday(j.deadline) !== "마감");
  const { data: hs } = cmp.dayHosp.length ? await d.from("hospitals").select("id,name,region,kind").in("id", cmp.dayHosp) : { data: [] as any[] };
  const [facts, dist] = await Promise.all([loadFacts((hs ?? []).map(h => h.id)), loadDistricts((hs ?? []).map(h => h.id))]);
  const inFocus = (h: any) => !!focus && h.region === focus.region && (!focus.gus.length || focus.gus.includes(dist[h.id]));
  const hlist = [...(hs ?? [])].sort((a, b) => Number(inFocus(b)) - Number(inFocus(a)) || (facts[b.id]?.n ?? 0) - (facts[a.id]?.n ?? 0));
  const ext0 = openExtJobs(), kinds = Array.from(new Set(ext0.map(e => e.k))), ek = kinds.includes(searchParams.k as any) ? searchParams.k! : "", CONDS = ["야간진료없음", "토요휴무", "연차별도", "조기퇴근", "OT0분", "인센티브", "잡무없음"].filter(c => ext0.some(e => extTags(e.id).includes(c))), ec = CONDS.includes(searchParams.c ?? "") ? searchParams.c! : "", g3 = searchParams.g3 === "1", ext = ext0.filter(e => (!ek || e.k === ek) && (!ec || extTags(e.id).includes(ec)) && (!g3 || isG3(e))).sort((a, b) => Number(isG3(b)) - Number(isG3(a)));
  const dl = (p: Record<string, string>) => { const q = new URLSearchParams(Object.entries({ k: ek, c: ec, g3: g3 ? "1" : "", ...p }).filter(([, v]) => v)); return `/jobs/day${q.toString() ? "?" + q : ""}#ext`; };
  const { data: eh } = await d.from("hospitals").select("id,name").in("name", Array.from(new Set(ext0.map(e => e.h)))); const EH = new Map((eh ?? []).map(h => [h.name, h.id]));
  const ready = cmp.shift.n >= MIN_N && cmp.day.n >= MIN_N, show = ready && contributed;
  const Col = ({ t, g, icon }: { t: string; g: typeof cmp.day; icon: string }) => <div className="dy-col"><small>{icon} {t}</small>
    <div><span>세후 실수령</span><b className={show ? "" : "dy-blur"}>{show ? (g.a.payMid ? `${g.a.payMid}만` : "-") : "300~350만"}</b></div>
    <div><span>대부분 칼퇴</span><b className={show ? "" : "dy-blur"}>{show ? `${g.offPct}%` : "47%"}</b></div>
    <div><span>총평점</span><b className={show ? "" : "dy-blur"}>{show ? (g.a.starN ? g.a.overallAvg.toFixed(1) : "-") : "3.4"}</b></div>
    <div><span>추천</span><b className={show ? "" : "dy-blur"}>{show ? (g.a.recN ? `${g.a.recPct}%` : "-") : "52%"}</b></div>
    <em>{g.n}명 응답</em></div>;
  return <div className="jb2 dy">
    <div className="dy-hero"><span>🌙</span><h2>저녁 약속 잡을 수 있는 알짜 병원</h2><p>나이트 없는 상근·낮 근무만 모았어요. 실수령은 얼마나 달라질까?<br />대학·종합병원(대부분 3교대)과 로컬(대부분 상근)을 직접 다녀본 사람들의 숫자로 비교해요.</p></div>
    <h3 className="dy-h" id="ext">🌙 저녁 약속 잡을 수 있는 알짜 병원 <small>{ext0.length}</small></h3>
    <p className="muted" style={{ fontSize: 12.5, margin: "-4px 0 0", lineHeight: 1.55 }}>🔄 {extCheckedLabel()} · {EXT_SRC}에 공개된 공고 중 낮 근무만 골라 핵심만 적었어요. 조건은 바뀔 수 있으니 <b>지원 전 원문을 꼭 확인</b>하세요.</p>
    <div className="dtab">{[["", "전체", ext0.length] as const, ...["간호", "간호조무사", "방사선", "물리치료", "임상병리", "원무"].filter(k => kinds.includes(k as any)).map(k => [k, ({ 간호: "간호사", 방사선: "방사선사", 물리치료: "물리치료사", 임상병리: "임상병리사" } as Record<string, string>)[k] ?? k, ext0.filter(e => e.k === k).length] as const)].map(([k, n, cnt]) => <Link key={k} href={dl({ k })} className={ek === k ? "on" : ""} scroll={false}>{n} <small>{cnt}</small></Link>)}</div>
    <div className="rf-kw ex-conds"><Link href={dl({ g3: g3 ? "" : "1" })} className={"g3" + (g3 ? " on" : "")} scroll={false}>📍 강남 3구 {ext0.filter(isG3).length}</Link>{CONDS.map(c => <Link key={c} href={dl({ c: ec === c ? "" : c })} className={ec === c ? "on" : ""} scroll={false}>{QUICK.find(q => q.id === c)?.label ?? c}</Link>)}</div>
    {!ext.length && <p className="muted" style={{ fontSize: 13 }}>이 조건에 맞는 공고가 지금은 없어요.</p>}
    <div className="ex-list">{ext.map(e => <div key={e.id} className="ex">
      <div className="ex-top"><b>{e.h}</b>{e.until && <span className="ex-dd">~{e.until.slice(5).replace("-", "/")}</span>}</div>
      <div className="ex-meta">{e.dept} · {splitArea(e.area).r}{splitArea(e.area).st && <span className="ex-sta">🚇 {splitArea(e.area).st}</span>}</div>
      <div className="ex-row"><span>⏰ {e.time}</span><span>💰 {e.pay}</span></div>
      {extTags(e.id).length > 0 && <div className="ex-tags">{extTags(e.id).map(t => <span key={t}>{tagLabel(t)}</span>)}</div>}<p className="ex-note">☀️ {e.note}</p>{e.warn && <p className="ex-warn">⚠️ {e.warn}</p>}
      <div className="ex-acts"><a href={`/api/extout?id=${e.id}`} target="_blank" rel="noopener noreferrer" className="btn">{EXT_SRC}에서 보고 지원 ↗</a><Link href={EH.get(e.h) ? `/hospitals/${EH.get(e.h)}` : `/search?q=${encodeURIComponent(e.h.replace(/\s.*$/, ""))}`} className="btn ghost">👀 이 병원 진짜 분위기 보기</Link></div>
    </div>)}</div>

    <div className="dy-cmp"><Col t="대학·종합병원" g={cmp.shift} icon="🌙" /><div className="dy-vs">VS</div><Col t="로컬 의원·치과·약국" g={cmp.day} icon="☀️" /></div>
    {!ready ? <div className="fb fb-wait"><b>📊 비교 데이터가 모이는 중이에요</b><p>대학·종합병원과 로컬 각각 {MIN_N}명 이상 모이면 공개돼요. 다니는(다녔던) 병원을 체크해주세요.</p><Link href="/hospitals/check" className="btn">🔎 내 병원 체크하고 비교 열기</Link></div>
      : !contributed ? <div className="fb-lockmsg"><b>🔒 체크 하나 남기고 6개월간 비교 자유롭게</b><span>다녔던 병원 하나만 체크하면 이 비교와 모든 병원 정보가 열려요.</span><Link href="/hospitals/check" className="btn">🔎 체크하고 보기</Link></div> : null}

    <h3 className="dy-h">☀️ 상근·칼퇴 공고 <small>{open.length}</small></h3>
    {open.length ? <div className="jb2-list">{open.map(j => <JobCard key={j.id} j={j} pub={(j.author as any)?.username === "mw_bot"} locked={!contributed} />)}</div>
      : <div className="jb2-empty"><span>☀️</span><b>아직 상근 공고가 없어요</b><p>단톡방에서 상근·평일 근무 공고 봤다면 제보해주세요. 공고 올릴 때 '상근(데이)'·'주4일' 태그를 고르면 여기에 모여요.</p><Link href="/jobs/new?tip=1" className="btn">🤫 상근 공고 제보</Link></div>}

    <h3 className="dy-h">🏠 로컬 병원·의원 {focus && <small>{focus.label} 먼저</small>}</h3>
    {hlist.length ? <div className="jb2-list">{hlist.map(h => <Link key={h.id} href={`/hospitals/${h.id}`} className="jb2-card"><div className="jb2-h"><div className="jb2-hn"><b>{h.name}</b><small>{h.region}{dist[h.id] ? ` ${dist[h.id]}` : ""} · {h.kind}{inFocus(h) ? " · 📍" : ""}</small></div></div>
      <PosBadges list={posBadges(facts[h.id])} max={3} />{factLine(facts[h.id], !contributed).length > 0 ? <div className={"jb2-facts" + (!contributed ? " lock" : "")}>{factLine(facts[h.id], !contributed).map(x => <span key={x}>{x}</span>)}</div> : <div className="jb2-facts none">🔎 {facts[h.id]?.n ?? 0}명 체크 · {MIN_N}명 모이면 공개</div>}</Link>)}</div>
      : <p className="muted" style={{ fontSize: 13 }}>상근으로 일하는 병원을 체크하면 여기에 모여요.</p>}

    <Link href="/hospitals/check" className="dy-cta"><b>🙋 3교대에서 탈출해봤어요</b><span>예전 병원과 지금 병원을 각각 체크해주면, 다음 사람이 "탈출하면 얼마나 달라지는지" 알 수 있어요</span></Link>
  </div>;
}
