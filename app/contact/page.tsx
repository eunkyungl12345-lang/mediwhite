import Link from "next/link";
import { getSession } from "@/lib/auth";
import { contactEmail } from "@/lib/support";
import InquiryForm from "@/components/InquiryForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "문의" };
export default async function ContactPage() {
  const [s, email] = await Promise.all([getSession(), contactEmail()]);
  return (
    <div className="app"><main><div className="auth form" style={{ maxWidth: 520, marginTop: 24 }}>
      <Link className="link" href={s ? "/board" : "/"}>← {s ? "게시판으로" : "메디화이트웹"}</Link>
      <h1>협업 · 광고 · 문의</h1>
      <div className="muted">병원 직원 커뮤니티 메디화이트웹에 광고·제휴·구인공고 노출을 원하시거나, 사용 중 불편한 점이 있으면 남겨주세요. 이메일로도 받아요: <b>{email || "준비 중"}</b></div>
      <InquiryForm defaultName={s?.nickname ?? ""} />
    </div></main></div>
  );
}
