/** 📖 의료 약어·용어 사전 — 신규·학생이 병동에서 제일 많이 듣는 것 위주 */
export const TERM_CATS: { k: string; name: string; icon: string; items: [string, string, string][] }[] = [
  { k: "vs", name: "활력징후·관찰", icon: "🩺", items: [
    ["V/S", "Vital Signs", "활력징후 (혈압·맥박·호흡·체온)"], ["BP", "Blood Pressure", "혈압"], ["HR / PR", "Heart Rate / Pulse Rate", "심박수 / 맥박수"], ["RR", "Respiratory Rate", "호흡수"],
    ["BT", "Body Temperature", "체온"], ["SpO₂", "Saturation of Peripheral Oxygen", "말초 산소포화도"], ["I/O", "Intake / Output", "섭취량·배설량"], ["BST", "Bedside Sugar Test", "손가락 채혈 혈당검사"],
    ["GCS", "Glasgow Coma Scale", "의식 수준 점수 (3~15점)"], ["NRS", "Numeric Rating Scale", "통증 점수 (0~10점)"], ["BWT", "Body Weight", "체중"]] },
  { k: "med", name: "투약", icon: "💊", items: [
    ["PO", "Per Os", "경구 투여 (입으로)"], ["IV", "Intravenous", "정맥 주사"], ["IM", "Intramuscular", "근육 주사"], ["SC / SQ", "Subcutaneous", "피하 주사"], ["SL", "Sublingual", "설하 투여 (혀 밑)"],
    ["PRN", "Pro Re Nata", "필요할 때마다"], ["STAT", "Statim", "즉시"], ["qd", "Quaque Die", "하루 1번"], ["bid", "Bis In Die", "하루 2번"], ["tid", "Ter In Die", "하루 3번"], ["qid", "Quater In Die", "하루 4번"],
    ["hs", "Hora Somni", "자기 전"], ["ac / pc", "Ante Cibum / Post Cibum", "식전 / 식후"], ["NPO", "Nil Per Os", "금식"], ["IVF", "Intravenous Fluid", "수액"],
    ["gtt", "Guttae", "방울 (수액 주입 속도 gtt/min)"], ["KVO", "Keep Vein Open", "정맥로만 유지하는 최소 속도"], ["PCA", "Patient-Controlled Analgesia", "자가 통증 조절기"], ["TPN", "Total Parenteral Nutrition", "완전 정맥 영양"]] },
  { k: "lab", name: "검사", icon: "🧪", items: [
    ["CBC", "Complete Blood Count", "일반 혈액 검사"], ["LFT", "Liver Function Test", "간 기능 검사"], ["BUN / Cr", "Blood Urea Nitrogen / Creatinine", "신장 기능 수치"], ["ABGA", "Arterial Blood Gas Analysis", "동맥혈 가스 분석"],
    ["U/A", "Urinalysis", "소변 검사"], ["C&S", "Culture & Sensitivity", "배양 및 항생제 감수성 검사"], ["PT / INR", "Prothrombin Time / International Normalized Ratio", "혈액 응고 검사"], ["CRP", "C-Reactive Protein", "염증 수치"],
    ["HbA1c", "Glycated Hemoglobin", "당화혈색소 (2~3개월 평균 혈당)"], ["EKG / ECG", "Electrocardiogram", "심전도"], ["CXR", "Chest X-Ray", "흉부 X선"], ["US / USG", "Ultrasonography", "초음파"]] },
  { k: "ward", name: "차트·병동 업무", icon: "📋", items: [
    ["Adm", "Admission", "입원"], ["D/C", "Discharge / Discontinue", "퇴원, 또는 처방 중단 (앞뒤 맥락으로 구분)"], ["Tf", "Transfer", "전동·전과"], ["OP", "Operation", "수술"], ["POD", "Post-Operative Day", "수술 후 며칠째"],
    ["Pre-op / Post-op", "Pre-/Post-Operative", "수술 전 / 수술 후"], ["F/U", "Follow Up", "추적 관찰"], ["R/O", "Rule Out", "감별이 필요한 진단 (의심)"], ["Dx / Tx", "Diagnosis / Treatment", "진단 / 치료"],
    ["Hx", "History", "병력"], ["C/C", "Chief Complaint", "주 호소 (환자가 온 이유)"], ["DNR", "Do Not Resuscitate", "심폐소생술 거부"], ["CPR", "Cardiopulmonary Resuscitation", "심폐소생술"],
    ["Foley", "Foley Catheter", "유치 도뇨관"], ["L-tube", "Levin Tube", "비위관 (코로 위까지)"], ["ABR", "Absolute Bed Rest", "절대 안정"], ["Amb", "Ambulation", "보행·걷기"], ["EMR", "Electronic Medical Record", "전자 의무 기록"]] },
  { k: "life", name: "병원 생활 말", icon: "🏥", items: [
    ["인계", "Handover", "근무 교대 때 환자 상태·할 일을 다음 근무자에게 넘기는 것"], ["프셉", "Preceptor", "신규를 1:1로 가르치는 선배 (프리셉터)"], ["듀티", "Duty", "근무 (데이·이브닝·나이트)"],
    ["오프", "Off", "쉬는 날"], ["액팅 / 차지", "Acting / Charge", "환자를 직접 맡는 간호사 / 병동 전체를 조율하는 책임 간호사"], ["노티", "Notify", "담당의에게 환자 상태를 보고하는 것"],
    ["라운딩", "Rounding", "회진, 또는 병실을 돌며 환자 상태를 확인하는 것"], ["나이트 킵", "Night Keep", "나이트 근무만 연속으로 하는 것 (나이트 전담)"], ["오버타임", "Overtime", "근무 시간 넘겨서 일한 것 (OT)"]] },
];
