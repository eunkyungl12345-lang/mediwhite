/** 닉네임 첫 글자 동그라미 아바타 (호갱노노 느낌) — 닉네임 해시로 파스텔 색 */
const HUES = [152, 200, 28, 262, 340, 90, 18, 215];
export default function Avatar({ name, size = 34 }: { name?: string | null; size?: number }) {
  const n = (name ?? "?").trim() || "?"; let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  const hue = HUES[h % HUES.length];
  return <span className="avt" aria-hidden style={{ width: size, height: size, fontSize: Math.round(size * .42), background: `hsl(${hue} 45% 90%)`, color: `hsl(${hue} 40% 32%)` }}>{Array.from(n)[0]}</span>;
}
