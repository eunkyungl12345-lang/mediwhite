/** 🛋️ 진짜 가구 3D 모델 (Kenney Furniture Kit · Car Kit, CC0 무료 — www.kenney.nl)
 *  슬롯·티어마다 모델 조합을 정하고, 실제 크기(m)로 맞춰서 배치해요. 우주급 티어는 기존 절차형 모델 사용 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Part = { m: string; size: number; axis?: "x" | "y" | "z" | "h"; at?: [number, number, number]; ry?: number; tint?: number; gold?: boolean; car?: boolean };
const F = (m: string, size: number, at: [number, number, number] = [0, 0, 0], ry = 0, extra: Partial<Part> = {}): Part => ({ m, size, at, ry, ...extra });
const CHAIRS = (m: string, n: number, w: number, s = .52) => Array.from({ length: n }, (_, i) => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), cols = Math.ceil(n / 2); const x = cols === 1 ? 0 : -w / 2 + .35 + k * (w - .7) / (cols - 1); return F(m, s, [x, 0, side * .75], side > 0 ? Math.PI : 0); });

/** slot → tier(1부터) → 부품 목록. 없는 티어는 절차형으로 */
const KIT: Record<string, Record<number, Part[]>> = {
  sofa: {
    1: [F("loungeChair", .95), F("rugRound", 1.6, [0, 0, .3], 0, { axis: "x" })],
    2: [F("loungeSofa", 2.1), F("tableCoffee", 1.1, [0, 0, 1.1]), F("rugRectangle", 2.6, [0, 0, .7])],
    3: [F("loungeDesignSofa", 2.3), F("loungeChair", .95, [-1.8, 0, 1], Math.PI / 2.5), F("tableCoffeeGlass", 1.2, [0, 0, 1.15]), F("rugRectangle", 3, [0, 0, .8]), F("pillowBlue", .45, [-.5, .45, .05])],
    4: [F("loungeSofaCorner", 3), F("loungeSofaOttoman", .8, [.3, 0, 1.4]), F("tableCoffeeGlass", 1.2, [-.6, 0, 1.3]), F("rugRounded", 3.4, [0, 0, .8])],
    5: [F("loungeDesignSofaCorner", 3.2, [0, 0, 0], 0, { gold: true }), F("loungeChairRelax", 1, [-2.2, 0, 1.2], Math.PI / 2.5), F("tableCoffeeGlass", 1.3, [-.6, 0, 1.4]), F("rugRounded", 3.8, [0, 0, .9])],
  },
  tv: {
    1: [F("cabinetTelevision", 1.2), F("televisionVintage", .6, [0, .5, 0])],
    2: [F("cabinetTelevisionDoors", 1.6), F("televisionModern", 1.2, [0, .55, 0])],
    3: [F("cabinetTelevisionDoors", 2), F("televisionModern", 1.7, [0, .55, 0]), F("speaker", .3, [-1.3, 0, .1], 0, { axis: "x" }), F("speaker", .3, [1.3, 0, .1], 0, { axis: "x" })],
    4: [F("cabinetTelevisionDoors", 2.6), F("televisionModern", 2.3, [0, .55, 0]), F("speaker", .35, [-1.6, 0, .1], 0, { axis: "x" }), F("speaker", .35, [1.6, 0, .1], 0, { axis: "x" }), F("speakerSmall", .2, [-.9, .55, .1], 0, { axis: "x" }), F("speakerSmall", .2, [.9, .55, .1], 0, { axis: "x" })],
    5: [F("televisionModern", 3.2, [0, .4, 0]), F("speaker", .4, [-2, 0, .1], 0, { axis: "x" }), F("speaker", .4, [2, 0, .1], 0, { axis: "x" }), F("loungeChairRelax", 1, [-.8, 0, 3], Math.PI), F("loungeChairRelax", 1, [.8, 0, 3], Math.PI)],
  },
  table: {
    1: [F("table", 1.2), ...CHAIRS("chair", 2, 1.2, .48)],
    2: [F("tableRound", 1.2), ...CHAIRS("chairCushion", 4, 1.2, .5)],
    3: [F("tableGlass", 1.8), ...CHAIRS("chairModernCushion", 6, 1.8)],
    4: [F("tableCloth", 2.2), ...CHAIRS("chairModernFrameCushion", 8, 2.2), F("lampSquareCeiling", .6, [0, 2.2, 0], 0, { axis: "x" })],
    5: [F("tableCrossCloth", 2.6, [0, 0, 0], 0, { gold: true }), ...CHAIRS("chairModernFrameCushion", 8, 2.6, .56)],
  },
  bed: {
    1: [F("bedSingle", 2, [0, 0, 0], 0, { axis: "z" })],
    2: [F("bedDouble", 2.1, [0, 0, 0], 0, { axis: "z" }), F("cabinetBedDrawerTable", .5, [1.15, 0, -.7])],
    3: [F("bedDouble", 2.15, [0, 0, 0], 0, { axis: "z" }), F("cabinetBedDrawerTable", .5, [1.2, 0, -.75]), F("cabinetBedDrawerTable", .5, [-1.2, 0, -.75]), F("lampRoundTable", .3, [1.2, .5, -.75], 0, { axis: "x" }), F("lampRoundTable", .3, [-1.2, .5, -.75], 0, { axis: "x" }), F("rugRectangle", 2.8, [0, 0, .5])],
    4: [F("bedDouble", 2.25, [0, 0, 0], 0, { axis: "z", tint: 0xe8dcc8 }), F("cabinetBedDrawerTable", .55, [1.3, 0, -.75]), F("cabinetBedDrawerTable", .55, [-1.3, 0, -.75]), F("lampSquareTable", .3, [1.3, .55, -.75], 0, { axis: "x" }), F("lampSquareTable", .3, [-1.3, .55, -.75], 0, { axis: "x" }), F("rugRounded", 3.2, [0, 0, .6]), F("loungeChair", .9, [1.6, 0, 1.6], -Math.PI * .75)],
    5: [F("bedDouble", 2.4, [0, 0, 0], 0, { axis: "z", gold: true }), F("cabinetBedDrawerTable", .55, [1.4, 0, -.8]), F("cabinetBedDrawerTable", .55, [-1.4, 0, -.8]), F("lampRoundTable", .32, [1.4, .55, -.8], 0, { axis: "x" }), F("lampRoundTable", .32, [-1.4, .55, -.8], 0, { axis: "x" }), F("rugRounded", 3.6, [0, 0, .6])],
  },
  light: {
    1: [F("lampSquareFloor", 1.5, [0, 0, 0], 0, { axis: "y" })],
    2: [F("lampRoundFloor", 1.6, [0, 0, 0], 0, { axis: "y" }), F("lampSquareCeiling", .6, [0, 2.45, 0], 0, { axis: "x" })],
  },
  plant: {
    1: [F("plantSmall1", .45, [0, 0, 0], 0, { axis: "y" })],
    2: [F("pottedPlant", 1.1, [0, 0, 0], 0, { axis: "y" })],
    3: [F("pottedPlant", 1.4, [0, 0, 0], 0, { axis: "y" }), F("pottedPlant", 1, [-.6, 0, .2], 1, { axis: "y" }), F("plantSmall2", .5, [.5, 0, .25], 0, { axis: "y" })],
  },
  fridge: {
    1: [F("kitchenFridgeSmall", .9, [0, 0, 0], 0, { axis: "y" })],
    2: [F("kitchenFridge", 1.8, [0, 0, 0], 0, { axis: "y" }), F("kitchenCabinet", .9, [-.85, 0, 0], 0, { axis: "y" }), F("kitchenSink", .9, [-1.65, 0, 0], 0, { axis: "y" })],
    3: [F("kitchenFridgeLarge", 1.9, [0, 0, 0], 0, { axis: "y" }), F("kitchenCabinetDrawer", .9, [-1, 0, 0], 0, { axis: "y" }), F("kitchenSink", .9, [-1.8, 0, 0], 0, { axis: "y" }), F("kitchenStove", .9, [-2.6, 0, 0], 0, { axis: "y" }), F("hoodModern", .6, [-2.6, 1.6, 0], 0, { axis: "y" }), F("kitchenMicrowave", .3, [-1, .9, 0], 0, { axis: "y" })],
    4: [F("kitchenFridgeLarge", 2, [0, 0, 0], 0, { axis: "y", tint: 0xc9ccd2 }), F("kitchenCabinetDrawer", .9, [-1, 0, 0], 0, { axis: "y" }), F("kitchenSink", .9, [-1.8, 0, 0], 0, { axis: "y" }), F("kitchenStoveElectric", .9, [-2.6, 0, 0], 0, { axis: "y" }), F("hoodModern", .6, [-2.6, 1.6, 0], 0, { axis: "y" }), F("kitchenCoffeeMachine", .35, [-1, .9, 0], 0, { axis: "y" }), F("kitchenBar", 2.4, [-1.4, 0, 1.6]), F("stoolBar", .8, [-2.2, 0, 2.3], 0, { axis: "y" }), F("stoolBar", .8, [-1.4, 0, 2.3], 0, { axis: "y" }), F("stoolBar", .8, [-.6, 0, 2.3], 0, { axis: "y" })],
  },
  washer: {
    1: [F("washer", .85, [0, 0, 0], 0, { axis: "y" })],
    2: [F("washer", .85, [0, 0, 0], 0, { axis: "y" }), F("dryer", .85, [.75, 0, 0], 0, { axis: "y" })],
    3: [F("washerDryerStacked", 1.8, [0, 0, 0], 0, { axis: "y" }), F("washer", .85, [.8, 0, 0], 0, { axis: "y" })],
  },
  bath: {
    1: [F("shower", 2.1, [0, 0, 0], 0, { axis: "y" }), F("toilet", .75, [1, 0, 0], 0, { axis: "y" })],
    2: [F("bathtub", 1.7), F("toilet", .75, [1.4, 0, -.1], 0, { axis: "y" }), F("bathroomSink", .9, [-1.5, 0, -.1], 0, { axis: "y" }), F("bathroomMirror", .6, [-1.5, 1.2, -.25], 0, { axis: "x" })],
    3: [F("bathtub", 1.8), F("showerRound", 2.1, [1.6, 0, 0], 0, { axis: "y" }), F("toiletSquare", .75, [-1.4, 0, -.1], 0, { axis: "y" }), F("bathroomSinkSquare", .9, [-2.3, 0, -.1], 0, { axis: "y" }), F("bathroomMirror", .7, [-2.3, 1.2, -.25], 0, { axis: "x" }), F("bathroomCabinetDrawer", .8, [-2.3, 0, .8], Math.PI / 2, { axis: "y" })],
  },
  desk: {
    1: [F("desk", 1.2), F("chairDesk", .55, [0, 0, .6], Math.PI)],
    2: [F("desk", 1.4), F("chairDesk", .6, [0, 0, .6], Math.PI), F("computerScreen", .55, [0, .75, -.1], 0, { axis: "x" }), F("computerKeyboard", .45, [0, .75, .1], 0, { axis: "x" }), F("computerMouse", .08, [.35, .75, .12], 0, { axis: "x" })],
    3: [F("deskCorner", 1.8), F("chairDesk", .6, [.2, 0, .7], Math.PI), F("computerScreen", .6, [-.3, .75, -.15], 0, { axis: "x" }), F("laptop", .35, [.5, .75, 0], 0, { axis: "x" }), F("bookcaseOpen", 2, [-1.6, 0, -.1], 0, { axis: "y" }), F("bookcaseOpen", 2, [1.6, 0, -.1], 0, { axis: "y" })],
    4: [F("deskCorner", 2), F("chairDesk", .62, [.2, 0, .7], Math.PI), F("computerScreen", .7, [-.3, .75, -.15], 0, { axis: "x" }), F("bookcaseClosedWide", 2.1, [-1.9, 0, -.2], 0, { axis: "y" }), F("bookcaseClosedWide", 2.1, [1.9, 0, -.2], 0, { axis: "y" }), F("loungeChair", .9, [2, 0, 1.6], -Math.PI * .8), F("rugRound", 2, [0, 0, .8])],
  },
  car: {
    1: [F("hatchback-sports", 3.8, [0, 0, 0], 0, { axis: "z", car: true })], 2: [F("sedan", 4.6, [0, 0, 0], 0, { axis: "z", car: true })], 3: [F("suv", 4.9, [0, 0, 0], 0, { axis: "z", car: true })],
    4: [F("suv-luxury", 5.2, [0, 0, 0], 0, { axis: "z", car: true, tint: 0x1a1d24 })], 5: [F("sedan-sports", 5.1, [0, 0, 0], 0, { axis: "z", car: true, tint: 0x0b0b0e })], 6: [F("race", 4.5, [0, 0, 0], 0, { axis: "z", car: true })],
    7: [F("suv-luxury", 5.4, [0, 0, 0], 0, { axis: "z", car: true, gold: true })], 8: [F("race-future", 4.5, [0, 0, 0], 0, { axis: "z", car: true })], 9: [F("race-future", 4.6, [0, 0, 0], 0, { axis: "z", car: true, tint: 0xff7a1a })],
  },
};
export const hasKit = (slot: string, tier: number) => !!KIT[slot]?.[tier];

const loader = new GLTFLoader(); const cache = new Map<string, Promise<THREE.Group>>();
const load = (url: string) => { let p = cache.get(url); if (!p) { p = loader.loadAsync(url).then(g => g.scene as unknown as THREE.Group); cache.set(url, p); } return p.then(s => s.clone(true)); };

function fit(obj: THREE.Object3D, size: number, axis: Part["axis"]) {
  const bb = new THREE.Box3().setFromObject(obj), sz = new THREE.Vector3(); bb.getSize(sz);
  const ref = axis === "y" ? sz.y : axis === "x" ? sz.x : axis === "z" ? sz.z : Math.max(sz.x, sz.z);
  const k = size / Math.max(ref, 1e-3); obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj), c = new THREE.Vector3(); b2.getCenter(c); obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b2.min.y;
}
function style(obj: THREE.Object3D, p: Part) {
  obj.traverse(o => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; const src = Array.isArray(m.material) ? m.material : [m.material];
    const mats = src.map(mt => { const n = (mt as THREE.MeshStandardMaterial).clone(); if (p.gold) { const c = n.color.getHSL({ h: 0, s: 0, l: 0 }); if (c.l > .35) { n.color.lerp(new THREE.Color(0xd9b45a), .55); n.metalness = .6; n.roughness = .35; } }
      if (p.tint !== undefined && !p.car) n.color.multiply(new THREE.Color(p.tint)); if (p.tint !== undefined && p.car) { const hsl = n.color.getHSL({ h: 0, s: 0, l: 0 }); if (hsl.s > .25) n.color.set(p.tint); }
      if (!p.car) { n.roughness = Math.min(n.roughness ?? .8, .75); } return n; });
    m.material = Array.isArray(m.material) ? mats : mats[0]; });
}
/** 진짜 모델로 슬롯 가구 만들기 (로드 실패하면 null → 절차형으로) */
export async function buildKit(slot: string, tier: number): Promise<THREE.Group | null> {
  const parts = KIT[slot]?.[tier]; if (!parts) return null;
  try {
    const g = new THREE.Group();
    const objs = await Promise.all(parts.map(p => load(`/models/kenney/${p.car ? "car" : "furniture"}/${p.m}.glb`)));
    objs.forEach((o, i) => { const p = parts[i]; const holder = new THREE.Group(); holder.add(o); fit(o, p.size, p.axis); style(o, p); holder.rotation.y = p.ry ?? 0; const [x, y, z] = p.at ?? [0, 0, 0]; holder.position.set(x, y, z); g.add(holder); });
    if (slot === "light") { const l = new THREE.PointLight(0xffe6b8, 1.6, 7, 1.6); l.position.y = 1.6; g.add(l); }
    if (slot === "bed" && tier >= 3) { for (const sx of [-1.25, 1.25]) { const l = new THREE.PointLight(0xffd9a8, .6, 3, 2); l.position.set(sx, .9, -.75); g.add(l); } }
    return g;
  } catch { return null; }
}
