import { redirect } from "next/navigation";
/** 🏆 자랑대회는 종료(메뉴에서 제거). 예전 링크는 병원 리뷰로 */
export default function Page() { redirect("/hospitals"); }
