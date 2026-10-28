import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getOmok } from "@/lib/omok";
import OmokRoom from "@/components/games/OmokRoom";
export const dynamic = "force-dynamic";
export default async function OmokRoomPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const st = await getOmok(params.id);
  if (!st) return <div className="detail"><Link className="link" href="/games/omok">← 오목 로비</Link><div className="empty">없어진 방이에요.</div></div>;
  return <OmokRoom me={{ id: s.id, nickname: s.nickname }} initial={st} />;
}
