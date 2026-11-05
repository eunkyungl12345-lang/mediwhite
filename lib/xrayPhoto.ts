/** 🩻 촬영법 폼 사진 — 회원이 올리고 운영팀 승인 후 공개. game_state(game="xrimg:<slug>:<id>") */
export const XP_KINDS = ["자세 (정면)", "자세 (측면)", "장비·IR 배치", "실제 영상 (익명)", "기타"] as const;
export type XPhoto = { slug: string; kind: string; path: string; note?: string; status: "pending" | "approved"; at: string };
export const xpKey = (slug: string, id: string) => `xrimg:${slug}:${id}`;
