import Link from "next/link";
export const metadata = { title: "페이지를 찾을 수 없어요" };
/** 🧭 404 — 주소가 틀렸거나 지워진 글. 홈·채용·병원 리뷰로 바로 갈 수 있게 */
export default function NotFound() {
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card nf">
      <h1><Link href="/" style={{ color: "inherit", textDecoration: "none" }}>메디화이트웹</Link></h1>
      <div style={{ fontSize: 44, lineHeight: 1 }}>🩻</div>
      <b style={{ fontSize: 17 }}>이 페이지는 촬영 범위 밖이에요</b>
      <div className="muted">주소가 틀렸거나, 글이 삭제됐거나, 아직 준비 중인 메뉴예요.</div>
      <div className="nf-links">
        <Link className="btn" href="/home">홈으로</Link>
        <Link className="btn ghost" href="/hospitals">병원 리뷰</Link>
        <Link className="btn ghost" href="/jobs">채용</Link>
      </div>
    </div></main></div></div>
  );
}
