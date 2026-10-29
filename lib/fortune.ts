/** 오늘의 운세 — 생년월일(·태어난 시간)과 오늘 일진으로 매일 바뀌어요. 재미로 보는 운세예요. */
export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const STEMS_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
export const ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const ANIMAL_E = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
const ELEM = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const ELEM_E: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" };
const ORDER = ["목", "화", "토", "금", "수"];

const days = (y: number, m: number, d: number) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 86400000);
/** 일진: 2000-01-01 = 무오일(60갑자 54번) */
export const dayGanzhi = (y: number, m: number, d: number) => { const i = ((54 + days(y, m, d)) % 60 + 60) % 60; return { i, stem: i % 10, branch: i % 12, name: STEMS[i % 10] + BRANCHES[i % 12], han: STEMS_H[i % 10] }; };
/** 띠: 입춘(대략 2월 4일) 기준 */
export const yearGanzhi = (y: number, m: number, d: number) => { const yy = m < 2 || (m === 2 && d < 4) ? y - 1 : y; const i = ((yy - 4) % 60 + 60) % 60; return { i, stem: i % 10, branch: i % 12, name: STEMS[i % 10] + BRANCHES[i % 12], animal: ANIMALS[i % 12], emoji: ANIMAL_E[i % 12] }; };
export const hourBranch = (t?: string | null) => { if (!t) return null; const [h] = t.split(":").map(Number); if (!Number.isFinite(h)) return null; return Math.floor(((h + 1) % 24) / 2); };
const ZOD: [string, number, number][] = [["염소자리", 1, 19], ["물병자리", 2, 18], ["물고기자리", 3, 20], ["양자리", 4, 19], ["황소자리", 5, 20], ["쌍둥이자리", 6, 21], ["게자리", 7, 22], ["사자자리", 8, 22], ["처녀자리", 9, 22], ["천칭자리", 10, 22], ["전갈자리", 11, 21], ["사수자리", 12, 21], ["염소자리", 12, 31]];
export const zodiac = (m: number, d: number) => ZOD.find(([, mm, dd]) => m < mm || (m === mm && d <= dd))![0];

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = <T,>(a: T[], seed: number, k = 0) => a[(seed >>> (k * 3)) % a.length];

type Rel = "비견" | "인성" | "식상" | "재성" | "관성";
const REL: Record<Rel, { tone: number; head: string[]; desc: string }> = {
  비견: { tone: 72, desc: "나와 같은 기운이 들어오는 날", head: ["든든한 동료운이 따르는 날", "혼자보다 함께일 때 빛나는 하루", "내 편이 생기는 날"] },
  인성: { tone: 85, desc: "나를 도와주는 기운이 들어오는 날", head: ["귀인이 손을 내미는 날", "배움과 도움이 쏟아지는 하루", "윗사람 덕을 보는 날"] },
  식상: { tone: 78, desc: "내 재능을 펼치는 기운의 날", head: ["말과 손재주가 빛나는 날", "아이디어가 샘솟는 하루", "표현할수록 운이 트이는 날"] },
  재성: { tone: 88, desc: "내가 다스리는 재물 기운이 들어오는 날", head: ["재물운이 문을 두드리는 날", "작은 수확이 쌓이는 하루", "지갑이 두둑해지는 날"] },
  관성: { tone: 64, desc: "책임과 긴장의 기운이 들어오는 날", head: ["책임감이 운을 만드는 날", "차분함이 무기가 되는 하루", "규칙을 지키면 탈이 없는 날"] },
};
const rel = (me: string, today: string): Rel => { const a = ORDER.indexOf(me), b = ORDER.indexOf(today); if (a === b) return "비견"; if ((b + 1) % 5 === a) return "인성"; if ((a + 1) % 5 === b) return "식상"; if ((a + 2) % 5 === b) return "재성"; return "관성"; };

const TOTAL: Record<Rel, string[]> = {
  비견: ["오늘은 동료와 손발이 척척 맞아요. 바쁜 근무도 팀으로 넘기면 금방 지나가요.", "비슷한 고민을 가진 사람을 만나 위로를 주고받게 돼요. 먼저 커피 한 잔 건네보세요.", "경쟁보다 협력이 이득인 날. 인계할 때 한마디 더 챙기면 칭찬이 돌아와요."],
  인성: ["생각지 못한 곳에서 도움의 손길이 와요. 모르는 건 바로 물어보는 게 정답!", "선배나 윗사람의 조언이 오늘따라 딱 맞아떨어져요. 메모해두면 두고두고 쓸모 있어요.", "공부운이 좋은 날이에요. 미뤄둔 자격증·보수교육을 시작하기 딱 좋아요."],
  식상: ["말솜씨가 빛나는 날! 환자 설명이나 발표가 평소보다 술술 풀려요.", "손이 빠르고 센스가 좋아요. 다만 말이 앞서지 않게 한 템포만 쉬어가요.", "새로운 아이디어가 떠오르면 바로 적어두세요. 업무 개선 제안이 통할 수 있어요."],
  재성: ["재물운이 들어와요. 미뤄둔 정산이나 환급이 생각보다 두둑할 수 있어요.", "부지런히 움직인 만큼 성과가 눈에 보이는 날이에요. 작은 투자도 꼼꼼히 살펴보면 좋아요.", "지출 계획을 세우기 좋은 날. 충동구매만 조심하면 지갑이 웃어요."],
  관성: ["업무 책임이 무겁게 느껴질 수 있지만, 원칙대로 하면 오히려 인정받아요.", "윗선의 지적이나 점검이 있을 수 있어요. 기록과 서류를 한 번 더 확인하세요.", "긴장이 큰 날일수록 숨 한번 크게 쉬고 순서대로! 실수만 피하면 무난히 지나가요."],
};
const MONEY = ["예상 못한 소소한 수입이 있어요.", "오늘은 지갑을 닫는 게 버는 거예요.", "동료와 나눠 먹는 간식이 복을 불러요.", "적금·자동이체를 점검하면 새는 돈을 막아요.", "배달 앱보다 구내식당이 운을 지켜줘요.", "투자 소식엔 하루만 기다렸다 판단하세요.", "포인트·쿠폰 챙기면 쏠쏠한 날!"];
const LOVE = ["무심코 건넨 말 한마디에 설렘이 시작돼요.", "연락 미뤄둔 사람에게 먼저 안부를 전해보세요.", "솔로라면 썸 탭에 한 번 들러보세요 😉", "연인과는 작은 약속을 지키는 게 최고의 선물이에요.", "오늘은 나를 먼저 아껴주는 날. 셀프 칭찬 필수!", "눈이 마주치는 사람이 있다면 웃어주세요.", "오해가 생기기 쉬운 날, 톡보다 전화가 좋아요."];
const WORK = ["인계는 평소보다 꼼꼼히! 칭찬받을 일이 생겨요.", "까다로운 환자도 오늘은 웃으며 넘길 수 있어요.", "콜벨이 몰리는 시간이 있어요. 미리 한 박자 준비!", "새로운 업무를 맡게 될 수 있어요. 기회로 받아들이세요.", "점심시간을 꼭 챙기세요. 오후 컨디션이 달라져요.", "기록 하나가 나를 지켜주는 날. 차팅을 꼼꼼히.", "동료의 실수를 감싸주면 나중에 크게 돌아와요."];
const HEALTH = ["어깨와 목이 뻣뻣해요. 틈틈이 스트레칭!", "물을 평소보다 두 컵 더 마시세요.", "야식은 오늘만큼은 참아요. 내일 몸이 가벼워요.", "퇴근 후 10분 산책이 숙면을 불러와요.", "다리가 붓기 쉬운 날, 압박스타킹이 도움이 돼요.", "눈의 피로가 커요. 화면에서 잠깐씩 눈을 떼세요.", "따뜻한 차 한 잔이 컨디션을 지켜줘요."];
const COLORS = [["민트", "#7FD3C2"], ["코랄", "#FF7F6B"], ["네이비", "#1D3557"], ["라벤더", "#B39DDB"], ["버터 옐로", "#F6D365"], ["화이트", "#F5F5F5"], ["올리브", "#8A9A5B"], ["버건디", "#7A1D2E"], ["하늘색", "#8EC9F2"], ["핑크", "#F48FB1"]];
const DIRS = ["동쪽", "서쪽", "남쪽", "북쪽", "동남쪽", "북서쪽", "남서쪽", "북동쪽"];
const ITEMS = ["볼펜", "손소독제", "핸드크림", "텀블러", "립밤", "보조배터리", "사탕", "명찰", "운동화", "머리끈", "향수", "이어폰"];
const TIMES = ["자시(23~01시)", "축시(01~03시)", "인시(03~05시)", "묘시(05~07시)", "진시(07~09시)", "사시(09~11시)", "오시(11~13시)", "미시(13~15시)", "신시(15~17시)", "유시(17~19시)", "술시(19~21시)", "해시(21~23시)"];

export function fortune(birth: string, time: string | null | undefined, name: string | null | undefined, today: Date) {
  const [by, bm, bd] = birth.split("-").map(Number);
  const k = new Date(today.getTime() + 9 * 3600000), ty = k.getUTCFullYear(), tm = k.getUTCMonth() + 1, td = k.getUTCDate();
  const me = dayGanzhi(by, bm, bd), yr = yearGanzhi(by, bm, bd), tday = dayGanzhi(ty, tm, td), hb = hourBranch(time);
  const myEl = ELEM[me.stem], todayEl = ELEM[tday.stem], r = rel(myEl, todayEl), R = REL[r];
  const seed = hash(`${birth}|${time ?? ""}|${name ?? ""}|${ty}-${tm}-${td}`);
  // 오늘 일지와 띠가 충(6칸 차이)이면 조심, 합(삼합)이면 상승
  const clash = (tday.branch - yr.branch + 12) % 12 === 6, trine = (tday.branch - yr.branch + 12) % 4 === 0;
  const score = Math.max(35, Math.min(99, R.tone + (seed % 15) - 7 + (trine ? 6 : 0) - (clash ? 10 : 0)));
  const sub = (k2: number) => Math.max(30, Math.min(99, score + ((seed >>> k2) % 25) - 12));
  const color = pick(COLORS, seed, 2);
  const luckyTime = hb !== null ? TIMES[(hb + 4) % 12] : TIMES[(tday.branch + 6) % 12];
  return {
    today: { y: ty, m: tm, d: td, name: tday.name + "일", han: tday.han, el: todayEl },
    me: { day: me.name, el: myEl, elEmoji: ELEM_E[myEl], animal: yr.animal, animalEmoji: yr.emoji, year: yr.name, zodiac: zodiac(bm, bd), hour: hb !== null ? TIMES[hb] : null },
    rel: r, relDesc: R.desc, headline: pick(R.head, seed), total: pick(TOTAL[r], seed, 1) + (clash ? " 오늘은 띠와 일진이 부딪히니 운전·계단·주사바늘 조심!" : trine ? " 띠와 일진이 잘 맞아 하는 일마다 순조로워요." : ""),
    score, money: { s: sub(4), t: pick(MONEY, seed, 4) }, love: { s: sub(8), t: pick(LOVE, seed, 5) }, work: { s: sub(12), t: pick(WORK, seed, 6) }, health: { s: sub(16), t: pick(HEALTH, seed, 7) },
    lucky: { color: color[0], hex: color[1], num: (seed % 45) + 1, dir: pick(DIRS, seed, 8), item: pick(ITEMS, seed, 9), time: luckyTime },
  };
}
