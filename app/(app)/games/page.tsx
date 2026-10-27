import { db } from "@/lib/supabase";
import Dodge from "@/components/games/Dodge";
import Sword from "@/components/games/Sword";
import Roulette from "@/components/games/Roulette";
import Defense from "@/components/games/Defense";
import Bowling from "@/components/games/Bowling";
import PlantGame from "@/components/games/Plant";
import Cpr from "@/components/games/Cpr";
import Quiz from "@/components/games/Quiz";
import Vein from "@/components/games/Vein";
import { getSession } from "@/lib/auth";
import { display } from "@/lib/depts";
import Hero from "@/components/Hero";
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const d = db(); const sess = (await getSession())!;
  const top = (game: string, extra = "") => d.from("scores").select(`value${extra},users(nickname,dept)`).eq("game", game).order("value", { ascending: false }).limit(10);
  const [{ data: dodge }, { data: sword }, { data: defense }, { data: bowling }, { data: cpr }, { data: quiz }, { data: vein }] = await Promise.all([
    d.from("scores").select("value,users(nickname,dept)").eq("game", "dodge").order("value", { ascending: false }).limit(10),
    d.from("scores").select("value,mode,users(nickname,dept)").eq("game", "sword").order("value", { ascending: false }).limit(10),
    d.from("scores").select("value,users(nickname,dept)").eq("game", "defense").order("value", { ascending: false }).limit(10),
    d.from("scores").select("value,users(nickname,dept)").eq("game", "bowling").order("value", { ascending: false }).limit(10),
    top("cpr"), top("quiz"), top("vein"),
  ]);
  const norm = (rows: any[] | null) => (rows ?? []).map(r => ({ value: Number(r.value), mode: r.mode as string | undefined, nickname: r.users ? display(r.users.dept, r.users.nickname) : "?", dept: r.users?.dept ?? "" }));
  return (
    <div className="games">
      <Hero img="/img/games.jpg" title="미니게임" sub="기록은 명예의 전당에, 퀘스트는 경험치로" />
      <Cpr ranks={norm(cpr)} />
      <Quiz ranks={norm(quiz)} myDept={sess.dept} />
      <Vein ranks={norm(vein)} />
      <PlantGame />
      <Bowling ranks={norm(bowling)} />
      <Defense ranks={norm(defense)} />
      <Dodge ranks={norm(dodge)} />
      <Sword ranks={norm(sword)} />
      <Roulette />
    </div>
  );
}
