/** 🪪 리뷰 카드 머리·꼬리 — 캡처해서 공유해도 병원·직종·출처가 한눈에 보이게
 *  머리: [🏥 병원명 · 🪪 직종 (현직/전직)] + 후기 구분 / 꼬리: ✨ 메디화이트 | 주소 */
export const SITE_LABEL = "mediwhite.vercel.app";
export function RevHead({ hospital, dept, status, cat, extra }: { hospital: string; dept?: string; status?: string; cat?: string; extra?: React.ReactNode }) {
  const now = status === "재직" || status === "현직원", lab = status ? (now ? "현직" : "전직") : "";
  return <div className="rc-head"><span className="rc-hosp">🏥 {hospital}</span>
    {dept && <span className={"rc-dept" + (now ? " now" : "")}>🪪 {dept}{lab && <em>{lab}</em>}</span>}
    {!dept && lab && <span className={"rc-dept" + (now ? " now" : "")}>{lab}</span>}
    {cat && <span className="rc-cat">{cat}</span>}{extra}</div>;
}
export function RevMark() { return <div className="rc-mark" aria-label="출처: 메디화이트">✨ <b>메디화이트</b><i>|</i>{SITE_LABEL}</div>; }
