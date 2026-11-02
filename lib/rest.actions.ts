"use server";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";

const ADJ = ["졸린", "다정한", "포근한", "느긋한", "조용한", "따뜻한", "말랑한", "고요한", "수줍은", "씩씩한", "반짝이는", "나른한"];
const NOUN = ["청진기", "수액병", "솜뭉치", "체온계", "붕대", "링거", "거즈", "베개", "핫팩", "보리차", "담요", "별빛"];
const kday = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const nickOf = (id: string) => { const h = hash(id + kday()); return `${ADJ[h % ADJ.length]} ${NOUN[(h >>> 5) % NOUN.length]}`; };
const SEATS = 24;
export type RestPos = { scene: "roof" | "pocha" | "zen"; x: number; z: number; pose: string };
export type RestPerson = { nick: string; dept: string | null; seat: number; act: string | null; actAge: number; breathing: boolean; me: boolean; scene: string; x: number; z: number; pose: string; say: string | null; sayAge: number };
export type RestView = { me: string; people: RestPerson[]; breathing: number };

/** 하트비트: 15초마다. act(건배·토닥·인사)나 breathing 상태를 같이 보내요 */
export async function restBeat(act?: "cheers" | "pat" | "bow" | null, breathing?: boolean, pos?: RestPos | null): Promise<RestView> {
  const s = await getSession(); if (!s) throw new Error("login");
  const d = db(), now = new Date(), since = new Date(Date.now() - 45000).toISOString();
  const { data: cur } = await d.from("rest_presence").select("seat,last_seen").eq("user_id", s.id).maybeSingle();
  let seat = cur?.seat ?? -1;
  if (seat < 0 || !cur || Date.parse(cur.last_seen) < Date.now() - 45000) {
    const { data: taken } = await d.from("rest_presence").select("seat").gte("last_seen", since).neq("user_id", s.id);
    const used = new Set((taken ?? []).map(r => r.seat)); const start = hash(s.id) % SEATS;
    seat = start; for (let k = 0; k < SEATS; k++) { const c = (start + k) % SEATS; if (!used.has(c)) { seat = c; break; } }
  }
  await d.from("rest_presence").upsert({ user_id: s.id, nick: nickOf(s.id), dept: s.dept, seat, last_seen: now.toISOString(), ...(act ? { act, act_at: now.toISOString() } : {}), ...(breathing !== undefined ? { breathing } : {}), ...(pos ? { scene: pos.scene === "pocha" ? "pocha" : "roof", x: Math.max(-12, Math.min(12, +pos.x || 0)), z: Math.max(-12, Math.min(12, +pos.z || 0)), pose: String(pos.pose).slice(0, 10) } : {}) });
  const { data } = await d.from("rest_presence").select("user_id,nick,dept,seat,act,act_at,breathing,last_seen,scene,x,z,pose,say,say_at").gte("last_seen", since).order("seat").limit(60);
  const people = (data ?? []).map(r => ({ nick: r.nick, dept: r.dept, seat: r.seat, act: r.act, actAge: r.act_at ? (Date.now() - Date.parse(r.act_at)) / 1000 : 999, breathing: !!r.breathing, me: r.user_id === s.id, scene: r.scene ?? "roof", x: r.x ?? 0, z: r.z ?? 0, pose: r.pose ?? "stand", say: r.say ?? null, sayAge: r.say_at ? (Date.now() - Date.parse(r.say_at)) / 1000 : 999 }));
  return { me: nickOf(s.id), people, breathing: people.filter(p => p.breathing).length };
}
export async function restLeave() { const s = await getSession(); if (!s) return; await db().from("rest_presence").update({ last_seen: new Date(Date.now() - 60000).toISOString(), breathing: false }).eq("user_id", s.id); }
/** 쉼 완료(숨쉬기·스트레칭·체크인) 하루 1번 +20 XP */
export async function restDone(kind: "breath" | "stretch" | "mood") { const s = await getSession(); if (!s) return 0; return awardXp(s.id, 20, `rest:${kind}:${kday()}`, "daily"); }

import { personMention, placeMention } from "./safety";
const CONTACT = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(카톡|카카오톡|오픈채팅|인스타|@[a-z0-9_.]{3,})/i;
/** 한마디 말풍선 (익명·60자·10초 노출) */
export async function restSay(text: string) {
  const s = await getSession(); if (!s) return { error: "로그인" };
  const t = text.trim().slice(0, 60); if (!t) return { error: "내용이 없어요" };
  if (CONTACT.test(t)) return { error: "연락처·SNS는 쓸 수 없어요" };
  const pm = personMention(t) || placeMention(t); if (pm) return { error: `"${pm}" — 사람·병원을 특정하는 말은 여기선 쉬어가요` };
  await db().from("rest_presence").update({ say: t, say_at: new Date().toISOString() }).eq("user_id", s.id);
  return { ok: true };
}
/** 걱정 태우기: 내용은 저장하지 않아요. 하루 1번 +10 XP */
export async function restBurn(len: number) {
  const s = await getSession(); if (!s) return 0; if (len < 2) return 0;
  return awardXp(s.id, 10, `rest:burn:${kday()}`, "daily");
}
