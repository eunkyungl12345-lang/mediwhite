"use client";
import { useEffect, useState } from "react";
import { savePushSub } from "@/lib/actions";

function b64ToU8(b64: string) { const pad = "=".repeat((4 - b64.length % 4) % 4); const s = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/"); const raw = atob(s); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }

export default function PushSetup({ vapidPublic }: { vapidPublic: string }) {
  const [state, setState] = useState<"unsupported" | "ios-install" | "ask" | "on" | "denied" | "loading">("loading");
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent); const standalone = (navigator as any).standalone === true || matchMedia("(display-mode: standalone)").matches;
      setState(ios && !standalone ? "ios-install" : "unsupported"); return;
    }
    navigator.serviceWorker.register("/sw.js").then(async reg => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) { setState("on"); savePushSub(JSON.parse(JSON.stringify(sub))).catch(() => {}); }
      else setState(Notification.permission === "denied" ? "denied" : "ask");
    }).catch(() => setState("unsupported"));
  }, []);
  async function enable() {
    try {
      const perm = await Notification.requestPermission(); if (perm !== "granted") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(vapidPublic) });
      await savePushSub(JSON.parse(JSON.stringify(sub))); setState("on");
    } catch { setState("unsupported"); }
  }
  if (state === "loading" || state === "unsupported" || state === "on") return null;
  if (state === "ios-install") return <div className="pushbar">📲 아이폰은 Safari 공유 버튼 → <b>홈 화면에 추가</b> 후 열면 알림을 받을 수 있어요.</div>;
  if (state === "denied") return null;
  return <div className="pushbar">🔔 댓글·호출·진급 알림을 폰으로 받을래요? <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: 13 }} onClick={enable}>알림 켜기</button></div>;
}
