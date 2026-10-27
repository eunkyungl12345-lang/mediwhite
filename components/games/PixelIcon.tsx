"use client";
import { useEffect, useRef } from "react";
/** 이모지를 작은 캔버스에 그린 뒤 확대해서 도트 느낌으로 */
export default function PixelIcon({ e, size = 48, px = 14 }: { e: string; size?: number; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (!c) return; const x = c.getContext("2d"); if (!x) return; c.width = px; c.height = px; x.clearRect(0, 0, px, px); x.font = `${px * .82}px system-ui`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(e, px / 2, px / 2 + px * .06); }, [e, px]);
  return <canvas ref={ref} className="pxi" style={{ width: size, height: size }} aria-hidden="true" />;
}
