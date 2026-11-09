import RestRoom from "@/components/RestRoom";
export const metadata = { title: "당직실" };
export const dynamic = "force-dynamic";
export default function RestPage() {
  return <div className="news"><RestRoom /></div>;
}
