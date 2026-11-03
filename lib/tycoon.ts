/** 우리 병원 키우기 — 시즌 3 (거지키우기식 방치형 경제). 서버·클라이언트 공용 */
export const VERSION = 3;
/** 밸런스 프로토콜 v4: 우주 시대는 "물가 ×1조"가 아니라 새 콘텐츠 층. 직원은 25레벨마다 매출 2배, 고용비는 1.07배씩 */
export const BALANCE_V = 4;
export const DAY = 86400;

/* ---------- 원장 진료(클릭) ---------- */
/** 레벨 n → 클릭당 기본 n(n+1)/2 + 1원 */
export const clickBase = (lv: number) => lv * (lv + 1) / 2 + 1;
export const clickCost = (lv: number) => Math.round(10 * Math.pow(1.05, lv));
/** 짧은 시간 연타 보너스 (1초 안 클릭 수) */
export const COMBO = [{ n: 0, m: 1, c: "#3DDC84" }, { n: 5, m: 1.2, c: "#A3E635" }, { n: 8, m: 1.3, c: "#FACC15" }, { n: 11, m: 1.4, c: "#FB923C" }, { n: 14, m: 1.5, c: "#EF4444" }];
export const comboOf = (cps: number) => [...COMBO].reverse().find(c => cps >= c.n)!;

/* ---------- 직원 (거지키우기 알바 고용비·20레벨 보너스 그대로) ---------- */
export type Staff = { name: string; icon: string; sprite: string; hire: number; bonus: number; ask: string; yes: string; line: string; dept?: string; space?: boolean };
export const STAFF: Staff[] = [
  { name: "실습생", icon: "🎒", sprite: "nurse", hire: 1e4, bonus: 5, ask: "실습 끝나고 알바 어때? 용돈 두둑이 줄게", yes: "진짜요? 실습 일지 쓰면서 할게요!", line: "실습 일지가 밀렸어요…" },
  { name: "원무 접수원", icon: "🧾", sprite: "wonmu", hire: 5e4, bonus: 7, ask: "접수 창구 하나 맡아줄래요?", yes: "수납 마감은 칼같이 할게요", line: "대기 번호 12번 오세요~", dept: "원무" },
  { name: "간호조무사", icon: "🩹", sprite: "nurse", hire: 1e5, bonus: 10, ask: "처치실 일손이 부족해요", yes: "드레싱이면 자신 있죠", line: "소독 들어갑니다~", dept: "간호조무사" },
  { name: "간호사", icon: "💉", sprite: "nurse", hire: 5e5, bonus: 14, ask: "우리 병동에서 같이 일해요!", yes: "3교대 수당 확실하죠?", line: "콜벨 누구야?!", dept: "간호사" },
  { name: "물리치료사", icon: "🦵", sprite: "pt", hire: 1e6, bonus: 19, ask: "재활센터 오픈 멤버 해줄래요?", yes: "도수치료 예약 꽉 채워드림", line: "하나, 둘, 셋!", dept: "물리치료" },
  { name: "임상병리사", icon: "🧪", sprite: "lab", hire: 5e6, bonus: 25, ask: "검사실 장비 최신으로 깔아드릴게요", yes: "자동분석기 있으면 바로 갑니다", line: "검체 접수 완료!", dept: "임상병리" },
  { name: "방사선사", icon: "☢️", sprite: "xray", hire: 1e7, bonus: 40, ask: "CT·MRI 둘 다 들여놨어요", yes: "숨 참으세요~ 바로 시작하죠", line: "CT 대기 5명!", dept: "방사선" },
  { name: "응급구조사", icon: "🚑", sprite: "ems", hire: 5e7, bonus: 80, ask: "응급실 열었어요. 같이 뛰어요!", yes: "구급차 키부터 주세요", line: "비켜주세요!!", dept: "응급구조" },
  { name: "총괄실장", icon: "👔", sprite: "director", hire: 1e8, bonus: 200, ask: "병원 살림 전부 맡겨볼게요", yes: "인건비부터 다시 봅시다", line: "회의는 3시입니다", dept: "총괄" },
  { name: "전공의", icon: "🥼", sprite: "doctor", hire: 1e10, bonus: 600, ask: "당직비 두 배로 드릴게요", yes: "…잠은 언제 자요?", line: "커피 한 잔만…", dept: "의사" },
  { name: "수간호사", icon: "📋", sprite: "nurse", hire: 5e10, bonus: 1000, ask: "병동 전체를 맡아주세요", yes: "인계는 15분 안에 끝냅니다", line: "오늘 근무표 나왔어요" },
  { name: "전문의", icon: "🩺", sprite: "doctor", hire: 1e11, bonus: 1500, ask: "선생님 이름 걸고 클리닉 열어요", yes: "외래 3시간 대기 각오하세요", line: "다음 환자분 들어오세요", dept: "의사" },
  { name: "의대 교수", icon: "🎓", sprite: "doctor", hire: 1e12, bonus: 2000, ask: "부속 의대 강의도 맡아주세요", yes: "논문은 1저자로 부탁해요", line: "오늘 회진은 8시다", dept: "의사" },
  { name: "진료부원장", icon: "🏅", sprite: "director", hire: 1e13, bonus: 2500, ask: "진료 쪽은 부원장님 결재로!", yes: "결재판 가져와요", line: "이번 분기 실적 좋네요" },
  { name: "병원장", icon: "🏥", sprite: "director", hire: 1e14, bonus: 3000, ask: "드디어 병원장님 모십니다", yes: "전 직원 회식부터 하죠!", line: "다들 고생 많아요" },
  { name: "의료재단 이사장", icon: "🏛️", sprite: "director", hire: 1e15, bonus: 4000, ask: "재단 하나 세워보실래요?", yes: "분원 열 곳부터 시작하죠", line: "다음 분원은 어디로?" },
  { name: "우주의학 박사", icon: "🧑‍🚀", sprite: "doctor", hire: 5e17, bonus: 5000, ask: "화성 분원 원장 자리가 비었어요", yes: "무중력 수술은 제 전문이죠", line: "산소 레벨 정상!" },
  // ── 우주 시대 직원 (달 기지 의원부터 채용 가능) ──
  { name: "외계어 통역사", icon: "👽", sprite: "wonmu", hire: 1e19, bonus: 6000, ask: "외계 환자 접수가 밀려요. 통역 좀!", yes: "삐빅… 접수 완료입니다", line: "다음 외계 환자분~", space: true },
  { name: "무중력 수술 로봇", icon: "🤖", sprite: "doctor", hire: 1e20, bonus: 7000, ask: "수술실에 중력이 없어요. 로봇 팔이 필요해요", yes: "오차 0.001mm 보장", line: "봉합 완료. 삐-", space: true },
  { name: "외계 생물학자", icon: "🧬", sprite: "lab", hire: 1e21, bonus: 8000, ask: "환자 혈액이 보라색인데 정상인가요?", yes: "그 종족은 원래 그래요", line: "촉수 3개가 정상입니다", space: true },
  { name: "은하 응급구조대", icon: "🛸", sprite: "ems", hire: 1e22, bonus: 10000, ask: "소행성대에서 사고 났대요!", yes: "워프 구급선 출동!", line: "광속 비켜주세요!!", space: true },
  { name: "시간여행 전문의", icon: "⏳", sprite: "doctor", hire: 1e23, bonus: 12000, ask: "환자가 아프기 전에 가서 치료할 수 있나요?", yes: "어제 이미 치료했습니다", line: "다음 환자는… 어제 오세요", space: true },
  { name: "안드로이드 간호 군단", icon: "🦾", sprite: "nurse", hire: 1e24, bonus: 15000, ask: "병동 1만 개를 동시에 봐줄 수 있어요?", yes: "콜벨 0.1초 응답", line: "전 병동 라운딩 완료", space: true },
  { name: "차원 이동 약사", icon: "🌀", sprite: "lab", hire: 1e25, bonus: 20000, ask: "이 우주엔 없는 약이 필요해요", yes: "옆 우주에서 가져올게요", line: "7번 차원 재고 확인!", space: true },
  { name: "다중우주 병원장", icon: "♾️", sprite: "director", hire: 1e26, bonus: 30000, ask: "모든 우주의 메디화이트를 맡아주세요", yes: "무한 분원, 무한 회식", line: "오늘 회의는 전 우주 동시" , space: true },
];
export const staffCost = (i: number, lv: number) => Math.round(STAFF[i].hire * Math.pow(1.07, lv));
/** 직원 1레벨당 초당 매출 (기본) */
export const staffBase = (i: number) => STAFF[i].hire * .006;
/** 25레벨마다 그 직원 매출 2배 (고용비 1.07^25 ≈ 5.4배보다 느리지만, 병원 확장·복지·환생이 메워요) */
export const STAFF_STEP = 25;
export const staffStepMult = (lv: number) => Math.pow(2, Math.floor(lv / STAFF_STEP));

/* ---------- 부동산 (판매가 = 구매가 + 보유 초 × 상승액) ---------- */
export type Asset = { name: string; icon: string; price: number; grow: number; space?: boolean };
export const PROPS: Asset[] = [
  { name: "개원 상가 한 칸", icon: "🏠", price: 2e8, grow: 3e5 },
  { name: "30평 의원 자리", icon: "🏢", price: 5e8, grow: 5e5 },
  { name: "메디컬 상가 1층", icon: "🏬", price: 1e9, grow: 1e6 },
  { name: "5층 메디컬빌딩", icon: "🏢", price: 2e9, grow: 2e6 },
  { name: "10층 병원빌딩", icon: "🏙️", price: 5e9, grow: 3e6 },
  { name: "20층 메디컬타워", icon: "🌆", price: 1e10, grow: 5e6 },
  { name: "50층 메디시티 타워", icon: "🌃", price: 1e11, grow: 7e6 },
  { name: "강남 메디컬 복합단지", icon: "🏯", price: 1e12, grow: 5e7 },
  { name: "송도 바이오 클러스터", icon: "🧬", price: 1e13, grow: 4e8 },
  { name: "제주 의료관광 리조트", icon: "🏝️", price: 1e14, grow: 3e9 },
  { name: "두바이 메디컬 시티 지분", icon: "🕌", price: 1e15, grow: 2e10 },
  { name: "맨해튼 병원 타워", icon: "🗽", price: 1e16, grow: 1.5e11 },
  { name: "우주 엘리베이터 지상역", icon: "🛗", price: 1e18, grow: 1e13 },
  // ── 우주 부동산 (달 기지 의원부터) ──
  { name: "달 분화구 분양지", icon: "🌕", price: 1e20, grow: 1e15, space: true },
  { name: "궤도 호텔 '별빛'", icon: "🛎️", price: 5e20, grow: 4e15, space: true },
  { name: "우주정거장 메디포트", icon: "🛰️", price: 1e21, grow: 8e15, space: true },
  { name: "화성 돔시티 한 구역", icon: "🔴", price: 1e22, grow: 6e16, space: true },
  { name: "소행성 희귀광물 광산", icon: "☄️", price: 1e23, grow: 5e17, space: true },
  { name: "타이탄 메탄 리조트", icon: "🟠", price: 1e24, grow: 4e18, space: true },
  { name: "다이슨 스피어 1구역", icon: "☀️", price: 1e26, grow: 3e20, space: true },
  { name: "웜홀 톨게이트 운영권", icon: "🕳️", price: 1e28, grow: 2e22, space: true },
];
/** 리모델링: 그 건물을 갖고 있어야 해요. 벽돌을 모아 완성하면 전체 초당 매출 버프 */
export const REMODEL = [{ bricks: 1e6, buff: 5 }, { bricks: 3e6, buff: 10 }, { bricks: 5e6, buff: 15 }, { bricks: 1e7, buff: 20 }, { bricks: 3e7, buff: 25 }, { bricks: 5e7, buff: 30 }, { bricks: 2e8, buff: 35 }, { bricks: 5e8, buff: 40 }, { bricks: 1e9, buff: 45 }, { bricks: 3e9, buff: 50 }, { bricks: 1e10, buff: 55 }, { bricks: 3e10, buff: 60 }, { bricks: 1e11, buff: 70 }, { bricks: 3e11, buff: 80 }, { bricks: 1e12, buff: 90 }, { bricks: 3e12, buff: 100 }, { bricks: 1e13, buff: 110 }, { bricks: 3e13, buff: 120 }, { bricks: 1e14, buff: 130 }, { bricks: 3e14, buff: 150 }, { bricks: 1e15, buff: 170 }];
export const WORKER_BRICKS = 100; // 일꾼 1명 초당 벽돌
export const workerCost = (n: number) => Math.round(1e8 * Math.pow(1.3, Math.max(0, n - 3)));

/* ---------- 미술품 (판매가 = 구매가 + 보유 초 × 상승액) ---------- */
export const ARTS: Asset[] = [
  { name: "별 헤는 밤의 당직실", icon: "🌌", price: 2e11, grow: 2e7 },
  { name: "청진기를 든 소녀", icon: "👧", price: 3e11, grow: 3e7 },
  { name: "인계 시간의 절규", icon: "😱", price: 4e11, grow: 4e7 },
  { name: "메롱하는 수액병", icon: "😜", price: 5e11, grow: 5e7 },
  { name: "왜 또 나만 나이트", icon: "🌙", price: 6e11, grow: 6e7 },
  { name: "결혼할 수 있을까 (간호사 편)", icon: "💍", price: 7e11, grow: 7e7 },
  { name: "미소 짓는 수간호사", icon: "🖼️", price: 4e13, grow: 4e9 },
  { name: "수술실의 진주 귀걸이", icon: "🦪", price: 1e14, grow: 1e10 },
  { name: "최후의 회진", icon: "🍷", price: 1e15, grow: 1e11 },
  { name: "나이트 근무자들 (카페 테라스)", icon: "☕", price: 1e16, grow: 1e12 },
  { name: "황금 청진기 (실물 금)", icon: "🥇", price: 1e17, grow: 1e13 },
  { name: "병원 천장화 '퇴근의 창조'", icon: "⛪", price: 1e18, grow: 1e14 },
  // ── 우주 미술품 ──
  { name: "외계인이 그린 모나리자", icon: "👽", price: 1e21, grow: 1e17, space: true },
  { name: "무중력의 절규", icon: "😱", price: 1e22, grow: 1e18, space: true },
  { name: "블랙홀 앞의 당직실", icon: "🕳️", price: 1e23, grow: 1e19, space: true },
  { name: "별먼지로 그린 수간호사", icon: "✨", price: 1e24, grow: 1e20, space: true },
  { name: "은하 지도 태피스트리", icon: "🌌", price: 1e26, grow: 1e22, space: true },
  { name: "빅뱅 순간의 콜벨 (유일본)", icon: "💥", price: 1e28, grow: 1e24, space: true },
];

/* ---------- 직원 복지 (보유 시 원장 진료 보너스) — 직원 30레벨 이상부터 ---------- */
export type Perk = { name: string; icon: string; price: number; bonus: number; noSell?: boolean; space?: boolean };
export const PERKS: Perk[] = [
  { name: "직원 휴게실", icon: "🛋️", price: 5e11, bonus: 100 },
  { name: "직원 기숙사", icon: "🏘️", price: 6e11, bonus: 150 },
  { name: "사내 어린이집", icon: "🧸", price: 7e11, bonus: 200 },
  { name: "직원 헬스장", icon: "🏋️", price: 8e11, bonus: 250 },
  { name: "직원 풋살장", icon: "⚽", price: 9e11, bonus: 300 },
  { name: "첨단 의학연구소", icon: "🔬", price: 1e12, bonus: 350 },
  { name: "부속 재활병원", icon: "🏥", price: 5e12, bonus: 400 },
  { name: "직원 오락실", icon: "🕹️", price: 1e13, bonus: 500 },
  { name: "직원 전용 테마파크", icon: "🎢", price: 5e13, bonus: 600 },
  { name: "사내 웨딩홀", icon: "💒", price: 1e14, bonus: 700 },
  { name: "영원한 약속", icon: "💍", price: 2e14, bonus: 1000, noSell: true },
  { name: "간호대학 설립", icon: "🏫", price: 1e17, bonus: 3000 },
  { name: "백만 평 메디컬 캠퍼스", icon: "🌳", price: 1e18, bonus: 4000 },
  { name: "직원 골프장", icon: "⛳", price: 1e19, bonus: 5000 },
  { name: "직원 전용 호텔", icon: "🏨", price: 1e20, bonus: 6000 },
  { name: "최첨단 의과대학", icon: "🎓", price: 1e21, bonus: 7000 },
  { name: "만능 청진기 패키지", icon: "🩺", price: 1e22, bonus: 10000 },
  // ── 우주 복지 ──
  { name: "우주 직원 휴게 돔", icon: "🫧", price: 1e23, bonus: 15000, space: true },
  { name: "무중력 헬스장", icon: "🏋️", price: 1e24, bonus: 20000, space: true },
  { name: "화성 직원 리조트", icon: "🏖️", price: 1e25, bonus: 30000, space: true },
  { name: "시간 정지 휴가 캡슐", icon: "⏸️", price: 1e26, bonus: 50000, space: true },
  { name: "복제 인력 연구소 (야근 대신 복제본)", icon: "🧫", price: 1e27, bonus: 70000, space: true },
  { name: "은하 평생 연금", icon: "💎", price: 1e28, bonus: 100000, space: true },
  { name: "다중우주 복지 재단", icon: "♾️", price: 1e30, bonus: 150000, space: true },
];

/* ---------- 인수: 기업 · 도시(분원) · 행성(우주병원). 보유 시 초당 수입 = 가격 × 0.000001 ---------- */
export const YIELD = 1e-6;
export const CORPS: Asset[] = [
  ["동네약국 체인", 1e13], ["메디택시", 2e13], ["붕대왕 제약", 3e13], ["폭소 헬스케어", 5e13], ["스타벅스 아닌 스타약국", 1e14], ["도요타 아닌 도요휠체어", 2e14],
  ["넷플릭스 아닌 넷플수액", 3e14], ["버거 말고 버거킹 영양식", 5e14], ["콜라 대신 링거콜라", 1e15], ["텐텐 바이오", 2e15], ["페이스 마스크북", 3e15],
  ["구구 헬스 검색", 5e15], ["아마도 메디존", 1e16], ["마이크로 헬스소프트", 2e16], ["사과 메디컬", 3e16],
].map(([name, price]) => ({ name: name as string, icon: "🏭", price: price as number, grow: 0 }));
export const CITIES: Asset[] = [
  ["타이베이", 1e18], ["시드니", 5e18], ["파리", 1e19], ["런던", 5e19], ["홍콩", 1e20], ["싱가포르", 9.99999e20], ["도쿄", 1e22], ["베이징", 2e22], ["뉴욕", 3e22], ["서울", 5e22],
].map(([name, price]) => ({ name: `${name} 분원`, icon: "🌏", price: price as number, grow: 0 }));
export const PLANETS: Asset[] = [
  ["수성", 1e20], ["금성", 2e20], ["화성", 3e20], ["목성", 5e20], ["토성", 1e21], ["천왕성", 2e21], ["해왕성", 3e21],
].map(([name, price]) => ({ name: `${name} 우주병원`, icon: "🪐", price: price as number, grow: 0 }));
export const STARS: Asset[] = [
  ["알파 센타우리", 1e25], ["시리우스", 2e25], ["베가", 5e25], ["베텔게우스", 1e26], ["리겔", 2e26], ["폴라리스", 5e26],
].map(([name, price]) => ({ name: `${name} 항성계 병원`, icon: "⭐", price: price as number, grow: 0, space: true }));
export const GALAXIES: Asset[] = [
  ["안드로메다", 1e27], ["삼각형자리", 2e27], ["소마젤란", 5e27], ["대마젤란", 1e28], ["소용돌이", 2e28], ["솜브레로", 5e28],
].map(([name, price]) => ({ name: `${name} 은하 의료연합`, icon: "🌌", price: price as number, grow: 0, space: true }));
export const VERSES: Asset[] = [
  ["평행우주 #2", 1e30], ["평행우주 #7", 3e30], ["거울우주", 1e31], ["시간 역행 우주", 3e31], ["꿈의 우주", 1e32], ["최초의 우주", 1e33],
].map(([name, price]) => ({ name: `${name} 메디화이트`, icon: "♾️", price: price as number, grow: 0, space: true }));

/* ---------- 특별 손님 · 도우미 · 펫 · 환생 ---------- */
export const HELPER_UNLOCK = 1e8;
export const vipDrop = (lv: number) => Math.min(100, 30 + lv); // 황금 왕진가방 드랍률 %
export const helperTps = (lv: number) => 9 + lv, helperDur = (lv: number) => 9 + lv, helperCd = (lv: number) => Math.max(10, 310 - 10 * Math.max(1, lv));
export const helperUp = (lv: number) => Math.max(1, Math.round((lv + 1) / 2)); // 💊 비용
export const PETS = [
  { key: "dog", name: "부지런한 치료견", icon: "🐕", desc: "원장 진료(클릭) +20%" },
  { key: "cat", name: "행운의 병원 고양이", icon: "🐈", desc: "부동산·미술품 값 오르는 속도 +20%" },
  { key: "ham", name: "똘똘한 햄스터", icon: "🐹", desc: "접속 안 한 동안 매출 +50%" },
  { key: "tur", name: "행운의 거북이", icon: "🐢", desc: "💊 영양제 나올 확률 +20%" },
  { key: "par", name: "수다쟁이 앵무새", icon: "🦜", desc: "황금 왕진가방이 더 자주 와요 (+20%)" },
  { key: "gor", name: "특별한 고릴라", icon: "🦍", desc: "레어템(레벨업 쿠폰) 확률 +20%" },
] as const;
export type PetKey = typeof PETS[number]["key"];
export const PET_COST = 15;
export const REBIRTH_LV = 300;
/** 환생 보너스: 원장 레벨 5마다 +1%p (최소 1%p) */
export const rebirthGain = (clickLv: number, hosp = 0) => Math.max(1, Math.floor(clickLv / 5)) + Math.max(0, hosp - (SPACE_TIER - 1)) * 30;
/** 환생(병원 매각) 가능: 원장 Lv300 또는 화성 종합병원 이상 */
export const canRebirth = (s: { clickLv: number; hosp?: number }) => s.clickLv >= REBIRTH_LV || (s.hosp ?? 0) >= SPACE_TIER + 1;
export const OFFLINE_CAP = 8 * 3600, OFFLINE_RATE = .5;

/* ---------- 내 집 (꾸미기용, 시즌 2에서 유지) ---------- */
export type Home = { name: string; price: number; area: string; wall: string; floor: string; view: "wall" | "alley" | "city" | "river" | "nightriver" | "garden" | "space" | "mars" | "orbit"; space?: boolean };
export const HOMES: Home[] = [
  { name: "고시원", price: 0, area: "신림동", wall: "#D9D4C7", floor: "#B9A98A", view: "wall" },
  { name: "원룸", price: 200_000_000, area: "관악구", wall: "#EDE7DA", floor: "#C8B08A", view: "alley" },
  { name: "오피스텔", price: 400_000_000, area: "마포구", wall: "#F2F0EA", floor: "#B48A5E", view: "city" },
  { name: "아파트 24평", price: 800_000_000, area: "노원구", wall: "#F4F1EA", floor: "#A57A50", view: "city" },
  { name: "아파트 34평", price: 1_800_000_000, area: "마포구", wall: "#F6F3EE", floor: "#8C6340", view: "city" },
  { name: "한강뷰 아파트", price: 4_000_000_000, area: "성수동", wall: "#F7F6F2", floor: "#6E4B2E", view: "river" },
  { name: "아파트 34평", price: 5_500_000_000, area: "반포동", wall: "#FAF8F4", floor: "#E8E2D6", view: "river" },
  { name: "고급 빌라", price: 12_000_000_000, area: "한남동", wall: "#F3EFE6", floor: "#D9CFBF", view: "nightriver" },
  { name: "한강 펜트하우스", price: 25_000_000_000, area: "성수동", wall: "#1E2328", floor: "#2E2A26", view: "nightriver" },
  { name: "단독 저택", price: 40_000_000_000, area: "성북동", wall: "#EFE9DD", floor: "#C9B48E", view: "garden" },
  { name: "더힐 펜트하우스", price: 1e11, area: "한남동", wall: "#F4F1EC", floor: "#8C6A4A", view: "nightriver" },
  { name: "프라이빗 섬 저택", price: 5e11, area: "제주", wall: "#F8F6F0", floor: "#D8CBB4", view: "garden" },
  { name: "센트럴파크 펜트하우스", price: 1e12, area: "뉴욕", wall: "#F2F2F0", floor: "#4A4038", view: "nightriver" },
  { name: "팜 아일랜드 대저택", price: 1e13, area: "두바이", wall: "#FBF7EE", floor: "#E9DFCC", view: "garden" },
  { name: "요트 저택", price: 1e14, area: "모나코", wall: "#F6F8FA", floor: "#CFC4B2", view: "river" },
  { name: "전용 섬 리조트", price: 1e15, area: "하와이", wall: "#FFFDF7", floor: "#D9C7A6", view: "garden" },
  { name: "고성(古城)", price: 1e16, area: "스코틀랜드", wall: "#D8D2C6", floor: "#7B6B5A", view: "garden" },
  { name: "달 돔하우스", price: 1e20, area: "고요의 바다", wall: "#E8ECF2", floor: "#C9D1DC", view: "space", space: true },
  { name: "붉은 사막 저택", price: 1e21, area: "화성", wall: "#F5E9E1", floor: "#D4BCAB", view: "mars", space: true },
  { name: "궤도 유리 빌라", price: 1e22, area: "지구 궤도", wall: "#EDF1F6", floor: "#C2CAD5", view: "orbit", space: true },
  { name: "수중 저택", price: 1e23, area: "유로파", wall: "#EAF2F8", floor: "#C4D6E3", view: "space", space: true },
  { name: "고리 전망대 저택", price: 1e24, area: "토성", wall: "#F3EEE4", floor: "#D8CDB8", view: "orbit", space: true },
  { name: "개인 행성", price: 1e26, area: "내 이름을 딴 행성", wall: "#ECE8FB", floor: "#CBC3EF", view: "space", space: true },
  { name: "개인 항성계", price: 1e28, area: "은하 외곽", wall: "#F0EEFF", floor: "#B9B0E8", view: "space", space: true },
];
export type Tier = { name: string; price: number; icon: string };
export type Slot = { key: string; label: string; cat: "furn" | "art" | "car"; tiers: Tier[] };
export const SLOTS: Slot[] = [
  { key: "sofa", label: "소파", cat: "furn", tiers: [{ name: "리클라이너 1인", price: 8e5, icon: "🪑" }, { name: "가죽 3인 소파", price: 4e6, icon: "🛋️" }, { name: "이탈리아 명품 소파", price: 3e7, icon: "🛋️" }, { name: "하이엔드 모듈 소파", price: 1.2e8, icon: "🛋️" }, { name: "24K 금 소파", price: 1e10, icon: "🛋️" }, { name: "반중력 소파", price: 1e20, icon: "🛋️" }] },
  { key: "tv", label: "TV·가전", cat: "furn", tiers: [{ name: "55인치 TV", price: 1e6, icon: "📺" }, { name: "85인치 OLED", price: 8e6, icon: "📺" }, { name: "가전 풀세트", price: 4e7, icon: "📺" }, { name: "110인치 마이크로LED", price: 1.7e8, icon: "📺" }, { name: "홈시네마 룸", price: 5e9, icon: "🎬" }, { name: "홀로그램 극장", price: 1e20, icon: "📺" }] },
  { key: "table", label: "식탁", cat: "furn", tiers: [{ name: "원목 4인 식탁", price: 1.5e6, icon: "🍽️" }, { name: "대리석 8인 식탁", price: 1.5e7, icon: "🍽️" }, { name: "디자이너 다이닝 테이블", price: 6e7, icon: "🍽️" }, { name: "전속 셰프 다이닝", price: 1e10, icon: "👨‍🍳" }, { name: "분자요리 합성기", price: 1e20, icon: "🍽️" }] },
  { key: "bed", label: "침대", cat: "furn", tiers: [{ name: "기본 침대", price: 1e6, icon: "🛏️" }, { name: "프리미엄 매트리스", price: 1e7, icon: "🛏️" }, { name: "스웨덴 수제 침대", price: 2e8, icon: "🛏️" }, { name: "수면 캡슐 스위트", price: 1e10, icon: "🛏️" }, { name: "무중력 침대", price: 1e20, icon: "🛏️" }] },
  { key: "light", label: "조명", cat: "furn", tiers: [{ name: "LED 스탠드", price: 5e5, icon: "💡" }, { name: "디자이너 펜던트", price: 8e6, icon: "💡" }, { name: "크리스탈 샹들리에", price: 1e8, icon: "💡" }, { name: "오로라 조명 시스템", price: 1e10, icon: "💡" }, { name: "작은 인공 태양", price: 1e20, icon: "☀️" }] },
  { key: "plant", label: "식물", cat: "furn", tiers: [{ name: "몬스테라 화분", price: 1e5, icon: "🪴" }, { name: "올리브 나무", price: 2e6, icon: "🌳" }, { name: "실내 정원", price: 1e9, icon: "🌴" }, { name: "외계 발광 식물", price: 1e20, icon: "🪻" }] },
  { key: "fridge", label: "냉장고·주방", cat: "furn", tiers: [{ name: "소형 냉장고", price: 4e5, icon: "🧊" }, { name: "양문형 냉장고", price: 3e6, icon: "🧊" }, { name: "빌트인 프리미엄 주방", price: 5e7, icon: "🍳" }, { name: "와인셀러 + 셰프 키친", price: 1e9, icon: "🍷" }, { name: "자동 요리 주방", price: 1e20, icon: "🍳" }] },
  { key: "washer", label: "세탁·청소", cat: "furn", tiers: [{ name: "통돌이 세탁기", price: 3e5, icon: "🫧" }, { name: "드럼 세탁기 + 건조기", price: 3e6, icon: "🧺" }, { name: "로봇청소기 + 스타일러", price: 2e7, icon: "🤖" }, { name: "가사 로봇", price: 1e9, icon: "🦾" }, { name: "나노 청소 안개", price: 1e20, icon: "✨" }] },
  { key: "bath", label: "욕실", cat: "furn", tiers: [{ name: "샤워부스", price: 5e5, icon: "🚿" }, { name: "욕조 + 비데", price: 5e6, icon: "🛁" }, { name: "히노키 욕조", price: 6e7, icon: "🛁" }, { name: "프라이빗 스파", price: 2e9, icon: "♨️" }, { name: "무중력 스파 캡슐", price: 1e20, icon: "🫧" }] },
  { key: "desk", label: "서재·작업실", cat: "furn", tiers: [{ name: "책상 + 의자", price: 3e5, icon: "🪑" }, { name: "모션데스크 + 듀얼모니터", price: 4e6, icon: "🖥️" }, { name: "원목 서재", price: 8e7, icon: "📚" }, { name: "개인 도서관", price: 5e9, icon: "📖" }, { name: "홀로그램 연구실", price: 1e20, icon: "🧠" }] },
  { key: "art", label: "벽 그림", cat: "art", tiers: [{ name: "신진작가 판화", price: 3e6, icon: "🖼️" }, { name: "중견작가 유화", price: 5e7, icon: "🖼️" }, { name: "해외 팝아트 판화", price: 3e8, icon: "🖼️" }, { name: "단색화 대작", price: 2e9, icon: "🖼️" }, { name: "근대 거장 추상화", price: 1.3e10, icon: "🖼️" }, { name: "인상파 거장 진품", price: 1e12, icon: "🖼️" }, { name: "외계 문명 벽화", price: 1e21, icon: "🖼️" }] },
  { key: "sculpt", label: "조각", cat: "art", tiers: [{ name: "브론즈 소품", price: 1e7, icon: "🗿" }, { name: "현대 조각 설치작", price: 8e8, icon: "🗿" }, { name: "르네상스 대리석상", price: 1e12, icon: "🗿" }, { name: "반물질 조각", price: 1e22, icon: "🗿" }] },
  { key: "car", label: "내 차", cat: "car", tiers: [{ name: "경차", price: 1.5e7, icon: "🚗" }, { name: "아반떼", price: 2.5e7, icon: "🚗" }, { name: "그랜저", price: 4.5e7, icon: "🚙" }, { name: "제네시스 G90", price: 1.3e8, icon: "🚘" }, { name: "벤츠 S클래스", price: 2e8, icon: "🚘" }, { name: "포르쉐 911", price: 2.5e8, icon: "🏎️" }, { name: "롤스로이스 고스트", price: 6e8, icon: "🚘" }, { name: "부가티 시론", price: 5e9, icon: "🏎️" }, { name: "코닉세그 제스코", price: 1e10, icon: "🏎️" }, { name: "전용 헬기", price: 3e10, icon: "🚁" }, { name: "걸프스트림 전용기", price: 1e11, icon: "✈️" }, { name: "120m 슈퍼요트", price: 1e12, icon: "🛥️" }, { name: "보잉 비즈니스젯", price: 5e12, icon: "🛩️" }, { name: "우주왕복선", price: 1e20, icon: "🚀" }, { name: "개인 우주선", price: 1e22, icon: "🛸" }, { name: "워프 요트", price: 1e24, icon: "🌠" }, { name: "텔레포터", price: 1e26, icon: "🌀" }] },
];

/* ---------- 저장 ---------- */
export type Saved = {
  v: number; cash: number; total: number; patients: number; lastSeen: number;
  clickLv: number; staff: number[];
  props: Record<number, number>; arts: Record<number, number>; // idx → 산 시각(ms)
  bricks: number; workers: number; remodel: number; // 완료한 리모델링 수(순서대로)
  perks: number[]; corps: number[]; cities: number[]; planets: number[]; stars?: number[]; galaxies?: number[]; verses?: number[]; hospV?: number;
  vipOn: boolean; vipLv: number; vipSeen: number; helperOn: boolean; helperLv: number; helperAt: number;
  pills: number; bags: number; coupons: Record<string, number>; pets: string[]; pet: string | null;
  rebirths: number; rebirthBonus: number; hosp?: number; staffV?: number;
  home: number; items: Record<string, number>;
};
export const fresh = (keep?: Partial<Saved>): Saved => ({
  v: VERSION, cash: 0, total: 0, patients: 0, lastSeen: Date.now(), clickLv: 0, staff: STAFF.map(() => 0),
  props: {}, arts: {}, bricks: 0, workers: 0, remodel: 0, perks: [], corps: [], cities: [], planets: [], stars: [], galaxies: [], verses: [], hospV: 2,
  vipOn: false, vipLv: 0, vipSeen: 0, helperOn: false, helperLv: 1, helperAt: 0, pills: 0, bags: 0, coupons: {}, pets: [], pet: null,
  rebirths: 0, rebirthBonus: 0, staffV: 2, home: 0, items: {}, ...keep,
});
export const isCurrent = (x: any): x is Saved => !!x && x.v === VERSION && typeof x.cash === "number" && Array.isArray(x.staff);

export const fmt = (n: number) => {
  n = Math.floor(n); const a = Math.abs(n);
  const U: [number, string][] = [[1e68, "무량대수"], [1e64, "불가사의"], [1e60, "나유타"], [1e56, "아승기"], [1e52, "항하사"], [1e48, "극"], [1e44, "재"], [1e40, "정"], [1e36, "간"], [1e32, "구"], [1e28, "양"], [1e24, "자"], [1e20, "해"], [1e16, "경"], [1e12, "조"]];
  for (const [u, s] of U) if (a >= u) { const v = n / u; return (v >= 100 ? Math.floor(v).toLocaleString() : v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, "")) + s; }
  if (a >= 1e8) { const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4); return eok.toLocaleString() + "억" + (man && eok < 100 ? " " + man.toLocaleString() + "만" : ""); }
  if (a >= 1e4) return Math.floor(n / 1e4).toLocaleString() + "만" + (a < 1e5 && n % 1e4 ? " " + (n % 1e4).toLocaleString() : "");
  return n.toLocaleString();
};

/* ---------- 계산 ---------- */
export const milestoneSum = (s: Saved) => s.staff.reduce((a, lv, i) => a + (lv >= 20 ? STAFF[i].bonus : 0), 0);
export const remodelBuff = (s: Saved) => REMODEL.slice(0, s.remodel).reduce((a, r) => a + r.buff, 0);
export const perkSum = (s: Saved) => s.perks.reduce((a, i) => a + PERKS[i].bonus, 0);
export const staffMine = (i: number, mine: string) => !!STAFF[i].dept && (STAFF[i].dept === mine || (mine === "간호" && STAFF[i].dept === "간호사"));
/** 직원 한 명(그 레벨)의 초당 매출 */
export const staffRate = (s: Saved, i: number, mine: string) => staffBase(i) * s.staff[i] * staffStepMult(s.staff[i]) * (staffMine(i, mine) ? 1.2 : 1);
/** 초당 매출 */
/* ---------- 병원 규모 (폐허의원 → 수도권 대학병원) ---------- */
export const HOSP_TIERS = [
  { name: "폐허의원", price: 0, desc: "벌레·거미줄 가득한 망하기 직전 의원" },
  { name: "촌구석 보건의원", price: 1e7, desc: "읍·면·리 시골 의원" },
  { name: "지방 작은의원", price: 1e8, desc: "읍내 상가 2층 의원" },
  { name: "수도권 작은의원", price: 1e9, desc: "신도시 메디컬 상가" },
  { name: "서울 강남의원", price: 1e10, desc: "강남대로 고급 클리닉" },
  { name: "지방병원", price: 1e11, desc: "병상 100개 종합병원" },
  { name: "서울병원", price: 1e12, desc: "서울 도심 대형병원" },
  { name: "지방 대학병원", price: 1e13, desc: "의과대학 부속병원" },
  { name: "수도권 대학병원", price: 1e14, desc: "한강이 보이는 초대형 대학병원" },
  { name: "전국 병원그룹", price: 1e15, desc: "전국 12개 분원을 거느린 병원그룹" },
  { name: "아시아 메디컬 허브", price: 1e16, desc: "아시아 전역에서 환자가 몰려오는 허브 병원" },
  { name: "글로벌 병원재단", price: 1e17, desc: "5대륙 분원 · 노벨상 수상자 3명 재직" },
  { name: "우주의학 연구병원", price: 1e18, desc: "우주비행사 전담 · 발사장 옆 병원" },
  { name: "우주 엘리베이터 클리닉", price: 1e19, desc: "지상 3만 6천 km, 우주로 가는 마지막 정거장" },
  { name: "🌕 달 기지 의원", price: 1e20, desc: "지구가 창밖에 뜨는 첫 우주 의원 · 🚀 우주 시대 콘텐츠 해금!" },
  { name: "🔴 화성 종합병원", price: 1e21, desc: "붉은 사막 위 돔 병원 · 화성 가즈아!" },
  { name: "🪐 유로파 메디컬센터", price: 1e22, desc: "목성이 하늘을 가득 채우는 얼음 위성 병원" },
  { name: "🛰️ 궤도정거장 대학병원", price: 1e23, desc: "무중력 수술실이 있는 우주정거장" },
  { name: "🌌 은하연합 중앙병원", price: 1e24, desc: "온 은하의 환자가 찾아오는 병원" },
  { name: "⭐ 안드로메다 의료연합", price: 1e25, desc: "이웃 은하까지 왕진 가는 병원" },
  { name: "♾️ 다중우주 종합병원", price: 1e26, desc: "평행우주의 나도 여기서 진료받아요" },
  { name: "⏳ 시간선 통합 의료성", price: 1e27, desc: "과거·미래 환자를 동시에 보는 성(城)" },
  { name: "🔮 차원 병원", price: 1e28, desc: "11차원 어디서나 콜벨이 울려요" },
  { name: "🧿 창조의 병원", price: 1e30, desc: "우주가 아플 때 오는 곳" },
];
/** 15단계 이후는 끝없이 이어져요: 초월 병원 N (가격 ×10씩, 매출 +30%씩) */
export const hospTier = (n: number) => n < HOSP_TIERS.length ? HOSP_TIERS[n] : { name: `🌠 초월 병원 ${["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"][(n - HOSP_TIERS.length) % 10]}${n - HOSP_TIERS.length >= 10 ? ` (${Math.floor((n - HOSP_TIERS.length) / 10) + 1}기)` : ""}`, price: 1e30 * Math.pow(10, n - HOSP_TIERS.length + 1), desc: "존재하는 모든 것이 환자인 병원 · 끝은 없어요" };
/** 우주 단계 시작 인덱스 (달 기지 의원) */
export const SPACE_TIER = 14;
/** 예전 저장(달=9)을 새 단계표(달=14)로 */
export const migrateHosp = (x: Saved): Saved => x.hospV === 2 ? x : { ...x, hosp: (x.hosp ?? 0) >= 9 ? (x.hosp ?? 0) + 5 : (x.hosp ?? 0), hospV: 2, stars: x.stars ?? [], galaxies: x.galaxies ?? [], verses: x.verses ?? [] };
/** 병원 규모마다 전체 초당 매출 +30% */
export const hospMult = (s: Saved) => 1 + .3 * (s.hosp ?? 0);
export function rateOf(s: Saved, mine: string) {
  let sum = 0; for (let i = 0; i < STAFF.length; i++) if (s.staff[i]) sum += staffRate(s, i, mine);
  sum *= (1 + milestoneSum(s) / 100) * (1 + remodelBuff(s) / 100) * (1 + s.rebirthBonus / 100) * hospMult(s);
  for (const i of s.corps) sum += CORPS[i].price * YIELD;
  for (const i of s.cities) sum += CITIES[i].price * YIELD;
  for (const i of s.planets) sum += PLANETS[i].price * YIELD;
  for (const i of s.stars ?? []) sum += STARS[i].price * YIELD; for (const i of s.galaxies ?? []) sum += GALAXIES[i].price * YIELD; for (const i of s.verses ?? []) sum += VERSES[i].price * YIELD;
  return sum;
}
export const dailyOf = (s: Saved, mine: string) => rateOf(s, mine) * DAY;
/** 클릭 1번 (연타 보너스 제외) */
export const clickOf = (s: Saved) => clickBase(s.clickLv) * (1 + perkSum(s) / 100) * (1 + milestoneSum(s) / 100) * (1 + s.rebirthBonus / 100) * (s.pet === "dog" ? 1.2 : 1);
export const growMult = (s: Saved) => s.pet === "cat" ? 1.2 : 1;
export const valueOf = (a: Asset, since: number, s: Saved, now = Date.now()) => a.price + a.grow * growMult(s) * Math.max(0, (now - since) / 1000);
/** 총자산 */
export function assetsOf(s: Saved, now = Date.now()) {
  let a = s.cash + HOMES[s.home].price;
  for (const [i, t] of Object.entries(s.props)) a += valueOf(PROPS[+i], t, s, now);
  for (const [i, t] of Object.entries(s.arts)) a += valueOf(ARTS[+i], t, s, now);
  for (const i of s.perks) if (!PERKS[i].noSell) a += PERKS[i].price;
  for (const i of s.corps) a += CORPS[i].price; for (const i of s.cities) a += CITIES[i].price; for (const i of s.planets) a += PLANETS[i].price; for (const i of s.stars ?? []) a += STARS[i].price; for (const i of s.galaxies ?? []) a += GALAXIES[i].price; for (const i of s.verses ?? []) a += VERSES[i].price;
  for (const sl of SLOTS) { const t = s.items[sl.key] ?? 0; if (t) a += sl.tiers[t - 1].price; }
  return a;
}
/** 내 직종 → 직원 직종 */
export const tycoonDept = (d: string) => d === "간호사" ? "간호사" : d === "간호조무사" ? "간호조무사" : d === "의사" ? "의사" : d;

/* ---------- 세금·복비 (현실 반영, 단순화) ---------- */
/** 양도소득세(지방세 포함) 누진: 과세표준 구간별 세율 ×1.1 */
const CGT: [number, number][] = [[1.4e7, .066], [5e7, .165], [8.8e7, .264], [1.5e8, .385], [3e8, .418], [5e8, .44], [1e9, .462], [Infinity, .495]];
export function capGainTax(gain: number) { if (gain <= 0) return 0; let t = 0, prev = 0; for (const [cap, r] of CGT) { const part = Math.min(gain, cap) - prev; if (part <= 0) break; t += part * r; prev = cap; } return Math.floor(t); }
/** 상가·건물: 취득세 4.6% + 복비 0.9% / 팔 때 복비 0.9% + 양도세 */
export const propBuyFee = (price: number) => ({ tax: Math.floor(price * .046), agent: Math.floor(price * .009) });
export const propSellFee = (value: number, price: number) => ({ tax: capGainTax(value - price), agent: Math.floor(value * .009) });
/** 미술품: 사고팔 때 경매 수수료 10%(낙찰·위탁) / 팔 때 기타소득세(필요경비 80% 인정 → 차익의 4.4%) */
export const artBuyFee = (price: number) => ({ tax: 0, agent: Math.floor(price * .1) });
export const artSellFee = (value: number, price: number) => ({ tax: Math.max(0, Math.floor((value - price) * .044)), agent: Math.floor(value * .1) });
/** 주택: 취득세 6억 이하 1.1% · 9억 이하 2.2% · 초과 3.3% / 복비 0.4~0.7% / 1주택 양도세 비과세 */
export const homeBuyFee = (price: number) => ({ tax: Math.floor(price * (price <= 6e8 ? .011 : price <= 9e8 ? .022 : .033)), agent: Math.floor(price * (price < 2e8 ? .005 : price < 9e8 ? .004 : price < 1.2e9 ? .005 : price < 1.5e9 ? .006 : .007)) });
export const homeSellAgent = (price: number) => homeBuyFee(price).agent;

/** 직원 순서 변경(총괄실장을 1억 자리로) 이전 저장분 옮기기 */
export function migrateStaff(x: Saved): Saved {
  if (Array.isArray(x.staff) && x.staff.length < STAFF.length) x = { ...x, staff: [...x.staff, ...Array(STAFF.length - x.staff.length).fill(0)] };
  if (x.staffV === 2 || !Array.isArray(x.staff)) return x;
  const o = x.staff, n = [...o]; n[8] = o[12] ?? 0; n[9] = o[9] ?? 0; n[10] = o[8] ?? 0; n[11] = o[10] ?? 0; n[12] = o[11] ?? 0;
  return { ...x, staff: n, staffV: 2 };
}
