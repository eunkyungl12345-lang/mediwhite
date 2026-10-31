/** 골드 인증 씰 — 16톱니 골드 그라데이션 + 다크 체크 (신분+면허 인증 회원) */
export default function BlueBadge({ size = 16, className = "", title = "골드뱃지 · 신분+면허 인증 회원" }: { size?: number; className?: string; title?: string }) {
  const pts: string[] = []; const N = 16;
  for (let i = 0; i < N * 2; i++) { const a = (Math.PI * i) / N - Math.PI / 2, r = i % 2 === 0 ? 50 : 43; pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`); }
  return (
    <svg className={"bluebadge " + className} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title}>
      <title>{title}</title>
      <defs><linearGradient id="gbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE08A" /><stop offset=".5" stopColor="#F5B82E" /><stop offset="1" stopColor="#C98A00" /></linearGradient></defs>
      <polygon points={pts.join(" ")} fill="url(#gbg)" stroke="#A86F00" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="2" />
      <path d="M31 52 L44 64 L70 37" fill="none" stroke="#5A3D00" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
