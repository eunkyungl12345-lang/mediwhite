import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { display } from "@/lib/depts";
import Hero from "@/components/Hero";
import Dodge from "@/components/games/Dodge";
import Sword from "@/components/games/Sword";
import Roulette from "@/components/games/Roulette";
import Defense from "@/components/games/Defense";
import PlantGame from "@/components/games/Plant";
import SpeedQuiz from "@/components/games/SpeedQuiz";
import Quiz from "@/components/games/Quiz";
import Runner from "@/components/games/Runner";
import Lightning from "@/components/games/Lightning";
import Tycoon from "@/components/games/Tycoon";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function GamesPage({ searchParams }: { searchParams: { g?: string } }) {
  const d = db(); const sess = (await getSession())!;
  const top = (game: string) => d.from("scores").select("value,mode,users(nickname,dept)").eq("game", game).order("value", { ascending: false }).limit(10);
  const [dodge, sword, defense, bowling, cpr, quiz, vein, runner, lightning, tycoon, trivia, econ, mine] = await Promise.all([...["dodge", "sword", "defense", "bowling", "cpr", "quiz", "vein", "runner", "lightning", "tycoon", "trivia", "econ"].map(top), d.from("scores").select("game,value").eq("user_id", sess.id)]);
  const my: Record<string, number> = Object.fromEntries(((mine as any).data ?? []).map((r: any) => [r.game, Number(r.value)]));
  const norm = (r: { data: any[] | null }) => (r.data ?? []).map(x => ({ value: Number(x.value), mode: x.mode as string | undefined, nickname: x.users ? display(x.users.dept, x.users.nickname) : "?", dept: x.users?.dept ?? "" }));
  const games = [
    { id: "tycoon", name: "우리 병원 키우기", icon: "🏥", sub: "방치형 경영", color: "#6FBFA9", badge: "NEW", node: <Tycoon ranks={norm(tycoon)} myDept={sess.dept} /> },
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
  return (
    <div className="games">
      <Hero img="/img/games.jpg" pos="center 42%" title="미니게임" sub="기록은 명예의 전당에, 퀘스트는 경험치로" />
      <div className="gtiles">{games.map(g => <Link key={g.id} href={g.id === "omok" ? "/games/omok" : g.id === "draw" ? "/games/draw" : `/games?g=${g.id}`} scroll={false} className={"gtile" + (cur.id === g.id ? " on" : "")}><span className="gtile-ico">{g.icon}</span><span className="gtile-name">{g.name}</span>{g.badge && <span className="gtile-badge">{g.badge}</span>}</Link>)}</div>
      <section key={cur.id} id={cur.id} className="game-sec">{cur.node}</section>
    </div>
  );
}
