import webpush from "web-push";
import { cache } from "react";
import { db } from "./supabase";

export const vapid = cache(async () => {
  const { data } = await db().from("settings").select("key,value").in("key", ["vapid_public", "vapid_private"]);
  const m = Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
  return { pub: m.vapid_public as string | undefined, priv: m.vapid_private as string | undefined };
});

type Payload = { title: string; body: string; url?: string; tag?: string };

async function sendTo(subs: { endpoint: string; p256dh: string; auth: string }[], payload: Payload) {
  const { pub, priv } = await vapid(); if (!pub || !priv || !subs.length) return;
  webpush.setVapidDetails("mailto:eunkyungl12@naver.com", pub, priv);
  const dead: string[] = [];
  await Promise.all(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 })
    .catch((e: any) => { if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.endpoint); })));
  if (dead.length) await db().from("push_subs").delete().in("endpoint", dead);
}
export async function pushToUsers(userIds: string[], payload: Payload) {
  const ids = Array.from(new Set(userIds.filter(Boolean))); if (!ids.length) return;
  const { data } = await db().from("push_subs").select("endpoint,p256dh,auth").in("user_id", ids);
  await sendTo(data ?? [], payload);
}
export async function pushToAll(payload: Payload, exceptUserId?: string) {
  let q = db().from("push_subs").select("endpoint,p256dh,auth"); if (exceptUserId) q = q.neq("user_id", exceptUserId);
  const { data } = await q; await sendTo(data ?? [], payload);
}
