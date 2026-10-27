export const RANKS = [
  ["이병", 0], ["일병", 100], ["상병", 250], ["병장", 450], ["하사", 700], ["중사", 1000], ["상사", 1400], ["원사", 1900],
  ["소위", 2500], ["중위", 3200], ["대위", 4000], ["소령", 5000], ["중령", 6200], ["대령", 7600],
  ["준장", 9200], ["소장", 11000], ["중장", 13000], ["대장", 15500],
] as const;
export const IDX = Object.fromEntries(RANKS.map(([n], i) => [n, i])) as Record<string, number>;
export const GENERAL = IDX["대장"]; // 별 4개 — 파트별 단 한 명

/** 계급 구간(tier): 0 병사, 1 부사관, 2 위관, 3 영관, 4 장성, 5 대장 */
export function tierOf(index: number) { return index >= GENERAL ? 5 : index >= IDX["준장"] ? 4 : index >= IDX["소령"] ? 3 : index >= IDX["소위"] ? 2 : index >= IDX["하사"] ? 1 : 0; }
export const STARS: Record<string, string> = { 준장: "★", 소장: "★★", 중장: "★★★", 대장: "★★★★" };

export type Rank = { name: string; index: number; tier: number; min: number; next: number | null; nextName: string | null; progress: number; capped: boolean };

/** xp → 계급. isDeptLeader=false 면 대장 자격이 있어도 중장으로 표시(파트별 대장은 한 명). */
export function rankOf(xp: number, isDeptLeader = true): Rank {
  let i = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][1]) i = k;
  let capped = false;
  if (i === GENERAL && !isDeptLeader) { i = GENERAL - 1; capped = true; }
  const cur = RANKS[i], next = RANKS[i + 1];
  return { name: cur[0], index: i, tier: tierOf(i), min: cur[1], next: next?.[1] ?? null, nextName: next?.[0] ?? null,
    progress: next ? Math.min(1, (xp - cur[1]) / (next[1] - cur[1])) : 1, capped };
}

/** 계급별 권한 */
export const PRIVILEGES: { minRank: string; title: string; desc: string }[] = [
  { minRank: "이병", title: "기본", desc: "채팅, 게시판 글·댓글, 게임" },
  { minRank: "하사", title: "글 빛남 1단계", desc: "내 글이 은은하게 강조돼요" },
  { minRank: "소위", title: "글 빛남 2단계", desc: "내 글에 색 테두리가 붙어요" },
  { minRank: "소령", title: "밀어올리기", desc: "내 글 1개를 목록 위쪽에 고정 (공지 바로 아래)" },
  { minRank: "준장", title: "공지 작성", desc: "모든 칸 위에 보이는 '공지' 칸에 글을 쓸 수 있어요 + 별 배지" },
  { minRank: "대장", title: "파트 대장", desc: "파트별 단 한 명. 금빛 글, ★★★★ 배지. 경험치 1위가 아니면 중장까지만" },
];
export const can = (r: Rank, minRank: string) => r.index >= IDX[minRank];

export const QUESTS: { key: string; title: string; xp: number }[] = [
  { key: "first_chat", title: "첫 채팅 보내기", xp: 50 },
  { key: "first_post", title: "게시판에 첫 글 올리기", xp: 100 },
  { key: "first_comment", title: "첫 댓글 달기", xp: 50 },
  { key: "roulette_1", title: "커피 룰렛 돌려보기", xp: 30 },
  { key: "dodge_10", title: "총알 피하기 10초 버티기", xp: 100 },
  { key: "dodge_20", title: "총알 피하기 20초 버티기", xp: 200 },
  { key: "dodge_30", title: "총알 피하기 30초 버티기", xp: 400 },
  { key: "sword_5", title: "검 +5 강화 성공", xp: 100 },
  { key: "sword_10", title: "검 +10 강화 성공", xp: 300 },
  { key: "sword_15", title: "검 +15 강화 성공", xp: 700 },
];
export const REPEAT = { chat: 2, post: 20, comment: 10 };
export const CHAT_DAILY_CAP = 60;
export function signupBonus(seq: number) { return seq <= 10 ? 300 : seq <= 30 ? 150 : seq <= 100 ? 80 : 30; }
