import { createHash } from "crypto";
/** 실체 체크 응답의 공개용 키 — 작성자 id가 화면에 드러나지 않게 해시 */
export const factPubKey = (uid: string, hid: number) => "f" + createHash("sha1").update(`${uid}:${hid}:mw`).digest("hex").slice(0, 12);
