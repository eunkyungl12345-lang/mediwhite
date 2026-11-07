/** 당직실 3D 추가 씬: 명상 홀 */
import * as THREE from "three";
type Seat = { x: number; z: number; ry: number };
export const ZEN_SEATS: Seat[] = Array.from({ length: 24 }, (_, i) => ({ x: -5 + (i % 6) * 2, z: -3 + Math.floor(i / 6) * 2.2, ry: Math.PI }));
type Fire = { pts: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>; light: THREE.PointLight; update: (dt: number) => void };
type Helpers = { M: (c: number, r?: number, e?: number, ei?: number) => THREE.MeshStandardMaterial; box: (w: number, h: number, d: number, m: THREE.Material, x?: number, y?: number, z?: number) => THREE.Mesh; makeFire: (pos: THREE.Vector3, scale?: number) => Fire; textSprite: (t: string, o?: any) => THREE.Sprite };

function inkPainting() { const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, "#F1E6CF"); g.addColorStop(1, "#E3D3B2"); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.fillStyle = "rgba(200,60,40,.85)"; x.beginPath(); x.arc(760, 120, 46, 0, 7); x.fill();
  const ridge = (base: number, amp: number, col: string, seed: number) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, 512); for (let i = 0; i <= 64; i++) { const px = i * 16, py = base - Math.abs(Math.sin(i * .37 + seed)) * amp - Math.sin(i * .11 + seed * 2) * amp * .5; x.lineTo(px, py); } x.lineTo(1024, 512); x.fill(); };
  ridge(330, 150, "rgba(60,60,70,.25)", 1); ridge(380, 120, "rgba(40,40,50,.4)", 3); ridge(440, 90, "rgba(25,25,30,.65)", 5);
  x.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(150 + i * 160, 300 + (i % 2) * 30, 120, 14, 0, 0, 7); x.fill(); }
  for (let k = 0; k < 3; k++) { x.strokeStyle = "rgba(20,20,20,.75)"; x.lineWidth = 3; x.beginPath(); x.moveTo(80 + k * 22, 512); x.lineTo(90 + k * 22, 300 - k * 30); x.stroke(); for (let j = 0; j < 6; j++) { x.beginPath(); x.ellipse(96 + k * 22 + (j % 2 ? 14 : -14), 320 - k * 30 + j * 26, 16, 4, (j % 2 ? .5 : -.5), 0, 7); x.fillStyle = "rgba(20,30,20,.7)"; x.fill(); } }
  x.fillStyle = "#3a2a1a"; x.font = "700 64px serif"; x.fillText("숨", 900, 300); x.fillText("쉼", 900, 380);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
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
  const ink = inkPainting(); const panel = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.2), new THREE.MeshStandardMaterial({ map: ink, roughness: .95, emissive: 0xffffff, emissiveMap: ink, emissiveIntensity: .18 })); panel.position.set(0, 2.9, -8.82); scene.add(panel);
  scene.add(box(9.9, .12, .1, woodM, 0, 5.04, -8.8), box(9.9, .12, .1, woodM, 0, .8, -8.8));
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, .25, 28), M(0x7a2e2e, .95)); cushion.position.set(0, .62, -6.6); cushion.castShadow = true; scene.add(cushion);
  const bowlM = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: .3, metalness: .85, emissive: 0x5a3a00, emissiveIntensity: .2 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.85, .55, .7, 36, 1, true), bowlM); bowl.position.set(0, 1.08, -6.6); bowl.castShadow = true; bowl.name = "bowl"; scene.add(bowl);
  const bowlIn = new THREE.Mesh(new THREE.CylinderGeometry(.82, .52, .68, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0b464, roughness: .25, metalness: .7, side: THREE.BackSide })); bowlIn.position.copy(bowl.position); scene.add(bowlIn);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, .98, 64), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .52, -6.6); ring.name = "bowlring"; scene.add(ring);
  const cushM = M(0x5b5048, .95), cushTop = M(0x6e6258, .9);
  for (const st of ZEN_SEATS) { const c1 = box(.95, .12, .95, cushM, st.x, .06, st.z), c2 = box(.85, .06, .85, cushTop, st.x, .15, st.z); scene.add(c1, c2); }
  const flames: Fire[] = [];
  for (const [x, z] of [[-4.2, -6.4], [4.2, -6.4], [-2.4, -7.6], [2.4, -7.6]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .12, .9, 10), M(0xb08a3a, .3)); st.position.set(x, .92, z); const cd = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .35, 10), M(0xfff1d6, .9)); cd.position.set(x, 1.55, z); scene.add(st, cd); const f = makeFire(new THREE.Vector3(x, 1.65, z), .22); (f.pts.material as THREE.PointsMaterial).size = .16; f.light.intensity = 1.2; f.light.distance = 7; scene.add(f.pts, f.light); flames.push(f); }
  const incense = makeFire(new THREE.Vector3(0, 1.2, -5.4), .6); const im = incense.pts.material as THREE.PointsMaterial; im.color.set(0xffffff); im.opacity = .2; im.size = .3; incense.light.intensity = 0; scene.add(incense.pts); flames.push(incense);
  scene.add(box(.8, .5, .5, M(0x2a1a10), 0, .72, -5.4));
  for (const sx of [-4.9, 4.9]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.35, .28, .5, 14), M(0x8fa89a, .6)); pot.position.set(sx, .72, -7.2); scene.add(pot); for (let k = 0; k < 8; k++) { const pet = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), M(0xf6c6d0, .8, 0xf6a6c0, .15)); pet.scale.set(.6, 1.2, .3); const a = k / 8 * Math.PI * 2; pet.position.set(sx + Math.cos(a) * .18, 1.2, -7.2 + Math.sin(a) * .18); pet.rotation.set(Math.cos(a) * .6, a, Math.sin(a) * .6); scene.add(pet); } }
  for (const sx of [-4.3, 0, 4.3]) for (const sz of [-3.5, 2]) { const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .7, 16), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd8a0, emissiveIntensity: .9 })); lamp.position.set(sx, 3.9, sz); scene.add(lamp); const l = new THREE.PointLight(0xffd8a0, 1.4, 9, 1.8); l.position.set(sx, 3.5, sz); scene.add(l); }
  const fire: Fire = { pts: flames[0].pts, light: flames[0].light, update: (dt: number) => { for (const f of flames) f.update(dt); const r = scene.getObjectByName("bowlring") as THREE.Mesh | undefined; if (r) { const t = (r.userData.t ?? 0) as number; if (t > 0) { r.scale.setScalar(1 + (1 - t) * 10); (r.material as THREE.MeshBasicMaterial).opacity = t * .6; r.userData.t = Math.max(0, t - dt / 5); } } } };
  return { fire, camBase: new THREE.Vector3(0, 0, 2) };
}
