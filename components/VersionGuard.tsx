"use client";
import { useEffect, useState } from "react";
/** 새 버전 배포 직후 열려 있던 화면이 옛 코드를 찾다 깨지면(튕김) 조용히 새로고침해요 */
export default function VersionGuard() {
  const [show, setShow] = useState(false), [fresh, setNew] = useState(false);
  useEffect(() => {
    const isSkew = (m: string) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Failed to find Server Action|Server Action .* not found|deployment/i.test(m);
    const go = () => { try { const k = "mw-reload-at", last = Number(sessionStorage.getItem(k) || 0); if (Date.now() - last < 20000) return; sessionStorage.setItem(k, String(Date.now())); } catch {} setShow(true); setTimeout(() => location.reload(), 1500); };
    const onErr = (e: ErrorEvent) => { if (isSkew(String(e.message || e.error?.message || ""))) go(); };
    const onRej = (e: PromiseRejectionEvent) => { if (isSkew(String(e.reason?.message || e.reason || ""))) go(); };
    window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onRej);
    // 새 배포 감지: 화면을 다시 볼 때(탭 복귀) 바뀌었으면 바로 새로고침, 보고 있는 중이면 안내만
    const mine = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA; let stale = false;
    const check = () => fetch("/api/public/version", { cache: "no-store" }).then(r => r.json()).then(({ v }) => { if (mine && v && v !== "dev" && v !== mine) { stale = true; setNew(true); } }).catch(() => {});
    const onVis = () => { if (document.visibilityState === "visible") { if (stale) location.reload(); else check(); } };
    const id = setInterval(check, 60000); document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onRej); clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  const st = { position: "fixed" as const, left: "50%", bottom: 90, transform: "translateX(-50%)", zIndex: 9999, display: "flex", gap: 8, alignItems: "center" };
  if (show) return <div className="ty-toast" style={st}>✨ 새 버전이 나와서 새로고침할게요 (진행 상황은 저장돼요)</div>;
  if (fresh) return <div className="ty-toast" style={st}>✨ 새 버전이 나왔어요 <button type="button" className="btn" style={{ padding: "4px 10px" }} onClick={() => { document.dispatchEvent(new Event("visibilitychange")); setTimeout(() => location.reload(), 300); }}>새로고침</button></div>;
  return null;
}
