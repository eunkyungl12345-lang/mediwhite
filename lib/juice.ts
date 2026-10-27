"use client";
/** 손맛 모듈: 합성 효과음, 햅틱, 흔들림, 입자, 점수 팝, 기록 갱신 */
let actx: AudioContext | null = null;
function ctx() { try { if (!actx) actx = new (window.AudioContext || (window as any).webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; } catch { return null; } }
let muted = false; try { muted = localStorage.getItem("mw-mute") === "1"; } catch {}
export const sound = { get muted() { return muted; }, toggle() { muted = !muted; try { localStorage.setItem("mw-mute", muted ? "1" : "0"); } catch {} return muted; } };
function tone(f: number, t = .08, type: OscillatorType = "square", vol = .06, slide = 0) { if (muted) return; const a = ctx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, a.currentTime); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), a.currentTime + t); g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + t + .02); }
function noise(t = .12, vol = .08) { if (muted) return; const a = ctx(); if (!a) return; const b = a.createBuffer(1, a.sampleRate * t, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(a.destination); s.start(); }
export const sfx = {
  tap() { tone(520, .04, "square", .04); },
  ok(n = 0) { tone(660 + Math.min(10, n) * 40, .07, "square", .05); setTimeout(() => tone(880 + Math.min(10, n) * 40, .07, "square", .04), 50); },
  perfect() { tone(880, .06, "triangle", .06); setTimeout(() => tone(1320, .09, "triangle", .05), 50); },
  fail() { tone(220, .18, "sawtooth", .06, -120); noise(.1, .05); },
  hit() { noise(.06, .07); tone(140, .06, "square", .05, -60); },
  coin() { tone(988, .05, "square", .05); setTimeout(() => tone(1319, .09, "square", .05), 45); },
  combo(n: number) { const base = 600 + Math.min(12, n) * 60; tone(base, .05, "square", .05); setTimeout(() => tone(base * 1.25, .05, "square", .05), 40); setTimeout(() => tone(base * 1.5, .08, "square", .05), 80); },
  level() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .1, "square", .06), i * 70)); },
  record() { [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => setTimeout(() => tone(f, .12, "triangle", .07), i * 90)); },
  tick() { tone(1000, .02, "square", .03); },
  boom() { noise(.25, .12); tone(80, .25, "sawtooth", .08, -40); },
  whoosh() { tone(300, .15, "sine", .04, 600); },
};
export function haptic(ms: number | number[] = 12) { try { navigator.vibrate?.(ms); } catch {} }
/** 요소 흔들기 */
export function shake(el: HTMLElement | null, strength: "s" | "m" | "l" = "m") { if (!el) return; el.classList.remove("shk-s", "shk-m", "shk-l"); void el.offsetWidth; el.classList.add("shk-" + strength); setTimeout(() => el.classList.remove("shk-" + strength), 320); }
/** 입자 터뜨리기 (DOM) */
export function burst(el: HTMLElement | null, x: number, y: number, color = "#F2C94C", n = 12) { if (!el) return; const r = el.getBoundingClientRect(); for (let i = 0; i < n; i++) { const p = document.createElement("i"); p.className = "ptc"; const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50; p.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;--s:${.6 + Math.random() * .8}`; el.appendChild(p); setTimeout(() => p.remove(), 650); } }
/** 떠오르는 글자 */
export function pop(el: HTMLElement | null, x: number, y: number, text: string, cls = "") { if (!el) return; const p = document.createElement("b"); p.className = "popt " + cls; p.textContent = text; p.style.left = x + "px"; p.style.top = y + "px"; el.appendChild(p); setTimeout(() => p.remove(), 800); }
/** 히트스톱: 잠깐 멈춤 (콜백으로 재개) */
export function hitstop(ms: number, resume: () => void) { setTimeout(resume, ms); }
/** 기록 추적: 라운드 중 최고 기록 넘는 순간 1회 */
export function recordWatcher(best: number) { let fired = best <= 0; return (score: number, onRecord: () => void) => { if (!fired && score > best) { fired = true; onRecord(); } }; }
