/** 🏆 천하제일 우리병원 자랑하기 — 사진 + 자랑 포인트 + 한마디. game_state(game="brag:<병원id>")에 1인 1병원 1자랑 */
export const BRAG_TAGS = ["복지 빵빵", "식당 맛집", "동료가 최고", "선배가 잘 가르쳐줘요", "칼퇴 가능", "연차 자유", "시설 신축·깨끗", "휴게실 좋아요", "기숙사 좋아요", "급여 만족", "뷰 맛집", "교육 지원"] as const;
export type Brag = { owner: string; hid: number; hospital: string; region: string; tags: string[]; text: string; photos: string[]; urls: string[]; dept?: string; at: string; likes: number; liked: boolean; verified?: boolean };
export const bragKey = (hid: number) => `brag:${hid}`;
export const likeKey = (owner: string, hid: number) => `bragx:${owner}:${hid}`;
