import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { topicOf, HOSPITAL_DEPTS } from "@/lib/depts";
import { dailyStatus, DAILY_BONUS } from "@/lib/daily";
import { rateOf, dailyOf, fmt as won, tycoonDept, OFFLINE_CAP, OFFLINE_RATE, STAFF, HOMES, assetsOf, isCurrent } from "@/lib/tycoon";
import { fmt } from "@/lib/format";
import Name from "@/components/Name";
import Insignia from "@/components/Insignia";
import { getNews, getQuotes } from "@/lib/news";
import { fortune } from "@/lib/fortune";
import { memo } from "@/lib/memo";
export const dynamic = "force-dynamic";

const hourGreet = () => { const h = new Date(Date.now() + 9 * 3600000).getUTCHours(); return h < 6 ? "밤번 수고 많아요" : h < 11 ? "좋은 아침이에요" : h < 14 ? "점심은 드셨어요?" : h < 18 ? "오후도 힘내요" : h < 22 ? "퇴근하셨어요?" : "오늘도 수고했어요"; };

export default async function HomePage() {
  const s = (await getSession())!;
  const d = db();
  const now = Date.now(), day = new Date(now - 86400000).toISOString(), week = new Date(now - 7 * 86400000).toISOString(), today = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  const isMyDept = (HOSPITAL_DEPTS as readonly string[]).includes(s.dept) || s.dept === "취준생" || s.dept === "대학생";
  const [{ data: me }, leaders, daily, { data: recent }, { count: newPosts }, { count: chats }, { data: visits }, { count: promos }, { data: ty }, { data: question }] = await Promise.all([
    d.from("users").select("id,username,nickname,dept,xp,birth_date,birth_time,fortune_name").eq("id", s.id).single(),
    deptLeaders(),
    dailyStatus(s.id),
    d.from("posts").select("id,title,topic,category,created_at,pinned,author_id,author:users(id,username,nickname,dept,xp)").eq("hidden", false).neq("category", "썸").neq("category", "익명").gte("created_at", week).order("created_at", { ascending: false }).limit(150),
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
  const kday = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const { data: dps } = await d.from("daily_plays").select("game,attempts,best,data").eq("user_id", s.id).eq("day", kday);
  const wd = (dps ?? []).find((r: any) => r.game === "wordle") as any;
  const [news, quotes] = await Promise.all([memo("tb-news", 30 * 60_000, getNews).catch(() => null), memo("tb-quotes", 10 * 60_000, getQuotes).catch(() => [])]);
  const heads = news ? [...news.global.slice(0, 2), ...news.stock.slice(0, 1), ...news.macro.slice(0, 1), ...news.med.slice(0, 1)] : [];
  const ndq = quotes.find(x => x.name === "나스닥"), ksp = quotes.find(x => x.name === "코스피");
  const ft = (me as any)?.birth_date ? fortune((me as any).birth_date, (me as any).birth_time, (me as any).fortune_name, new Date()) : null;
  const doneN = daily.quests.filter(x => x.done).length;
  const online = new Set((visits ?? []).map((v: any) => v.user_id)).size;
  const tyS = isCurrent(ty?.state) ? ty!.state as any : undefined;
  const tyRate = tyS ? rateOf(tyS, tycoonDept(s.dept)) : 0, tyDaily = tyS ? dailyOf(tyS, tycoonDept(s.dept)) : 0;
  const tyPending = tyS && tyRate ? Math.floor(tyRate * Math.min(OFFLINE_CAP, Math.max(0, (now - tyS.lastSeen) / 1000)) * OFFLINE_RATE) : 0;
  const Row = ({ p }: { p: any }) => <Link href={`/board/${p.id}`} className="h-row"><span className="h-topic">{topicOf(p.topic).icon}</span><span className="h-title">{p.title}</span><span className="h-meta">{p.author ? `[${p.author.dept}]` : ""} · 💬{p.nc} 👍{p.nr}</span></Link>;

  const pct = (x?: { pct: number }) => x ? `${x.pct > 0 ? "▲" : x.pct < 0 ? "▼" : ""}${Math.abs(x.pct).toFixed(1)}%` : "";
  return (
    <div className="home">
      <div className="h-greet"><b>{hourGreet()},</b> {me?.nickname ?? s.nickname}님{online >= 10 && <span className="h-online">오늘 {online}명 방문</span>}</div>


      {heads.length > 0 && <section className="h-card">
        <div className="h-head"><h3>오늘의 핫뉴스</h3><Link href="/news" className="h-link">더보기</Link></div>
        {heads.map((h, i) => <a key={i} href={h.link} target="_blank" rel="noopener noreferrer" className="h-row"><span className="h-topic">{["🌙", "🌙", "📈", "🏦", "🏥"][i]}</span><span className="h-title">{h.title}</span><span className="h-meta">{h.source}</span></a>)}
      </section>}

      <div className="h-grid">
        <section className="h-card">
          <div className="h-head"><h3>지금 핫한 글</h3><Link href="/board?sort=best" className="h-link">더보기</Link></div>
          {hot.length ? hot.map(p => <Row key={p.id} p={p} />) : <div className="h-empty">이번 주 첫 글을 남겨보세요. <Link href="/board/new">글쓰기 →</Link></div>}
        </section>
        <section className="h-card">
          <div className="h-head"><h3>{s.dept} 새 글</h3>{isMyDept && <Link href={`/board?cat=${encodeURIComponent(s.dept)}&sort=new`} className="h-link">더보기</Link>}</div>
          {mine.length ? mine.map(p => <Row key={p.id} p={p} />) : <div className="h-empty">우리 직종 라운지가 조용해요. <Link href={`/board/new?cat=${encodeURIComponent(s.dept)}`}>첫 글 쓰기 →</Link></div>}
        </section>
      </div>

      <nav className="h-tiles" aria-label="바로가기">
        <Link href="/news" className="h-tile"><span className="h-tile-ico">📰</span><b>핫뉴스</b><small className={ndq ? (ndq.pct >= 0 ? "up" : "down") : ""}>{ndq ? `나스닥 ${pct(ndq)}` : "오늘 소식"}</small></Link>
        <Link href="/fortune" className="h-tile ft"><span className="h-tile-ico">🔮</span><b>오늘의 운세</b><small>{ft ? `${ft.score}점` : "생일 등록하기"}</small></Link>
        <Link href="/games?g=tycoon" className="h-tile"><span className="h-tile-ico">🏥</span><b>우리 병원</b><small>{tyPending > 0 ? `+${won(tyPending)} 쌓임` : tyS ? `초당 ${won(tyRate)}원` : "폐허의원부터 시작"}</small></Link>
        <Link href="/anon" className="h-tile"><span className="h-tile-ico">🕶️</span><b>익명 게시판</b><small>아무도 모르게</small></Link>
        <Link href="/rest" className="h-tile"><span className="h-tile-ico">🛋️</span><b>당직실</b><small>같이 쉬기·숨쉬기</small></Link>
        <Link href="/ssum" className="h-tile"><span className="h-tile-ico">💘</span><b>썸</b><small>고백·셀소·소개</small></Link>
        <Link href="/food" className="h-tile"><span className="h-tile-ico">🍚</span><b>병원 앞 맛집</b><small>혼밥·회식·배달</small></Link>
        <Link href="/games" className="h-tile"><span className="h-tile-ico">🎮</span><b>게임</b><small>{ksp ? `코스피 ${pct(ksp)}` : "오목·그림 맞히기"}</small></Link>
      </nav>
      <div className="h-daily">
        <Link href="/games?g=wordle" className={"h-dly" + (wd?.data?.done ? " done" : "")}><span>🟩</span><div><b>오늘의 메디워들</b><small>{wd?.data?.done ? (wd.data.won ? `✅ ${wd.attempts}번 만에 정답` : "❌ 내일 다시") : "하루 한 문제 · 최대 300 XP"}</small></div></Link>
      </div>


      <section className={`h-card h-rank t${r.tier}`}>
        <div className="h-rank-top">
          <Insignia index={r.index} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-rank-name"><b>{r.name}</b> · {(xp).toLocaleString()} XP</div>
            <div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
            <div className="h-xp">{r.next ? `${r.nextName}까지 ${(r.next - xp).toLocaleString()} XP` : "최고 계급"} · 🔥 {daily.streak}일 연속 출석</div>
          </div>
          <Link href="/rank" className="h-link">내 계급 →</Link>
        </div>
        <div className="h-dq">
          {daily.quests.map(qq => <Link key={qq.key} href={qq.key === "chat" ? "/board" : qq.key === "game" ? "/games" : "/board/new"} className={"h-dq-item" + (qq.done ? " done" : "")}><span className="h-dq-chk">{qq.done ? "✓" : qq.icon}</span><span>{qq.title}</span><small>{qq.n}/{qq.target}</small></Link>)}
        </div>
        <div className="h-dq-foot">{daily.all ? <span>🎉 오늘 퀘스트 올클리어!</span> : <span>오늘 퀘스트 {doneN}/3 · 다 하면 +{DAILY_BONUS} XP</span>}</div>
      </section>
    </div>
  );
}
