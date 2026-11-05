/** 🏷️ 공고 '현장 정보' 태그 — 구인사이트엔 잘 없는, 의료직이 진짜 궁금한 것 (교대·신규·교육·기숙사)
 *  DB 컬럼 추가 없이 본문 첫 줄에 "#3교대 #신규가능" 형태로 저장해요. */
export const JOB_TAGS = [
  { id: "5시퇴근", g: "조건", label: "🕔 5시대 퇴근" }, { id: "나이트없음", g: "조건", label: "🌙 나이트·야간진료 없음" }, { id: "토요휴무", g: "조건", label: "📅 주5일(토요 휴무)" },
  { id: "인센티브", g: "조건", label: "💸 인센티브 있음" }, { id: "잡무없음", g: "조건", label: "🧹 본업만(잡무 없음)" }, { id: "OT수당", g: "조건", label: "⏱️ OT 수당 지급" },
  { id: "3교대", g: "근무" }, { id: "2교대", g: "근무" }, { id: "상근", g: "근무", label: "상근(데이)" }, { id: "나이트전담", g: "근무" }, { id: "주4일", g: "근무" },
  { id: "신규가능", g: "경력", label: "🐣 신규 가능" }, { id: "경력만", g: "경력" },
  { id: "프리셉터", g: "교육", label: "프리셉터 교육" }, { id: "기숙사", g: "생활", label: "🏠 기숙사" }, { id: "통근버스", g: "생활" }, { id: "주차지원", g: "생활" },
] as const;
export const SHARE_TAG = "공유"; // 단톡방·지인한테 받은 공고를 대신 올린 경우
export const tagLabel = (id: string) => (JOB_TAGS.find(t => t.id === id) as any)?.label ?? id;
const LINE = /^((?:#[^\s#]+\s*)+)\n?/;
export function splitTags(body: string | null | undefined): { tags: string[]; rest: string } {
  const b = body ?? ""; const m = b.match(LINE); if (!m) return { tags: [], rest: b };
  return { tags: m[1].trim().split(/\s+/).map(t => t.slice(1)).filter(Boolean), rest: b.slice(m[0].length).replace(/^\n+/, "") };
}
export const joinTags = (tags: string[], rest: string) => tags.length ? `${tags.map(t => "#" + t).join(" ")}\n${rest}` : rest;
/** 공공 공고 본문에서 자동으로 뽑기 */
export function guessTags(text: string): string[] {
  const t: string[] = [];
  if (/3\s*교대/.test(text)) t.push("3교대"); else if (/2\s*교대/.test(text)) t.push("2교대");
  if (/나이트\s*전담|야간\s*전담/.test(text)) t.push("나이트전담");
  if (/신규\s*(간호사|가능|졸업|채용)|경력\s*무관|경력\s*불문|졸업\s*예정/.test(text)) t.push("신규가능");
  if (/기숙사/.test(text)) t.push("기숙사"); if (/통근\s*버스|셔틀/.test(text)) t.push("통근버스");
  if (/프리셉터|신규\s*교육/.test(text)) t.push("프리셉터");
  return t;
}
/** 리스트 상단 빠른 필터 */
export const QUICK = [{ id: "5시퇴근", label: "🕔 5시대 퇴근" }, { id: "나이트없음", label: "🌙 나이트 없음" }, { id: "토요휴무", label: "📅 토요 휴무" }, { id: "인센티브", label: "💸 인센티브" }, { id: "잡무없음", label: "🧹 잡무 없음" }, { id: "신규가능", label: "🐣 신규 가능" }, { id: "상근", label: "☀️ 상근" }, { id: "3교대", label: "🌙 3교대" }] as const;
/** 💰 공고 '팩트' 줄 — 본문 맨 앞에 "실수령: …" 형식으로 저장 (실수령·인센·실제 퇴근·잡무) */
export const META = [{ k: "실수령", icon: "💰", label: "통장 실수령(월)" }, { k: "인센", icon: "💸", label: "인센티브 조건" }, { k: "실제퇴근", icon: "🕕", label: "실제 퇴근" }, { k: "잡무", icon: "🧹", label: "본업 외 업무" }] as const;
export function splitMeta(rest: string): { meta: Record<string, string>; text: string } {
  const meta: Record<string, string> = {}; const lines = rest.split("\n"); let i = 0;
  for (; i < lines.length; i++) { const m = lines[i].match(/^\[(실수령|인센|실제퇴근|잡무)\]\s*(.+)$/); if (!m) break; meta[m[1]] = m[2].trim(); }
  return { meta, text: lines.slice(i).join("\n").replace(/^\n+/, "") };
}
export const joinMeta = (meta: Record<string, string>, text: string) => { const ls = META.filter(m => meta[m.k]).map(m => `[${m.k}] ${meta[m.k]}`); return ls.length ? `${ls.join("\n")}\n${text}` : text; };
