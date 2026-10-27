import { useId } from "react";
import { IDX } from "@/lib/ranks";
/**
 * 계급장 배지 (자체 제작). 어두운 바탕 + 금속색 문양.
 * 훈련병: 해골 · 병사: 가로 작대기 1~4 · 부사관: V자 1~3(+원사 별) · 위관: 다이아 1~3 · 영관: 무궁화 1~3 · 장성: 별 1~4(참모총장 붉은 테)
 */
export default function Insignia({ index, size = 16 }: { index: number; size?: number }) {
  const count = index <= IDX["병장"] || index <= IDX["원사"] ? 1 : index <= IDX["대위"] ? index - IDX["소위"] + 1 : index <= IDX["대령"] ? index - IDX["소령"] + 1 : index - IDX["준장"] + 1;
  const w = size * (1.45 + Math.max(0, count - 1) * 0.62), h = size, pad = 2;
  const gold = "#E6B341", silver = "#D9DEE3", dark = "#2E2A26";
  const el: JSX.Element[] = [];
  const iw = w - pad * 2, ih = h - pad * 2, cx0 = w / 2, cy0 = h / 2;
  const star = (cx: number, cy: number, R: number, r: number, n = 5) => { let d = ""; for (let k = 0; k < n * 2; k++) { const a = -Math.PI / 2 + k * Math.PI / n, rr = k % 2 ? r : R; d += (k ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); } return d + "Z"; };
  let fill = gold, border = "#1B1816";
  if (index === 0) {
    // 훈련병: 해골
    const r = ih * .34, cx = cx0, cy = cy0 - ih * .08, bone = "#D8D2C4";
    el.push(<ellipse key="h" cx={cx} cy={cy} rx={r} ry={r * .95} fill={bone} />);
    el.push(<rect key="j" x={cx - r * .55} y={cy + r * .55} width={r * 1.1} height={r * .7} rx={r * .2} fill={bone} />);
    el.push(<circle key="e1" cx={cx - r * .4} cy={cy - r * .05} r={r * .26} fill={dark} />);
    el.push(<circle key="e2" cx={cx + r * .4} cy={cy - r * .05} r={r * .26} fill={dark} />);
    el.push(<path key="n" d={`M${cx} ${cy + r * .25} l${-r * .14} ${r * .28} h${r * .28} Z`} fill={dark} />);
    for (let i = -1; i <= 1; i++) el.push(<rect key={"t" + i} x={cx + i * r * .3 - .5} y={cy + r * .62} width={1} height={r * .5} fill={dark} />);
  } else if (index <= IDX["병장"]) {
    const n = index, bh = Math.max(1.6, ih / 7), gap = (ih - n * bh) / (n + 1);
    for (let i = 0; i < n; i++) el.push(<rect key={i} x={pad + iw * .22} y={pad + gap * (i + 1) + bh * i} width={iw * .56} height={bh} rx={.6} fill={gold} />);
  } else if (index <= IDX["원사"]) {
    const n = Math.min(3, index - IDX["하사"] + 1), isMaster = index === IDX["원사"], step = ih / (isMaster ? 5 : 4.2), top = pad + (ih - step * (n + 1)) / 2 + (isMaster ? ih * .14 : 0);
    for (let i = 0; i < n; i++) el.push(<path key={i} d={`M${pad + iw * .22} ${top + step * i} L${cx0} ${top + step * (i + 1)} L${pad + iw * .78} ${top + step * i}`} fill="none" stroke={gold} strokeWidth={Math.max(1.6, ih / 7)} strokeLinecap="round" strokeLinejoin="round" />);
    if (isMaster) el.push(<path key="s" d={star(cx0, pad + ih * .17, ih * .19, ih * .08)} fill={gold} />);
  } else if (index <= IDX["대위"]) {
    const n = index - IDX["소위"] + 1, g = iw / (n + 1), dh = ih * .42, dw = iw / 5.2; fill = silver;
    for (let i = 0; i < n; i++) { const cx = pad + g * (i + 1); el.push(<path key={i} d={`M${cx} ${cy0 - dh} L${cx + dw} ${cy0} L${cx} ${cy0 + dh} L${cx - dw} ${cy0} Z`} fill={silver} />); el.push(<path key={"i" + i} d={`M${cx} ${cy0 - dh} L${cx + dw} ${cy0} L${cx} ${cy0} Z`} fill="#A9B1B8" />); }
  } else if (index <= IDX["대령"]) {
    const n = index - IDX["소령"] + 1, g = iw / (n + 1); fill = silver;
    for (let i = 0; i < n; i++) { const cx = pad + g * (i + 1); el.push(<path key={i} d={star(cx, cy0, ih * .46, ih * .22, 8)} fill={silver} />); el.push(<circle key={"c" + i} cx={cx} cy={cy0} r={ih * .1} fill={dark} />); }
  } else {
    const n = index - IDX["준장"] + 1, g = iw / (n + 1);
    for (let i = 0; i < n; i++) el.push(<path key={i} d={star(pad + g * (i + 1), cy0, ih * .44, ih * .19)} fill={gold} />);
    if (index >= IDX["참모총장"]) border = "#C9302C";
  }
  const tier = index === 0 ? 0 : index <= IDX["병장"] ? 1 : index <= IDX["원사"] ? 2 : index <= IDX["대위"] ? 3 : index <= IDX["대령"] ? 4 : index >= IDX["참모총장"] ? 6 : 5;
  const uid = useId().replace(/:/g, "");
  return (
    <svg className={`insignia shine-t${tier}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <clipPath id={`${uid}c`}><rect x={.5} y={.5} width={w - 1} height={h - 1} rx={2} /></clipPath>
        <linearGradient id={`${uid}g`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <rect x={.5} y={.5} width={w - 1} height={h - 1} rx={2} fill={dark} stroke={border} strokeWidth={1} />
      {el}
      {tier >= 2 && <g clipPath={`url(#${uid}c)`}><rect className="sweep" x={-w} y={-2} width={w * .6} height={h + 4} fill={`url(#${uid}g)`} transform="skewX(-20)" /></g>}
      {tier >= 3 && <><circle className="tw tw1" cx={w * .18} cy={h * .22} r={1.1} fill="#fff" /><circle className="tw tw2" cx={w * .85} cy={h * .7} r={1} fill="#fff" /></>}
      {tier >= 5 && <circle className="tw tw3" cx={w * .5} cy={h * .15} r={1.2} fill="#FFF3B0" />}
    </svg>
  );
}
