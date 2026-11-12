import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/supabase";
export const runtime = "nodejs";
export const revalidate = 3600;
/** 🖼️ 링크 미리보기 카드(1200×630) — 밝은 오프화이트 + 에메랄드. ?h=병원id면 그 병원 이름으로.
 *  글꼴은 Pretendard(OFL) 서브셋을 저장소에 넣어 써요. 이모지는 그림 글꼴이 없어서 도형으로 대신해요 */
let fonts: { b: Buffer; s: Buffer } | null = null;
async function loadFonts() { if (fonts) return fonts; const dir = path.join(process.cwd(), "assets/fonts"); const [b, s] = await Promise.all([readFile(path.join(dir, "Pretendard-ExtraBold.subset.woff")), readFile(path.join(dir, "Pretendard-SemiBold.subset.woff"))]); return (fonts = { b, s }); }
export async function GET(req: Request) {
  const hid = Number(new URL(req.url).searchParams.get("h")) || 0; let name = "";
  if (hid) { const { data } = await db().from("hospitals").select("name").eq("id", hid).maybeSingle(); name = String(data?.name ?? "").slice(0, 22); }
  const f = await loadFonts(), E = "#1FA97A", D = "#0B5E49";
  const title = name ? [name, "이직 전 팩트체크"] : ["병원 이직 전,", "공고 뒤 실체를 확인하세요"];
  const big = name && name.length > 11 ? 64 : 76;
  const pill = (t: string, c: string) => <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderRadius: 999, background: "#fff", border: "2px solid #DCEFE7", fontSize: 30, color: "#24302C" }}><div style={{ width: 14, height: 14, borderRadius: 999, background: c }} />{t}</div>;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#F8FAF9", fontFamily: "Pretendard", padding: 28 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 64px", borderRadius: 36, background: "linear-gradient(150deg,#FFFFFF 0%,#F2FBF7 55%,#E3F6EE 100%)", border: `4px solid ${E}`, boxShadow: "0 10px 40px rgba(31,169,122,.15)" }}>
        <div style={{ display: "flex" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, background: "#E8F7F2", color: D, fontSize: 28, fontWeight: 600 }}>
          <div style={{ width: 26, height: 30, background: E, borderRadius: "6px 6px 14px 14px" }} />익명 재직자 팩트 데이터</div></div>
        <div style={{ display: "flex", flexDirection: "column", fontWeight: 800, color: "#14201C", letterSpacing: "-0.03em", lineHeight: 1.18 }}>
          <div style={{ fontSize: big, color: name ? E : "#14201C" }}>{title[0]}</div><div style={{ fontSize: big }}>{title[1]}</div></div>
        <div style={{ display: "flex", gap: 14 }}>{pill("세후 실수령", "#E3A21A")}{pill("실제 퇴근시간", "#2F6FD0")}{pill("정규직 전환율", E)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600, color: "#52605B" }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: E, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 24, height: 24, display: "flex" }}><div style={{ position: "absolute", left: 8, top: 0, width: 8, height: 24, background: "#fff", borderRadius: 2 }} /><div style={{ position: "absolute", left: 0, top: 8, width: 24, height: 8, background: "#fff", borderRadius: 2 }} /></div></div>
          <span style={{ fontWeight: 800, color: "#14201C" }}>메디화이트</span><span>·  mediwhite.vercel.app</span></div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: "Pretendard", data: f.s, weight: 600, style: "normal" }, { name: "Pretendard", data: f.b, weight: 800, style: "normal" }], headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
