import Link from "next/link";
import TakedownPublic from "@/components/TakedownPublic";
export const metadata = { title: "게시중단·반론 요청 · 메디화이트", description: "메디화이트 게시물로 권리를 침해받았다면 회원가입 없이 게시중단(임시조치)이나 반론을 요청할 수 있어요." };
/** 🏥 게시중단·반론 요청 — 비회원(병원 관계자·당사자)도 바로 접수. 정보통신망법 제44조의2 임시조치 절차 */
export default function TakedownPage({ searchParams }: { searchParams: { h?: string; u?: string } }) {
  return <main className="app legal td-page" style={{ padding: "24px 16px 60px" }}>
    <Link href="/" className="link">← 메디화이트</Link>
    <h1>게시중단·반론 요청</h1>
    <p>메디화이트의 글 때문에 명예나 권리를 침해받았다면, 회원가입 없이 여기서 요청할 수 있어요. 병원 관계자, 글에 언급된 당사자 누구나 가능해요.</p>
    <ol className="td-steps">
      <li><b>접수</b><span>요청이 들어오면 운영팀에 바로 알림이 가요.</span></li>
      <li><b>검토 (영업일 3일 안)</b><span>요청 내용과 글을 함께 확인해요.</span></li>
      <li><b>임시조치 (최대 30일)</b><span>권리침해가 소명되거나 판단이 어려우면 글을 30일까지 가려요.</span></li>
      <li><b>작성자 소명</b><span>글쓴이에게도 사실이라는 근거를 낼 기회를 줘요.</span></li>
      <li><b>결과 회신</b><span>복원·삭제·반려 중 결과를 적어주신 연락처로 알려드려요.</span></li>
    </ol>
    <div className="card"><TakedownPublic hname={searchParams.h?.slice(0, 60)} url={searchParams.u?.slice(0, 300)} /></div>
    <p className="muted" style={{ fontSize: 13 }}>메디화이트는 글을 직접 쓰거나 고치지 않고, 회원들이 직접 경험한 사실을 올리는 공간이에요. 운영팀도 남의 글은 수정할 수 없고, 신고·요청에 따라 가리거나 삭제만 해요. 법적 근거: 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제44조의2(정보의 삭제요청 등).</p>
    <p style={{ fontSize: 13 }}><Link href="/rules" className="link">이용규칙</Link> · <Link href="/terms" className="link">이용약관</Link> · <Link href="/privacy" className="link">개인정보처리방침</Link></p>
  </main>;
}
