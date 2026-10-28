"use client";
import { useEffect, useState } from "react";
import { markOnboarded } from "@/lib/actions";

/** 처음 들어온 사람용 사용법 투어. 헤더의 ? 버튼으로 언제든 다시 열 수 있어요. */
const STEPS: { icon: string; title: string; body: React.ReactNode; demo: React.ReactNode }[] = [
  { icon: "👋", title: "메디화이트웹에 오신 걸 환영해요", body: <>병원 사람들끼리 <b>익명</b>으로 수다 떨고, 게임하고, 계급 올리는 라운지예요.<br />여기선 이름 대신 <b>[직종]닉네임</b>으로 불려요.</>,
    demo: <div className="ob-demo"><span className="ob-badge">🪖</span><b>[간호사]야간러버</b><span className="muted">← 이렇게 보여요</span></div> },
  { icon: "🎖️", title: "계급은 활동하면 저절로 올라요", body: <>채팅·글·댓글·게임을 하면 <b>경험치</b>가 쌓이고 훈련병 → 이병 → … → 참모총장까지 진급해요.<br />계급이 높을수록 글이 위에 뜨고, 이름이 반짝여요.</>,
    demo: <div className="ob-demo ob-ladder"><span>훈련병</span>→<span>이병</span>→<span>병장</span>→<span>소위</span>→<span>대령</span>→<span className="ob-top">★ 참모총장</span></div> },
  { icon: "📋", title: "게시판 — 우리 파트 이야기", body: <>위쪽 칩에서 <b>파트</b>를, 그 아래에서 <b>주제</b>(자유·일상·병원 리뷰·급여·이직…)를 고르면 그 글만 보여요. <b>글쓰기</b> 버튼으로 바로 쓰고, 공지는 📢에 모여 있어요.<br />실명·환자 정보만 빼면 뭐든 OK.</>,
    demo: <div className="ob-demo ob-chips"><span className="on">전체</span><span>의사</span><span>간호사</span><span>방사선</span><span>원무</span><span>…</span></div> },
  { icon: "💬", title: "실시간 채팅 — 오른쪽 아래 버튼", body: <>오른쪽 아래 <b>💬 채팅</b> 버튼을 누르면 열려요. 안 읽은 메시지 수가 빨간 점으로 떠요. 지금 접속 중인 사람이 몇 명인지도 보여요.<br />@닉네임 으로 부르면 알림이 가요.</>,
    demo: <div className="ob-demo ob-dock"><i /><span>💬 실시간 채팅 <b style={{ color: "#E2574C" }}>●</b> 3명</span><span className="muted">펼치기 ▴</span></div> },
  { icon: "🎮", title: "게임 — 기록 세우면 경험치", body: <><b>우리 병원 키우기</b>(접속 안 해도 돈이 쌓여요), <b>병동 사수</b>(세균 막기), 번개 모드, 볼링 등 12가지.<br />기록을 세우면 퀘스트 경험치가 들어와요.</>,
    demo: <div className="ob-demo ob-games"><span>🏥</span><span>🦠</span><span>⚡</span><span>🎳</span><span>🫀</span><span>📚</span></div> },
  { icon: "📅", title: "매일 할 일은 '내 계급' 탭에", body: <><b>💘 썸</b> 탭에선 익명 고백·프로필 카드로 병원 사람끼리 설렐 수 있어요. <b>오늘의 퀘스트</b> 3개(채팅 3번·게임 1판·글 1개)를 하면 보너스 경험치, 매일 출석하면 7일마다 추가 보너스.<br />친구 <b>초대 링크</b>도 여기 있어요. 그럼 시작해볼까요?</>,
    demo: <div className="ob-demo ob-dq"><span>✓ 실시간 채팅 3번</span><span>○ 게임 아무거나 1판</span><span>○ 글 또는 댓글 1개</span></div> },
];

export default function Onboarding({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => { if (!show) return; try { if (localStorage.getItem("mw-ob") === "1") { markOnboarded().catch(() => {}); return; } } catch {} setOpen(true); }, [show]);
  useEffect(() => { const h = () => { setI(0); setOpen(true); }; window.addEventListener("mw-tour", h); return () => window.removeEventListener("mw-tour", h); }, []);
  const close = () => { setOpen(false); try { localStorage.setItem("mw-ob", "1"); } catch {} if (show) markOnboarded().catch(() => {}); };
  if (!open) return null;
  const st = STEPS[i], last = i === STEPS.length - 1;
  return (
    <div className="ob" role="dialog" aria-modal="true">
      <div className="ob-card">
        <button type="button" className="ob-skip" onClick={close}>건너뛰기</button>
        <div className="ob-icon">{st.icon}</div>
        <h3>{st.title}</h3>
        <p>{st.body}</p>
        {st.demo}
        <div className="ob-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>
        <div className="ob-nav">
          {i > 0 ? <button type="button" className="btn ghost" onClick={() => setI(i - 1)}>이전</button> : <span />}
          <button type="button" className="btn" onClick={() => last ? close() : setI(i + 1)}>{last ? "시작하기 🚀" : "다음"}</button>
        </div>
      </div>
    </div>
  );
}

export function TourButton() {
  return <button type="button" className="ob-help" title="사용법" aria-label="사용법 보기" onClick={() => window.dispatchEvent(new Event("mw-tour"))}>?</button>;
}
