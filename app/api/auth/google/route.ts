import type { NextRequest } from "next/server";
import { startOauth } from "@/lib/oauthCallback";

export const dynamic = "force-dynamic";

/** 구글 로그인 시작: 구글 계정 선택 화면으로 보냅니다. */
export async function GET(req: NextRequest) {
  return startOauth(req, "google");
}
