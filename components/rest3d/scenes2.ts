/** 당직실 3D 추가 씬: 명상 홀 · 화성 기지 */
import * as THREE from "three";
type Seat = { x: number; z: number; ry: number };
export const ZEN_SEATS: Seat[] = Array.from({ length: 24 }, (_, i) => ({ x: -5 + (i % 6) * 2, z: -3 + Math.floor(i / 6) * 2.2, ry: Math.PI }));
export const MARS_SEATS: Seat[] = [{ x: -2, z: 1.2, ry: 2.1 }, { x: 0, z: 2.2, ry: Math.PI }, { x: 2, z: 1.2, ry: -2.1 }, { x: -2.2, z: -1, ry: 1.1 }, { x: 2.2, z: -1, ry: -1.1 }, { x: 0, z: -2.2, ry: 0 }];
type Fire = { pts: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>; light: THREE.PointLight; update: (dt: number) => void };
type Helpers = { M: (c: number, r?: number, e?: number, ei?: number) => THREE.MeshStandardMaterial; box: (w: number, h: number, d: number, m: THREE.Material, x?: number, y?: number, z?: number) => THREE.Mesh; makeFire: (pos: THREE.Vector3, scale?: number) => Fire; textSprite: (t: string, o?: any) => THREE.Sprite };

/** 불화 느낌 배경: 짙은 붉은 바탕 · 큰 광배(연꽃잎 동심원) · 양옆 구름·꽃무늬 */
function mandala() { const c = document.createElement("canvas"); c.width = 1536; c.height = 512; const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, "#2a0f0a"); g.addColorStop(1, "#3e1a10"); x.fillStyle = g; x.fillRect(0, 0, 1536, 512);
  const cx = 768, cy = 250; const col = ["#7a2a18", "#b8512a", "#2f5a4a", "#c9902f", "#8a3a22", "#d9a441"];
  for (let r = 250, k = 0; r > 40; r -= 26, k++) { const n = 10 + k * 2; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + k * .2; x.save(); x.translate(cx + Math.cos(a) * r * .92, cy + Math.sin(a) * r * .92); x.rotate(a + Math.PI / 2); x.fillStyle = col[k % col.length]; x.globalAlpha = .85; x.beginPath(); x.ellipse(0, 0, 9 + r * .05, 18 + r * .07, 0, 0, 7); x.fill(); x.strokeStyle = "rgba(230,180,90,.55)"; x.lineWidth = 1.5; x.stroke(); x.restore(); } }
  const rg = x.createRadialGradient(cx, cy, 10, cx, cy, 140); rg.addColorStop(0, "rgba(255,210,120,.55)"); rg.addColorStop(1, "rgba(255,210,120,0)"); x.fillStyle = rg; x.fillRect(0, 0, 1536, 512);
  for (const sx of [180, 1356]) { for (let i = 0; i < 40; i++) { x.fillStyle = col[i % col.length]; x.globalAlpha = .45; x.beginPath(); x.ellipse(sx + Math.sin(i * 1.7) * 150, 40 + i * 11, 30 + (i % 5) * 8, 10, Math.sin(i) * .6, 0, 7); x.fill(); }
    x.globalAlpha = .5; x.fillStyle = "#c9902f"; x.beginPath(); x.ellipse(sx, 150, 38, 46, 0, 0, 7); x.fill(); x.fillStyle = "#8a3a22"; x.beginPath(); x.ellipse(sx, 330, 70, 150, 0, 0, 7); x.fill(); }
  x.globalAlpha = 1; x.strokeStyle = "#c9902f"; x.lineWidth = 10; x.strokeRect(5, 5, 1526, 502);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
/** 금빛 좌불상: 연꽃 대좌 · 결가부좌 · 오른손 들어올림 · 나발 · 광배 */
function buddha(h: Helpers) { const g = new THREE.Group(); const { box } = h;
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8a650, metalness: .75, roughness: .32, emissive: 0x6a4200, emissiveIntensity: .3 }), red = new THREE.MeshStandardMaterial({ color: 0x8a2a1a, roughness: .6, metalness: .2 });
  const add = (m: THREE.Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, .4, 32), red), 0, .2, 0);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const p = add(new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), gold), Math.cos(a) * 1.6, .55, Math.sin(a) * 1.6); p.scale.set(.9, .55, 1.4); p.rotation.y = -a; p.rotation.z = .4; }
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, .2, 32), gold), 0, .72, 0);
  const lap = add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), gold), 0, 1.05, .1); lap.scale.set(1.35, .42, .85);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.62, .95, 1.5, 24), gold), 0, 1.85, 0);
  const sh = add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), gold), 0, 2.48, 0); sh.scale.set(.95, .42, .6);
  const ra = add(new THREE.Mesh(new THREE.CapsuleGeometry(.13, .6, 4, 8), gold), .78, 2.0, .25); ra.rotation.z = .15; const rf = add(new THREE.Mesh(new THREE.CapsuleGeometry(.11, .45, 4, 8), gold), .72, 2.15, .55); rf.rotation.x = -.3;
  add(new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), gold), .7, 2.5, .62);
  const la = add(new THREE.Mesh(new THREE.CapsuleGeometry(.13, .6, 4, 8), gold), -.78, 1.9, .2); la.rotation.z = -.35; add(new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), gold), -.25, 1.45, .7);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, .3, 14), gold), 0, 2.78, 0);
  add(new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 18), gold), 0, 3.22, 0);
  for (let i = 0; i < 70; i++) { const ph = .5 + Math.random() * .9, th = Math.random() * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), gold), Math.cos(ph) * Math.cos(th) * .5, 3.32 + Math.sin(ph) * .48, Math.cos(ph) * Math.sin(th) * .5 - .02); }
  add(new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), gold), 0, 3.72, -.02);
  for (const sx of [-1, 1]) { const e = add(new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8), gold), sx * .5, 3.05, 0); e.scale.set(.6, 2.6, 1); }
  for (const sx of [-.17, .17]) { const ey = add(new THREE.Mesh(new THREE.BoxGeometry(.13, .018, .02), new THREE.MeshStandardMaterial({ color: 0x3a2410 })), sx, 3.24, .48); ey.rotation.z = sx > 0 ? -.12 : .12; }
  add(new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 6), gold), 0, 3.4, .49);
  const hc = document.createElement("canvas"); hc.width = hc.height = 256; const hx = hc.getContext("2d")!; const hg = hx.createRadialGradient(128, 128, 20, 128, 128, 128); hg.addColorStop(0, "rgba(255,220,140,.9)"); hg.addColorStop(.6, "rgba(220,140,60,.5)"); hg.addColorStop(1, "rgba(120,40,20,0)"); hx.fillStyle = hg; hx.fillRect(0, 0, 256, 256);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false })); halo.position.set(0, 3.3, -.55); g.add(halo);
  for (const [r, y] of [[.95, 3.3], [2.3, 2.1]] as [number, number][]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 6, 48), gold); ring.position.set(0, y, -.6); g.add(ring); }
  void box; return g; }
const tex = (draw: (x: CanvasRenderingContext2D, s: number) => void, s = 512, rx = 1, ry = 1) => { const c = document.createElement("canvas"); c.width = c.height = s; draw(c.getContext("2d")!, s); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; return t; };

/** 🧘 명상 홀: 넓은 원목 마루 · 방석 24개 · 앞 무대 수묵 산수화 · 대형 싱잉볼 · 촛대 · 한지 등 · 대나무 창 */
export function buildZenHall(scene: THREE.Scene, h: Helpers) {
  const { M, box, makeFire } = h;
  scene.background = new THREE.Color(0x1a1410); scene.fog = new THREE.Fog(0x1a1410, 24, 52);
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x3a2a1c, .75));
  const key = new THREE.DirectionalLight(0xffdcae, .9); key.position.set(-6, 10, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(key);
  const floorTex = tex((x, s) => { x.fillStyle = "#4a3324"; x.fillRect(0, 0, s, s); for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(0,0,0,${.05 + (i % 3) * .04})`; x.fillRect(0, i * 32, s, 32); x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, i * 32, s, 1.5); for (let k = 0; k < 20; k++) { x.strokeStyle = `rgba(255,220,180,${Math.random() * .05})`; x.beginPath(); const y = i * 32 + Math.random() * 32; x.moveTo(0, y); x.bezierCurveTo(170, y + 3, 340, y - 3, s, y); x.stroke(); } } }, 512, 5, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55 })); floor.rotation.x = -Math.PI / 2; floor.position.z = 1; floor.receiveShadow = true; floor.name = "ground"; scene.add(floor);
  const wallM = M(0xe9dcc4, 1), woodM = M(0x3a2418, .7);
  scene.add(box(18, 5, .3, wallM, 0, 2.5, -9)); for (const sx of [-9, 9]) scene.add(box(.3, 5, 20, wallM, sx, 2.5, 1));
  for (const sx of [-8.6, -4.3, 4.3, 8.6]) for (const sz of [-8.6, -2, 4.5]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, 5, 14), woodM); pl.position.set(sx, 2.5, sz); pl.castShadow = true; scene.add(pl); }
  for (const sz of [-8.6, -2, 4.5]) scene.add(box(18, .35, .35, woodM, 0, 4.9, sz)); for (const sx of [-8.6, 8.6]) scene.add(box(.35, .35, 20, woodM, sx, 4.9, 1));
  const bamboo = tex((x, s) => { x.fillStyle = "#16251a"; x.fillRect(0, 0, s, s); for (let i = 0; i < 9; i++) { x.fillStyle = `rgb(${90 + i * 8},${140 + i * 6},90)`; const bx = i * 30 + 6; x.fillRect(bx, 0, 7, s); for (let k = 0; k < 6; k++) { x.fillRect(bx - 2, k * 44, 11, 3); x.beginPath(); x.ellipse(bx + 14, k * 44 + 12, 14, 3, .5, 0, 7); x.fill(); } } }, 256);
  for (const sx of [-8.82, 8.82]) for (const sz of [-5.5, .8, 6.5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshStandardMaterial({ map: bamboo, emissive: 0x9fc9a0, emissiveMap: bamboo, emissiveIntensity: .5 })); w.position.set(sx, 2.2, sz); w.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(w); for (let k = 0; k < 5; k++) scene.add(box(.05, 2.2, .05, woodM, sx + (sx < 0 ? .02 : -.02), 2.2, sz - 1.6 + k * .8)); }
  scene.add(box(10, .45, 3.2, M(0x2f1d13, .6), 0, .22, -7.2), box(10.4, .06, 3.4, M(0x6b4a2e, .5), 0, .47, -7.2));
  const ink = mandala(); const panel = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 4.8), new THREE.MeshStandardMaterial({ map: ink, roughness: .95, emissive: 0xffffff, emissiveMap: ink, emissiveIntensity: .22 })); panel.position.set(0, 2.55, -8.82); scene.add(panel);
  const bud = buddha(h); bud.position.set(0, .47, -7.4); bud.scale.setScalar(1.05); scene.add(bud);
  const spot = new THREE.SpotLight(0xffd59a, 18, 16, .5, .6, 1.4); spot.position.set(0, 5, -2); spot.target = bud; scene.add(spot, spot.target);
  
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, .25, 28), M(0x7a2e2e, .95)); cushion.position.set(-3.6, .62, -5.6); cushion.scale.setScalar(.45); cushion.castShadow = true; scene.add(cushion);
  const bowlM = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: .3, metalness: .85, emissive: 0x5a3a00, emissiveIntensity: .2 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.85, .55, .7, 36, 1, true), bowlM); bowl.position.set(-3.6, .9, -5.6); bowl.scale.setScalar(.4); bowl.castShadow = true; bowl.name = "bowl"; scene.add(bowl);
  const bowlIn = new THREE.Mesh(new THREE.CylinderGeometry(.82, .52, .68, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0b464, roughness: .25, metalness: .7, side: THREE.BackSide })); bowlIn.position.copy(bowl.position); bowlIn.scale.setScalar(.4); scene.add(bowlIn);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, .98, 64), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(-3.6, .52, -5.6); ring.name = "bowlring"; scene.add(ring);
  const cushM = M(0x241e1a, .95), cushTop = M(0x2f2722, .9);
  for (const st of ZEN_SEATS) { const c1 = box(.95, .12, .95, cushM, st.x, .06, st.z), c2 = box(.85, .06, .85, cushTop, st.x, .15, st.z); scene.add(c1, c2); }
  const flames: Fire[] = [];
  for (const [x, z] of [[-4.2, -6.4], [4.2, -6.4], [-2.4, -7.6], [2.4, -7.6]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .12, .9, 10), M(0xb08a3a, .3)); st.position.set(x, .92, z); const cd = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .35, 10), M(0xfff1d6, .9)); cd.position.set(x, 1.55, z); scene.add(st, cd); const f = makeFire(new THREE.Vector3(x, 1.65, z), .22); (f.pts.material as THREE.PointsMaterial).size = .16; f.light.intensity = 1.2; f.light.distance = 7; scene.add(f.pts, f.light); flames.push(f); }
  const incense = makeFire(new THREE.Vector3(0, 1.55, -5.4), .6); const im = incense.pts.material as THREE.PointsMaterial; im.color.set(0xbfb8b0); im.opacity = .1; im.size = .18; im.blending = THREE.NormalBlending; incense.pts.scale.set(.35, 1, .35); incense.light.intensity = 0; scene.add(incense.pts); flames.push(incense);
  scene.add(box(.8, .5, .5, M(0x2a1a10), 0, .72, -5.4)); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .14, .16, 14), M(0x8a6a3a, .4)); pot.position.set(0, 1.05, -5.4); scene.add(pot); for (const dx of [-.04, 0, .04]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .4, 4), M(0x6a3a1a)); st.position.set(dx, 1.3, -5.4); scene.add(st); const tip = new THREE.Mesh(new THREE.SphereGeometry(.014, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff5a1a })); tip.position.set(dx, 1.5, -5.4); scene.add(tip); } }
  for (const sx of [-4.9, 4.9]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.35, .28, .5, 14), M(0x8fa89a, .6)); pot.position.set(sx, .72, -7.2); scene.add(pot); for (let k = 0; k < 8; k++) { const pet = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), M(0xf6c6d0, .8, 0xf6a6c0, .15)); pet.scale.set(.6, 1.2, .3); const a = k / 8 * Math.PI * 2; pet.position.set(sx + Math.cos(a) * .18, 1.2, -7.2 + Math.sin(a) * .18); pet.rotation.set(Math.cos(a) * .6, a, Math.sin(a) * .6); scene.add(pet); } }
  for (const sx of [-5.6, 5.6]) for (const sz of [-3.5, 2]) { const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .7, 16), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd8a0, emissiveIntensity: .9 })); lamp.position.set(sx, 4.4, sz); scene.add(lamp); const l = new THREE.PointLight(0xffd8a0, 1.4, 9, 1.8); l.position.set(sx, 3.5, sz); scene.add(l); }
  const fire: Fire = { pts: flames[0].pts, light: flames[0].light, update: (dt: number) => { for (const f of flames) f.update(dt); const r = scene.getObjectByName("bowlring") as THREE.Mesh | undefined; if (r) { const t = (r.userData.t ?? 0) as number; if (t > 0) { r.scale.setScalar(1 + (1 - t) * 10); (r.material as THREE.MeshBasicMaterial).opacity = t * .6; r.userData.t = Math.max(0, t - dt / 5); } } } };
  return { fire, camBase: new THREE.Vector3(0, 0, 2) };
}

/** 🔴 화성 기지: 붉은 사막 · 유리 돔 거주지 · 로켓 · 탐사 로버 · 히터 · 먼지 바람 */
export function buildMarsBase(scene: THREE.Scene, h: Helpers) {
  const { M, box, makeFire, textSprite } = h;
  scene.background = new THREE.Color(0x2a1410); scene.fog = new THREE.Fog(0xb8653a, 20, 95);
  scene.add(new THREE.HemisphereLight(0xffc8a0, 0x5a2410, .9));
  const sun = new THREE.DirectionalLight(0xffe2c4, 1.6); sun.position.set(15, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 }); scene.add(sun);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }", fragmentShader: "varying vec3 vP; void main(){ float h = clamp(vP.y, 0., 1.); vec3 c = mix(vec3(.85,.52,.33), vec3(.16,.07,.12), pow(h, .55)); gl_FragColor = vec4(c,1.); }" })));
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0x6fb4ff, fog: false })); earth.position.set(-40, 42, -70); scene.add(earth);
  for (const [x, y, z, r] of [[30, 34, -80, 2.2], [55, 26, -60, 1.2]]) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 1, fog: false })); m.position.set(x, y, z); scene.add(m); }
  const gg = new THREE.PlaneGeometry(160, 160, 80, 80); const pa = gg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), d = Math.hypot(x, y); const hh = d < 13 ? 0 : (Math.sin(x * .08) * Math.cos(y * .07) * 2.5 + Math.sin(x * .21 + y * .13) * .8) * Math.min(1, (d - 13) / 18) + (d > 40 ? (d - 40) * .25 : 0); pa.setZ(i, hh); } gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0xb5532c, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = "ground"; scene.add(ground);
  for (let i = 0; i < 70; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(.2 + Math.random() * .9, 0), new THREE.MeshStandardMaterial({ color: [0x8e3b1f, 0x6b2a16, 0xa04a28][i % 3], roughness: 1 })); const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 40; rk.position.set(Math.cos(a) * r, .1, Math.sin(a) * r); rk.rotation.set(Math.random(), Math.random(), Math.random()); rk.castShadow = true; scene.add(rk); }
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, .08, 48), M(0x6b6f78, .8)); pad.position.y = .04; pad.receiveShadow = true; scene.add(pad);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7fe3ff })); b.position.set(Math.cos(a) * 7.3, .1, Math.sin(a) * 7.3); scene.add(b); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: .05, metalness: .1, transparent: true, opacity: .28, depthWrite: false })); dome.position.set(-4, .4, -14); scene.add(dome);
  const domeFrame = new THREE.Mesh(new THREE.SphereGeometry(5.02, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xdfe6ee, wireframe: true, transparent: true, opacity: .35 })); domeFrame.position.copy(dome.position); scene.add(domeFrame);
  scene.add(box(10.4, .4, 10.4, M(0x8a8f99, .6), -4, .2, -14)); for (let i = 0; i < 5; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(.7, 10, 8), M(0x4f9e5e, 1)); tr.position.set(-6 + i * 1.1, 1.3, -14 + (i % 2) * 1.4); scene.add(tr); }
  const domeLight = new THREE.PointLight(0xfff1d6, 3, 14); domeLight.position.set(-4, 2.8, -14); scene.add(domeLight);
  const sign = textSprite("🔴 메디화이트 화성 1기지", { bg: "rgba(226,87,76,.95)", size: 30 }); sign.position.set(-4, 6.4, -14); scene.add(sign);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 8, 16), M(0xdfe3e8, .5)); tube.rotation.z = Math.PI / 2; tube.position.set(4, 1.1, -14); tube.castShadow = true; scene.add(tube);
  const mod = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2.6, 20), M(0xeef1f5, .4)); mod.position.set(9, 1.3, -14); mod.castShadow = true; scene.add(mod); scene.add(box(1.2, .6, .1, M(0x9fe7ff, .2, 0x9fe7ff, 1.2), 9, 1.6, -11.85));
  const rocket = new THREE.Group(); const hull = new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: .25, metalness: .9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 14, 28), hull); body.position.y = 8; const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 28), hull); nose.position.y = 16.6; rocket.add(body, nose);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const fin = box(.08, 3, 1.6, hull, Math.cos(a) * 1.3, 2.2, Math.sin(a) * 1.3); fin.rotation.y = -a; rocket.add(fin, box(.12, 1.8, .12, M(0x333, .5), Math.cos(a) * 1.6, .9, Math.sin(a) * 1.6)); }
  rocket.position.set(10, 0, -4); rocket.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; }); scene.add(rocket);
  const rover = new THREE.Group(); rover.add(box(2, .5, 1.2, M(0xeef1f5, .4), 0, .8, 0), box(.6, .5, .6, M(0x333, .4), .6, 1.3, 0)); for (const [sx, sz] of [[-.7, -.7], [0, -.7], [.7, -.7], [-.7, .7], [0, .7], [.7, .7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .25, 14), M(0x222, .9)); w.rotation.x = Math.PI / 2; w.position.set(sx, .3, sz); rover.add(w); } rover.add(box(.06, 1, .06, M(0x555), -.7, 1.5, 0), box(.3, .2, .2, M(0x111), -.7, 2.05, 0)); rover.position.set(-9, 0, -3); rover.rotation.y = .6; rover.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; }); scene.add(rover);
  const heater = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .5, 16), M(0x3a3f48, .5)); heater.position.y = .25; const coil = new THREE.Mesh(new THREE.TorusGeometry(.45, .06, 8, 24), M(0xff6a2a, .3, 0xff6a2a, 2)); coil.rotation.x = Math.PI / 2; coil.position.y = .52; scene.add(heater, coil);
  const glow = makeFire(new THREE.Vector3(0, .5, 0), .7); (glow.pts.material as THREE.PointsMaterial).color.set(0xff8a4a); scene.add(glow.pts, glow.light);
  for (const st of MARS_SEATS) scene.add(box(.7, .45, .7, M(0xd8dde4, .5), st.x, .22, st.z), box(.72, .04, .72, M(0xe2574c, .5), st.x, .46, st.z));
  const N = 400, dg = new THREE.BufferGeometry(), dp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { dp[i * 3] = (Math.random() - .5) * 40; dp[i * 3 + 1] = Math.random() * 6; dp[i * 3 + 2] = (Math.random() - .5) * 40; } dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffc8a0, size: .06, transparent: true, opacity: .6 })));
  const fire: Fire = { pts: glow.pts, light: glow.light, update: (dt: number) => { glow.update(dt); for (let i = 0; i < N; i++) { dp[i * 3] += dt * .8; if (dp[i * 3] > 20) dp[i * 3] = -20; } dg.attributes.position.needsUpdate = true; } };
  return { fire, camBase: new THREE.Vector3(0, 0, 0) };
}
