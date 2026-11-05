/** 🌿 긍정 뱃지 줄 */
export default function PosBadges({ list, max = 4, big }: { list: string[]; max?: number; big?: boolean }) {
  if (!list.length) return null;
  return <div className={"pb" + (big ? " big" : "")}>{list.slice(0, max).map(t => <span key={t}>{t}</span>)}{list.length > max && <em>+{list.length - max}</em>}</div>;
}
