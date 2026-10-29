/** 방사선사 라운지 · 일반촬영 포지셔닝 요약 (교과서 표준 기준. 병원 프로토콜·장비 설정이 우선이에요) */
export type XrayExam = { part: string; name: string; pos: string; cr: string; sid?: string; breath?: string; check: string[]; tip?: string };
export const XRAY_PARTS = ["흉부", "복부", "두부", "경추", "요추·골반", "상지", "하지"] as const;
export const XRAY: XrayExam[] = [
  { part: "흉부", name: "Chest PA", pos: "기립. 앞가슴을 IR에 밀착, 턱을 들어 IR 위에 올리고 손등을 엉덩이에 대고 어깨를 앞으로 굴려 견갑골을 폐야 밖으로 빼요.", cr: "수평, T7 높이(견갑골 하각 높이) 정중시상면", sid: "180cm (72\")", breath: "깊게 들이마신 두 번째 흡기 후 정지", check: ["후늑골 10번 이상 횡격막 위로 보임", "양측 쇄골 내측단과 극돌기 간격 동일 = 회전 없음", "견갑골이 폐야 밖", "폐첨부~늑골횡격막각 모두 포함"], tip: "심장 확대를 줄이려면 PA·180cm가 기본. AP로 찍었으면 판독용으로 꼭 표시!" },
  { part: "흉부", name: "Chest Lateral", pos: "기립. 왼쪽 측면을 IR에 붙이고(심장 확대 최소화) 양팔을 머리 위로 올려 교차.", cr: "수평, T7 높이 중액와선(중관상면)", sid: "180cm", breath: "깊은 흡기 후 정지", check: ["양측 후늑골이 거의 겹침(1cm 이내)", "흉골이 정측면", "팔 연부조직이 폐야에 겹치지 않음"] },
  { part: "흉부", name: "Chest AP (Supine·Portable)", pos: "앙와위 또는 반좌위. 가능한 한 상체를 세우고 어깨를 앞으로 굴려요.", cr: "흉골에 수직이 되도록 3~5° 미측, 경정맥절흔 아래 8~10cm", sid: "가능한 최대(보통 100cm 이상)", breath: "흡기 정지 (인공호흡기는 흡기 타이밍)", check: ["쇄골이 폐첨부 위로 투영되면 각도 확인", "회전 없음", "AP·체위(supine/semierect) 표시"] },
  { part: "복부", name: "Abdomen AP (KUB, Supine)", pos: "앙와위, 무릎 밑 받침. 회전 없이 정중시상면을 테이블 중앙에.", cr: "수직, 장골능선 높이 정중선", sid: "100cm", breath: "호기 후 정지", check: ["신장 상극~치골결합 포함(체형에 따라 2장)", "장골 날개·폐쇄공 좌우 대칭", "요근 윤곽 보임"] },
  { part: "복부", name: "Abdomen Erect", pos: "기립(또는 앉은 자세). 촬영 전 최소 5분 세워 유리 공기·액면이 올라오게.", cr: "수평, 장골능선 약 5cm 위(횡격막 포함되게)", sid: "100cm", breath: "호기 후 정지", check: ["횡격막 돔이 반드시 포함 (유리 공기 확인)", "액면(air-fluid level) 보이면 수평 확인"], tip: "기립이 어려우면 왼쪽 측와위(Left lateral decubitus)로 대체." },
  { part: "두부", name: "Skull PA / Caldwell", pos: "엎드리거나 기립, 이마·코를 IR에 대고 OML을 IR에 수직.", cr: "PA: 0°로 비근점(nasion) 통과 / Caldwell: 15° 미측으로 비근점 통과", sid: "100cm", check: ["Caldwell: 추체릉이 안와 하 1/3에 투영", "안와 외측연과 두개골 외측 간격 좌우 동일"] },
  { part: "두부", name: "Waters (PA 두정이극)", pos: "턱을 IR에 대고 머리를 들어 OML이 IR과 37°(MML 수직).", cr: "수직, 비극(acanthion)으로 나가게", sid: "100cm", check: ["추체릉이 상악동 바로 아래", "상악동이 선명하게 좌우 대칭"], tip: "부비동은 액면 확인 위해 가능하면 기립 촬영." },
  { part: "두부", name: "Towne (AP 축)", pos: "앙와위, 턱을 당겨 OML을 IR에 수직.", cr: "30° 미측(IOML 기준이면 37°), 미간 약 6cm 위 입사 → 대후두공 통과", sid: "100cm", check: ["배안장(dorsum sellae)이 대후두공 안에 투영", "추체릉 좌우 대칭"] },
  { part: "경추", name: "C-spine AP", pos: "앙와위 또는 기립, 턱을 살짝 들어 교합면~후두 기저선이 일치.", cr: "15~20° 두측, 갑상연골(C4) 입사", sid: "100cm", check: ["C3~T2 포함", "극돌기가 추체 중앙에 일렬", "추간판 간격이 열려 보임"] },
  { part: "경추", name: "C-spine Lateral", pos: "기립 측면, 어깨를 최대한 내리고(필요하면 양손에 추) 턱을 살짝 듦.", cr: "수평, C4(갑상연골 높이)", sid: "150~180cm (거리 늘려 확대 감소)", breath: "호기 후 정지 (어깨 내려감)", check: ["C7~T1까지 보여야 함 (안 보이면 수영자 자세)", "하악지가 추체에 겹치지 않음", "후관절 겹쳐 보임"] },
  { part: "경추", name: "Odontoid (Open mouth)", pos: "앙와위, 입을 최대한 벌리고 상악 절치 끝~유양돌기 끝 선을 IR에 수직.", cr: "수직, 벌린 입 중앙", sid: "100cm", check: ["치돌기와 C1 외측괴가 상악 절치·후두골에 안 가림", "환추·축추 관절 좌우 대칭"], tip: "촬영 직전 '아~' 소리 내게 하면 혀가 내려가요." },
  { part: "요추·골반", name: "L-spine AP", pos: "앙와위, 무릎을 굽혀 요추 전만을 줄여요.", cr: "수직, 장골능선 높이(L4~5) 정중선 — L1~천골 포함", sid: "100cm", breath: "호기 후 정지", check: ["극돌기 정중앙 일렬(회전 없음)", "천장관절 좌우 동일 거리", "추간판 간격 열림"] },
  { part: "요추·골반", name: "L-spine Lateral", pos: "측와위, 무릎·고관절 굽히고 허리 밑에 받침을 넣어 척추를 테이블과 평행하게.", cr: "수직, 장골능선 높이 중관상면", sid: "100cm", breath: "호기 후 정지", check: ["추간공 열림", "후방 늑골·장골 겹침(회전 없음)", "L5~S1 관절 열림 (안 되면 따로 spot)"] },
  { part: "요추·골반", name: "Pelvis AP", pos: "앙와위, 양발 15~20° 내회전(대퇴경부가 길게 보이게).", cr: "수직, ASIS와 치골결합 중간(ASIS 아래 약 5cm) 정중선", sid: "100cm", check: ["양측 소전자가 거의 안 보이거나 대칭", "폐쇄공·장골 날개 좌우 대칭", "장골능선~대퇴 근위부 포함"], tip: "고관절 골절 의심이면 내회전 금지! 그대로 촬영." },
  { part: "요추·골반", name: "Hip AP", pos: "앙와위, 다리 15~20° 내회전.", cr: "수직, ASIS–치골결합 중점에서 수직선으로 2.5~5cm 아래(대퇴경부)", sid: "100cm", check: ["대퇴경부가 단축 없이 보임", "대전자 윤곽 보임, 소전자 거의 안 보임"] },
  { part: "상지", name: "Hand PA / Oblique", pos: "PA: 손바닥을 IR에, 손가락 살짝 벌림. Oblique: 엄지 쪽을 45° 들어 올림(손가락 받침으로 평행 유지).", cr: "수직, 3번째 중수지관절(MCP)", sid: "100cm", check: ["지절관절·MCP 관절 간격 열림", "Oblique: 중수골 몸통 겹침 최소"] },
  { part: "상지", name: "Wrist PA / Scaphoid", pos: "PA: 주먹 살짝 쥐어 손목을 IR에 밀착. Scaphoid: 척측 편위(ulnar deviation).", cr: "PA: 수직, 수근 중앙 / Scaphoid: 10~15° 근위(팔꿈치 쪽)", sid: "100cm", check: ["원위 요척관절 열림", "Scaphoid: 주상골이 단축 없이 길게"] },
  { part: "상지", name: "Shoulder AP (외회전·중립)", pos: "기립 또는 앙와위, 환측 견갑골을 IR에. 외회전 = 손바닥 앞, 중립 = 손바닥 허벅지.", cr: "수직, 오훼돌기 약 2cm 아래", sid: "100cm", breath: "호흡 정지", check: ["외회전: 대결절 측면 윤곽", "견갑상완 관절 부분적으로 보임"], tip: "외상·탈구 의심이면 회전시키지 말고 Y-view 추가." },
  { part: "상지", name: "Elbow AP / Lateral", pos: "AP: 팔 완전 신전, 손바닥 위. Lateral: 90° 굴곡, 엄지 위로, 어깨를 낮춰 상완을 IR과 평행.", cr: "수직, 주관절 중앙(Lateral은 외상과 쪽)", sid: "100cm", check: ["Lateral: 상완골 원위부 동심원 3개(이중 윤곽 없음)", "지방체(fat pad) 확인 가능"] },
  { part: "하지", name: "Knee AP", pos: "앙와위, 다리 펴고 3~5° 내회전(슬개골 정중앙).", cr: "슬개골 첨부 1.25cm 아래. ASIS-테이블 거리 <19cm: 3~5° 미측, 19~24cm: 0°, >24cm: 3~5° 두측", sid: "100cm", check: ["대퇴·경골 관절면이 열려 보임", "슬개골이 대퇴 중앙", "비골두 일부가 경골과 겹침"] },
  { part: "하지", name: "Knee Lateral", pos: "환측 아래로 측와위, 20~30° 굴곡.", cr: "5~7° 두측, 내측 상과 2.5cm 아래", sid: "100cm", check: ["대퇴 내·외과 후연이 겹침", "슬개대퇴관절 열림"] },
  { part: "하지", name: "Ankle AP / Mortise", pos: "앙와위, 발목 배굴. Mortise: 다리 전체 15~20° 내회전(내·외과 잇는 선이 IR과 평행).", cr: "수직, 내·외과 중간", sid: "100cm", check: ["Mortise: 거골 주위 관절 간격이 고르게 열림", "원위 경비관절 열림"] },
  { part: "하지", name: "Foot AP / Oblique", pos: "무릎 굽혀 발바닥 IR에. Oblique: 30~40° 내회전.", cr: "AP: 10° 후방(발뒤꿈치 쪽), 3번째 중족골 기저부 / Oblique: 수직", sid: "100cm", check: ["AP: 1·2 중족골 기저부 간격 열림", "Oblique: 3~5 중족골 기저부 겹침 최소"] },
];
