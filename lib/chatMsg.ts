/** 💬 채팅 메시지 — 클라이언트로 나가는 모양. 실제 user_id(UUID)는 담지 않아요.
 *  내 메시지 여부(mine)·운영팀 여부(official)는 서버가 계산해 내려주고, 화면은 그 값만 씁니다. */
export type ChatMsg = {
  id: number;
  nickname: string;
  dept: string;
  text: string;
  created_at: string;
  rank?: string | null;
  /** 내가 쓴 메시지인가 (서버 계산) */
  mine?: boolean;
  /** 운영팀 표시 이름(운영팀·봇) — 서버 계산. 아니면 null */
  official?: string | null;
  /** 같은 사람끼리 묶어 보여줄 때만 쓰는 익명 키 (user_id 해시) */
  ak?: string | null;
  /** 보낸 사람이 붙인 임시 키 — 실시간으로 두 번 들어올 때 한 줄로 합치는 데만 씀 (랜덤값) */
  tmp?: string;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** 실시간 채널로 받은 payload → 안전한 메시지.
 *  남이 보낸 것뿐이라 mine은 항상 false로 두고, 아는 칸만 골라 담아요(모르는 필드는 버림). */
export function fromWire(p: any): ChatMsg {
  return {
    id: Number(p?.id) || 0,
    nickname: str(p?.nickname).slice(0, 40),
    dept: str(p?.dept).slice(0, 20),
    text: str(p?.text).slice(0, 500),
    created_at: str(p?.created_at) || new Date().toISOString(),
    rank: typeof p?.rank === "string" ? p.rank : null,
    official: typeof p?.official === "string" ? p.official : null,
    ak: typeof p?.ak === "string" ? p.ak : null,
    tmp: str(p?.tmp).slice(0, 40) || undefined,
    mine: false,
  };
}

/** 같은 사람이 2분 안에 이어서 쓴 메시지인지 (익명 키 비교) */
export function sameAuthor(prev: ChatMsg | undefined, m: ChatMsg): boolean {
  if (!prev || !prev.ak || !m.ak || prev.ak !== m.ak) return false;
  const a = new Date(prev.created_at).getTime(), b = new Date(m.created_at).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) < 120000;
}
