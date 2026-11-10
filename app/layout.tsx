import VersionGuard from "@/components/VersionGuard";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = "https://mediwhite.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "메디화이트 — 강남 3구 병원 실수령액 & 분위기 팩트체크", template: "%s · 메디화이트" },
  applicationName: "메디화이트",
  keywords: ["메디화이트", "메디화이트웹", "MediWhite", "병원 리뷰", "병원 실수령", "간호사 연봉", "방사선사 연봉", "물리치료사 연봉", "임상병리사", "간호조무사", "병원 채용", "강남 병원", "서초 병원", "송파 병원", "병원 직원 커뮤니티"],
  alternates: { canonical: "/" },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFY || undefined, other: process.env.NEXT_PUBLIC_NAVER_VERIFY ? { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFY } : undefined },
  description: "병원 직원들이 익명으로 알려주는 진짜 병원 정보 — 실수령 급여·내부 분위기·입사해야만 아는 리스크, 의료 채용공고까지",
  openGraph: { title: "메디화이트 — 강남 3구 병원 실수령액 & 분위기 팩트체크", description: "입사하기 전에 원장 성향과 실제 퇴근 시간 확인하고 가세요. 병원 직원들이 익명으로 알려줘요", url: SITE, siteName: "메디화이트", type: "website", locale: "ko_KR", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "메디화이트" }] },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "메디화이트", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  twitter: { card: "summary_large_image", title: "메디화이트", description: "강남 3구 병원 실수령액 & 분위기 팩트체크", images: ["/og.jpg"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2C6B5E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" />
      </head>
      <body>{children}<VersionGuard /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "메디화이트", alternateName: ["메디화이트웹", "MediWhite"], url: SITE, description: "강남 3구 병원 실제 실수령액 & 분위기 팩트체크 — 병원 직원 익명 커뮤니티", potentialAction: { "@type": "SearchAction", target: `${SITE}/?q={q}`, "query-input": "required name=q" } }) }} /></body>
    </html>
  );
}
