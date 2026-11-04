"use client";
import { usePathname } from "next/navigation";
/** 특정 화면에서만 보여주기 (운세·시세 띠는 커뮤니티 쪽에서만 — 홈·병원·채용은 깔끔하게) */
export default function OnlyOn({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const p = usePathname(); return prefixes.some(x => p === x || p.startsWith(x + "/")) ? <>{children}</> : null;
}
