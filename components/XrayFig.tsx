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


/* ───── 추가 자세 조각 ───── */
const IRb = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => <g><rect x={x} y={y} width={w} height={h} rx={4} fill={IRC} opacity={0.1} stroke={IRC} strokeOpacity={0.35} strokeDasharray="4 3" /><text x={x + 5} y={y + h - 6} fontSize={7} fill="#64748B" fontWeight={700}>IR (몸 옆)</text></g>;
const Note = ({ c }: { c: string }) => <text x={232} y={12} fontSize={7.5} fill="#94A3B8" textAnchor="end" fontWeight={700}>{c}</text>;

/** 위에서 내려다본 단면: 회전 각도 표현 (IR 아래, X선 위에서) */
function TopView({ rot, kind = "body", face = "up", lab }: { rot: number; kind?: "body" | "head" | "hand" | "foot"; face?: "up" | "down"; lab?: string }) {
  const cx = 120, cy = 80, f = face === "up" ? -1 : 1;
  const shape = kind === "head" ? <><ellipse cx={-27} cy={0} rx={4} ry={7} fill={SKIN} stroke={SKIN_L} /><ellipse cx={27} cy={0} rx={4} ry={7} fill={SKIN} stroke={SKIN_L} /><circle r={26} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><path d={`M-6,${f * 24} L0,${f * 34} L6,${f * 24} Z`} fill={SKIN} stroke={SKIN_L} /></>
    : kind === "hand" ? <><ellipse rx={44} ry={11} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><circle cx={-42} cy={f * 9} r={7} fill={SKIN} stroke={SKIN_L} /><text x={-42} y={f * 9 + 3} fontSize={7} textAnchor="middle" fill="#7C5A47">엄지</text></>
    : kind === "foot" ? <><ellipse rx={18} ry={14} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><path d={`M-8,${f * 12} L0,${f * 30} L8,${f * 12} Z`} fill={SKIN} stroke={SKIN_L} /><text x={0} y={f * 40 + 3} fontSize={7} textAnchor="middle" fill="#7C5A47">발끝</text></>
    : <><ellipse rx={52} ry={21} fill={GOWN} stroke={GOWN_L} strokeWidth={1.5} /><circle r={11} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><path d={`M-4,${f * 10} L0,${f * 17} L4,${f * 10} Z`} fill={SKIN_L} /></>;
  return (
    <g>
      <IR x={30} y={124} w={180} h={8} />
      <line x1={50} y1={cy} x2={190} y2={cy} stroke="#CBD5E1" strokeDasharray="3 3" />
      <g transform={`translate(${cx},${cy}) rotate(${rot})`}>{shape}<line x1={-70} y1={0} x2={70} y2={0} stroke="#0EA5E9" strokeDasharray="3 3" strokeWidth={1.1} /></g>
      {rot !== 0 && <text x={196} y={cy - Math.sign(rot) * 14 + 3} fontSize={10} fontWeight={800} fill={RED} textAnchor="middle">{Math.abs(rot)}°</text>}
      <Beam x={cx} y={cy - (kind === "body" ? 24 : kind === "head" ? 28 : 14)} deg={90} len={44} />
      <Note c={lab ?? "위에서 본 모습"} />
    </g>
  );
}

/** 옆모습 기립 (얼굴 오른쪽) — trunk/neck 굴곡각, mark = CR 표시 위치 */
function ProfileStand({ trunk = 0, neck = 0, mark }: { trunk?: number; neck?: number; mark?: "neck" | "ct" | "thor" | "lumb" }) {
  return (
    <g>
      <Limb p={[[138, 100], [137, 145]]} w={13} /><Limb p={[[150, 100], [152, 145]]} w={13} />
      <g transform={`rotate(${trunk} 144 100)`}>
        <Torso x={126} y={40} w={38} h={64} />
        <Limb p={[[140, 48], [136, 76], [142, 94]]} w={8} />
        {mark === "thor" && <Cross x={136} y={64} />}{mark === "lumb" && <Cross x={136} y={90} />}
        <g transform={`rotate(${neck} 144 40)`}>
          <Limb p={[[144, 30], [145, 42]]} w={9} /><HeadC x={147} y={22} r={11} /><path d="M157,19 L163,24 L157,26 Z" fill={SKIN} stroke={SKIN_L} />
          {mark === "neck" && <Cross x={143} y={33} />}{mark === "ct" && <Cross x={142} y={42} />}
        </g>
      </g>
    </g>
  );
}

/** 정면 기립 (환자 오른쪽 = 화면 왼쪽) */
function FrontStand({ arms = "down", weights = false }: { arms?: "down" | "up" | "swim" | "swimL" | "front" | "belly"; weights?: boolean }) {
  const L: P[] = arms === "up" ? [[99, 47], [92, 24], [112, 12]] : arms === "swimL" ? [[99, 47], [94, 22], [100, 4]] : arms === "front" ? [[99, 47], [104, 60], [114, 50]] : arms === "belly" ? [[98, 48], [90, 76], [108, 84]] : [[98, 48], [92, 104]];
  const R: P[] = arms === "up" ? [[121, 47], [128, 24], [108, 12]] : arms === "swim" ? [[121, 47], [126, 22], [120, 4]] : arms === "front" ? [[121, 47], [116, 60], [106, 50]] : [[122, 48], [128, 104]];
  return (
    <g>
      <Limb p={[[104, 100], [102, 145]]} w={13} /><Limb p={[[116, 100], [118, 145]]} w={13} />
      <Torso x={94} y={42} w={32} h={62} />
      <Limb p={L} w={8} /><Limb p={R} w={8} />
      {weights && <><rect x={86} y={106} width={12} height={10} rx={2} fill="#475569" /><rect x={122} y={106} width={12} height={10} rx={2} fill="#475569" /></>}
      <Limb p={[[110, 32], [110, 44]]} w={8} /><HeadC x={110} y={24} r={11} />
    </g>
  );
}

/** 정면 얼굴 */
const FaceFront = ({ x, y, open = false, tilt = 0 }: { x: number; y: number; open?: boolean; tilt?: number }) => (
  <g transform={`rotate(${tilt} ${x} ${y})`}>
    <Limb p={[[x, y + 26], [x, y + 60]]} w={20} />
    <ellipse cx={x - 23} cy={y + 2} rx={4} ry={7} fill={SKIN} stroke={SKIN_L} /><ellipse cx={x + 23} cy={y + 2} rx={4} ry={7} fill={SKIN} stroke={SKIN_L} />
    <ellipse cx={x} cy={y} rx={22} ry={28} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
    <circle cx={x - 8} cy={y - 6} r={2} fill="#374151" /><circle cx={x + 8} cy={y - 6} r={2} fill="#374151" />
    <path d={`M${x},${y - 4} L${x - 3},${y + 6} L${x + 2},${y + 6}`} fill="none" stroke={SKIN_L} strokeWidth={1.3} />
    {open ? <ellipse cx={x} cy={y + 15} rx={6} ry={5} fill="#7A2E2E" /> : <line x1={x - 6} y1={y + 14} x2={x + 6} y2={y + 14} stroke={SKIN_L} strokeWidth={1.4} />}
  </g>
);

/** 손등 위에서 본 손 (PA) */
const HandTop = () => (
  <g>
    <Limb p={[[120, 112], [120, 150]]} w={30} />
    <rect x={96} y={68} width={50} height={48} rx={12} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
    <Limb p={[[102, 74], [94, 36]]} w={9} /><Limb p={[[114, 72], [111, 26]]} w={10} /><Limb p={[[126, 72], [128, 22]]} w={10} /><Limb p={[[138, 74], [145, 30]]} w={10} /><Limb p={[[146, 100], [166, 76]]} w={11} />
  </g>
);
/** 옆에서 본 손 (척측이 IR) */
const HandSide = ({ one = false }: { one?: boolean }) => (
  <g>
    <IR x={10} y={112} w={220} h={7} />
    <Limb p={[[14, 98], [96, 98]]} w={22} />
    <rect x={92} y={84} width={58} height={28} rx={11} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
    {one ? <><Limb p={[[146, 92], [204, 90]]} w={8} /><circle cx={154} cy={104} r={10} fill={SKIN} stroke={SKIN_L} /></> : <><Limb p={[[146, 92], [198, 70]]} w={7} /><Limb p={[[146, 96], [204, 84]]} w={7} /><Limb p={[[146, 100], [204, 98]]} w={7} /><Limb p={[[146, 104], [198, 110]]} w={7} /></>}
    <Limb p={[[110, 84], [130, 64]]} w={9} />
  </g>
);
/** 옆에서 본 발 (측면) */
const FootSide = () => (
  <g>
    <IR x={40} y={120} w={170} h={7} />
    <Limb p={[[72, 8], [76, 96]]} w={18} />
    <path d="M62,94 Q54,118 74,118 L178,118 Q188,116 182,108 L126,98 Q96,90 84,92 Z" fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
    <circle cx={78} cy={96} r={4} fill="none" stroke={SKIN_L} />
  </g>
);
/** 발바닥 쪽에서 본 발 (AP) */
const FootTop = ({ rot = 0 }: { rot?: number }) => (
  <g transform={`rotate(${rot} 120 90)`}>
    <rect x={98} y={40} width={44} height={92} rx={20} fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} />
    {[100, 110, 120, 130, 139].map((x, i) => <circle key={x} cx={x + 2} cy={36 - (i === 0 ? 2 : i * 0.5)} r={i === 0 ? 7 : 5} fill={SKIN} stroke={SKIN_L} />)}
  </g>
);
/** 위에서 본 누운 다리 (양측) */
const LegsTop = ({ ruler = false }: { ruler?: boolean }) => (
  <g>
    <rect x={10} y={40} width={74} height={72} rx={18} fill={GOWN} stroke={GOWN_L} strokeWidth={1.5} />
    <Limb p={[[84, 62], [220, 60]]} w={18} /><Limb p={[[84, 90], [220, 92]]} w={18} />
    <Limb p={[[220, 60], [226, 50]]} w={9} /><Limb p={[[220, 92], [226, 102]]} w={9} />
    {ruler && <g><rect x={84} y={73} width={140} height={6} fill="#F59E0B" />{Array.from({ length: 14 }, (_, i) => <line key={i} x1={88 + i * 10} y1={73} x2={88 + i * 10} y2={77} stroke="#7C4A03" />)}</g>}
  </g>
);

const FIGS2: Record<string, Fig> = {
  "skull-ap": { cap: "앙와위 · OML ⟂ IR · 수직 → 비근점", svg: <><Table y={116} /><IR x={52} y={116} w={60} h={7} /><Torso x={112} y={88} w={116} h={26} r={10} /><Head x={82} y={90} rot={-90} /><Beam x={92} y={66} deg={90} len={60} /><Txt x={170} y={40} c="수직 (0°)" /></> },
  "skull-obl": { cap: "머리를 관심 쪽으로 약 45° 회전 · 좌·우 각각", svg: <TopView rot={45} kind="head" /> },
  "tmj-close": { cap: "측면 · 입 다묾 · 25~30° 미측 → IR 쪽 TMJ (Schüller)", svg: <><IR x={150} y={20} w={9} h={110} /><FaceFront x={118} y={70} /><Beam x={96} y={60} deg={27} refDeg={0} label="25~30°" len={82} /><Txt x={178} y={140} c="좌·우 각각" s={8} /><Note c="정면에서 본 모습 · IR = 환측 옆" /></> },
  "tmj-open": { cap: "같은 자세 · 입 최대한 벌림 · 각도 그대로", svg: <><IR x={150} y={20} w={9} h={110} /><FaceFront x={118} y={70} open /><Beam x={96} y={60} deg={27} refDeg={0} label="25~30°" len={82} /><Txt x={178} y={140} c="좌·우 각각" s={8} /><Note c="정면에서 본 모습 · IR = 환측 옆" /></> },
  "mand-pa": { cap: "이마·코 IR에 · OML ⟂ IR · 수직 → 입술 접합부", svg: <><IR x={182} y={14} w={9} h={112} /><Limb p={[[146, 98], [146, 146]]} w={18} /><Head x={152} y={72} /><Beam x={128} y={82} deg={0} len={92} /><Txt x={60} y={66} c="수직 (0°)" /></> },
  "mand-obl": { cap: "측면에서 목 젖히고 IR 쪽으로 기울임 · 25° 두측", svg: <><IR x={150} y={20} w={9} h={110} /><FaceFront x={118} y={70} tilt={18} /><Beam x={100} y={94} deg={-25} refDeg={0} label="25°" len={80} /><Txt x={60} y={140} c="하악지 0° · 하악체 30° · 턱끝 45° 회전" s={8} /><Note c="정면에서 본 모습 · IR = 환측 옆" /></> },
  "nasal-lat": { cap: "측면 · IPL ⟂ IR · 수직 → 비근점 1.3cm 아래", svg: <><IR x={150} y={30} w={9} h={90} /><FaceFront x={118} y={72} /><Beam x={96} y={72} deg={0} len={80} /><Txt x={178} y={140} c="좌·우 각각" s={8} /><Note c="정면에서 본 모습 · IR = 코 옆" /></> },
  "zyg-smv": { cap: "고개 최대한 젖혀 정수리 IR에 · IOML ∥ IR · 턱 아래 입사", svg: <><IR x={76} y={20} w={9} h={110} /><Limb p={[[124, 84], [150, 128]]} w={18} /><Torso x={138} y={110} w={70} h={36} /><Head x={110} y={74} rot={-90} /><Beam x={136} y={78} deg={180} len={80} /><Txt x={186} y={40} c="IOML에 수직" s={8} /></> },
  "cs-obl": { cap: "몸 전체 45° 회전 · AP사위 15~20° 두측 / PA사위 미측 · C4", svg: <TopView rot={45} /> },
  "cs-flex": { cap: "측면 기립 · 턱을 가슴 쪽으로 최대 굴곡 · CR 수평 C4", svg: <><Floor /><IRb x={96} y={4} w={98} h={140} /><ProfileStand neck={38} mark="neck" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "cs-ext": { cap: "측면 기립 · 고개 최대 신전 · CR 수평 C4", svg: <><Floor /><IRb x={96} y={4} w={98} h={140} /><ProfileStand neck={-32} mark="neck" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ct-flex": { cap: "측면 · 최대 굴곡 · CR 수평 C7~T1", svg: <><Floor /><IRb x={96} y={4} w={98} h={140} /><ProfileStand neck={36} trunk={8} mark="ct" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ct-ext": { cap: "측면 · 최대 신전 · CR 수평 C7~T1", svg: <><Floor /><IRb x={96} y={4} w={98} h={140} /><ProfileStand neck={-30} mark="ct" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ct-ap": { cap: "앙와위 · 수직(또는 약간 두측) · C7~T1 경정맥절흔", svg: <><Table /><IR x={30} y={110} w={56} h={7} /><Supine /><Beam x={56} y={86} deg={90} /><Txt x={140} y={40} c="수직 (0°)" /></> },
  "ct-lat": { cap: "수영자 자세 · IR 쪽 팔 위로 · 반대 어깨 내림 · 수평 T1", svg: <><Floor /><IR x={132} y={2} w={9} h={110} /><FrontStand arms="swim" /><Beam x={94} y={46} deg={0} len={80} /><Txt x={186} y={70} c="반대 어깨 ↓" s={8} /></> },
  "ts-ap": { cap: "앙와위 · 무릎 굽힘 · 수직 · T7 (경정맥절흔–검상돌기 중간)", svg: <><Table /><IR x={44} y={110} w={84} h={7} /><Supine bent /><Beam x={86} y={84} deg={90} /><Txt x={170} y={40} c="수직 (0°)" /><Txt x={170} y={52} c="머리 쪽 = 양극" s={8} /></> },
  "ts-lat": { cap: "측와위 · 팔 앞으로 90° · 허리 받침 · 수직 T7", svg: <><Table /><IR x={44} y={110} w={84} h={7} /><rect x={96} y={106} width={24} height={5} rx={2} fill="#F59E0B" /><Supine bent /><Beam x={80} y={84} deg={90} /><Txt x={170} y={40} c="수직 (0°)" /><Txt x={170} y={52} c="옆으로 누움 · 얕은 호흡" s={8} /></> },
  "ts-flex": { cap: "측면 · 상체 최대 굴곡 · CR T7", svg: <><Floor /><IRb x={96} y={4} w={110} h={140} /><ProfileStand trunk={28} neck={10} mark="thor" /><Txt x={50} y={60} c="CR ⊕" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ts-ext": { cap: "측면 · 상체 최대 신전 · CR T7", svg: <><Floor /><IRb x={96} y={4} w={110} h={140} /><ProfileStand trunk={-14} neck={-8} mark="thor" /><Txt x={50} y={60} c="CR ⊕" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ls-obl": { cap: "45° 후사위 (RPO·LPO 각각) · 수직 · L3 · 아래쪽 후관절", svg: <TopView rot={45} /> },
  "ls-flex": { cap: "측면 기립 · 앞으로 최대 숙임 · CR 수평 L3", svg: <><Floor /><IRb x={96} y={4} w={120} h={140} /><ProfileStand trunk={42} neck={12} mark="lumb" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "ls-ext": { cap: "측면 기립 · 뒤로 최대 젖힘 · CR 수평 L3", svg: <><Floor /><IRb x={96} y={4} w={110} h={140} /><ProfileStand trunk={-16} neck={-8} mark="lumb" /><Txt x={50} y={60} c="CR ⊕ 수평" /><Note c="옆모습 · X선은 화면 앞에서 수직으로" /></> },
  "sac-ap": { cap: "앙와위 · 15° 두측 · 치골결합 약 5cm 위", svg: <><Table /><IR x={94} y={110} w={62} h={7} /><Supine /><Beam x={124} y={84} deg={105} refDeg={90} label="15°" /><Txt x={36} y={30} c="머리 쪽(두측) ←" s={8} a="start" /></> },
  "sac-lat": { cap: "측와위 · 무릎·고관절 굽힘 · 수직 · ASIS 8~10cm 뒤", svg: <><Table /><IR x={94} y={110} w={62} h={7} /><Supine bent /><Beam x={126} y={84} deg={90} /><Txt x={60} y={40} c="수직 (0°)" /><Txt x={60} y={52} c="옆으로 누움" s={8} /></> },
  "coc-ap": { cap: "앙와위 · 10° 미측 · 치골결합 약 5cm 위", svg: <><Table /><IR x={98} y={110} w={62} h={7} /><Supine /><Beam x={126} y={84} deg={80} refDeg={90} label="10°" /><Txt x={196} y={30} c="→ 발 쪽(미측)" s={8} /></> },
  "rib-ap": { cap: "상부: 기립·흡기 T7 / 하부: 앙와위·호기 T10 · 수직", svg: <><Floor /><IR x={116} y={14} w={9} h={112} /><StandSide /><Beam x={164} y={70} deg={180} len={60} /><Txt x={56} y={56} c="상부 늑골" /><Txt x={56} y={68} c="기립 · 흡기 정지" s={8} /><Note c="AP = 등이 IR 쪽" /></> },
  "rib-obl": { cap: "45° 회전 · 환측 액와부 늑골 IR과 평행 · 좌·우 각각", svg: <TopView rot={45} /> },
  "ster-lat": { cap: "기립 측면 · 어깨 뒤로 · 수평 흉골 중앙 · 흡기", svg: <><Floor /><IR x={130} y={14} w={9} h={112} /><FrontStand /><Beam x={94} y={62} deg={0} len={80} /><Txt x={186} y={70} c="어깨 뒤로 젖힘" s={8} /></> },
  "ster-rao": { cap: "오른쪽 앞 15~20° 회전 (RAO) · 흉골을 심장 음영 위로", svg: <TopView rot={-18} face="down" lab="위에서 본 모습 · 앞면이 IR 쪽" /> },
  "sh-lat": { cap: "환측 IR에 · 반대 팔 머리 위 · 수평 외과경", svg: <><Floor /><IR x={130} y={14} w={9} h={112} /><FrontStand arms="swimL" /><Beam x={94} y={56} deg={0} len={80} /><Txt x={186} y={70} c="환측 = IR 쪽" s={8} /></> },
  "sh-y": { cap: "환측 앞면 IR에 · 몸 45~60° 회전 · 견갑상완관절", svg: <TopView rot={-50} face="down" lab="위에서 본 모습 · 앞면이 IR 쪽" /> },
  "sh-axial": { cap: "앙와위 · 팔 90° 외전 · IR은 어깨 위 · 수평 15~30° 내측 → 액와", svg: <><rect x={70} y={40} width={70} height={106} rx={16} fill={GOWN} stroke={GOWN_L} strokeWidth={1.5} /><HeadC x={105} y={26} r={15} /><Limb p={[[138, 54], [222, 54]]} w={14} /><IR x={128} y={16} w={40} h={8} /><Beam x={150} y={58} deg={-112} refDeg={-90} label="15~30°" len={70} /><Note c="위에서 본 모습" /></> },
  "ac-ap": { cap: "기립 · 양측 비교 (무게 有·無) · 수직 · 양 AC 관절", svg: <><Floor /><FrontStand weights /><Cross x={97} y={45} /><Cross x={123} y={45} /><Txt x={186} y={60} c="⊕ = CR (수직)" s={8} /><Txt x={186} y={110} c="손목에 2.5~4.5kg" s={8} /><Note c="정면 · IR은 등 뒤" /></> },
  "ac-axial": { cap: "기립 AP · 15° 두측 → AC 관절", svg: <><Floor /><IR x={115} y={14} w={9} h={112} /><StandSide /><Beam x={160} y={46} deg={195} refDeg={180} label="15°" len={66} /><Note c="옆모습 · 등이 IR 쪽" /></> },
  "clav-ap": { cap: "기립/앙와위 · 수직 · 쇄골 중앙", svg: <><Floor /><FrontStand /><line x1={97} y1={46} x2={109} y2={42} stroke={SKIN_L} strokeWidth={2} /><Cross x={102} y={45} /><Txt x={186} y={60} c="⊕ = CR (수직)" s={8} /><Note c="정면 · IR은 등 뒤" /></> },
  "clav-axial": { cap: "AP 축 · 15~30° 두측 · 쇄골 중앙", svg: <><Floor /><IR x={115} y={14} w={9} h={112} /><StandSide /><Beam x={160} y={48} deg={200} refDeg={180} label="15~30°" len={66} /><Note c="옆모습 · 등이 IR 쪽" /></> },
  "hum-ap": { cap: "팔 외회전 · 상과선 ∥ IR · 수직 · 상완 중앙", svg: <><Floor /><FrontStand /><Cross x={95} y={74} /><Txt x={186} y={60} c="⊕ = CR (수직)" s={8} /><Txt x={186} y={72} c="손바닥 앞(외회전)" s={8} /><Note c="정면 · IR은 등 뒤" /></> },
  "hum-lat": { cap: "팔 내회전 (손등 배 쪽) · 상과선 ⟂ IR · 상완 중앙", svg: <><Floor /><FrontStand arms="belly" /><Cross x={94} y={64} /><Txt x={186} y={60} c="⊕ = CR (수직)" s={8} /><Txt x={186} y={72} c="내회전" s={8} /><Note c="정면 · IR은 등 뒤" /></> },
  "hum-obl": { cap: "AP에서 약 45° 내·외측 회전 (각각) · 상완 중앙", svg: <TopView rot={45} /> },
  "elb-obl": { cap: "내측: 회내 45° (구상돌기) / 외측: 외회전 45° (요골두)", svg: <TopView rot={45} kind="hand" face="up" lab="손끝 쪽에서 본 모습" /> },
  "fa-ap": { cap: "손바닥 위 · 손목·팔꿈치 포함 · 수직 전완 중앙", svg: <><IR x={14} y={50} w={212} h={52} /><Limb p={[[18, 76], [200, 76]]} w={18} /><ellipse cx={212} cy={76} rx={14} ry={11} fill={SKIN} stroke={SKIN_L} /><Cross x={150} y={76} /><Txt x={60} y={120} c="상완" s={8} /><Txt x={150} y={120} c="전완" s={8} /><Note c="위에서 본 모습" /></> },
  "fa-lat": { cap: "팔꿈치 90° · 엄지 위 · 수직 전완 중앙", svg: <><IR x={30} y={24} w={180} h={110} /><Limb p={[[60, 112], [130, 112], [130, 36]]} w={16} /><ellipse cx={130} cy={30} rx={10} ry={12} fill={SKIN} stroke={SKIN_L} /><Cross x={130} y={74} /><Note c="위에서 본 모습" /></> },
  "fa-obl": { cap: "AP에서 45° 내회전 / 외회전 (각각)", svg: <TopView rot={45} kind="hand" lab="손끝 쪽에서 본 모습" /> },
  "wr-lat": { cap: "척측 IR에 · 요골·척골 겹치게 · 요골 경상돌기", svg: <><HandSide one={false} /><Cross x={96} y={98} /><Note c="옆에서 본 모습" /></> },
  "wr-obl": { cap: "내측: 엄지 쪽 45° 들기 / 외측: 새끼 쪽 45° 들기", svg: <TopView rot={45} kind="hand" face="down" lab="손끝 쪽에서 본 모습" /> },
  "hand-lat": { cap: "척측 IR에 · 손가락 부채꼴(fan) · 엄지 앞 · 2nd MCP", svg: <><HandSide /><Cross x={146} y={94} /><Note c="옆에서 본 모습" /></> },
  "hand-obl": { cap: "엄지 쪽 45° 들기 (받침) / Norgaard 양손 45°", svg: <TopView rot={45} kind="hand" face="down" lab="손끝 쪽에서 본 모습" /> },
  "fin-ap": { cap: "손바닥 아래 · 해당 손가락 IR 중앙 · PIP 수직", svg: <><IR x={60} y={6} w={120} h={138} /><HandTop /><Cross x={128} y={44} /><Txt x={204} y={46} c="PIP" s={8} /></> },
  "fin-lat": { cap: "해당 손가락만 펴고 나머지 주먹 · 받침으로 IR 평행 · PIP", svg: <><HandSide one /><Cross x={182} y={90} /><Note c="옆에서 본 모습" /></> },
  "fin-obl": { cap: "45° 내측·외측 회전 (각각) · 손가락은 받침으로 평행", svg: <TopView rot={45} kind="hand" lab="손끝 쪽에서 본 모습" /> },
  "pel-lat": { cap: "측와위 · 양 ASIS 수직으로 겹치게 · 수직 대전자", svg: <><Table /><IR x={98} y={110} w={64} h={7} /><Supine bent /><Beam x={130} y={84} deg={90} /><Txt x={60} y={40} c="수직 (0°)" /><Txt x={60} y={52} c="옆으로 누움" s={8} /></> },
  "pel-obl": { cap: "Judet: 45° 후사위 (좌·우 각각) · 비구 전·후주", svg: <TopView rot={45} /> },
  "hip-lat": { cap: "개구리 자세: 무릎 굽혀 발바닥 붙이고 40~45° 외전 · 대퇴경부", svg: <><rect x={84} y={6} width={72} height={84} rx={16} fill={GOWN} stroke={GOWN_L} strokeWidth={1.5} /><Limb p={[[100, 86], [56, 118], [112, 140]]} w={16} /><Limb p={[[140, 86], [184, 118], [128, 140]]} w={16} /><Cross x={104} y={82} /><Txt x={40} y={30} c="⊕ 대퇴경부" s={8} a="start" /><Note c="위에서 본 모습" /></> },
  "fem-ap": { cap: "앙와위 · 5° 내회전 · 고관절·무릎 포함 · 대퇴 중앙", svg: <><IR x={86} y={36} w={84} h={70} /><LegsTop /><Cross x={128} y={61} /><Note c="위에서 본 모습" /></> },
  "fem-lat": { cap: "환측 아래 측와위 · 무릎 약 45° 굽힘 · 대퇴 중앙", svg: <><Table /><IR x={118} y={110} w={64} h={7} /><Supine bent /><Beam x={148} y={86} deg={90} /><Txt x={60} y={40} c="수직 (0°)" /><Txt x={60} y={52} c="옆으로 누움" s={8} /></> },
  "tib-ap": { cap: "앙와위 · 발 배굴 · 무릎·발목 포함 · 하퇴 중앙", svg: <><IR x={150} y={36} w={80} h={70} /><LegsTop /><Cross x={190} y={60} /><Note c="위에서 본 모습" /></> },
  "tib-lat": { cap: "환측 아래 측와위 · 무릎 살짝 굽힘 · 하퇴 중앙", svg: <><Table /><IR x={150} y={110} w={64} h={7} /><Supine /><Beam x={186} y={92} deg={90} /><Txt x={60} y={40} c="수직 (0°)" /><Txt x={60} y={52} c="옆으로 누움" s={8} /></> },
  "tib-obl": { cap: "다리 45° 내회전 / 외회전 (각각)", svg: <TopView rot={45} kind="foot" lab="발 쪽에서 본 모습" /> },
  "ank-lat": { cap: "환측 아래 측면 · 배굴 90° · 수직 내과", svg: <><FootSide /><Cross x={78} y={96} /><Note c="옆에서 본 모습" /></> },
  "calc-lat": { cap: "측면 · 배굴 · 내과 약 2.5cm 아래", svg: <><FootSide /><Cross x={74} y={108} /><Note c="옆에서 본 모습" /></> },
  "calc-axial": { cap: "앙와위 · 끈으로 발 당겨 최대 배굴 · 40° 두측 → 발바닥", svg: <><Table /><IR x={150} y={110} w={60} h={7} /><Limb p={[[14, 100], [178, 101]]} w={18} /><Limb p={[[178, 101], [182, 56]]} w={12} /><line x1={182} y1={54} x2={110} y2={38} stroke="#B45309" strokeWidth={2} strokeDasharray="4 3" /><Beam x={190} y={84} deg={130} refDeg={90} label="40°" len={70} /><Txt x={60} y={30} c="끈으로 당김" s={8} /></> },
  "foot-lat": { cap: "환측 아래 측면 · 발바닥 ⟂ IR · 내측 설상골", svg: <><FootSide /><Cross x={122} y={106} /><Note c="옆에서 본 모습" /></> },
  "foot-obl": { cap: "AP에서 30~45° 내회전 · 수직 3rd 중족골 기저부", svg: <TopView rot={-38} kind="foot" lab="발 뒤쪽에서 본 모습" /> },
  "fs-ap": { cap: "양발 체중부하 · 15° 후방(뒤꿈치 쪽) · 3rd 중족골 기저부", svg: <><Floor /><IR x={60} y={134} w={150} h={7} /><Limb p={[[100, 10], [102, 122]]} w={20} /><path d="M88,120 Q84,134 100,134 L176,134 Q184,132 178,126 L124,118 Q110,114 100,116 Z" fill={SKIN} stroke={SKIN_L} strokeWidth={1.5} /><Beam x={140} y={124} deg={105} refDeg={90} label="15°" len={80} /><Note c="옆모습 · 서서" /></> },
  "fs-lat": { cap: "IR을 양발 사이에 세우고 체중부하 · 수평 · 좌·우 각각", svg: <><Floor /><Limb p={[[94, 10], [94, 128]]} w={20} /><Limb p={[[146, 10], [146, 128]]} w={20} /><ellipse cx={94} cy={136} rx={16} ry={7} fill={SKIN} stroke={SKIN_L} /><ellipse cx={146} cy={136} rx={16} ry={7} fill={SKIN} stroke={SKIN_L} /><IR x={116} y={92} w={8} h={50} /><Beam x={80} y={130} deg={0} len={64} /><Note c="앞에서 본 모습" /></> },
  "toe-ap": { cap: "발바닥 IR에 · 10~15° 후방 · 해당 발가락 MTP", svg: <><IR x={60} y={10} w={120} h={134} /><FootTop /><Cross x={102} y={46} /><Txt x={204} y={46} c="MTP" s={8} /><Note c="위에서 본 모습" /></> },
  "toe-lat": { cap: "다른 발가락 젖혀 분리 · 측면 · 해당 발가락", svg: <><FootSide /><Cross x={172} y={110} /><Note c="옆에서 본 모습" /></> },
  "toe-obl": { cap: "30~45° 내회전 / 외회전 (각각)", svg: <TopView rot={-38} kind="foot" lab="발 뒤쪽에서 본 모습" /> },
  "ws-ap": { cap: "기립 · 신발 벗고 무릎 펴기 · 장척 촬영 · 외이도~대퇴골두", svg: <><Floor /><IR x={115} y={2} w={9} h={144} /><StandSide /><Beam x={164} y={70} deg={180} len={60} /><Txt x={56} y={60} c="장척(stitching)" s={8} /><Note c="옆모습 · 등이 IR 쪽" /></> },
  "ws-lat": { cap: "기립 측면 · 팔 앞으로 (쇄골 위 손) · 장척 촬영", svg: <><Floor /><IR x={130} y={2} w={9} h={144} /><FrontStand arms="front" /><Beam x={94} y={72} deg={0} len={80} /><Note c="정면에서 본 모습 · IR = 몸 옆" /></> },
  "scano": { cap: "앙와위 · 다리 평행 · 자(ruler) · 고관절·슬관절·족관절 각각", svg: <><LegsTop ruler /><Cross x={92} y={62} /><Cross x={150} y={61} /><Cross x={214} y={60} /><Txt x={150} y={128} c="고관절 · 슬관절 · 족관절" s={8} /><Note c="위에서 본 모습" /></> },
};
Object.assign(FIGS, FIGS2);

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
