/**
 * 경험치표. 활발히 쓰면 하루 약 100 XP (채팅 30 + 글 40 + 댓글 30) + 1회성 퀘스트 + 초대.
 * 목표 체감: 일병 하루 · 하사 1주+ · 소위 1달+ · 소령 6개월 · 참모총장 1년+
 */
export const RANKS = [
  ["훈련병", 0], ["이병", 30], ["일병", 130], ["상병", 330], ["병장", 630],
  ["하사", 1030], ["중사", 1630], ["상사", 2430], ["원사", 3330],
  ["소위", 4500], ["중위", 6000], ["대위", 8000],
  ["소령", 11000], ["중령", 15000], ["대령", 20000],
  ["준장", 26000], ["소장", 33000], ["중장", 41000], ["참모총장", 50000],
] as const;
export const IDX = Object.fromEntries(RANKS.map(([n], i) => [n, i])) as Record<string, number>;
export const GENERAL = IDX["참모총장"]; // 별 4개 — 파트별 단 한 명
export const rankName = (i: number) => RANKS[Math.max(0, Math.min(RANKS.length - 1, i))][0];

/** 계급 구간(tier): -1 훈련병, 0 병사, 1 부사관, 2 위관, 3 영관, 4 장성, 5 참모총장 */
export function tierOf(index: number) { return index === 0 ? -1 : index >= GENERAL ? 5 : index >= IDX["준장"] ? 4 : index >= IDX["소령"] ? 3 : index >= IDX["소위"] ? 2 : index >= IDX["하사"] ? 1 : 0; }
export const STARS: Record<string, string> = { 준장: "★", 소장: "★★", 중장: "★★★", 참모총장: "★★★★" };

export type Rank = { name: string; index: number; tier: number; min: number; next: number | null; nextName: string | null; progress: number; capped: boolean };

export function rankOf(xp: number, isDeptLeader = true): Rank {
  let i = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][1]) i = k;
  let capped = false;
  if (i === GENERAL && !isDeptLeader) { i = GENERAL - 1; capped = true; }
  const cur = RANKS[i], next = RANKS[i + 1];
  return { name: cur[0], index: i, tier: tierOf(i), min: cur[1], next: next?.[1] ?? null, nextName: next?.[0] ?? null,
    progress: next ? Math.min(1, (xp - cur[1]) / (next[1] - cur[1])) : 1, capped };
}

export const PRIVILEGES: { minRank: string; title: string; desc: string }[] = [
  { minRank: "훈련병", title: "훈련병", desc: "19금 발언·욕설로 강등된 상태. 처음부터 다시 올라와야 해요 (이병까지 30 XP)" },
  { minRank: "이병", title: "기본", desc: "채팅, 게시판·익명 글·댓글, 밀어올리기, 번개·하트 제한 없음" },
  { minRank: "일병", title: "글 우선 노출", desc: "계급이 높을수록 내 글이 목록 위쪽에 와요 (모든 계급 공통)" },
  { minRank: "하사", title: "글 빛남 1단계", desc: "내 글이 은은하게 강조돼요" },
  { minRank: "소위", title: "글 빛남 2단계", desc: "내 글에 색 테두리가 붙어요" },
  { minRank: "준장", title: "공지 작성", desc: "모든 칸 위에 보이는 '공지' 칸에 글 + ★ 배지" },
  { minRank: "참모총장", title: "파트 참모총장", desc: "파트별 단 한 명(경험치 1위). 금빛 글, ★★★★. 1위가 아니면 중장까지" },
];
export const can = (r: Rank, minRank: string) => r.index >= IDX[minRank];
/** 계급별 혜택 수치 */
export const PERK = {
  anonMin: "대위" as const,                                                         // 익명 게시판 글쓰기
  meetups: (r: Rank) => (can(r, "준장") ? 3 : can(r, "소령") ? 2 : 1),             // 동시 개설 가능한 번개 수
  hearts: (r: Rank) => (can(r, "준장") ? Infinity : can(r, "소령") ? 5 : 3),        // 하루 셀소 하트(💗) 수
};

/** 1회성 퀘스트 — 지금 있는 기능만. prefix: 병원마다 받는 보상은 '첫 1곳'으로 표시 */
export const QUESTS: { key: string; title: string; xp: number; prefix?: boolean }[] = [
  { key: "bio", title: "한줄소개 쓰기", xp: 50 },
  { key: "hfact:", title: "첫 병원 팩트 제보하기", xp: 50, prefix: true },
  { key: "hverify:", title: "병원 재직·퇴사 인증 받기", xp: 50, prefix: true },
  { key: "hwel:", title: "병원 복지 평가하기", xp: 30, prefix: true },
  { key: "first_post", title: "커뮤니티에 첫 글 올리기", xp: 100 },
  { key: "first_comment", title: "첫 댓글 달기", xp: 50 },
  { key: "first_chat", title: "실시간 채팅 첫 인사", xp: 50 },
  { key: "job:", title: "채용 공고 제보하기", xp: 20, prefix: true },
  { key: "food_1", title: "병원 앞 맛집 첫 등록", xp: 50 },
];
export const questDone = (q: { key: string; prefix?: boolean }, keys: Set<string> | string[]) => { const a = Array.from(keys); return q.prefix ? a.some(k => k.startsWith(q.key)) : a.includes(q.key); };
/** 반복 보상: 1건당 XP와 하루 상한 */
export const REPEAT: Record<string, { each: number; dailyCap: number }> = {
  chat: { each: 2, dailyCap: 30 },
  post: { each: 20, dailyCap: 40 },
  comment: { each: 10, dailyCap: 30 },
  referral: { each: 50, dailyCap: 500 },
  plant: { each: 15, dailyCap: 45 },
  liked: { each: 5, dailyCap: 50 },
};
export function signupBonus(order: number) { return order <= 10 ? 300 : order <= 30 ? 150 : order <= 100 ? 80 : 30; }
