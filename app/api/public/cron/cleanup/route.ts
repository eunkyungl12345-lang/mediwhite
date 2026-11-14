import { NextResponse } from "next/server";
import { purgeOldVerifyPhotos, purgeOldTakedowns } from "@/lib/purge";
export const dynamic = "force-dynamic";
/** ⏰ Vercel Cron(매일 03:00 KST)이 불러요. CRON_SECRET이 설정돼 있으면 그 값으로만 실행돼요. 지우는 건 30일 지난 대기 사진뿐이라 여러 번 불려도 안전해요 */
export async function GET(req: Request) {
  const sec = process.env.CRON_SECRET; if (sec && req.headers.get("authorization") !== `Bearer ${sec}`) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await purgeOldVerifyPhotos(); const takedown = await purgeOldTakedowns().catch(() => -1); return NextResponse.json({ ok: true, ...r, takedown });
}
