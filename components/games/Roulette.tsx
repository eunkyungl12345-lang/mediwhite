"use client";
import { useEffect, useRef, useState } from "react";
import { questOnce } from "@/lib/actions";

export default function Roulette() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [names, setNames] = useState("총괄, 간호, 원무과, 임상병리, 물리치료, 방사선");
  const [res, setRes] = useState("");
  const rot = useRef(0), spinning = useRef(false);
  const list = () => names.split(/[,，]/).map(s => s.trim()).filter(Boolean).slice(0, 12);

  const draw = () => {
    const c = cv.current; if (!c) return; const x = c.getContext("2d")!, n = list(), R = 130, cc = 140; x.clearRect(0, 0, 280, 280); if (!n.length) return;
    const cs = getComputedStyle(document.documentElement), cols = [cs.getPropertyValue("--scrub"), cs.getPropertyValue("--scrub-soft")], ink = cs.getPropertyValue("--ink"), bg = cs.getPropertyValue("--bg");
    n.forEach((t, i) => { const a0 = rot.current + i * 2 * Math.PI / n.length, a1 = a0 + 2 * Math.PI / n.length, mid = (a0 + a1) / 2, flip = Math.cos(mid) < 0;
      x.beginPath(); x.moveTo(cc, cc); x.arc(cc, cc, R, a0, a1); x.closePath(); x.fillStyle = cols[i % 2]; x.fill();
      x.save(); x.translate(cc, cc); x.rotate(mid + (flip ? Math.PI : 0)); x.fillStyle = i % 2 ? ink : bg; x.font = "600 14px " + getComputedStyle(document.body).fontFamily; x.textAlign = flip ? "left" : "right"; x.fillText(t.slice(0, 8), flip ? -(R - 12) : R - 12, 5); x.restore(); });
    x.beginPath(); x.moveTo(cc - 9, 4); x.lineTo(cc + 9, 4); x.lineTo(cc, 22); x.closePath(); x.fillStyle = cs.getPropertyValue("--signal"); x.fill();
  };
  useEffect(() => { draw(); const mq = matchMedia("(prefers-color-scheme:dark)"); mq.addEventListener("change", draw); document.fonts?.ready.then(draw); return () => mq.removeEventListener("change", draw); }, [names]); // eslint-disable-line

  function spin() {
    const n = list(); if (n.length < 2) { setRes("이름을 두 개 이상 넣어주세요"); return; } if (spinning.current) return;
    spinning.current = true; setRes(""); const start = rot.current, dist = Math.PI * 2 * (5 + Math.random() * 3), dur = matchMedia("(prefers-reduced-motion:reduce)").matches ? 10 : 3200, t0 = performance.now();
    const f = (t: number) => { const k = Math.min(1, (t - t0) / dur); rot.current = start + dist * (1 - Math.pow(1 - k, 3)); draw();
      if (k < 1) return requestAnimationFrame(f); spinning.current = false;
      const seg = 2 * Math.PI / n.length, a = ((-Math.PI / 2 - rot.current) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
      setRes("☕ 오늘 커피는 " + n[Math.floor(a / seg)] + "!"); questOnce("roulette_1").catch(() => {}); };
    requestAnimationFrame(f);
  }
  return (
    <div className="card">
      <div><h3>커피 내기 룰렛</h3><div className="muted">이름을 쉼표로 구분해서 넣고 돌리세요.</div></div>
      <div className="row"><input value={names} onChange={e => setNames(e.target.value)} aria-label="참가자 이름" /><button className="btn" type="button" onClick={spin}>돌리기</button></div>
      <div className="wheel-wrap"><canvas ref={cv} width={280} height={280} /></div>
      <div className="result">{res}</div>
    </div>
  );
}
