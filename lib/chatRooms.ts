/** 키워드별 채팅방 (서버·클라이언트 공용) */
export type ChatRoomDef = { key: string; name: string; icon: string };
export const FIXED_ROOMS: ChatRoomDef[] = [
  { key: "all", name: "전체", icon: "💬" },
  { key: "night", name: "야간근무", icon: "🌙" },
  { key: "job", name: "이직·연봉", icon: "💼" },
  { key: "ssum", name: "썸", icon: "💘" },
  { key: "game", name: "게임", icon: "🎮" },
];
export const deptRoom = (dept: string): ChatRoomDef => ({ key: `dept:${dept}`, name: dept, icon: "🏷️" });
export const roomsFor = (dept: string): ChatRoomDef[] => [FIXED_ROOMS[0], deptRoom(dept), ...FIXED_ROOMS.slice(1)];
export const validRoom = (room: string, dept: string) => room === `dept:${dept}` || FIXED_ROOMS.some(r => r.key === room);
