import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { deptCommanders } from "@/lib/ranksvc";
import { display } from "@/lib/depts";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ items: [] }, { status: 401 });
  const [{ data: ev }, cmd] = await Promise.all([
    db().from("events").select("id,text,created_at").order("created_at", { ascending: false }).limit(8),
    deptCommanders(),
  ]);
  const items = [
    ...(ev ?? []).map(e => ({ id: "e" + e.id, text: "🎖️ " + e.text })),
    ...cmd.map(c => ({ id: "c" + c.dept, text: `👑 오늘의 [${c.dept}] 총사령관님은 "${display(c.dept, c.nickname)}"님입니다.` })),
  ];
  return NextResponse.json({ items });
}
