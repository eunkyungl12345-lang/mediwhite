"use client";
import { useEffect } from "react";
/** 화면이 깨졌을 때: 새 버전 배포 직후라면 한 번 자동 새로고침, 아니면 다시 시도 버튼 */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    try { const k = "mw-err-reload", last = Number(sessionStorage.getItem(k) || 0); if (Date.now() - last > 30000) { sessionStorage.setItem(k, String(Date.now())); setTimeout(() => location.reload(), 600); } } catch {}
  }, [error]);
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
        <div style={{ fontSize: 40 }}>🩹</div>
        <b>화면을 다시 불러오는 중이에요</b>
        <div className="muted" style={{ fontSize: 13 }}>새 버전이 올라가는 중이었거나 잠깐 문제가 생겼어요. 진행 상황은 저장돼 있어요.</div>
        <button type="button" className="btn" onClick={() => { reset(); location.reload(); }}>새로고침</button>
        <a className="link" href="/home">홈으로</a>
      </div>
    </div>
  );
}
