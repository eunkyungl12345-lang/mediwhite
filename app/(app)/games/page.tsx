import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { display } from "@/lib/depts";
import Hero from "@/components/Hero";
import Dodge from "@/components/games/Dodge";
import Sword from "@/components/games/Sword";
import Roulette from "@/components/games/Roulette";
import Defense from "@/components/games/Defense";
import Wordle from "@/components/games/Wordle";
import OneShot from "@/components/games/OneShot";
import PlantGame from "@/components/games/Plant";
import SpeedQuiz from "@/components/games/SpeedQuiz";
import Quiz from "@/components/games/Quiz";
import Runner from "@/components/games/Runner";
import Lightning from "@/components/games/Lightning";
import Tycoon from "@/components/games/Tycoon";
import Link from "next/link";
import { deptBattle, settleDeptWeek, liveRooms, myMissions, weekStart } from "@/lib/gamesHub";
export const dynamic = "force-dynamic";

export default async function GamesPage({ searchParams }: { searchParams: { g?: string; c?: string } }) {
  const d = db(); const sess = (await getSession())!;
  const top = (game: string) => d.from("scores").select("value,mode,users(nickname,dept)").eq("game", game).order("value", { ascending: false }).limit(10);
  const [dodge, sword, defense, bowling, cpr, quiz, vein, runner, lightning, tycoon, trivia, econ, mine] = await Promise.all([...["dodge", "sword", "defense", "bowling", "cpr", "quiz", "vein", "runner", "lightning", "tycoon", "trivia", "econ"].map(top), d.from("scores").select("game,value").eq("user_id", sess.id)]);
  const my: Record<string, number> = Object.fromEntries(((mine as any).data ?? []).map((r: any) => [r.game, Number(r.value)]));
  const norm = (r: { data: any[] | null }) => (r.data ?? []).map(x => ({ value: Number(x.value), mode: x.mode as string | undefined, nickname: x.users ? display(x.users.dept, x.users.nickname) : "?", dept: x.users?.dept ?? "" }));
  const games = [
    { id: "tycoon", name: "우리 병원 키우기", icon: "🏥", sub: "방치형 경영", color: "#6FBFA9", badge: "NEW", node: <Tycoon ranks={norm(tycoon)} myDept={sess.dept} /> },
    { id: "wordle", name: "오늘의 메디워들", icon: "🟩", sub: "하루 한 문제", color: "#7BC47F", badge: "DAILY", node: <Wordle /> },
    { id: "iv", name: "원샷원킬 IV", icon: "🎯", sub: "하루 3번 랭킹전", color: "#F2A65A", badge: "DAILY", node: <OneShot /> },
    { id: "defense", name: "병동 사수", icon: "🦠", sub: "줄 지키기 디펜스", color: "#5FA777", badge: "HIT!", node: <Defense ranks={norm(defense)} /> },
    { id: "omok", name: "온라인 오목", icon: "⚫", sub: "1:1 · 팀전 5:5", color: "#E6B97A", badge: "NEW", node: <div className="card"><h3>⚫⚪ 온라인 오목</h3><div className="muted">회원끼리 실시간 오목! 1:1부터 5:5 팀전(같은 팀끼리 번갈아 두기)까지. 내기 걸고 한 판 ☕ 혼자일 땐 🤖 컴퓨터와 연습</div><Link className="btn" href="/games/omok">오목 로비로 →</Link></div> },
    { id: "draw", name: "그림 맞히기", icon: "🎨", sub: "캐치마인드식", color: "#F8BBD0", badge: "NEW", node: <div /> },
    { id: "lightning", name: "번개 모드", icon: "⚡", sub: "5초 미니게임 연속", color: "#F4D35E", badge: "NEW", node: <Lightning ranks={norm(lightning)} best={my.lightning ?? 0} /> },
    { id: "runner", name: "복도 질주", icon: "🏃‍♀️", sub: "무한 달리기", color: "#98C1D9", node: <Runner ranks={norm(runner)} best={my.runner ?? 0} /> },
    { id: "quiz", name: "의학용어 퀴즈", icon: "📚", sub: "45초 4지선다", color: "#7E6BC4", node: <Quiz ranks={norm(quiz)} best={my.quiz ?? 0} myDept={sess.dept} /> },
    { id: "trivia", name: "상식 스피드퀴즈", icon: "🧠", sub: "45초 4지선다", color: "#9B7EDE", badge: "NEW", node: <SpeedQuiz kind="trivia" ranks={norm(trivia)} best={my.trivia ?? 0} /> },
    { id: "econ", name: "경제 스피드 뉴스", icon: "📈", sub: "헤드라인 퀴즈", color: "#3FA27A", badge: "NEW", node: <SpeedQuiz kind="econ" ranks={norm(econ)} best={my.econ ?? 0} /> },
    { id: "plant", name: "창가 화분", icon: "🪴", sub: "실시간 키우기", color: "#A8C256", node: <PlantGame /> },
    { id: "dodge", name: "총알 피하기", icon: "💥", sub: "버티기", color: "#D9534F", node: <Dodge ranks={norm(dodge)} best={my.dodge ?? 0} /> },
    { id: "sword", name: "검 강화하기", icon: "⚔️", sub: "확률 강화", color: "#3D5A80", node: <Sword ranks={norm(sword)} best={my.sword ?? 0} /> },
    { id: "roulette", name: "커피 룰렛", icon: "☕", sub: "내기 정하기", color: "#B08968", node: <Roulette /> },
  ];
  const cur = games.find(g => g.id === searchParams.g && g.id !== "omok" && g.id !== "draw") ?? games[0];
  const [battle, lastTop, live, mis] = await Promise.all([deptBattle(weekStart(0)), settleDeptWeek().catch(() => null), liveRooms().catch(() => null), myMissions(sess.id)]);
  const CATS: { key: string; name: string; ids: string[] }[] = [
    { key: "", name: "전체", ids: [] }, { key: "daily", name: "📅 데일리", ids: ["wordle", "iv"] }, { key: "rank", name: "🔥 랭킹전", ids: ["iv", "defense", "lightning", "runner", "dodge", "sword"] },
    { key: "together", name: "👥 같이하기", ids: ["omok", "draw"] }, { key: "quiz", name: "🧠 퀴즈", ids: ["wordle", "quiz", "trivia", "econ"] }, { key: "heal", name: "🪴 방치·힐링", ids: ["tycoon", "plant", "roulette"] },
  ];
  const cat = CATS.find(c => c.key === (searchParams.c ?? "")) ?? CATS[0];
  const shown = cat.ids.length ? games.filter(g => cat.ids.includes(g.id)) : games;
  const kday = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), hotPool = ["defense", "lightning", "runner", "dodge", "sword", "quiz", "trivia", "econ"];
  const hot = games.find(g => g.id === hotPool[(Number(kday.replace(/-/g, "")) * 7) % hotPool.length])!;
  const liveOf = (id: string) => id === "omok" && live ? live.omok : id === "draw" && live ? live.draw : null;
  const href = (id: string) => id === "omok" ? "/games/omok" : id === "draw" ? "/games/draw" : `/games?${new URLSearchParams({ g: id, ...(cat.key ? { c: cat.key } : {}) })}`;
  const missions = [{ id: "wordle", name: "메디워들 풀기", done: mis.wordle, xp: "최대 300" }, { id: "iv", name: "원샷원킬 1판", done: mis.iv, xp: "+30" }, { id: "roulette", name: "커피 룰렛 돌리기", done: mis.roulette, xp: "+30" }, { id: "quiz", name: "퀴즈 1판", done: mis.quiz, xp: "+30" }];
  const nDone = missions.filter(m => m.done).length, maxPts = Math.max(1, ...battle.map(b => b.pts));
  return (
    <div className="games">
      <Hero img="/img/games.jpg" pos="center 42%" title="미니게임" sub="기록은 명예의 전당에, 퀘스트는 경험치로" />
      <section className="gm-mission">
        <div className="gm-mt"><b>📅 오늘의 데일리 미션</b><span>{nDone}/4 완료{nDone === 4 ? " · 🎉 올클리어 +100 XP" : " · 4개 다 하면 보너스 +100 XP"}</span></div>
        <div className="gm-ml">{missions.map(m => <Link key={m.id} href={href(m.id === "quiz" ? "quiz" : m.id)} scroll={false} className={"gm-mi" + (m.done ? " done" : "")}><span>{m.done ? "✅" : "⬜"}</span><b>{m.name}</b><small>{m.xp} XP</small></Link>)}</div>
      </section>
      <section className="gm-battle">
        <div className="gm-mt"><b>⚔️ 이번 주 부서 대항전</b><span>{lastTop ? `지난주 1위 [${lastTop}] · ` : ""}1위 부서 참가자 전원 다음 주 +200 XP</span></div>
        {battle.length ? battle.slice(0, 6).map((b, i) => <div key={b.dept} className={"gm-br" + (b.dept === sess.dept ? " me" : "")}><span className="gm-bn">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span><span className="gm-bd">{b.dept}</span><span className="gm-bb"><i style={{ width: `${Math.max(4, b.pts / maxPts * 100)}%` }} /></span><span className="gm-bp">{b.pts.toLocaleString()}점 · {b.people}명</span></div>)
          : <div className="muted" style={{ fontSize: 13 }}>이번 주 아직 기록이 없어요. 우리 부서가 첫 점수를 따 보세요!</div>}
        <div className="muted" style={{ fontSize: 11.5 }}>메디워들·원샷원킬·룰렛·퀴즈 기록이 부서 점수로 쌓여요 (매주 월요일 0시 리셋)</div>
      </section>
      <Link href={href(hot.id)} scroll={false} className="gm-hot"><span className="gm-hi">{hot.icon}</span><div><small>🔥 오늘의 핫 게임</small><b>{hot.name}</b><span>{hot.sub} · 오늘 한 판 어때요?</span></div><span className="gm-go">▶</span></Link>
      <div className="cats gm-cats">{CATS.map(c => <Link key={c.key} href={`/games${c.key ? `?c=${c.key}` : ""}`} scroll={false} className="cats-btn" aria-pressed={cat.key === c.key}>{c.name}</Link>)}</div>
      <div className="gtiles">{shown.map(g => { const lv = liveOf(g.id); return <Link key={g.id} href={href(g.id)} scroll={false} className={"gtile" + (cur.id === g.id ? " on" : "")}><span className="gtile-ico">{g.icon}</span><span className="gtile-name">{g.name}</span>{lv ? <span className={"gtile-live" + (lv.people ? " on" : "")}>{lv.people ? `🟢 ${lv.rooms}방 · ${lv.people}명` : "방 만들기"}</span> : null}{g.badge && <span className="gtile-badge">{g.badge}</span>}</Link>; })}</div>
      <section key={cur.id} id={cur.id} className="game-sec">{cur.node}</section>
    </div>
  );
}
