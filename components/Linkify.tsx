/** 본문 속 URL을 링크로. 쇼핑 링크는 도메인 칩으로 표시 */
const RE = /(https?:\/\/[^\s<>"']+)/g;
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
export default function Linkify({ text }: { text: string }) {
  const parts = text.split(RE);
  return <>{parts.map((p, i) => RE.test(p) && p.startsWith("http") ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="linkchip">🔗 {host(p)}</a> : <span key={i}>{p}</span>)}</>;
}
