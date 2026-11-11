import type { NextRequest } from "next/server";
import { startOauth } from "@/lib/oauthCallback";

export const dynamic = "force-dynamic";

/** 네이버 로그인 시작: 네이버 로그인 화면으로 보냅니다. */
export async function GET(req: NextRequest) {
  return startOauth(req, "naver");
}
