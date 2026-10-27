import { IDX } from "@/lib/ranks";
/** 계급장 아이콘. 병사: 가로 작대기 1~4 · 부사관: V자 1~3(+원사 별) · 위관: 다이아 1~3 · 영관: 무궁화(원) 1~3 · 장성: 별 1~4 */
export default function Insignia({ index, size = 16 }: { index: number; size?: number }) {
  const w = size * 1.6, h = size;
  const el: JSX.Element[] = [];
  if (index <= IDX["병장"]) {
    const n = index + 1; for (let i = 0; i < n; i++) el.push(<rect key={i} x={3} y={h - 3 - i * 3.2 - 1.8} width={w - 6} height={1.8} rx={.5} />);
  } else if (index <= IDX["원사"]) {
    const n = index - IDX["하사"] + 1; for (let i = 0; i < Math.min(n, 3); i++) el.push(<path key={i} d={`M3 ${3 + i * 3.4} L${w / 2} ${7 + i * 3.4} L${w - 3} ${3 + i * 3.4}`} fill="none" stroke="currentColor" strokeWidth={1.8} />);
    if (n === 4) el.push(<circle key="s" cx={w / 2} cy={2.2} r={1.6} />);
  } else if (index <= IDX["대위"]) {
    const n = index - IDX["소위"] + 1, gap = w / (n + 1); for (let i = 0; i < n; i++) el.push(<path key={i} d={`M${gap * (i + 1)} 2 L${gap * (i + 1) + 3.5} ${h / 2} L${gap * (i + 1)} ${h - 2} L${gap * (i + 1) - 3.5} ${h / 2} Z`} />);
  } else if (index <= IDX["대령"]) {
    const n = index - IDX["소령"] + 1, gap = w / (n + 1); for (let i = 0; i < n; i++) { el.push(<circle key={i} cx={gap * (i + 1)} cy={h / 2} r={4} />); el.push(<circle key={"i" + i} cx={gap * (i + 1)} cy={h / 2} r={1.6} fill="var(--bg)" />); }
  } else {
    const n = index - IDX["준장"] + 1, gap = w / (n + 1);
    for (let i = 0; i < n; i++) { const cx = gap * (i + 1), cy = h / 2, R = 4.6, r = 2; let d = ""; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; d += (k ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); } el.push(<path key={i} d={d + "Z"} />); }
  }
  return <svg className="insignia" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true">{el}</svg>;
}
