import type { MetadataRoute } from "next";
import { db } from "@/lib/supabase";
export const revalidate = 3600;
const SITE = "https://mediwhite.vercel.app";
/** 🗺️ 사이트맵: 첫 화면 + 가입 + 소개 + 병원 공개 페이지 전부 (네이버 서치어드바이저·구글 서치콘솔에 등록) */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/login?mode=signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/pay`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/rules`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const { data } = await db().from("hospitals").select("id").order("id").limit(5000);
    return [...base, ...(data ?? []).map(h => ({ url: `${SITE}/h/${h.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 }))];
  } catch { return base; }
}
