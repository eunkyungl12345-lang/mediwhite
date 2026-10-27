import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ events: [] }, { status: 401 });
  const { data } = await db().from("events").select("id,text,created_at").in("kind", ["promotion", "support"]).order("created_at", { ascending: false }).limit(10);
  const events = (data ?? []).map(e => { const [text, rank] = e.text.split("|"); return { id: e.id, text, rank: rank != null && rank !== "" ? Number(rank) : null, created_at: e.created_at }; });
  return NextResponse.json({ events });
}
