import Link from "next/link";
import AnonPostForm from "@/components/AnonPostForm";
import { ANON_TOPICS } from "@/lib/depts";
export const dynamic = "force-dynamic";
export default function AnonNew({ searchParams }: { searchParams: { topic?: string } }) {
  const topic = ANON_TOPICS.some(t => t.key === searchParams.topic) ? searchParams.topic! : "free";
  return <div className="detail"><Link className="link" href="/anon">← 익명 게시판</Link><h2 style={{ marginTop: 8 }}>🕶️ 익명으로 글쓰기</h2><AnonPostForm defaultTopic={topic} /></div>;
}
