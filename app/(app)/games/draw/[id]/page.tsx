import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDraw } from "@/lib/draw";
import DrawRoom from "@/components/games/DrawRoom";
export const dynamic = "force-dynamic";
export default async function DrawRoomPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const st = await getDraw(params.id);
  if (!st) return <div className="detail"><Link className="link" href="/games/draw">← 그림 맞히기 로비</Link><div className="empty">없어진 방이에요.</div></div>;
  return <DrawRoom me={{ id: s.id, nickname: s.nickname, dept: s.dept }} initial={st} />;
}
