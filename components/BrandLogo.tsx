/** 🏥 메디화이트 심볼 로고 — 라운드 스퀘어 뱃지(--ink) 안 화이트 의료 크로스 + 워드마크. 순수 인라인 SVG */
export default function BrandLogo({ size = 22 }: { size?: number }) {
  return <span className="bl">
    <svg className="bl-mark" width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <rect width="22" height="22" rx="6" fill="var(--ink)" />
      <path d="M9.2 5.5h3.6v3.7h3.7v3.6h-3.7v3.7H9.2v-3.7H5.5V9.2h3.7z" fill="var(--bg, #fff)" />
    </svg>
    <span className="bl-word">메디화이트</span>
  </span>;
}
