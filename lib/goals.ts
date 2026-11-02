/** 오늘의 목표 1개 — 내 최고 기록 바로 위 단계. 달성 여부는 기기(localStorage)에 날짜별로 저장 */
export const kstDay = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
export function todayGoal(game: string, ladder: number[], best: number) { const g = ladder.find(v => v > best * .99) ?? ladder[ladder.length - 1]; return g; }
export function goalDone(game: string) { try { return localStorage.getItem(`mw-goal-${game}`) === kstDay(); } catch { return false; } }
export function markGoal(game: string) { try { localStorage.setItem(`mw-goal-${game}`, kstDay()); } catch {} }
