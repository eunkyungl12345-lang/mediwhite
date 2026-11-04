/** 당직실 3D 배경음 — 파일 없이 WebAudio로 합성 (도시 소음·불·귀뚜라미·포차 웅성거림 + 잔잔한 패드 음악) */
/** iOS: 무음 스위치가 켜져 있으면 Web Audio가 안 들려요 → 오디오 세션을 '재생'으로 바꾸고 무음 <audio>를 한 번 재생 (사용자 탭 안에서 호출) */
let unlocked = false;
export function unlockAudio() {
  try { const as = (navigator as any).audioSession; if (as) as.type = "playback"; } catch {}
  if (unlocked) return; unlocked = true;
  try { const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf); const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" }))); a.loop = true; (a as any).playsInline = true; a.volume = .01; a.play().catch(() => { unlocked = false; }); } catch { unlocked = false; }
}
export type AmbScene = "roof" | "pocha" | "zen" | "mars";

function noiseBuffer(ctx: AudioContext, sec = 4, brown = true) {
  const len = ctx.sampleRate * sec, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return buf;
}

export class Ambience {
  ctx: AudioContext; master: GainNode; music: GainNode; sfx: GainNode; timers: any[] = []; nodes: AudioNode[] = []; scene: AmbScene = "roof"; running = false; padStep = 0; padTimer: any = null;
  constructor() { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination); this.music = this.ctx.createGain(); this.music.gain.value = .55; this.music.connect(this.master); this.sfx = this.ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master); }
  setVolume(v: number) { this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, .3); }
  async start(scene: AmbScene) { await this.ctx.resume(); this.stopLayers(); this.scene = scene; this.running = true; if (scene === "roof") this.roof(); else if (scene === "pocha") this.pocha(); else if (scene === "zen") this.zen(); else this.mars(); this.pad(); }
  stop() { this.stopLayers(); this.running = false; }
  dispose() { this.stop(); try { this.ctx.close(); } catch {} }
  private stopLayers() { for (const t of this.timers) clearTimeout(t); this.timers = []; if (this.padTimer) clearInterval(this.padTimer); this.padTimer = null; for (const n of this.nodes) { try { (n as any).stop?.(); } catch {} try { n.disconnect(); } catch {} } this.nodes = []; }
  private loop(buf: AudioBuffer, filter: BiquadFilterType, freq: number, gain: number, q = 1) {
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true; const f = this.ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q; const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(); this.nodes.push(src, f, g); return { src, f, g };
  }
  private every(minMs: number, maxMs: number, fn: () => void) { const tick = () => { if (!this.running) return; fn(); this.timers.push(setTimeout(tick, minMs + Math.random() * (maxMs - minMs))); }; this.timers.push(setTimeout(tick, Math.random() * maxMs)); }
  private burst(filter: BiquadFilterType, freq: number, dur: number, gain: number, pan = 0) {
    const src = this.ctx.createBufferSource(); src.buffer = noiseBuffer(this.ctx, Math.max(.1, dur), false); const f = this.ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq; const g = this.ctx.createGain(); const t = this.ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = pan; src.connect(f); f.connect(g); g.connect(p); p.connect(this.sfx); src.start(); src.stop(t + dur + .05);
  }
  /* 옥상: 바람/도시 소음 + 드럼통 불 + 귀뚜라미 + 가끔 멀리 사이렌·차 소리 */
  private roof() {
    const brown = noiseBuffer(this.ctx, 5, true);
    const wind = this.loop(brown, "lowpass", 420, .22); // 바람·도시
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = .07; const lg = this.ctx.createGain(); lg.gain.value = .1; lfo.connect(lg); lg.connect(wind.g.gain); lfo.start(); this.nodes.push(lfo, lg);
    this.loop(brown, "bandpass", 1200, .07, .6); // 불 '솨아'
    this.every(140, 520, () => this.burst("bandpass", 1600 + Math.random() * 1200, .05 + Math.random() * .07, .07 + Math.random() * .08, (Math.random() - .5) * .4)); // 탁탁(은은하게)
    // 귀뚜라미
    this.every(900, 2600, () => { const n = 3 + Math.floor(Math.random() * 4), pan = (Math.random() - .5) * 1.4; for (let i = 0; i < n; i++) this.timers.push(setTimeout(() => this.chirp(4200 + Math.random() * 600, pan), i * 110)); });
    // 멀리 구급차 사이렌(아주 작게) · 차 지나가기
    this.every(18000, 40000, () => this.car());
  }
  /* 포차: 솥 끓는 소리·지글 + 웅성웅성 + 잔 부딪히는 소리 + 도로 */
  private pocha() {
    const brown = noiseBuffer(this.ctx, 5, true), white = noiseBuffer(this.ctx, 4, false);
    this.loop(brown, "lowpass", 300, .16); // 도로·밤공기
    const siz = this.loop(white, "highpass", 5200, .035); const l2 = this.ctx.createOscillator(); l2.frequency.value = .9; const l2g = this.ctx.createGain(); l2g.gain.value = .02; l2.connect(l2g); l2g.connect(siz.g.gain); l2.start(); this.nodes.push(l2, l2g); // 지글
    this.loop(brown, "bandpass", 180, .12, .8); // 끓는 솥 (저음 부글)
    this.every(400, 1500, () => this.burst("bandpass", 250 + Math.random() * 200, .12, .12)); // 보글
    const mur = this.loop(brown, "bandpass", 700, .09, .5); const ml = this.ctx.createOscillator(); ml.frequency.value = .23; const mg = this.ctx.createGain(); mg.gain.value = .05; ml.connect(mg); mg.connect(mur.g.gain); ml.start(); this.nodes.push(ml, mg); // 웅성웅성
    this.every(6000, 18000, () => this.clink());
    this.every(20000, 45000, () => this.car());
  }
  /* 화성: 낮게 우는 바람 + 가끔 무전 비프 + 먼 기계음 */
  private mars() {
    const brown = noiseBuffer(this.ctx, 5, true);
    const wind = this.loop(brown, "bandpass", 380, .14, .7); const l = this.ctx.createOscillator(); l.frequency.value = .05; const lg = this.ctx.createGain(); lg.gain.value = .07; l.connect(lg); lg.connect(wind.g.gain); l.start(); this.nodes.push(l, lg);
    const hum = this.ctx.createOscillator(); hum.type = "sine"; hum.frequency.value = 55; const hg = this.ctx.createGain(); hg.gain.value = .015; hum.connect(hg); hg.connect(this.sfx); hum.start(); this.nodes.push(hum, hg);
    this.every(9000, 20000, () => { for (let i = 0; i < 2; i++) { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = 1320; const g = this.ctx.createGain(); const t = this.ctx.currentTime + i * .18; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.02, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .12); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + .15); } });
  }
  /* 명상실: 아주 옅은 공기 소리 + 낮은 드론 + 가끔 저절로 울리는 싱잉볼 + 풍경 */
  private zen() {
    const brown = noiseBuffer(this.ctx, 5, true);
    this.loop(brown, "lowpass", 260, .05); // 공기
    for (const [f, g] of [[110, .022], [165, .012], [220, .008]] as [number, number][]) { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; const gn = this.ctx.createGain(); gn.gain.value = g; const l = this.ctx.createOscillator(); l.frequency.value = .05 + Math.random() * .04; const lg = this.ctx.createGain(); lg.gain.value = g * .5; l.connect(lg); lg.connect(gn.gain); o.connect(gn); gn.connect(this.music); o.start(); l.start(); this.nodes.push(o, gn, l, lg); }
    this.every(14000, 26000, () => this.bowl(Math.random() < .5 ? 196 : 261.6, .5));
    this.every(9000, 20000, () => this.windchime());
  }
  /** 싱잉볼: 비조화 배음 + 미세한 맥놀이 + 긴 여운 */
  bowl(f0 = 261.6, gain = 1.6) {
    this.ctx.resume(); const t = this.ctx.currentTime, dur = 9; const out = this.ctx.createGain(); out.gain.value = gain; out.connect(this.sfx); this.nodes.push(out);
    const parts: [number, number, number][] = [[1, .35, 9], [2.71, .16, 7], [5.4, .07, 5], [8.93, .03, 3.5]];
    for (const [r, a, d] of parts) for (const det of [-1.5, 1.5]) { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = f0 * r; o.detune.value = det * (r > 1 ? 2 : 1); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .1); }
    this.burst("bandpass", 2500, .03, .12); // 채 닿는 소리
    this.timers.push(setTimeout(() => { try { out.disconnect(); } catch {} }, (dur + 1) * 1000));
  }
  /** 🎆 불꽃: 쉬익 올라가는 소리 → (delay 후) 펑 + 타닥타닥 */
  firework(delay = 1.1, big = 1) {
    this.ctx.resume(); const t0 = this.ctx.currentTime;
    { const src = this.ctx.createBufferSource(); src.buffer = noiseBuffer(this.ctx, 1.5, false); const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 6; f.frequency.setValueAtTime(600, t0); f.frequency.exponentialRampToValueAtTime(3200, t0 + delay); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.08, t0 + .1); g.gain.linearRampToValueAtTime(0, t0 + delay); src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t0); src.stop(t0 + delay + .05); }
    const tb = t0 + delay;
    { const src = this.ctx.createBufferSource(); src.buffer = noiseBuffer(this.ctx, 2, true); const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; const g = this.ctx.createGain(); g.gain.setValueAtTime(0, tb); g.gain.linearRampToValueAtTime(.55 * big, tb + .01); g.gain.exponentialRampToValueAtTime(.0001, tb + 1.6); src.connect(f); f.connect(g); g.connect(this.sfx); src.start(tb); src.stop(tb + 1.7); }
    { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(90, tb); o.frequency.exponentialRampToValueAtTime(38, tb + .5); const g = this.ctx.createGain(); g.gain.setValueAtTime(.35 * big, tb); g.gain.exponentialRampToValueAtTime(.0001, tb + .7); o.connect(g); g.connect(this.sfx); o.start(tb); o.stop(tb + .8); }
    for (let i = 0; i < 26; i++) this.timers.push(setTimeout(() => this.burst("highpass", 3000 + Math.random() * 4000, .03, .05 + Math.random() * .06, (Math.random() - .5) * 1.4), (delay + .35 + Math.random() * 1.4) * 1000));
  }
  /** 🔥 걱정 태우기: 확 붙는 소리 / 타닥 */
  ignite() { this.ctx.resume(); const t = this.ctx.currentTime; const src = this.ctx.createBufferSource(); src.buffer = noiseBuffer(this.ctx, 1.5, true); const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + .5); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .25); g.gain.exponentialRampToValueAtTime(.0001, t + 1.4); src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t); src.stop(t + 1.5); }
  crackle() { for (let i = 0; i < 3; i++) this.timers.push(setTimeout(() => this.burst("bandpass", 1500 + Math.random() * 2500, .03 + Math.random() * .05, .12 + Math.random() * .15, (Math.random() - .5) * .6), Math.random() * 250)); }
  private windchime() { const base = [1046, 1174, 1318, 1568, 1760]; const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const t = this.ctx.currentTime + i * (.12 + Math.random() * .25); const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = base[Math.floor(Math.random() * base.length)]; const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2); const p = this.ctx.createStereoPanner(); p.pan.value = (Math.random() - .5) * 1.2; o.connect(g); g.connect(p); p.connect(this.sfx); o.start(t); o.stop(t + 2.3); } }
  private chirp(freq: number, pan: number) { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq; const g = this.ctx.createGain(); const t = this.ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.025, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .07); const p = this.ctx.createStereoPanner(); p.pan.value = pan; o.connect(g); g.connect(p); p.connect(this.sfx); o.start(); o.stop(t + .1); }
  private clink() { for (let i = 0; i < 2; i++) { const o = this.ctx.createOscillator(); o.type = "triangle"; o.frequency.value = 2400 + Math.random() * 900; const g = this.ctx.createGain(); const t = this.ctx.currentTime + i * .09; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .5); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + .6); } }
  private siren() { const o = this.ctx.createOscillator(); o.type = "sine"; const g = this.ctx.createGain(); const t = this.ctx.currentTime, dur = 7; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.012, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur); for (let i = 0; i < dur * 2; i++) o.frequency.setValueAtTime(i % 2 ? 660 : 880, t + i * .5); const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; const p = this.ctx.createStereoPanner(); p.pan.setValueAtTime(-1, t); p.pan.linearRampToValueAtTime(1, t + dur); o.connect(f); f.connect(g); g.connect(p); p.connect(this.sfx); o.start(t); o.stop(t + dur + .1); }
  private car() { const src = this.ctx.createBufferSource(); src.buffer = noiseBuffer(this.ctx, 4, true); const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; const t = this.ctx.currentTime, dur = 3.5; f.frequency.setValueAtTime(200, t); f.frequency.linearRampToValueAtTime(900, t + dur / 2); f.frequency.linearRampToValueAtTime(200, t + dur); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + dur / 2); g.gain.linearRampToValueAtTime(0, t + dur); const p = this.ctx.createStereoPanner(); p.pan.setValueAtTime(1, t); p.pan.linearRampToValueAtTime(-1, t + dur); src.connect(f); f.connect(g); g.connect(p); p.connect(this.sfx); src.start(t); src.stop(t + dur + .1); }
  /* 잔잔한 패드: 느린 코드 진행 + 딜레이 리버브 느낌 */
  private pad() {
    const chords = this.scene === "mars" ? [[110, 164.8, 220, 329.6], [98, 146.8, 196, 293.7], [123.5, 185, 246.9, 370], [110, 164.8, 220, 329.6]] : this.scene === "zen" ? [[130.8, 196, 261.6, 392], [174.6, 220, 261.6, 349.2], [146.8, 220, 293.7, 440], [130.8, 196, 261.6, 392]] : this.scene === "roof" ? [[261.6, 329.6, 392, 523.3], [220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]] : [[196, 246.9, 293.7, 392], [174.6, 220, 261.6, 349.2], [220, 261.6, 329.6, 440], [146.8, 174.6, 220, 293.7]];
    const delay = this.ctx.createDelay(1.5); delay.delayTime.value = .42; const fb = this.ctx.createGain(); fb.gain.value = .45; const dl = this.ctx.createBiquadFilter(); dl.type = "lowpass"; dl.frequency.value = 1600; delay.connect(fb); fb.connect(dl); dl.connect(delay); const wet = this.ctx.createGain(); wet.gain.value = .5; delay.connect(wet); wet.connect(this.music); this.nodes.push(delay, fb, dl, wet);
    const play = () => { if (!this.running) return; const ch = chords[this.padStep % chords.length]; this.padStep++; const t = this.ctx.currentTime, dur = this.scene === "zen" ? 13 : 9;
      ch.forEach((f, i) => { for (const det of [-4, 4]) { const o = this.ctx.createOscillator(); o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det; const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(i === 0 ? .035 : .018, t + 3); g.gain.setValueAtTime(i === 0 ? .035 : .018, t + dur - 3.5); g.gain.linearRampToValueAtTime(0, t + dur); const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; o.connect(lp); lp.connect(g); g.connect(this.music); g.connect(delay); o.start(t); o.stop(t + dur + .1); } });
      // 가끔 높은 음 하나 (별빛/풍경 느낌)
      if (Math.random() < .6) { const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = ch[Math.floor(Math.random() * ch.length)] * 4; const g = this.ctx.createGain(); const t2 = t + 2 + Math.random() * 4; g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(.02, t2 + .05); g.gain.exponentialRampToValueAtTime(.0001, t2 + 2.5); o.connect(g); g.connect(delay); g.connect(this.music); o.start(t2); o.stop(t2 + 2.6); }
    };
    play(); this.padTimer = setInterval(play, this.scene === "zen" ? 12000 : 8000);
  }
}
