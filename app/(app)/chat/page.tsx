import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import ChatRoom from "@/components/ChatRoom";
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const s = (await getSession())!;
  const { data } = await db().from("messages").select("id,nickname,dept,text,created_at,user_id,rank").order("created_at", { ascending: false }).limit(120);
  return <ChatRoom me={s} initial={(data ?? []).reverse()} />;
}
