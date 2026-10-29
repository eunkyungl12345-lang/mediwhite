import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginPage from "./login/page";
export const dynamic = "force-dynamic";
// 첫 주소(/)는 리다이렉트 없이 바로 로그인 화면을 그려요 (카톡·문자 미리보기 로봇이 OG 태그를 읽을 수 있게)
export default async function Home({ searchParams }: { searchParams: { ref?: string } }) {
  if (await getSession()) redirect("/home");
  return <LoginPage searchParams={searchParams} />;
}
