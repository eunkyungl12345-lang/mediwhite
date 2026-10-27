import type { Rank } from "@/lib/ranks";
import Insignia from "./Insignia";
export default function RankBadge({ r, size = 14 }: { r: Rank; size?: number }) {
  return <span className={`rank-tag t${r.tier}`} title={r.name}><Insignia index={r.index} size={size} /><span className="rank-name">{r.name}</span></span>;
}
