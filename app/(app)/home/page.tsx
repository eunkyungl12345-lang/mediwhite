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
export const dynamic = "force-dynamic";

const hourGreet = () => { const h = new Date(Date.now() + 9 * 3600000).getUTCHours(); return h < 6 ? "밤번 수고 많아요" : h < 11 ? "좋은 아침이에요" : h < 14 ? "점심은 드셨어요?" : h < 18 ? "오후도 힘내요" : h < 22 ? "퇴근하셨어요?" : "오늘도 수고했어요"; };

export default async function HomePage() {
  const s = (await getSession())!;
  const d = db();
  const now = Date.now(), day = new Date(now - 86400000).toISOString(), week = new Date(now - 7 * 86400000).toISOString(), today = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  const isMyDept = (HOSPITAL_DEPTS as readonly string[]).includes(s.dept) || s.dept === "취준생" || s.dept === "대학생";
  const [{ data: me }, leaders, daily, { data: recent }, { count: newPosts }, { count: chats }, { data: visits }, { count: promos }, { data: ty }, { data: question }] = await Promise.all([
    d.from("users").select("id,username,nickname,dept,xp").eq("id", s.id).single(),
    deptLeaders(),
    dailyStatus(s.id),
    d.from("posts").select("id,title,topic,category,created_at,pinned,author_id,author:users(id,username,nickname,dept,xp)").eq("hidden", false).neq("category", "썸").gte("created_at", week).order("created_at", { ascending: false }).limit(150),
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
  const hot = [...posts].filter(p => !p.pinned).sort((a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const mine = posts.filter(p => p.category === s.dept && !p.pinned).slice(0, 5);
  const online = new Set((visits ?? []).map((v: any) => v.user_id)).size;
  const tyS = isCurrent(ty?.state) ? ty!.state as any : undefined;
  const tyRate = tyS ? rateOf(tyS, tycoonDept(s.dept)) : 0, tyDaily = tyS ? dailyOf(tyS, tycoonDept(s.dept)) : 0;
  const tyPending = tyS && tyRate ? Math.floor(tyRate * Math.min(OFFLINE_CAP, Math.max(0, (now - tyS.lastSeen) / 1000)) * OFFLINE_RATE) : 0;
  const q = question?.[0] as any;
  const Row = ({ p }: { p: any }) => <Link href={`/board/${p.id}`} className="h-row"><span className="h-topic">{topicOf(p.topic).icon}</span><span className="h-title">{p.title}</span><span className="h-meta">{p.author ? `[${p.author.dept}]` : ""} · 💬{p.nc} 👍{p.nr}</span></Link>;

  return (
    <div className="home">
      <div className="h-greet"><b>{hourGreet()},</b> {me?.nickname ?? s.nickname}님</div>

      <section className={`h-card h-rank t${r.tier}`}>
        <div className="h-rank-top">
          <Insignia index={r.index} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Name r={r} dept={me?.dept ?? s.dept} nickname={me?.nickname ?? s.nickname} />
            <div className="h-xp"><b>{xp.toLocaleString()}</b> XP · {r.next ? `${r.nextName}까지 ${(r.next - xp).toLocaleString()}` : "최고 계급"}</div>
          </div>
          <Link href="/rank" className="h-link">내 계급 →</Link>
        </div>
        <div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
        <div className="h-dq">
          {daily.quests.map(qq => <Link key={qq.key} href={qq.key === "chat" ? "/board" : qq.key === "game" ? "/games" : "/board/new"} className={"h-dq-item" + (qq.done ? " done" : "")}><span className="h-dq-chk">{qq.done ? "✓" : qq.icon}</span><span>{qq.title}</span><small>{qq.n}/{qq.target}</small></Link>)}
        </div>
        <div className="h-dq-foot">{daily.all ? <span>🎉 오늘 퀘스트 올클리어!</span> : <span>3개 다 하면 +{DAILY_BONUS} XP</span>}<span>🔥 {daily.streak}일 연속 출석</span></div>
      </section>

      <section className="h-stats">
        <div className="h-stat"><b>{online}</b><span>오늘 접속</span></div>
        <div className="h-stat"><b>{newPosts ?? 0}</b><span>24시간 새 글</span></div>
        <div className="h-stat"><b>{chats ?? 0}</b><span>24시간 채팅</span></div>
        <div className="h-stat"><b>{promos ?? 0}</b><span>이번 주 진급</span></div>
      </section>

      {q && <Link href={`/board/${q.id}`} className="h-card h-q"><span className="h-q-tag">오늘의 질문</span><b>{q.title.replace(/^\[오늘의 질문\]\s*/, "")}</b><span className="h-link">답하러 가기 →</span></Link>}

      <div className="h-grid">
        <section className="h-card">
          <div className="h-head"><h3>🔥 지금 핫한 글</h3><Link href="/board?sort=best" className="h-link">더보기</Link></div>
          {hot.length ? hot.map(p => <Row key={p.id} p={p} />) : <div className="h-empty">이번 주 첫 글을 남겨보세요.</div>}
        </section>
        <section className="h-card">
          <div className="h-head"><h3>🏷️ {s.dept} 새 글</h3>{isMyDept && <Link href={`/board?cat=${encodeURIComponent(s.dept)}&sort=new`} className="h-link">더보기</Link>}</div>
          {mine.length ? mine.map(p => <Row key={p.id} p={p} />) : <div className="h-empty">우리 직종 라운지가 조용해요. <Link href={`/board/new?cat=${encodeURIComponent(s.dept)}`}>첫 글 쓰기 →</Link></div>}
        </section>
      </div>

      <div className="h-grid">
        <Link href="/games?g=tycoon" className="h-card h-ty">
          <div className="h-head"><h3>🏥 우리 병원</h3><span className="h-link">들어가기 →</span></div>
          {tyS ? <>
            <div className="h-ty-row"><span className="h-ty-ico">{(() => { const k = tyS.staff.reduce((a: number, lv: number, i: number) => lv ? i : a, -1); return k >= 0 ? STAFF[k].icon : "🏥"; })()}</span><div><b>₩ {won(tyS.cash)}</b><div className="muted">초당 +{won(tyRate)}원 · 🏠 {HOMES[tyS.home].area} {HOMES[tyS.home].name} · 총자산 {won(assetsOf(tyS))}원</div></div></div>
            {tyPending > 0 && <div className="h-ty-pending">💰 자리 비운 동안 <b>+{won(tyPending)}원</b> 쌓였어요 — 받으러 가기</div>}
          </> : <div className="h-empty">시즌 2 오픈! 병원을 키워서 한강뷰 집·외제차까지 사보세요.</div>}
        </Link>
        <Link href="/news" className="h-card" style={{ background: "linear-gradient(135deg,#E6F0FF,#F5F9FF)", borderColor: "#C6D8F6", color: "#1E3A6B" }}>
          <div className="h-head"><h3>📰 오늘의 핫뉴스</h3><span className="h-link" style={{ color: "#2F67B8" }}>보러 가기 →</span></div>
          <div className="h-empty" style={{ color: "#1E3A6B" }}>간밤 미국증시 · 주식 · 거시경제 · 코인 · 부동산 · 의료·병원 + 실시간 시세</div>
        </Link>
        <Link href="/fortune" className="h-card" style={{ background: "linear-gradient(135deg,#2B2156,#4B3B8F)", borderColor: "#4B3B8F", color: "#F4F1FF" }}>
          <div className="h-head"><h3>🔮 오늘의 운세</h3><span className="h-link" style={{ color: "#FFD36E" }}>확인하기 →</span></div>
          <div className="h-empty" style={{ color: "#DCD6F7" }}>생년월일·태어난 시간으로 매일 바뀌는 나만의 운세</div>
        </Link>
        <Link href="/ssum" className="h-card" style={{ background: "linear-gradient(135deg,#FFE3EC,#FFF4F7)", borderColor: "#F6C6D5", color: "#7A2E4A" }}>
          <div className="h-head"><h3>💘 썸</h3><span className="h-link" style={{ color: "#C2185B" }}>들어가기 →</span></div>
          <div className="h-empty" style={{ color: "#7A2E4A" }}>닉네임 고백 · 셀소 카드 · 지인 소개 · 오늘의 솔로</div>
        </Link>
        <a href="/food" className="h-card" style={{ background: "linear-gradient(135deg,#FFF1DC,#FFF8EE)", borderColor: "#F2D6A8", color: "#6B4A12" }}>
          <div className="h-head"><h3>🍚 병원 앞 맛집</h3><span className="h-link" style={{ color: "#B7791F" }}>보러 가기 →</span></div>
          <div className="h-empty" style={{ color: "#6B4A12" }}>서울·경기·인천·대구 · 혼밥 / 회식 / 야식·배달 / 보호자 추천</div>
        </a>
        <section className="h-card h-jobs">
          <div className="h-head"><h3>💼 채용</h3><Link href="/board?topic=job" className="h-link">이직·채용 글</Link></div>
          <div className="h-empty">병원 채용 공고가 곧 여기에 올라와요. 좋은 공고를 보셨다면 <Link href="/board/new?topic=job">이직·채용</Link>에 공유해 주세요.</div>
        </section>
      </div>
    </div>
  );
}
