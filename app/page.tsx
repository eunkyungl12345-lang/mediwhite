import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginPage from "./login/page";
import PublicHome from "@/components/PublicHome";
export const dynamic = "force-dynamic";
// 첫 주소(/)는 로그인 없이 보는 공고·병원 검색 홈. 추천 링크(?ref=)로 오면 바로 가입 화면
export default async function Home({ searchParams }: { searchParams: { ref?: string; q?: string; c?: string; k?: string } }) {
  if (await getSession()) redirect("/home");
  if (searchParams.ref) return <LoginPage searchParams={searchParams} />;
  return <PublicHome q={searchParams.q} c={searchParams.c} k={searchParams.k} />;
}
