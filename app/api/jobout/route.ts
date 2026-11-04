import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { memoOnce } from "@/lib/memo";
/** 📄 원문 공고로 나가기 — 어떤 공고가 실제 지원까지 이어지는지 세려고 한 번 거쳐가요 */
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id")) || 0; const d = db();
  const { data: j } = await d.from("jobs").select("id,dept,region,contact,author:users!jobs_author_id_fkey(username)").eq("id", id).maybeSingle();
  const url = j?.contact && /^https?:\/\//.test(j.contact) ? j.contact : null;
  if (!url) return NextResponse.redirect(new URL(`/jobs/${id}`, req.url));
  const s = await getSession().catch(() => null);
  if (memoOnce(`jobout:${id}:${s?.id ?? "x"}`, 3600000)) await d.from("events").insert({ kind: "jobout", user_id: s?.id ?? null, text: `${j!.dept}|${j!.region}|${(j as any).author?.username === "mw_bot" ? "pub" : "member"}|${id}` }).then(() => {}, () => {});
  return NextResponse.redirect(url);
}
