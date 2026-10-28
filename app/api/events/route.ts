import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ events: [] }, { status: 401 });
  const [{ data }, { data: mine }] = await Promise.all([
    db().from("events").select("id,kind,text,created_at").in("kind", ["promotion", "support", "game"]).order("created_at", { ascending: false }).limit(10),
    db().from("events").select("id,text,created_at").eq("kind", "quest").eq("user_id", s.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const events = (data ?? []).map(e => { const [text, rank] = e.text.split("|"); return { id: e.id, kind: (e as any).kind === "game" ? "game" : "promotion", text, rank: rank != null && rank !== "" ? Number(rank) : null, created_at: e.created_at }; });
  const quests = (mine ?? []).map(e => { const [title, xp, key] = e.text.split("|"); return { id: e.id, kind: "quest", title, xp: Number(xp), key, created_at: e.created_at }; });
  return NextResponse.json({ events, quests });
}
