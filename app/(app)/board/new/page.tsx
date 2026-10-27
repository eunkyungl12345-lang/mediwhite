import NewPostForm from "@/components/NewPostForm";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT, DEPTS } from "@/lib/depts";
import { myRank } from "@/lib/ranksvc";
import { can } from "@/lib/ranks";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function NewPost({ searchParams }: { searchParams: { cat?: string; tab?: string } }) {
  const s = (await getSession())!;
  const canNotice = s.role === "admin" || can(await myRank(s.id), "준장");
  let def = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : ((DEPTS as readonly string[]).includes(s.dept) ? s.dept : (canNotice ? NOTICE_CAT : DEPTS[0]));
  if (def === NOTICE_CAT && !canNotice) def = s.dept;
  const { data: boards } = await db().from("boards").select("id,name,dept").in("dept", DEPTS as unknown as string[]).order("created_at");
  return <NewPostForm defaultCat={def} defaultTab={searchParams.tab || ""} canNotice={canNotice} boards={boards ?? []} />;
}
