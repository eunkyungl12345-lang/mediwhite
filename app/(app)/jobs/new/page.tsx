import Link from "next/link";
import { getSession } from "@/lib/auth";
import JobForm from "@/components/jobs/JobForm";
export default async function NewJobPage() {
  const s = (await getSession())!;
  return <div className="detail"><Link className="link" href="/jobs">← 채용</Link><h2>💼 채용공고 올리기</h2><div className="card"><JobForm dept={s.dept} /></div></div>;
}
