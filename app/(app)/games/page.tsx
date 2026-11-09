import { redirect } from "next/navigation";
/** 🎮 게임은 정리했어요 (코드는 GitHub 브랜치 archive/games-2026-11에 보관). 예전 링크는 당직실로 */
export const metadata = { title: "미니게임" };
export default function GamesGone() { redirect("/rest"); }
