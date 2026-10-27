# 메디화이트웹

병원 직원 익명 커뮤니티. 아이디/비밀번호로 가입 → 실시간 채팅 · 직군별 익명 게시판 · 미니게임 · 군대 계급(경험치) 시스템.

- Next.js 14 (App Router) + Supabase (Postgres, Realtime)
- 인증은 자체 구현 (bcrypt 해시 + JWT 쿠키). Supabase Auth 안 씀.
- DB 접근은 전부 서버(service role)에서만. 브라우저 anon 키는 실시간 채널(채팅 브로드캐스트, 접속자 수)에만 사용.

## 1. Supabase 준비 (5분)
1. https://supabase.com → New project (리전 Northeast Asia (Seoul) 권장)
2. 좌측 **SQL Editor** → `supabase/schema.sql` 내용 전체 붙여넣고 Run
3. **Settings → API** 에서 아래 세 값 복사
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. 배포 (Vercel)
1. 이 폴더를 GitHub 새 저장소에 올리기 (예: `mediwhite`)
2. https://vercel.com → Add New Project → 해당 저장소 Import
3. **Environment Variables** 에 `.env.example` 의 6개 항목 입력
   - `SESSION_SECRET`: 아무 긴 랜덤 문자열 (터미널 `openssl rand -base64 32`)
   - `ADMIN_USERNAMES`: 관리자로 쓸 아이디 (예: `admin,eunkyung`). 이 아이디로 **가입하면** 자동으로 관리자.
4. Deploy → 끝. 도메인은 Vercel이 주는 `xxx.vercel.app` 또는 직접 연결.

## 3. 관리자 기능
- 게시글 열면 **상단 고정 / 고정 해제** 버튼 → 📌 공지로 목록 맨 위
- 아무 글/댓글이나 삭제 가능

## 4. 계급 / 경험치
`lib/ranks.ts` 에서 전부 조정 가능.
- 가입 보너스: 1~10번째 300 XP, ~30번째 150, ~100번째 80, 이후 30
- 반복: 채팅 2 XP(하루 60까지), 글 20, 댓글 10
- 1회성 퀘스트: 첫 채팅/글/댓글, 룰렛, 총알 피하기 10·20·30초, 검 +5·+10·+15
- 계급: 이병 → 일병 → 상병 → 병장 → 하사 → … → 대장 (18단계)
- **파트별 대장은 한 명**: 대장 경험치(15,500)를 채워도 파트 1위가 아니면 중장으로 표시
- 계급별 권한: 하사↑ 글 빛남 1 / 소위↑ 글 빛남 2 / 소령↑ 내 글 밀어올리기 / 준장↑ 공지 칸 작성 + ★ / 대장 금빛 글 + ★★★★
- 글·댓글 앞에 작성자 계급 배지, 계급 tier별 글 강조(빛남)
- 헤더 아래 실시간 띠: 진급 알림("OOO님이 OO으로 진급하셨습니다") + 오늘의 파트 총사령관(파트별 경험치 1위)

## 가입 / 소속
- 표시 이름은 `[소속]닉네임` (예: `[간호]홍길동`). 소속: 총괄 / 간호 / 원무과 / 임상병리 / 물리치료 / 방사선
- 소속은 가입 때 한 번만 선택. 바꾸려면 **계급 탭 맨 아래 회원탈퇴** 후 재가입 (글·댓글은 익명으로 남고 경험치·기록은 삭제)

## 로컬 실행
```
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```
