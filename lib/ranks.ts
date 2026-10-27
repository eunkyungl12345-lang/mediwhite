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
  { minRank: "이병", title: "기본", desc: "채팅, 게시판 글·댓글, 게임" },
  { minRank: "일병", title: "글 우선 노출", desc: "계급이 높을수록 내 글이 목록 위쪽에 와요 (모든 계급 공통)" },
  { minRank: "하사", title: "글 빛남 1단계", desc: "내 글이 은은하게 강조돼요" },
  { minRank: "소위", title: "글 빛남 2단계", desc: "내 글에 색 테두리가 붙어요" },
  { minRank: "소령", title: "밀어올리기", desc: "내 글 1개를 공지 바로 아래 고정" },
  { minRank: "준장", title: "공지 작성", desc: "모든 칸 위에 보이는 '공지' 칸에 글 + ★ 배지" },
  { minRank: "참모총장", title: "파트 참모총장", desc: "파트별 단 한 명(경험치 1위). 금빛 글, ★★★★. 1위가 아니면 중장까지" },
];
export const can = (r: Rank, minRank: string) => r.index >= IDX[minRank];

export const QUESTS: { key: string; title: string; xp: number }[] = [
  { key: "first_chat", title: "첫 채팅 보내기", xp: 50 },
  { key: "first_post", title: "게시판에 첫 글 올리기", xp: 100 },
  { key: "first_comment", title: "첫 댓글 달기", xp: 50 },
  { key: "bio", title: "한줄소개 쓰기", xp: 50 },
  { key: "roulette_1", title: "커피 룰렛 돌려보기", xp: 30 },
  { key: "dodge_10", title: "총알 피하기 10초 버티기", xp: 100 },
  { key: "dodge_20", title: "총알 피하기 20초 버티기", xp: 200 },
  { key: "dodge_30", title: "총알 피하기 30초 버티기", xp: 400 },
  { key: "defense_5", title: "병동 사수 5웨이브 방어", xp: 150 },
  { key: "defense_10", title: "병동 사수 10웨이브 방어", xp: 400 },
  { key: "defense_20", title: "병동 사수 20웨이브 방어", xp: 800 },
  { key: "sword_5", title: "검 +5 강화 성공", xp: 100 },
  { key: "sword_10", title: "검 +10 강화 성공", xp: 300 },
  { key: "sword_15", title: "검 +15 강화 성공", xp: 700 },
];
/** 반복 보상: 1건당 XP와 하루 상한 */
export const REPEAT: Record<string, { each: number; dailyCap: number }> = {
  chat: { each: 2, dailyCap: 30 },
  post: { each: 20, dailyCap: 40 },
  comment: { each: 10, dailyCap: 30 },
  referral: { each: 50, dailyCap: 500 },
};
export function signupBonus(order: number) { return order <= 10 ? 300 : order <= 30 ? 150 : order <= 100 ? 80 : 30; }
