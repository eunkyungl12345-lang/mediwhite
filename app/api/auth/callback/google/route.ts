import type { NextRequest } from "next/server";
import { handleOauthCallback } from "@/lib/oauthCallback";

export const dynamic = "force-dynamic";

/** 구글 콜백: 기존 회원이면 바로 로그인, 처음이면 직종 선택 퍼널로. */
export async function GET(req: NextRequest) {
  return handleOauthCallback(req, "google");
}
