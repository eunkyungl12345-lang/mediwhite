import { redirect } from "next/navigation";
export const metadata = { title: "실시간 채팅" };
export default function ChatPage() { redirect("/board"); }
