import Link from "next/link";
import { db } from "@/lib/supabase";
import { dday } from "@/lib/jobs";
import { memo } from "@/lib/memo";
import { loadFacts } from "@/lib/hospFactsDb";
import { MIN_N } from "@/lib/hospFacts";
import { splitTags, SHARE_TAG } from "@/lib/jobTags";
import RankRoll from "./RankRoll";
/** 🏠 잡플래닛식 홈 상단 — 검색창 · 지금 많이 보는 병원 순위 · 아이콘 4개 · 곧 마감 배너 · 지금 뜨는 공고 */
export default async function HomeTop() {
  const d = db(); const wk = new Date(Date.now() - 7 * 86400000).toISOString();
  const [rank, jobs] = await Promise.all([
    memo("home-hrank", 10 * 60_000, async () => { const { data: ev } = await d.from("events").select("text").eq("kind", "hview").gte("created_at", wk).limit(5000);
      const c: Record<string, number> = {}; for (const e of ev ?? []) c[e.text] = (c[e.text] ?? 0) + 1;
      let ids = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => Number(k));
      if (ids.length < 5) { const { data: more } = await d.from("hospitals").select("id").order("id", { ascending: false }).limit(10); ids = Array.from(new Set([...ids, ...(more ?? []).map(h => h.id)])).slice(0, 8); }
      const { data: hs } = ids.length ? await d.from("hospitals").select("id,name").in("id", ids) : { data: [] as any[] };
      return ids.map(id => (hs ?? []).find(h => h.id === id)).filter(Boolean) as { id: number; name: string }[]; }),
    d.from("jobs").select("id,hospital,region,dept,emp_type,deadline,welfare,body,created_at,views,author:users!jobs_author_id_fkey(username)").eq("hidden", false).eq("closed", false).order("created_at", { ascending: false }).limit(120),
  ]);
  const open = (jobs.data ?? []).filter(j => dday(j.deadline) !== "마감");
  const soon = open.filter(j => { const x = dday(j.deadline); return x === "오늘 마감" || (x.startsWith("D-") && Number(x.slice(2)) <= 3); }).length;
  // 지금 뜨는 공고: 히든 공고 먼저, 그다음 조회 많은 순
  const hot = [...open].sort((a, b) => Number(splitTags(b.body).tags.includes(SHARE_TAG)) - Number(splitTags(a.body).tags.includes(SHARE_TAG)) || (b.views ?? 0) - (a.views ?? 0)).slice(0, 8);
  const { data: hs } = await d.from("hospitals").select("id,name,region").in("name", Array.from(new Set(hot.map(j => j.hospital))));
  const facts = await loadFacts((hs ?? []).map(h => h.id)); const hOf = (j: any) => (hs ?? []).find(h => h.name === j.hospital && h.region === j.region);
  return <div className="ht">
    <form action="/search" className="ht-search"><input name="q" placeholder="어느 병원이 궁금해요? (병원·약국·직종)" aria-label="검색" /><button aria-label="검색">⌕</button></form>
    {rank.length > 0 && <div className="ht-rank"><span className="ht-live">🩺 요즘 많이 찾는 병원</span><RankRoll items={rank} /></div>}
    <nav className="ht-icons">
      <Link href="/hospitals/check"><span className="ic i1">🔎</span>실체 체크</Link>
      <Link href="/jobs/day"><span className="ic i2">☀️</span>3교대 탈출</Link>
      <Link href="/hospitals"><span className="ic i3">💰</span>병원 급여</Link>
      <Link href="/board"><span className="ic i4">💬</span>커뮤니티</Link>
    </nav>
    {soon > 0 && <Link href="/jobs?soon=1" className="ht-hot"><span className="ht-hot-ic">⏰</span><span>이번 주 마감 공고 <b>{soon}개</b> · 놓치기 전에 확인</span><em>›</em></Link>}
    {hot.length > 0 && <section className="ht-jobs"><div className="ht-h"><b>💼 오늘의 의료 공고</b><Link href="/jobs">전체보기 ›</Link></div>
      <div className="ht-row">{hot.map(j => { const h = hOf(j), a = h ? facts[h.id] : undefined, pub = (j.author as any)?.username === "mw_bot", share = splitTags(j.body).tags.includes(SHARE_TAG);
        const chip = a && a.starN >= MIN_N ? (() => { const best = [...a.stars].sort((x, y) => y.avg - x.avg)[0]; return `${best.name} ${best.avg.toFixed(1)}`; })() : null;
        return <Link key={j.id} href={`/jobs/${j.id}`} className="ht-card"><small>{j.hospital}</small><b>{pub ? (j.welfare || `${j.dept} 채용`) : `${j.dept} ${j.emp_type} 모집`}</b><span>{dday(j.deadline)} · {j.region}</span>
          <div className="ht-chips">{share && <i className="h">🤫 히든</i>}{chip && <i>{chip}</i>}</div></Link>; })}</div></section>}
  </div>;
}
