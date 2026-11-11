import type { NextRequest } from "next/server";
import { startOauth } from "@/lib/oauthCallback";

export const dynamic = "force-dynamic";

/** 카카오 로그인 시작: 카카오 인가 화면으로 보냅니다. */
export async function GET(req: NextRequest) {
  return startOauth(req, "kakao");
}
