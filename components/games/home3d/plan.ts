/** 내 집 3D — 집마다 평면도(방 배치). 단위 m. 방 key ↔ 가구 슬롯 배치 */
import { HOMES } from "@/lib/tycoon";
export type Room = { key: string; name: string; x: number; z: number; w: number; d: number; kind: "living" | "kitchen" | "bed" | "bath" | "study" | "dress" | "cinema" | "spa" | "garage" | "util" | "hall" };
export type Plan = { rooms: Room[]; W: number; D: number; label: string; floors?: number };
/** 슬롯이 놓이는 방 */
export const SLOT_ROOM: Record<string, Room["kind"]> = { sofa: "living", tv: "living", light: "living", plant: "living", art: "living", sculpt: "living", table: "kitchen", fridge: "kitchen", bed: "bed", bath: "bath", washer: "util", desk: "study", car: "garage" };
/** 방 안에서 슬롯 위치 (방 크기 비율) */
export const SLOT_POS: Record<string, [number, number, number]> = { sofa: [.5, .62, 0], tv: [.5, .08, 0], light: [.5, .5, 0], plant: [.9, .12, 0], art: [.18, .04, 0], sculpt: [.1, .85, 0], table: [.5, .55, 0], fridge: [.85, .12, 0], bed: [.5, .3, 0], bath: [.5, .35, 0], washer: [.35, .25, 0], desk: [.5, .15, 0], car: [.5, .5, 0] };

const r = (key: string, name: string, kind: Room["kind"], x: number, z: number, w: number, d: number): Room => ({ key, name, kind, x, z, w, d });
/** 집 등급별 평면도 (0 고시원 ~ 큰 저택). 우주 집은 큰 저택 평면 + 우주 뷰 */
export function planOf(home: number): Plan {
  const h = HOMES[home]; const big = home >= 7, huge = home >= 10 || !!h.space;
  if (home === 0) return { label: "고시원 1.5평 · 방1", W: 3, D: 2.6, rooms: [r("living", "방", "bed", 0, 0, 3, 2.6)] };
  if (home === 1) return { label: "원룸 8평 · 방1 화1", W: 5.5, D: 4.2, rooms: [r("living", "원룸", "living", 0, 0, 3.7, 4.2), r("bath", "욕실", "bath", 3.7, 0, 1.8, 1.9), r("kitchen", "주방", "kitchen", 3.7, 1.9, 1.8, 2.3)] };
  if (home === 2) return { label: "오피스텔 14평 · 거실1 방1 화1", W: 7.5, D: 5.5, rooms: [r("living", "거실", "living", 0, 0, 4.3, 5.5), r("bed", "침실", "bed", 4.3, 0, 3.2, 3.2), r("bath", "욕실", "bath", 4.3, 3.2, 1.6, 2.3), r("kitchen", "주방", "kitchen", 5.9, 3.2, 1.6, 2.3)] };
  if (home === 3) return { label: "24평 · 방2 거실1 화1", W: 9, D: 7, rooms: [r("living", "거실", "living", 0, 2.4, 5, 4.6), r("kitchen", "주방", "kitchen", 0, 0, 3, 2.4), r("util", "다용도실", "util", 3, 0, 2, 2.4), r("bed", "안방", "bed", 5, 3.4, 4, 3.6), r("bed2", "작은방", "bed", 5, 0, 2.4, 3.4), r("bath", "욕실", "bath", 7.4, 0, 1.6, 3.4)] };
  if (!big) return { label: "34평 · 방3 거실1 화2", W: 11, D: 8, rooms: [r("living", "거실", "living", 0, 3, 5.6, 5), r("kitchen", "주방·식당", "kitchen", 0, 0, 3.6, 3), r("util", "다용도실", "util", 3.6, 0, 2, 3), r("bed", "안방", "bed", 5.6, 4, 3.6, 4), r("bath", "안방 욕실", "bath", 9.2, 4, 1.8, 4), r("bed2", "침실2", "bed", 5.6, 0, 2.7, 4), r("bed3", "침실3", "bed", 8.3, 0, 2.7, 4)] };
  if (!huge) return { label: "60평 · 방4 거실1 화2 서재1", W: 14, D: 10, rooms: [r("living", "거실", "living", 0, 4, 7, 6), r("kitchen", "주방·다이닝", "kitchen", 0, 0, 4.5, 4), r("util", "다용도실", "util", 4.5, 0, 2.5, 4), r("bed", "안방", "bed", 7, 5.5, 4.5, 4.5), r("dress", "드레스룸", "dress", 11.5, 5.5, 2.5, 4.5), r("bath", "안방 욕실", "bath", 11.5, 3, 2.5, 2.5), r("study", "서재", "study", 7, 0, 3.5, 3), r("bed2", "침실2", "bed", 10.5, 0, 3.5, 3), r("bed3", "침실3", "bed", 7, 3, 4.5, 2.5)] };
  return { label: (h.space ? `${h.area} · ` : "") + "120평 · 방5 거실1 화3 서재 홈시네마 스파 차고", W: 23, D: 13, rooms: [r("hall", "현관홀", "hall", 0, 10, 4, 3), r("living", "거실", "living", 4, 6, 8, 7), r("kitchen", "주방·다이닝", "kitchen", 0, 4, 4, 6), r("util", "다용도실", "util", 0, 0, 4, 4), r("cinema", "홈시네마", "cinema", 4, 0, 4, 6), r("study", "서재", "study", 8, 0, 4, 6), r("bed", "안방", "bed", 12, 8, 6, 5), r("dress", "드레스룸", "dress", 12, 5, 3, 3), r("bath", "안방 욕실", "bath", 15, 5, 3, 3), r("spa", "스파", "spa", 12, 0, 3, 5), r("bed2", "게스트룸", "bed", 15, 0, 3, 5), r("garage", "차고", "garage", 18, 0, 5, 13)] };
}
export const roomCenter = (rm: Room) => ({ x: rm.x + rm.w / 2, z: rm.z + rm.d / 2 });
export const roomOf = (plan: Plan, x: number, z: number) => plan.rooms.find(rm => x >= rm.x && x <= rm.x + rm.w && z >= rm.z && z <= rm.z + rm.d);
/** 슬롯이 놓일 방 (첫 번째 해당 종류 방) */
export const roomForSlot = (plan: Plan, slot: string) => plan.rooms.find(rm => rm.kind === SLOT_ROOM[slot]) ?? (SLOT_ROOM[slot] === "util" || SLOT_ROOM[slot] === "study" ? plan.rooms.find(rm => rm.kind === "kitchen") ?? plan.rooms[0] : plan.rooms[0]);
