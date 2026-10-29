/** 방사선 촬영법 가이드 · 포지셔닝 도식 (코드로 그린 SVG) */
import type { ReactNode } from "react";

const SKIN = "#F3D5C2", SKIN_L = "#B98C74", GOWN = "#D6E6F7", GOWN_L = "#86A9CF", IRC = "#2F3A4A", TABLE = "#CBD5E1", RED = "#E5484D";
type P = [number, number];
const pts = (a: P[]) => a.map(p => p.join(",")).join(" ");

function Limb({ p, w = 12 }: { p: P[]; w?: number }) {
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points={pts(p)} stroke={SKIN_L} strokeWidth={w + 3} /><polyline points={pts(p)} stroke={SKIN} strokeWidth={w} /></g>;
}
const Torso = ({ x, y, w, h, r = 12 }: { x: number; y: number; w: number; h: number; r?: number }) => <rect x={x} y={y} width={w} height={h} rx={r} fill={GOWN} stroke={GOWN_L} strokeWidth={1.5} />;
const HeadC = ({ x, y, r = 10 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />;
const IR = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => <g><rect x={x} y={y} width={w} height={h} rx={2} fill={IRC} /><text x={x + w / 2} y={y + h / 2 + 3} fontSize={7} fill="#fff" textAnchor="middle" fontWeight={700}>{w > 24 || h > 24 ? "IR" : ""}</text></g>;
const Table = ({ y = 110 }: { y?: number }) => <rect x={10} y={y} width={220} height={6} rx={2} fill={TABLE} />;
const Floor = () => <line x1={8} y1={146} x2={232} y2={146} stroke={TABLE} strokeWidth={2} />;
const Txt = ({ x, y, c, a = "middle", s = 9 }: { x: number; y: number; c: string; a?: "start" | "middle" | "end"; s?: number }) => <text x={x} y={y} fontSize={s} fill="#5B4FA0" textAnchor={a} fontWeight={700}>{c}</text>;

/** CR 빔: 입사점(x,y)으로 deg 방향(0=→, 90=↓)으로 들어감. ref = 기준(수직/수평) 방향이면 각도 호 표시 */
function Beam({ x, y, deg, len = 78, refDeg, label }: { x: number; y: number; deg: number; len?: number; refDeg?: number; label?: string }) {
  const r = (d: number) => (d * Math.PI) / 180, c = Math.cos(r(deg)), s = Math.sin(r(deg));
  const x0 = x - len * c, y0 = y - len * s, tip: P = [x - 2 * c, y - 2 * s];
  const head = [tip, [tip[0] - 9 * c - 4.5 * s, tip[1] - 9 * s + 4.5 * c], [tip[0] - 9 * c + 4.5 * s, tip[1] - 9 * s - 4.5 * c]] as P[];
  let arc: ReactNode = null;
  if (refDeg !== undefined && refDeg !== deg) {
    const R = 34, rc = Math.cos(r(refDeg)), rs = Math.sin(r(refDeg));
    const p1: P = [x - R * rc, y - R * rs], p2: P = [x - R * c, y - R * s];
    const mid = r((refDeg + deg) / 2), lx = x - (R + 20) * Math.cos(mid) + (deg > refDeg ? -1 : 1) * 10 * Math.sin(mid), ly = y - (R + 20) * Math.sin(mid);
    arc = <g><line x1={x} y1={y} x2={x - 56 * rc} y2={y - 56 * rs} stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1.2} /><path d={`M${p1[0]},${p1[1]} A${R},${R} 0 0 ${deg > refDeg ? 1 : 0} ${p2[0]},${p2[1]}`} fill="none" stroke={RED} strokeWidth={1.2} />{label && <text x={lx} y={ly + 3} fontSize={9} fontWeight={800} fill={RED} textAnchor="middle">{label}</text>}</g>;
  }
  return (
    <g>
      {arc}
      <line x1={x0 + 10 * c} y1={y0 + 10 * s} x2={tip[0] - 7 * c} y2={tip[1] - 7 * s} stroke={RED} strokeWidth={2.4} />
      <polygon points={pts(head)} fill={RED} />
      <g transform={`translate(${x0},${y0}) rotate(${deg})`}><rect x={-12} y={-13} width={16} height={26} rx={3} fill="#64748B" /><rect x={3} y={-6} width={4} height={12} fill="#94A3B8" /></g>
      <circle cx={x} cy={y} r={2.2} fill={RED} />
    </g>
  );
}
/** 위에서 본 도식용 수직 입사 표시 */
const Cross = ({ x, y }: { x: number; y: number }) => <g stroke={RED} strokeWidth={1.8}><circle cx={x} cy={y} r={7} fill="none" /><line x1={x - 12} y1={y} x2={x + 12} y2={y} /><line x1={x} y1={y - 12} x2={x} y2={y + 12} /><circle cx={x} cy={y} r={2} fill={RED} /></g>;

/** 옆에서 본 머리. rot: 0=얼굴이 오른쪽 */
function Head({ x, y, rot = 0, open = false, oml = true }: { x: number; y: number; rot?: number; open?: boolean; oml?: boolean }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <path d="M-22,-8 A24,24 0 0 1 20,-14 L22,-4 L30,4 L22,7 L22,10 Q21,14 18,15 L18,15 Q16,24 4,24 Q-8,26 -14,18 A24,24 0 0 1 -22,-8 Z" fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
      {open ? <path d="M21,12 L12,15 L19,21" fill="#7A2E2E" stroke="#7A2E2E" strokeWidth={1} /> : <line x1={20} y1={14} x2={15} y2={14} stroke={SKIN_L} strokeWidth={1.2} />}
      <ellipse cx={-2} cy={0} rx={3.5} ry={5} fill={SKIN} stroke={SKIN_L} strokeWidth={1.2} />
      <circle cx={14} cy={-3} r={1.6} fill="#374151" />
      {oml && <line x1={-8} y1={0.4} x2={34} y2={-3.6} stroke="#0EA5E9" strokeWidth={1.1} strokeDasharray="2 2" />}
    </g>
  );
}

/* ── 몸 자세 조각 ── */
const StandSide = ({ x = 0 }: { x?: number }) => ( // 옆모습, 가슴이 오른쪽(IR)
  <g transform={`translate(${x},0)`}><Limb p={[[140, 100], [139, 145]]} w={13} /><Limb p={[[152, 100], [154, 145]]} w={13} /><Torso x={126} y={40} w={38} h={64} /><Limb p={[[136, 47], [126, 72], [133, 94]]} w={8} /><Limb p={[[147, 36], [148, 42]]} w={8} /><HeadC x={150} y={26} r={11} /></g>
);
const Supine = ({ bent = false, head = true }: { bent?: boolean; head?: boolean }) => (
  <g><Limb p={bent ? [[128, 98], [168, 72], [204, 102]] : [[128, 99], [212, 101]]} w={15} />{!bent && <Limb p={[[212, 101], [215, 86]]} w={9} />}{bent && <Limb p={[[204, 102], [218, 103]]} w={8} />}<Torso x={50} y={84} w={84} h={25} r={10} /><Limb p={[[40, 98], [50, 98]]} w={9} />{head && <HeadC x={32} y={96} r={12} />}</g>
);
const Feet = ({ x, y, rot }: { x: number; y: number; rot: number }) => (
  <g><ellipse cx={x - 9} cy={y} rx={5} ry={12} transform={`rotate(${rot} ${x - 9} ${y})`} fill={SKIN} stroke={SKIN_L} /><ellipse cx={x + 9} cy={y} rx={5} ry={12} transform={`rotate(${-rot} ${x + 9} ${y})`} fill={SKIN} stroke={SKIN_L} /><text x={x} y={y + 24} fontSize={7.5} fill="#64748B" textAnchor="middle">위에서 본 발</text></g>
);

type Fig = { svg: ReactNode; cap: string };
const FIGS: Record<string, Fig> = {
  "Chest PA": { cap: "기립 · 가슴을 IR에 · 수평 입사 T7 · SID 180cm", svg: <><Floor /><IR x={168} y={14} w={9} h={112} /><StandSide /><Beam x={126} y={70} deg={0} len={92} /><Txt x={60} y={56} c="수평 (0°)" /><Txt x={60} y={140} c="T7 · 견갑골 하각" s={8} /></> },
  "Chest Lateral": { cap: "기립 · 왼쪽을 IR에 · 양팔 머리 위 · 수평 T7", svg: <><Floor /><IR x={130} y={14} w={9} h={112} /><Limb p={[[104, 100], [102, 145]]} w={13} /><Limb p={[[116, 100], [118, 145]]} w={13} /><Torso x={94} y={42} w={32} h={62} /><Limb p={[[99, 47], [92, 24], [112, 12]]} w={8} /><Limb p={[[121, 47], [128, 24], [108, 12]]} w={8} /><HeadC x={110} y={30} r={10} /><Beam x={94} y={72} deg={0} len={80} /><Txt x={186} y={70} c="환자 왼쪽" s={8} /><Txt x={186} y={82} c="IR 밀착" s={8} /></> },
  "Chest AP (Supine·Portable)": { cap: "앙와위/반좌위 · 흉골에 수직 되도록 3~5° 미측", svg: <><Table /><IR x={52} y={110} w={80} h={7} /><Supine /><Beam x={90} y={84} deg={84} refDeg={90} label="3~5°" /><Txt x={196} y={30} c="→ 발 쪽(미측)" s={8} /></> },
  "Abdomen AP (KUB, Supine)": { cap: "앙와위 · 무릎 밑 받침 · 수직 · 장골능선", svg: <><Table /><IR x={70} y={110} w={74} h={7} /><Supine /><Beam x={118} y={84} deg={90} /><Txt x={175} y={40} c="수직 (0°)" /><Txt x={175} y={52} c="장골능선 정중선" s={8} /></> },
  "Abdomen Erect": { cap: "기립 5분 후 · 수평 · 장골능선 5cm 위 (횡격막 포함)", svg: <><Floor /><IR x={168} y={14} w={9} h={112} /><StandSide /><Beam x={126} y={84} deg={0} len={92} /><Txt x={60} y={70} c="수평 (0°)" /><Txt x={60} y={140} c="5분 세운 뒤 촬영" s={8} /></> },
  "Skull PA / Caldwell": { cap: "이마·코 IR에 · OML ⟂ IR · Caldwell 15° 미측 → 비근점", svg: <><IR x={182} y={14} w={9} h={112} /><Limb p={[[146, 98], [146, 146]]} w={18} /><Head x={152} y={72} /><Beam x={128} y={68} deg={15} refDeg={0} len={92} label="15°" /><Txt x={120} y={140} c="파란 점선 = OML" s={8} /></> },
  "Waters (PA 두정이극)": { cap: "턱을 IR에 · 고개 젖혀 OML 37° · 수평 → 비극", svg: <><IR x={182} y={14} w={9} h={112} /><Limb p={[[140, 100], [136, 146]]} w={18} /><Head x={154} y={76} rot={-37} /><Beam x={130} y={72} deg={0} len={90} /><Txt x={60} y={58} c="수평 (0°)" /><Txt x={120} y={140} c="OML–IR 37° · MML ⟂ IR" s={8} /></> },
  "Towne (AP 축)": { cap: "앙와위 · 턱 당겨 OML ⟂ IR · 30° 미측 → 대후두공", svg: <><Table y={116} /><IR x={52} y={116} w={60} h={7} /><Torso x={112} y={88} w={116} h={26} r={10} /><Head x={82} y={90} rot={-90} /><Beam x={82} y={64} deg={60} refDeg={90} len={74} label="30°" /><Txt x={180} y={34} c="→ 발 쪽(미측)" s={8} /></> },
  "C-spine AP": { cap: "앙와위 · 턱 살짝 들기 · 15~20° 두측 · C4(갑상연골)", svg: <><Table /><IR x={30} y={110} w={52} h={7} /><Supine /><Beam x={50} y={86} deg={107} refDeg={90} len={80} label="15~20°" /><Txt x={30} y={30} c="머리 쪽(두측) ←" s={8} a="start" /></> },
  "C-spine Lateral": { cap: "기립 측면 · 어깨 최대한 내림 · 수평 C4 · SID 150~180cm", svg: <><Floor /><IR x={130} y={4} w={9} h={110} /><Limb p={[[104, 100], [102, 145]]} w={13} /><Limb p={[[116, 100], [118, 145]]} w={13} /><Torso x={94} y={46} w={32} h={58} /><Limb p={[[98, 52], [92, 106]]} w={8} /><Limb p={[[122, 52], [128, 106]]} w={8} /><rect x={86} y={106} width={12} height={10} rx={2} fill="#475569" /><rect x={122} y={106} width={12} height={10} rx={2} fill="#475569" /><Limb p={[[110, 36], [110, 46]]} w={8} /><HeadC x={110} y={24} r={11} /><Beam x={104} y={40} deg={0} len={84} /><Txt x={172} y={60} c="어깨 ↓ (추)" s={8} /><Txt x={172} y={72} c="호기 후 정지" s={8} /></> },
  "Odontoid (Open mouth)": { cap: "앙와위 · 입 크게 · 절치–유양돌기선 ⟂ IR · 수직", svg: <><Table y={116} /><IR x={50} y={116} w={64} h={7} /><Torso x={112} y={88} w={116} h={26} r={10} /><Head x={82} y={90} rot={-90} open oml={false} /><Beam x={96} y={68} deg={90} len={62} /><Txt x={170} y={40} c="수직 · 벌린 입 중앙" s={8} /><Txt x={170} y={52} c="'아~' 하면 혀 ↓" s={8} /></> },
  "L-spine AP": { cap: "앙와위 · 무릎 굽혀 전만 감소 · 수직 · 장골능선(L4)", svg: <><Table /><IR x={70} y={110} w={72} h={7} /><Supine bent /><Beam x={112} y={84} deg={90} /><Txt x={58} y={40} c="수직 (0°)" /><Txt x={58} y={52} c="무릎 굽힘" s={8} /></> },
  "L-spine Lateral": { cap: "측와위 · 무릎 굽힘 · 허리 밑 받침 · 수직 · 장골능선", svg: <><Table /><IR x={70} y={110} w={72} h={7} /><rect x={96} y={106} width={24} height={5} rx={2} fill="#F59E0B" /><Supine bent /><Beam x={112} y={84} deg={90} /><Txt x={58} y={40} c="수직 (0°)" /><Txt x={108} y={128} c="노란 것 = 허리 받침 (척추 평행)" s={8} /><Txt x={58} y={52} c="옆으로 누움" s={8} /></> },
  "Pelvis AP": { cap: "앙와위 · 양발 15~20° 내회전 · 수직 · ASIS 아래 5cm", svg: <><Table /><IR x={88} y={110} w={66} h={7} /><Supine /><Beam x={124} y={84} deg={90} /><Feet x={196} y={36} rot={17} /><Txt x={60} y={40} c="수직 (0°)" /><Txt x={60} y={128} c="골절 의심 시 내회전 ✕" s={8} /></> },
  "Hip AP": { cap: "앙와위 · 다리 15~20° 내회전 · 수직 · 대퇴경부", svg: <><Table /><IR x={98} y={110} w={64} h={7} /><Supine /><Beam x={134} y={86} deg={90} /><Feet x={196} y={36} rot={17} /><Txt x={60} y={40} c="수직 (0°)" /></> },
  "Hand PA / Oblique": { cap: "손바닥 IR에 · 손가락 살짝 벌림 · 3rd MCP 수직 (Obl: 엄지 쪽 45°↑)", svg: <><IR x={60} y={6} w={120} h={138} /><Limb p={[[120, 112], [120, 150]]} w={30} /><rect x={96} y={68} width={50} height={48} rx={12} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><Limb p={[[102, 74], [94, 36]]} w={9} /><Limb p={[[114, 72], [111, 26]]} w={10} /><Limb p={[[126, 72], [128, 22]]} w={10} /><Limb p={[[138, 74], [145, 30]]} w={10} /><Limb p={[[146, 100], [166, 76]]} w={11} /><Cross x={126} y={74} /><Txt x={204} y={78} c="3rd MCP" s={8} /></> },
  "Wrist PA / Scaphoid": { cap: "주먹 살짝 · 손목 밀착 · Scaphoid는 척측편위 + 10~15° 근위", svg: <><IR x={60} y={6} w={120} h={138} /><Limb p={[[120, 104], [120, 150]]} w={30} /><g transform="rotate(-18 120 96)"><rect x={98} y={46} width={46} height={54} rx={16} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><Limb p={[[143, 82], [152, 64]]} w={10} /></g><Cross x={120} y={104} /><Txt x={36} y={40} c="← 척측편위" s={8} a="start" /><Txt x={204} y={110} c="수근 중앙" s={8} /></> },
  "Shoulder AP (외회전·중립)": { cap: "환측 견갑골 IR에 · 외회전=손바닥 앞 · 오훼돌기 2cm 아래 수직", svg: <><IR x={40} y={14} w={160} h={122} /><Torso x={78} y={52} w={88} h={90} r={18} /><Limb p={[[110, 40], [110, 52]]} w={14} /><HeadC x={110} y={30} r={16} /><Limb p={[[84, 60], [64, 140]]} w={16} /><Limb p={[[160, 60], [178, 140]]} w={16} /><Cross x={88} y={70} /><Txt x={36} y={10} c="환측" s={8} a="start" /></> },
  "Elbow AP / Lateral": { cap: "AP: 완전 신전·손바닥 위 · Lateral: 90° 굴곡·엄지 위 · 주관절 중앙", svg: <><IR x={20} y={26} w={96} h={50} /><Limb p={[[24, 52], [112, 52]]} w={16} /><Cross x={68} y={52} /><Txt x={68} y={94} c="AP" /><IR x={130} y={26} w={96} h={96} /><Limb p={[[136, 104], [186, 104], [186, 36]]} w={16} /><Cross x={186} y={104} /><Txt x={178} y={140} c="Lateral (90°)" /></> },
  "Knee AP": { cap: "앙와위 · 3~5° 내회전 · 슬개골 첨부 1.25cm 아래 · 체형 따라 0~±5°", svg: <><Table /><IR x={98} y={110} w={64} h={7} /><Limb p={[[14, 100], [214, 101]]} w={20} /><Limb p={[[214, 101], [216, 82]]} w={11} /><Beam x={130} y={90} deg={90} /><Txt x={64} y={40} c="0° (19~24cm)" s={8} /><Txt x={64} y={52} c="마른 체형 3~5° 미측" s={8} /><Txt x={64} y={64} c="큰 체형 3~5° 두측" s={8} /></> },
  "Knee Lateral": { cap: "환측 아래 측와위 · 20~30° 굴곡 · 5~7° 두측 · 내측상과 2.5cm 아래", svg: <><Table /><IR x={92} y={110} w={64} h={7} /><Limb p={[[14, 100], [124, 100], [214, 72]]} w={20} /><Beam x={124} y={90} deg={96} refDeg={90} label="5~7°" /><Txt x={30} y={30} c="허벅지(두측) ←" s={8} a="start" /><Txt x={186} y={100} c="20~30° 굴곡" s={8} /></> },
  "Ankle AP / Mortise": { cap: "앙와위 · 배굴 · Mortise = 다리 15~20° 내회전 · 내·외과 중간 수직", svg: <><Table /><IR x={150} y={110} w={60} h={7} /><Limb p={[[14, 100], [180, 101]]} w={18} /><Limb p={[[180, 101], [184, 64]]} w={12} /><Beam x={180} y={90} deg={90} len={72} /><Feet x={60} y={36} rot={17} /><Txt x={60} y={84} c="Mortise: 15~20° 내회전" s={8} /></> },
  "Foot AP / Oblique": { cap: "무릎 굽혀 발바닥 IR에 · 10° 후방(뒤꿈치 쪽) · 3rd 중족골 기저부", svg: <><Table y={124} /><IR x={118} y={116} w={92} h={8} /><Limb p={[[14, 104], [100, 46]]} w={20} /><Limb p={[[100, 46], [134, 104]]} w={16} /><Limb p={[[128, 110], [196, 112]]} w={11} /><Beam x={162} y={106} deg={100} refDeg={90} len={80} label="10°" /><Txt x={64} y={136} c="Obl: 30~40° 내회전 · 수직" s={8} /></> },
};

export default function XrayFig({ name }: { name: string }) {
  const f = FIGS[name];
  if (!f) return null;
  return (
    <figure className="xg-fig">
      <svg viewBox="0 0 240 150" role="img" aria-label={`${name} 포지셔닝 도식`}>{f.svg}</svg>
      <figcaption>{f.cap}</figcaption>
    </figure>
  );
}
export const XRAY_FIG_NAMES = Object.keys(FIGS);
