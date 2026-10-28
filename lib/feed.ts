import { db } from "@/lib/supabase";
/** 게임 활동 소식: 모두의 화면 위쪽에 잠깐 떠요 (테스트 계정 제외) */
export async function gameEvent(text: string) {
  if (/zz_/.test(text)) return;
  await db().from("events").insert({ kind: "game", text: `${text}|` }).then(() => {}, () => {});
}
