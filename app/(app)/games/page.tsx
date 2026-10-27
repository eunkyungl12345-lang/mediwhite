import { db } from "@/lib/supabase";
import Dodge from "@/components/games/Dodge";
import Sword from "@/components/games/Sword";
import Roulette from "@/components/games/Roulette";
import { display } from "@/lib/depts";
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const d = db();
  const [{ data: dodge }, { data: sword }] = await Promise.all([
    d.from("scores").select("value,users(nickname,dept)").eq("game", "dodge").order("value", { ascending: false }).limit(10),
    d.from("scores").select("value,mode,users(nickname,dept)").eq("game", "sword").order("value", { ascending: false }).limit(10),
  ]);
  const norm = (rows: any[] | null) => (rows ?? []).map(r => ({ value: Number(r.value), mode: r.mode as string | undefined, nickname: r.users ? display(r.users.dept, r.users.nickname) : "?", dept: r.users?.dept ?? "" }));
  return (
    <div className="games">
      <Dodge ranks={norm(dodge)} />
      <Sword ranks={norm(sword)} />
      <Roulette />
    </div>
  );
}
