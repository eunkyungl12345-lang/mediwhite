/** 서버 인스턴스 내 짧은 캐시 (요청 간 공유). 람다가 살아있는 동안 유지. */
const store = new Map<string, { v: any; exp: number }>();
export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key); const now = Date.now();
  if (hit && hit.exp > now) return hit.v as T;
  const v = await fn(); store.set(key, { v, exp: now + ttlMs }); return v;
}
export function memoOnce(key: string, ttlMs: number): boolean {
  const now = Date.now(); const hit = store.get(key); if (hit && hit.exp > now) return false; store.set(key, { v: 1, exp: now + ttlMs }); return true;
}
