import { TOPICS } from "./depts";
export type MenuItem = { href: string; name: string; k?: string; sub?: { href: string; name: string; k?: string }[] };
/** ☰ 전체 메뉴 — 카테고리별 카드(필커식). 최근 24시간 새 소식이 있으면 NEW */
export const MENU_GROUPS: { icon: string; title: string; items: MenuItem[] }[] = [
  { icon: "🏥", title: "병원 리뷰", items: [{ href: "/hospitals", name: "병원 리뷰", k: "rev" }, { href: "/hospitals?tab=rank", name: "병원 순위" }, { href: "/hospitals/check", name: "리뷰 쓰기" }, { href: "/salary", name: "급여 비교" }] },
  { icon: "💼", title: "채용", items: [{ href: "/jobs", name: "전체 공고", k: "jobs" }, { href: "/jobs/day", name: "3교대 탈출 (상근·로컬)" }, { href: "/jobs?soon=1", name: "마감 임박" }, { href: "/jobs/new", name: "공고 올리기" }] },
  { icon: "💬", title: "커뮤니티", items: [{ href: "/board", name: "게시판", k: "board", sub: TOPICS.filter(t => !["data", "req", "study"].includes(t.key)).map(t => ({ href: `/board?topic=${t.key}`, name: `${t.icon} ${t.name}`, k: "t:" + t.key })) }, { href: "/anon", name: "익명 게시판", k: "anon" }, { href: "/handover", name: "인수인계", k: "note" }] },
  { icon: "📚", title: "공부방·자료실", items: [{ href: "/study", name: "공부방 홈" }, { href: "/board?topic=data", name: "자료실", k: "t:data" }, { href: "/board?topic=req", name: "자료 요청", k: "t:req" }, { href: "/study/terms", name: "의료 약어 사전" }, { href: "/study/interview", name: "면접 질문 모음" }, { href: "/study/xray", name: "방사선 촬영법 폼" }, { href: "/board?topic=study", name: "공부·시험", k: "t:study" }] },
    { icon: "👤", title: "MY", items: [{ href: "/my", name: "내 정보·열람권" }, { href: "/noti", name: "알림" }, { href: "/badge", name: "골드뱃지 인증" }] },
  { icon: "➕", title: "더보기", items: [{ href: "/rest", name: "당직실" }, { href: "/rest?s=sauna", name: "🧖 찜질방" }, { href: "/ssum", name: "썸", k: "ssum" }, { href: "/rank", name: "내 계급" }, { href: "/fortune", name: "오늘의 운세" }, { href: "/news", name: "의료 뉴스" }] },
];
