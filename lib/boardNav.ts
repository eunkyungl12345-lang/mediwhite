import { NOTICE_CAT, DEPTS, TOPICS } from "./depts";
import { GUIDES } from "./deptGuides";
import type { NavItem } from "@/components/CafeNav";
/** 게시판 컨텍스트 메뉴(☰) 항목 — 게시판·홈 공용 */
export function boardNavItems(dept: string): NavItem[] {
  const enc = encodeURIComponent, s = { dept };
  return [
    { href: "/board", name: "전체글", icon: "✨", group: "게시판" },
    { href: `/board?cat=${enc(NOTICE_CAT)}`, name: "공지사항", icon: "📢", group: "게시판" },
    { href: "/anon", name: "익명 게시판", icon: "🕶️", group: "게시판" },
    { href: "/jobs", name: "채용공고", icon: "💼", group: "게시판" },
    { href: "/hospitals", name: "병원 리뷰", icon: "🏥", group: "게시판" },
    ...[s.dept, ...DEPTS.filter(x => x !== s.dept)].filter(x => (DEPTS as readonly string[]).includes(x)).map(x => ({ href: `/board?cat=${enc(x)}`, name: `${x} 라운지`, icon: x === s.dept ? "🏷️" : "🏥", group: "직종 라운지" })),
    ...TOPICS.map(t => ({ href: `/board?topic=${t.key}`, name: t.name, icon: t.icon, group: "주제별" })),
    { href: "/study/xray", name: "방사선 촬영법", icon: "📖", group: "실무 가이드" },
    ...GUIDES.map(g => ({ href: `/guide/${g.slug}`, name: g.title.replace(" 가이드", ""), icon: g.icon, group: "실무 가이드" })),
    { href: "/ssum", name: "썸", icon: "💘", group: "커뮤니티" }, { href: "/food", name: "맛집", icon: "🍽️", group: "커뮤니티" },
    { href: "/news", name: "오늘의 핫뉴스", icon: "📰", group: "커뮤니티" },
  ];
}
