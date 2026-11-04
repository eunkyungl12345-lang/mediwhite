import Link from "next/link";
import { db } from "@/lib/supabase";
import { memo } from "@/lib/memo";
import { ago } from "@/lib/format";
import type { Rank } from "@/lib/ranks";
import Insignia from "@/components/Insignia";
/** 💻 PC 오른쪽 레일: 내 계급 · 실시간 인기글 · 미니게임 바로가기 (1080px 이상) */
export default async function RightRail({ rank, xp, nick, dept }: { rank: Rank; xp: number; nick: string; dept: string }) {
  const hot = await memo("rail_hot", 60_000, async () => { const since = new Date(Date.now() - 3 * 86400000).toISOString(); const { data } = await db().from("posts").select("id,title,views,created_at,category").eq("hidden", false).neq("category", "썸").neq("category", "익명").neq("category", "공지").gte("created_at", since).order("views", { ascending: false }).limit(6); return data ?? []; });
  const r: any = rank;
  return <aside className="rail">
    <Link href="/rank" className="rail-card rail-me">
      <span className={`ins t${r.tier}`}><Insignia index={r.index} size={22} /></span>
      <div><b>{nick}</b><small>{dept} · {r.name}</small><div className="xpbar"><i style={{ width: `${Math.round((r.progress ?? 0) * 100)}%` }} /></div><small>{xp.toLocaleString()} XP{r.nextName ? ` · ${r.nextName}까지 ${(r.next - xp).toLocaleString()}` : ""}</small></div>
    </Link>
    <div className="rail-card">
      <div className="rail-h">🔥 지금 인기글</div>
      {hot.length ? <ol className="rail-hot">{hot.map((p: any, i: number) => <li key={p.id}><Link href={`/board/${p.id}`}><em>{i + 1}</em><span>{p.title}</span><small>{ago(p.created_at)} · 조회 {p.views ?? 0}</small></Link></li>)}</ol> : <div className="muted" style={{ fontSize: 13 }}>최근 3일 인기글이 아직 없어요</div>}
    </div>
    <div className="rail-card">
      <div className="rail-h">🎮 잠깐 쉬어가기</div>
      <div className="rail-games">{[["/rest", "🛋️", "당직실"], ["/games?g=wordle", "🟩", "메디워들"], ["/games?g=apoc", "🧟", "병원묵시록"], ["/games?g=tycoon", "🏥", "병원 키우기"]].map(([h, ic, n]) => <Link key={h} href={h}><span>{ic}</span>{n}</Link>)}</div>
    </div>
    <div className="rail-foot"><Link href="/about">소개</Link> · <Link href="/support">문의</Link> · © 메디화이트웹</div>
  </aside>;
}
