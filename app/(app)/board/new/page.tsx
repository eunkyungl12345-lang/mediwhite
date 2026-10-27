import NewPostForm from "@/components/NewPostForm";
import { getSession } from "@/lib/auth";
import { CATS, NOTICE_CAT } from "@/lib/depts";
import { myRank } from "@/lib/ranksvc";
import { can } from "@/lib/ranks";
export default async function NewPost({ searchParams }: { searchParams: { cat?: string } }) {
  const s = (await getSession())!;
  const canNotice = s.role === "admin" || can(await myRank(s.id), "준장");
  let def = searchParams.cat && (CATS as readonly string[]).includes(searchParams.cat) ? searchParams.cat : s.dept;
  if (def === NOTICE_CAT && !canNotice) def = s.dept;
  return <NewPostForm defaultCat={def} canNotice={canNotice} />;
}
