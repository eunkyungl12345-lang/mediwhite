import VersionGuard from "@/components/VersionGuard";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = "https://mediwhite.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "메디화이트 — 이직 전에 그 병원 실수령 확인하는 곳", template: "%s · 메디화이트" },
  applicationName: "메디화이트",
  keywords: ["메디화이트", "메디화이트웹", "MediWhite", "병원 리뷰", "병원 실수령", "간호사 연봉", "방사선사 연봉", "물리치료사 연봉", "임상병리사", "간호조무사", "병원 채용", "강남 병원", "서초 병원", "송파 병원", "병원 직원 커뮤니티"],
  alternates: { canonical: "/" },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFY || undefined, other: process.env.NEXT_PUBLIC_NAVER_VERIFY ? { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFY } : undefined },
  description: "이직 전에 그 병원 실수령 확인하는 곳. 다녀본 병원 직원들이 익명으로 알려주는 통장 실수령·원장 성향·실제 퇴근 시간",
  openGraph: { title: "메디화이트 — 이직 전에 그 병원 실수령 확인하는 곳", description: "다녀본 직원이 알려주는 통장 실수령·원장 성향·실제 퇴근 시간. 입사하기 전에 확인하고 가세요", url: SITE, siteName: "메디화이트", type: "website", locale: "ko_KR", images: [{ url: "/api/public/og", width: 1200, height: 630, alt: "메디화이트 — 병원 이직 전 팩트체크" }] },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "메디화이트", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  twitter: { card: "summary_large_image", title: "메디화이트", description: "이직 전에 그 병원 실수령 확인하는 곳", images: ["/api/public/og"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1FA97A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}<VersionGuard /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "메디화이트", alternateName: ["메디화이트웹", "MediWhite"], url: SITE, description: "이직 전에 그 병원 실수령 확인하는 곳 — 병원 직원 익명 커뮤니티", potentialAction: { "@type": "SearchAction", target: `${SITE}/?q={q}`, "query-input": "required name=q" } }) }} /></body>
    </html>
  );
}
