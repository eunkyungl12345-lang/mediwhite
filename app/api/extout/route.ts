import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { EXT_JOBS, extUrl } from "@/lib/extJobs";
/** 외부 공고로 나가기 — 몇 번 눌렸는지 events(kind=extout)에 남기고 원문으로 */
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id")); const j = EXT_JOBS.find(x => x.id === id);
  if (!j) return NextResponse.redirect(new URL("/jobs/day", req.url));
  const s = await getSession().catch(() => null); await db().from("events").insert({ kind: "extout", user_id: s?.id ?? null, text: `${j.id}|${j.k}` }).then(() => {}, () => {});
  return NextResponse.redirect(extUrl(j.id));
}
