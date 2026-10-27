import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { display } from "@/lib/depts";
import Hero from "@/components/Hero";
import GameHub from "@/components/games/GameHub";
import Dodge from "@/components/games/Dodge";
import Sword from "@/components/games/Sword";
import Roulette from "@/components/games/Roulette";
import Defense from "@/components/games/Defense";
import Bowling from "@/components/games/Bowling";
import PlantGame from "@/components/games/Plant";
import Cpr from "@/components/games/Cpr";
import Quiz from "@/components/games/Quiz";
import Vein from "@/components/games/Vein";
import Runner from "@/components/games/Runner";
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const d = db(); const sess = (await getSession())!;
  const top = (game: string) => d.from("scores").select("value,mode,users(nickname,dept)").eq("game", game).order("value", { ascending: false }).limit(10);
  const [dodge, sword, defense, bowling, cpr, quiz, vein, runner] = await Promise.all(["dodge", "sword", "defense", "bowling", "cpr", "quiz", "vein", "runner"].map(top));
  const norm = (r: { data: any[] | null }) => (r.data ?? []).map(x => ({ value: Number(x.value), mode: x.mode as string | undefined, nickname: x.users ? display(x.users.dept, x.users.nickname) : "?", dept: x.users?.dept ?? "" }));
  const games = [
    { id: "runner", name: "복도 질주", icon: "🏃‍♀️", sub: "무한 달리기", node: <Runner ranks={norm(runner)} /> },
    { id: "cpr", name: "코드블루 CPR", icon: "🫀", sub: "리듬 탭", node: <Cpr ranks={norm(cpr)} /> },
    { id: "quiz", name: "의학용어 퀴즈", icon: "📚", sub: "60초 4지선다", node: <Quiz ranks={norm(quiz)} myDept={sess.dept} /> },
    { id: "vein", name: "혈관 찾기", icon: "🩸", sub: "정확도 탭", node: <Vein ranks={norm(vein)} /> },
    { id: "defense", name: "병동 사수", icon: "🦠", sub: "줄 지키기 디펜스", node: <Defense ranks={norm(defense)} /> },
    { id: "plant", name: "창가 화분", icon: "🪴", sub: "실시간 키우기", node: <PlantGame /> },
    { id: "bowling", name: "복도 볼링", icon: "🎳", sub: "10프레임", node: <Bowling ranks={norm(bowling)} /> },
    { id: "dodge", name: "총알 피하기", icon: "💥", sub: "버티기", node: <Dodge ranks={norm(dodge)} /> },
    { id: "sword", name: "검 강화하기", icon: "⚔️", sub: "확률 강화", node: <Sword ranks={norm(sword)} /> },
    { id: "roulette", name: "커피 룰렛", icon: "☕", sub: "내기 정하기", node: <Roulette /> },
  ];
  return (
    <div className="games">
      <Hero img="/img/games.jpg" title="미니게임" sub="기록은 명예의 전당에, 퀘스트는 경험치로" />
      <GameHub games={games} />
    </div>
  );
}
