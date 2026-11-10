import type { MetadataRoute } from "next";
/** 🔎 검색엔진: 공개 화면(첫 화면·병원 공개 페이지·소개·규칙)만 수집, 회원 화면·API는 제외 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/h/", "/about", "/rules", "/contact", "/login", "/pay"], disallow: ["/api/", "/admin", "/my", "/noti", "/chat"] }],
    sitemap: "https://mediwhite.vercel.app/sitemap.xml",
    host: "https://mediwhite.vercel.app",
  };
}
