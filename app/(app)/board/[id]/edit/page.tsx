import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import EditPostForm from "@/components/EditPostForm";
export const metadata = { title: "글 수정" };
export const dynamic = "force-dynamic";
export default async function EditPost({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const { data: p } = await db().from("posts").select("id,title,body,category,author_id").eq("id", params.id).maybeSingle();
  if (!p) notFound(); const anon = p.category === "익명" || p.category === "썸", back = anon ? `/anon/${p.id}` : `/board/${p.id}`;
  if (p.author_id !== s.id && s.role !== "admin") return <div className="detail"><Link className="link" href={back}>← 글로</Link><div className="empty">내 글만 수정할 수 있어요.</div></div>;
  return <div className="detail"><Link className="link" href={back}>← 글로 돌아가기</Link><h2 style={{ margin: "8px 0 10px" }}>✏️ 글 수정</h2><EditPostForm id={p.id} title={p.title} body={p.body} back={back} /></div>;
}
