import { db } from "@/lib/supabase";
import { NOTE_SECS, type HNote } from "@/lib/handover";
import { notePubKey } from "@/lib/helpKey";
import { HelpBtn } from "@/components/jobs/RvBits";
import { NoteForm, NoteDel } from "@/components/jobs/NoteBits";
/** 📋 병원 인계장 — 칸별로 선배들이 남긴 생활 노트 (도움이 돼요 많은 순) */
export default async function NoteBoard({ hid, me, admin }: { hid: number; me: string; admin: boolean }) {
  const d = db();
  const [{ data: rows }, { data: helps }] = await Promise.all([d.from("game_state").select("user_id,game,state").like("game", `hnote:${hid}:%`).limit(2000), d.from("events").select("user_id,text").eq("kind", "rvhelp").like("text", `${hid}:n%`).limit(5000)]);
  const help = new Map<string, { n: number; me: boolean }>(); for (const e of helps ?? []) { const k = String(e.text).slice(String(hid).length + 1), c = help.get(k) ?? { n: 0, me: false }; c.n++; if (e.user_id === me) c.me = true; help.set(k, c); }
  const total = (rows ?? []).length;
  return <div className="hn">
    <div className="hn-intro"><b>📋 인계장</b><p>이 병원에 처음 오는 사람에게 남기는 인계예요. 첫 출근, 주차, 식당, 이 병원만의 말까지. 리뷰처럼 평가하는 곳이 아니라 <b>생활 정보</b>를 나누는 곳이에요.</p>{total > 0 && <small className="muted">{total}개 노트</small>}</div>
    {NOTE_SECS.map(sec => {
      const list = (rows ?? []).filter(r => String(r.game).endsWith(":" + sec.k)).map(r => ({ uid: r.user_id, k: notePubKey(r.user_id, hid, sec.k), ...(r.state as HNote) }))
        .map(x => ({ ...x, h: help.get(x.k) })).sort((a, b) => (b.h?.n ?? 0) - (a.h?.n ?? 0) || b.at.localeCompare(a.at));
      const mine = list.find(x => x.uid === me);
      return <section key={sec.k} className="hn-sec"><h4>{sec.icon} {sec.name} {list.length > 0 && <small>{list.length}</small>}</h4>
        {list.length ? list.map(x => <div key={x.k} className={"hn-note" + (x.uid === me ? " mine" : "")}><p>{x.text}</p>
          <div className="hn-foot"><small>{x.status === "퇴사" ? "다녔던 사람" : "다니는 사람"} · {x.at.slice(0, 4)}. {x.at.slice(5, 7)}{x.uid === me ? " · 내 노트" : ""}</small>
            <span className="hn-acts">{admin && x.uid !== me && <NoteDel hid={hid} sec={sec.k} k={x.k} />}<HelpBtn hid={hid} k={x.k} n={x.h?.n ?? 0} on={!!x.h?.me} /></span></div></div>)
          : <p className="hn-empty">아직 없어요. {sec.ph.replace(/^예\) /, "예를 들면 ‘")}’ 같은 거요.</p>}
        <NoteForm hid={hid} sec={sec.k} ph={sec.ph} mine={mine ? { text: mine.text, status: mine.status } : null} /></section>;
    })}
    <p className="muted" style={{ fontSize: 12, margin: 0 }}>사람 이름·별명 등 특정인을 알 수 있는 내용은 쓸 수 없어요. 닉네임은 보이지 않아요.</p>
  </div>;
}
