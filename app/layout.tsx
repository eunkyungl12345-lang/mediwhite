import VersionGuard from "@/components/VersionGuard";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = "https://mediwhite.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "메디화이트웹", template: "%s · 메디화이트웹" },
  description: "병원 직원들이 익명으로 알려주는 진짜 병원 정보 — 실수령 급여·내부 분위기·입사해야만 아는 리스크, 의료 채용공고까지",
  openGraph: { title: "메디화이트웹 — 입사 전에 알고 가는 병원 정보", description: "실수령 급여·내부 분위기·육아휴직 불이익 같은 입사해야만 알던 것, 병원 직원들이 익명으로 알려줘요", url: SITE, siteName: "메디화이트웹", type: "website", locale: "ko_KR", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "메디화이트웹" }] },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "메디화이트웹", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  twitter: { card: "summary_large_image", title: "메디화이트웹", description: "입사 전에 알고 가는 병원 정보", images: ["/og.jpg"] },
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
      <body>{children}<VersionGuard /></body>
    </html>
  );
}
