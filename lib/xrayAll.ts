import { XRAY, XRAY_PARTS, type XrayExam, type XrayView, type XDetail } from "./xrayGuide";
import { D as A } from "./xrayDetail/a";
import { D as B } from "./xrayDetail/b";
import { D as C } from "./xrayDetail/c";
/** 🩻 촬영법 폼 — 검사×뷰마다 한 장 (slug = 검사번호-뷰번호) */
const DET: Record<string, XDetail> = { ...A, ...B, ...C };
export type XV = { slug: string; exam: XrayExam; view: XrayView; d?: XDetail; ei: number; vi: number };
export const XVIEWS: XV[] = XRAY.flatMap((exam, ei) => exam.views.map((view, vi) => ({ slug: `${ei + 1}-${vi + 1}`, exam, view, d: DET[`${exam.name}|${view.v}`], ei, vi })));
export const xvBySlug = (s: string) => XVIEWS.find(x => x.slug === s);
export { XRAY, XRAY_PARTS };
