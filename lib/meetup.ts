export const MEET_KINDS = [
  { key: "coffeechat", name: "커피챗", icon: "🥇", badge: true },
  { key: "coffee", name: "커피", icon: "☕" }, { key: "meal", name: "밥", icon: "🍚" }, { key: "drink", name: "술 한잔", icon: "🍻" }, { key: "walk", name: "산책·운동", icon: "🏃" },
  { key: "study", name: "스터디", icon: "📚" }, { key: "hobby", name: "취미·문화", icon: "🎬" }, { key: "trip", name: "나들이", icon: "🚗" }, { key: "etc", name: "기타", icon: "✨" },
] as const satisfies readonly { key: string; name: string; icon: string; badge?: boolean }[];
/** 골드뱃지(신분+면허 인증)만 열 수 있는 종류 */
export const needsBadge = (k: string) => k === "coffeechat";
export const MEET_AREAS = ["서울", "경기 남부", "경기 북부", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충청", "전라", "경상", "제주", "온라인"] as const;
export const kindOf = (k: string) => MEET_KINDS.find(x => x.key === k) ?? MEET_KINDS[MEET_KINDS.length - 1];
/** 모임 시간 표시: 오늘/내일/요일 + 시각 */
export function whenLabel(iso: string) {
  const t = new Date(iso), now = new Date(); const k = (d: Date) => new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10);
  const dd = Math.round((Date.parse(k(t)) - Date.parse(k(now))) / 86400000);
  const hm = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(t);
  const day = dd === 0 ? "오늘" : dd === 1 ? "내일" : dd === 2 ? "모레" : new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" }).format(t);
  return `${day} ${hm}`;
}
