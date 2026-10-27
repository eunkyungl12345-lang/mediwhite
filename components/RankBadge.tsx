import { STARS, type Rank } from "@/lib/ranks";
export default function RankBadge({ r }: { r: Rank }) {
  return <span className={`rank-tag t${r.tier}`}>{STARS[r.name] ? STARS[r.name] + " " : ""}{r.name}</span>;
}
