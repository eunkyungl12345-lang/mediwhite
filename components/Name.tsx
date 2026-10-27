import Link from "next/link";
import type { Rank } from "@/lib/ranks";
import { display } from "@/lib/depts";
import Insignia from "./Insignia";
/** 계급장[직종]닉네임 — 눌러서 프로필로 */
export default function Name({ r, dept, nickname, username, size = 14 }: { r: Rank; dept: string; nickname: string; username?: string | null; size?: number }) {
  const inner = <><span className={`ins t${r.tier}`} title={r.name}><Insignia index={r.index} size={size} /></span><span className="nm">{display(dept, nickname)}</span></>;
  return username ? <Link href={`/u/${encodeURIComponent(username)}`} className="name">{inner}</Link> : <span className="name">{inner}</span>;
}
