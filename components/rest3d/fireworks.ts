/** 🎆 옥상 불꽃놀이 — 파티클 불꽃 6종 (국화·하트·링·금빛 버드나무·무지개·메디 십자) */
import * as THREE from "three";
export const FW_TYPES = [
  { icon: "🌼", name: "국화" }, { icon: "💖", name: "하트" }, { icon: "💫", name: "링" },
  { icon: "🌟", name: "금빛 버드나무" }, { icon: "🌈", name: "무지개" }, { icon: "➕", name: "메디 십자" },
] as const;
let glowTex: THREE.Texture | null = null;
const glow = () => glowTex ??= (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d")!; const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,255,255,.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const PAL = [[0xff5a7a, 0xffd36e], [0xff6fae, 0xff9ccc], [0x6fe3ff, 0xb6f4ff], [0xffc34d, 0xffe6a6], [0xff4d4d, 0xffa64d, 0xffe14d, 0x5cff7a, 0x4dc3ff, 0xa64dff], [0xff3b3b, 0xffffff]];

type Burst = { pts: THREE.Points; pos: Float32Array; vel: Float32Array; col: Float32Array; base: Float32Array; n: number; t: number; life: number; grav: number; drag: number; mat: THREE.PointsMaterial; light: THREE.PointLight };
type Rocket = { pts: THREE.Points; from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; type: number; trail: THREE.Points; tpos: Float32Array; ti: number };

export class Fireworks {
  scene: THREE.Scene; rockets: Rocket[] = []; bursts: Burst[] = []; lastBurst = new THREE.Vector3(0, 14, -24); active = 0;
  constructor(scene: THREE.Scene) { this.scene = scene; }
  launch(type: number, from: THREE.Vector3, to: THREE.Vector3, dur = 1.1) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: glow(), size: .9, color: 0xfff1c4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const tg = new THREE.BufferGeometry(), tpos = new Float32Array(30 * 3); for (let i = 0; i < 30; i++) { tpos[i * 3] = from.x; tpos[i * 3 + 1] = from.y; tpos[i * 3 + 2] = from.z; } tg.setAttribute("position", new THREE.BufferAttribute(tpos, 3));
    const trail = new THREE.Points(tg, new THREE.PointsMaterial({ map: glow(), size: .35, color: 0xffb070, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(pts, trail); this.rockets.push({ pts, from: from.clone(), to: to.clone(), t: 0, dur, type, trail, tpos, ti: 0 }); this.active = Math.max(this.active, dur + 3);
  }
  private burst(type: number, at: THREE.Vector3) {
    const n = type === 3 ? 160 : type === 4 ? 260 : 200; const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), col = new Float32Array(n * 3), base = new Float32Array(n * 3);
    const pal = PAL[type]; const c = new THREE.Color(); const sp = type === 3 ? 7 : 10;
    for (let i = 0; i < n; i++) {
      let vx = 0, vy = 0, vz = 0;
      if (type === 1) { const t = i / n * Math.PI * 2; vx = 16 * Math.pow(Math.sin(t), 3) / 16; vy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16; vz = (Math.random() - .5) * .08; const k = sp * .9; vx *= k; vy *= k; vz *= k; }
      else if (type === 2) { const t = i / n * Math.PI * 2; vx = Math.cos(t) * sp; vy = Math.sin(t) * sp * .35; vz = Math.sin(t) * sp * .9; }
      else if (type === 5) { const arm = i % 4, d = (Math.floor(i / 4) / (n / 4)) * sp, w = (Math.random() - .5) * 1.6; if (arm === 0) { vx = w; vy = d; } else if (arm === 1) { vx = w; vy = -d; } else if (arm === 2) { vx = d; vy = w; } else { vx = -d; vy = w; } vz = (Math.random() - .5) * .6; }
      else { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), s = sp * (.85 + Math.random() * .15); vx = r * Math.cos(th) * s; vy = u * s; vz = r * Math.sin(th) * s; }
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; pos[i * 3] = at.x; pos[i * 3 + 1] = at.y; pos[i * 3 + 2] = at.z;
      c.setHex(pal[type === 4 ? i % pal.length : (Math.random() < .75 ? 0 : 1) % pal.length]); base[i * 3] = col[i * 3] = c.r; base[i * 3 + 1] = col[i * 3 + 1] = c.g; base[i * 3 + 2] = col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ map: glow(), size: type === 3 ? .7 : .85, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const pts = new THREE.Points(g, mat); const light = new THREE.PointLight(new THREE.Color().setHex(pal[0]), 6, 60, 1.2); light.position.copy(at);
    this.scene.add(pts, light); this.bursts.push({ pts, pos, vel, col, base, n, t: 0, life: type === 3 ? 3.6 : 2.6, grav: type === 3 ? 4.5 : 2.2, drag: type === 3 ? 1.2 : 1.8, mat, light }); this.lastBurst.copy(at);
  }
  update(dt: number) {
    this.active = Math.max(0, this.active - dt);
    for (const r of this.rockets) { r.t += dt; const k = Math.min(1, r.t / r.dur), e = 1 - Math.pow(1 - k, 2); const p = new THREE.Vector3().lerpVectors(r.from, r.to, e); p.x += Math.sin(r.t * 30) * .05;
      const a = r.pts.geometry.attributes.position as THREE.BufferAttribute; a.setXYZ(0, p.x, p.y, p.z); a.needsUpdate = true;
      r.ti = (r.ti + 1) % 30; r.tpos[r.ti * 3] = p.x + (Math.random() - .5) * .1; r.tpos[r.ti * 3 + 1] = p.y - .2; r.tpos[r.ti * 3 + 2] = p.z; (r.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      if (k >= 1) { this.burst(r.type, p); this.scene.remove(r.pts, r.trail); r.pts.geometry.dispose(); r.trail.geometry.dispose(); (r.pts.material as THREE.Material).dispose(); (r.trail.material as THREE.Material).dispose(); } }
    this.rockets = this.rockets.filter(r => r.t < r.dur);
    for (const b of this.bursts) { b.t += dt; const dr = Math.exp(-b.drag * dt), f = Math.max(0, 1 - b.t / b.life);
      for (let i = 0; i < b.n; i++) { b.vel[i * 3] *= dr; b.vel[i * 3 + 1] = b.vel[i * 3 + 1] * dr - b.grav * dt; b.vel[i * 3 + 2] *= dr; b.pos[i * 3] += b.vel[i * 3] * dt; b.pos[i * 3 + 1] += b.vel[i * 3 + 1] * dt; b.pos[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        const tw = f * (.6 + .4 * Math.sin(b.t * 30 + i)); b.col[i * 3] = b.base[i * 3] * tw; b.col[i * 3 + 1] = b.base[i * 3 + 1] * tw; b.col[i * 3 + 2] = b.base[i * 3 + 2] * tw; }
      const g = b.pts.geometry; (g.attributes.position as THREE.BufferAttribute).needsUpdate = true; (g.attributes.color as THREE.BufferAttribute).needsUpdate = true; b.light.intensity = 6 * Math.max(0, 1 - b.t / .6);
      if (b.t >= b.life) { this.scene.remove(b.pts, b.light); g.dispose(); b.mat.dispose(); } }
    this.bursts = this.bursts.filter(b => b.t < b.life);
  }
  dispose() { for (const r of this.rockets) this.scene.remove(r.pts, r.trail); for (const b of this.bursts) this.scene.remove(b.pts, b.light); this.rockets = []; this.bursts = []; }
}
