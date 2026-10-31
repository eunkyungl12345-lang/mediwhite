import Link from "next/link";
import BlueBadge from "@/components/BlueBadge";
import HomeFeed from "@/components/HomeFeed";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { topicOf, HOSPITAL_DEPTS } from "@/lib/depts";
import { dailyStatus, DAILY_BONUS } from "@/lib/daily";
import { rateOf, dailyOf, fmt as won, tycoonDept, OFFLINE_CAP, OFFLINE_RATE, STAFF, HOMES, assetsOf, isCurrent } from "@/lib/tycoon";
import { fmt } from "@/lib/format";
import Name from "@/components/Name";
import Insignia from "@/components/Insignia";
import { NEWS_TABS, getNews, getQuotes } from "@/lib/news";
import { fortune } from "@/lib/fortune";
import { memo } from "@/lib/memo";
export const dynamic = "force-dynamic";

const hourGreet = () => { const h = new Date(Date.now() + 9 * 3600000).getUTCHours(); return h < 6 ? "밤번 수고 많아요" : h < 11 ? "좋은 아침이에요" : h < 14 ? "점심은 드셨어요?" : h < 18 ? "오후도 힘내요" : h < 22 ? "퇴근하셨어요?" : "오늘도 수고했어요"; };

export default async function HomePage() {
  const s = (await getSession())!;
  const d = db();
  const now = Date.now(), day = new Date(now - 86400000).toISOString(), week = new Date(now - 7 * 86400000).toISOString(), today = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  const isMyDept = (HOSPITAL_DEPTS as readonly string[]).includes(s.dept) || ["취준생", "대학생", "타직장인", "업체"].includes(s.dept);
  const [{ data: me }, leaders, daily, { data: recent }, { count: newPosts }, { count: chats }, { data: visits }, { count: promos }, { data: ty }, { data: question }] = await Promise.all([
    d.from("users").select("id,username,nickname,dept,xp,birth_date,birth_time,fortune_name").eq("id", s.id).single(),
    deptLeaders(),
    dailyStatus(s.id),
    d.from("posts").select("id,title,topic,category,created_at,pinned,views,author_id,author:users(id,username,nickname,dept,xp,blue_badge)").eq("hidden", false).neq("category", "썸").neq("category", "익명").gte("created_at", week).order("created_at", { ascending: false }).limit(150),
    d.from("posts").select("id", { count: "exact", head: true }).gte("created_at", day),
    d.from("messages").select("id", { count: "exact", head: true }).gte("created_at", day),
    d.from("visits").select("user_id").eq("day", today),
    d.from("events").select("id", { count: "exact", head: true }).eq("kind", "promotion").gte("created_at", week),
    d.from("game_state").select("state").eq("user_id", s.id).eq("game", "tycoon").maybeSingle(),
    d.from("posts").select("id,title,created_at,author:users!inner(username)").eq("author.username", "mw_team").order("created_at", { ascending: false }).limit(1),
  ]);
  const r = rankFor(me, leaders), xp = me?.xp ?? 0;
  const ids = (recent ?? []).map(p => p.id);
  const [{ data: cc }, { data: rc }] = ids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", ids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", ids)]) : [{ data: [] }, { data: [] }];
  const nC: Record<string, number> = {}, nR: Record<string, number> = {};
  for (const c of cc ?? []) nC[(c as any).post_id] = (nC[(c as any).post_id] ?? 0) + 1;
  for (const x of rc ?? []) nR[(x as any).target_id] = (nR[(x as any).target_id] ?? 0) + 1;
  const posts = (recent ?? []).map((p: any) => ({ ...p, nc: nC[p.id] ?? 0, nr: nR[p.id] ?? 0, score: (nR[p.id] ?? 0) * 3 + (nC[p.id] ?? 0) * 2, r: rankFor(p.author, leaders) }));
  const q = question?.[0] as any;
  const hot = [...posts].filter(p => !p.pinned && p.id !== q?.id).sort((a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const mine = posts.filter(p => p.category === s.dept && !p.pinned && p.id !== q?.id).slice(0, 5);
  const { count: memberN } = await d.from("users").select("id", { count: "exact", head: true }).eq("stealth", false);
  const feedRow = (p: any) => ({ id: p.id, title: p.title, icon: topicOf(p.topic).icon, dept: p.author?.dept, nick: p.author?.nickname, badge: !!p.author?.blue_badge, cat: p.category === "공지" ? "공지" : `${p.category} 라운지`, time: fmt(p.created_at), views: p.views ?? 0, nc: p.nc, nr: p.nr, fresh: now - Date.parse(p.created_at) < 86400000 });
  const latestF = posts.filter(p => !p.pinned && p.id !== q?.id).slice(0, 10).map(feedRow), recentF = posts.filter(p => !p.pinned && p.id !== q?.id && now - Date.parse(p.created_at) < 2 * 86400000).slice(0, 10).map(feedRow), hotF = hot.map(feedRow), mineF = posts.filter(p => p.category === s.dept && !p.pinned && p.id !== q?.id).slice(0, 8).map(feedRow);
  const kday = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const { data: dps } = await d.from("daily_plays").select("game,attempts,best,data").eq("user_id", s.id).eq("day", kday);
  const wd = (dps ?? []).find((r: any) => r.game === "wordle") as any;
  const [news, quotes] = await Promise.all([memo("tb-news", 30 * 60_000, getNews).catch(() => null), memo("tb-quotes", 10 * 60_000, getQuotes).catch(() => [])]);
  const heads = news ? [...news.global.slice(0, 2), ...news.stock.slice(0, 1), ...news.macro.slice(0, 1), ...news.med.slice(0, 1)] : [];
  const newsF: Record<string, any[]> = news ? Object.fromEntries(Object.entries(news).map(([k, v]) => [k, (v as any[]).slice(0, 8).map(h => ({ title: h.title, link: h.link, source: h.source, at: h.at }))])) : {};
  const ndq = quotes.find(x => x.name === "나스닥"), ksp = quotes.find(x => x.name === "코스피");
  const ft = (me as any)?.birth_date ? fortune((me as any).birth_date, (me as any).birth_time, (me as any).fortune_name, new Date()) : null;
  const doneN = daily.quests.filter(x => x.done).length;
  const online = new Set((visits ?? []).map((v: any) => v.user_id)).size;
  const tyS = isCurrent(ty?.state) ? ty!.state as any : undefined;
  const tyRate = tyS ? rateOf(tyS, tycoonDept(s.dept)) : 0, tyDaily = tyS ? dailyOf(tyS, tycoonDept(s.dept)) : 0;
  const tyPending = tyS && tyRate ? Math.floor(tyRate * Math.min(OFFLINE_CAP, Math.max(0, (now - tyS.lastSeen) / 1000)) * OFFLINE_RATE) : 0;
  const Row = ({ p }: { p: any }) => <Link href={`/board/${p.id}`} className="h-row"><span className="h-topic">{topicOf(p.topic).icon}</span><span className="h-title">{p.title}</span><span className="h-meta">{p.author ? `[${p.author.dept}]` : ""}{p.author?.blue_badge ? <BlueBadge size={11} className="bb" /> : null} · 💬{p.nc} 👍{p.nr}</span></Link>;

  const pct = (x?: { pct: number }) => x ? `${x.pct > 0 ? "▲" : x.pct < 0 ? "▼" : ""}${Math.abs(x.pct).toFixed(1)}%` : "";
  const noticesF = posts.filter(p => p.category === "공지" || p.pinned).slice(0, 8).map(feedRow);
  return (
    <div className="home v2">
      <div className="h-greet"><b>{hourGreet()},</b> {me?.nickname ?? s.nickname}님<span className="h-online">회원 {(memberN ?? 0).toLocaleString()} · 오늘 {online.toLocaleString()}명</span></div>
      <nav className="hstrip" aria-label="오늘">
        <Link href="/games?g=wordle" className={"hs-pill" + (wd?.data?.done ? " done" : "")}><span>🟩</span>{wd?.data?.done ? "메디워들 완료" : "메디워들"}</Link>
        <Link href="/games?g=tycoon" className="hs-pill"><span>🏥</span>{tyPending > 0 ? `우리 병원 +${won(tyPending)}` : "우리 병원"}</Link>
        {heads[0] && <a href={heads[0].link} target="_blank" rel="noopener noreferrer" className="hs-pill news"><span>📰</span><em>{heads[0].title}</em></a>}
        <Link href="/rest" className="hs-pill"><span>🛋️</span>당직실</Link>
        <Link href="/anon" className="hs-pill"><span>🕶️</span>익명</Link>
        <Link href="/jobs" className="hs-pill"><span>💼</span>채용·병원리뷰</Link>
        <Link href="/food" className="hs-pill"><span>🍚</span>맛집</Link>
      </nav>

      <HomeFeed latest={latestF} recent={recentF} hot={hotF} mine={mineF} notices={noticesF} news={newsF} newsTabs={NEWS_TABS.map(t => ({ key: t.key, name: t.name }))} quotes={quotes} dept={s.dept} moreMine={`/board?cat=${encodeURIComponent(s.dept)}&sort=new`} />

      <Link href="/rank" className={`h-rank2 t${r.tier}`}>
        <Insignia index={r.index} size={26} />
        <div className="h-rank2-mid"><div className="h-rank2-name"><b>{r.name}</b><span className="muted">{xp.toLocaleString()} XP{r.next ? ` · ${r.nextName}까지 ${(r.next - xp).toLocaleString()}` : " · 최고 계급"}</span></div><div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div></div>
        <div className="h-rank2-right"><span className={"h-q" + (daily.all ? " done" : "")}>{daily.all ? "🎉 퀘스트 완료" : `퀘스트 ${doneN}/3`}</span><small>🔥 {daily.streak}일</small></div>
      </Link>
    </div>
  );
}
