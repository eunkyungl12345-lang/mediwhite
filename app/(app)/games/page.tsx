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
import Lightning from "@/components/games/Lightning";
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const d = db(); const sess = (await getSession())!;
  const top = (game: string) => d.from("scores").select("value,mode,users(nickname,dept)").eq("game", game).order("value", { ascending: false }).limit(10);
  const [dodge, sword, defense, bowling, cpr, quiz, vein, runner, lightning] = await Promise.all(["dodge", "sword", "defense", "bowling", "cpr", "quiz", "vein", "runner", "lightning"].map(top));
  const norm = (r: { data: any[] | null }) => (r.data ?? []).map(x => ({ value: Number(x.value), mode: x.mode as string | undefined, nickname: x.users ? display(x.users.dept, x.users.nickname) : "?", dept: x.users?.dept ?? "" }));
  const games = [
    { id: "lightning", name: "번개 모드", icon: "⚡", sub: "5초 미니게임 연속", color: "#F4D35E", badge: "NEW", node: <Lightning ranks={norm(lightning)} /> },
    { id: "runner", name: "복도 질주", icon: "🏃‍♀️", sub: "무한 달리기", color: "#98C1D9", node: <Runner ranks={norm(runner)} /> },
    { id: "cpr", name: "코드블루 CPR", icon: "🫀", sub: "리듬 탭", color: "#EE6C8F", node: <Cpr ranks={norm(cpr)} /> },
    { id: "quiz", name: "의학용어 퀴즈", icon: "📚", sub: "60초 4지선다", color: "#9B7EDE", node: <Quiz ranks={norm(quiz)} myDept={sess.dept} /> },
    { id: "vein", name: "혈관 찾기", icon: "🩸", sub: "20초 콤보", color: "#EE6C4D", node: <Vein ranks={norm(vein)} /> },
    { id: "defense", name: "병동 사수", icon: "🦠", sub: "줄 지키기 디펜스", color: "#5FA777", badge: "HIT!", node: <Defense ranks={norm(defense)} /> },
    { id: "plant", name: "창가 화분", icon: "🪴", sub: "실시간 키우기", color: "#A8C256", node: <PlantGame /> },
    { id: "bowling", name: "복도 볼링", icon: "🎳", sub: "10프레임", color: "#E9B44C", node: <Bowling ranks={norm(bowling)} /> },
    { id: "dodge", name: "총알 피하기", icon: "💥", sub: "버티기", color: "#D9534F", node: <Dodge ranks={norm(dodge)} /> },
    { id: "sword", name: "검 강화하기", icon: "⚔️", sub: "확률 강화", color: "#3D5A80", node: <Sword ranks={norm(sword)} /> },
    { id: "roulette", name: "커피 룰렛", icon: "☕", sub: "내기 정하기", color: "#B08968", node: <Roulette /> },
  ];
  return (
    <div className="games">
      
      <GameHub games={games} />
    </div>
  );
}
