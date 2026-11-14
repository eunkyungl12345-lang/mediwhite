import { createHash } from "crypto";
/** 실체 체크 응답의 공개용 키 — 작성자 id가 화면에 드러나지 않게 해시 */
export const factPubKey = (uid: string, hid: number) => "f" + createHash("sha1").update(`${uid}:${hid}:mw`).digest("hex").slice(0, 12);
export const notePubKey = (uid: string, hid: number, sec: string) => "n" + createHash("sha1").update(`${uid}:${hid}:${sec}:note`).digest("hex").slice(0, 12);
/** 면접 후기 카드의 공개용 키 — 작성자 id를 React key·props로 내보내지 않게 해시 (사용자·병원당 후기 1개) */
export const ivPubKey = (uid: string, hid: number) => "v" + createHash("sha1").update(`${uid}:${hid}:iv`).digest("hex").slice(0, 12);
