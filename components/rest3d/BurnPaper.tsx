"use client";
import { useEffect, useRef, useState } from "react";
/** 🔥 걱정 태우기 — 내가 쓴 글이 종이에 적혀서, 모닥불처럼 아래부터 타들어가 재와 불씨가 되어 날아가요.
 *  내용은 어디에도 저장되지 않아요. 다 타면 응원 한마디. */
const CHEER = [
  "걱정은 재가 됐어요. 오늘 버틴 당신, 정말 잘했어요.",
  "다 타버렸어요. 이제 그 무게는 내려놓아도 돼요.",
  "불씨처럼 가볍게. 내일의 나는 오늘보다 조금 더 괜찮을 거예요.",
  "힘든 걸 꺼내 적은 것만으로도 이미 한 걸음 나아간 거예요.",
  "오늘도 누군가를 돌본 손, 이제 나를 돌볼 차례예요.",
  "이 걱정보다 당신이 훨씬 커요. 수고했어요.",
];
type Ember = { x: number; y: number; vx: number; vy: number; life: number; r: number; hue: number };
export default function BurnPaper({ text, onDone, onSound }: { text: string; onDone: () => void; onSound?: (k: "ignite" | "crackle") => void }) {
  const cv = useRef<HTMLCanvasElement>(null); const [phase, setPhase] = useState<"show" | "burn" | "done">("show"); const [cheer] = useState(() => CHEER[Math.floor(Math.random() * CHEER.length)]);
  useEffect(() => {
    const c = cv.current!, x = c.getContext("2d")!; const dpr = Math.min(2, devicePixelRatio || 1);
    const top = 120; const W0 = Math.min(innerWidth - 40, 360), H = Math.round(Math.min(W0 * 1.2, innerHeight - top - 230)), W = Math.min(W0, Math.round(H / 1.05)); c.width = W * dpr; c.height = (H + top + 20) * dpr; c.style.width = W + "px"; c.style.height = H + top + 20 + "px"; x.setTransform(dpr, 0, 0, dpr, 0, 0); // 위쪽 여백(불꽃·불씨가 올라갈 공간)
    // 종이 + 글씨를 오프스크린에 한 번 그림
    const paper = document.createElement("canvas"); paper.width = W * dpr; paper.height = H * dpr; const p = paper.getContext("2d")!; p.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = p.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#FBF6EA"); g.addColorStop(1, "#F1E7D2"); p.fillStyle = g; p.beginPath(); p.roundRect(0, 0, W, H, 6); p.fill();
    p.strokeStyle = "rgba(120,160,200,.25)"; p.lineWidth = 1; for (let y = 64; y < H - 20; y += 30) { p.beginPath(); p.moveTo(18, y); p.lineTo(W - 18, y); p.stroke(); } p.strokeStyle = "rgba(220,90,90,.3)"; p.beginPath(); p.moveTo(42, 20); p.lineTo(42, H - 20); p.stroke();
    p.fillStyle = "#3a2f28"; p.font = "600 15px 'Nanum Pen Script', 'IBM Plex Sans KR', system-ui"; p.textBaseline = "alphabetic";
    p.fillStyle = "#9a8a7a"; p.font = "700 12px system-ui"; p.fillText("오늘 태워버릴 걱정 한 장", 52, 40);
    p.fillStyle = "#2f2620"; p.font = "500 18px 'IBM Plex Sans KR', system-ui"; const words = Array.from(text); let line = "", y = 88; const maxW = W - 70;
    for (const ch of words) { const t = line + ch; if (ch === "\n" || p.measureText(t).width > maxW) { p.fillText(line, 52, y); line = ch === "\n" ? "" : ch; y += 30; if (y > H - 30) break; } else line = t; } if (line && y <= H - 30) p.fillText(line, 52, y);
    // 불 번지는 모양: 노이즈 높이맵 (x마다 타는 속도가 조금씩 달라요)
    const N = 64, rough = Array.from({ length: N + 1 }, () => Math.random());
    const smooth = (u: number) => { const i = Math.floor(u * N), f = u * N - i; const a = rough[i], b = rough[Math.min(N, i + 1)]; return a + (b - a) * (f * f * (3 - 2 * f)); };
    const embers: Ember[] = []; let raf = 0, t0 = 0, burnStart = 0, lastCrackle = 0; const DUR = 4500;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame); if (!t0) t0 = now; const el = now - t0;
      x.clearRect(0, 0, W, H + top + 40);
      const burning = burnStart > 0, k = burning ? Math.min(1, (now - burnStart) / DUR) : 0;
      // 타는 선: 아래(H)에서 위로. 진행도 k에 x별 흔들림
      const front = (u: number) => H - k * (H + 90) + (smooth(u) - .5) * 70 + Math.sin(u * 9 + now / 300) * 6;
      // 종이(아직 안 탄 부분만)
      x.save(); x.translate(0, top); x.beginPath(); x.moveTo(0, -10); x.lineTo(W, -10); for (let i = N; i >= 0; i--) { const u = i / N; x.lineTo(u * W, Math.min(H + 10, front(u))); } x.closePath(); x.clip();
      const wob = burning ? Math.sin(now / 90) * .4 : 0; x.drawImage(paper, 0, wob, W, H); x.restore();
      if (burning) {
        // 그을린 가장자리 + 불꽃 혀
        x.save(); x.translate(0, top);
        for (let i = 0; i <= N; i++) { const u = i / N, fx = u * W, fy = front(u); if (fy > H + 8 || fy < -60) continue;
          const ch = x.createLinearGradient(0, fy - 26, 0, fy); ch.addColorStop(0, "rgba(60,30,10,0)"); ch.addColorStop(.6, "rgba(70,35,12,.55)"); ch.addColorStop(1, "rgba(20,10,5,.9)"); x.fillStyle = ch; x.fillRect(fx - W / N, fy - 26, W / N * 2 + 1, 26);
          const fl = 18 + smooth((u + now / 2400) % 1) * 46 * (1 - Math.abs(k - .5)); const gr = x.createRadialGradient(fx, fy, 0, fx, fy - fl * .5, fl);
          gr.addColorStop(0, "rgba(255,245,200,.95)"); gr.addColorStop(.3, "rgba(255,170,60,.75)"); gr.addColorStop(.7, "rgba(230,70,20,.35)"); gr.addColorStop(1, "rgba(200,40,10,0)"); x.globalCompositeOperation = "lighter"; x.fillStyle = gr; x.beginPath(); x.ellipse(fx, fy - fl * .45, fl * .45, fl * .9, 0, 0, 7); x.fill(); x.globalCompositeOperation = "source-over";
          if (Math.random() < .22) embers.push({ x: fx + (Math.random() - .5) * 8, y: fy + top, vx: (Math.random() - .5) * .6, vy: -(1 + Math.random() * 2.2), life: 1, r: 1 + Math.random() * 2.2, hue: 20 + Math.random() * 30 });
          if (Math.random() < .12) embers.push({ x: fx, y: fy + top, vx: (Math.random() - .5) * .4, vy: -(.4 + Math.random() * .8), life: 1.4, r: 2 + Math.random() * 3, hue: -1 }); }
        x.restore();
        if (now - lastCrackle > 280) { lastCrackle = now; onSound?.("crackle"); try { navigator.vibrate?.(4); } catch {} }
        if (k >= 1 && (embers.length < 6 || now - burnStart > DUR + 1800)) { cancelAnimationFrame(raf); setPhase("done"); }
      }
      // 불씨·재
      for (const e of embers) { e.x += e.vx + Math.sin((e.y + now / 10) / 30) * .3; e.y += e.vy; e.vy *= .995; e.life -= .012;
        if (e.hue < 0) { x.fillStyle = `rgba(90,85,80,${Math.max(0, e.life * .6)})`; x.beginPath(); x.ellipse(e.x, e.y, e.r, e.r * .6, e.x, 0, 7); x.fill(); }
        else { x.globalCompositeOperation = "lighter"; x.fillStyle = `hsla(${e.hue},100%,${55 + e.life * 20}%,${Math.max(0, e.life)})`; x.beginPath(); x.arc(e.x, e.y, e.r * e.life, 0, 7); x.fill(); x.globalCompositeOperation = "source-over"; } }
      for (let i = embers.length - 1; i >= 0; i--) if (embers[i].life <= 0 || embers[i].y < -20) embers.splice(i, 1);
      if (!burning && el > 1400) { burnStart = now; setPhase("burn"); onSound?.("ignite"); try { navigator.vibrate?.([20, 40, 20]); } catch {} }
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line
  return <div className="burnp" onClick={() => phase === "done" && onDone()}>
    <div className="burnp-glow" data-on={phase === "burn" ? "1" : "0"} />
    <canvas ref={cv} className="burnp-cv" />
    <div className="burnp-msg">{phase === "show" ? "모닥불에 넣는 중…" : phase === "burn" ? "타들어가는 중… 같이 천천히 내쉬어요" : <><b>🔥 {cheer}</b><button type="button" className="btn" onClick={onDone}>고마워요</button></>}</div>
    <small className="burnp-note">쓴 내용은 어디에도 저장되지 않아요</small>
  </div>;
}
