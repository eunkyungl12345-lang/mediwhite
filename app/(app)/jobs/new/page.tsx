import Link from "next/link";
import { getSession } from "@/lib/auth";
import JobForm from "@/components/jobs/JobForm";
export default async function NewJobPage({ searchParams }: { searchParams: { tip?: string } }) {
  const tip = searchParams.tip === "1";
  const s = (await getSession())!;
  return <div className="detail"><Link className="link" href="/jobs">← 채용</Link><h2>{tip ? "📢 숨은 공고 제보하기" : "💼 채용공고 올리기"}</h2><div className="card"><JobForm dept={s.dept} tip={tip} /></div></div>;
}
