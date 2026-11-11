-- 마이그레이션 23: 소셜 간편 로그인/가입 (카카오·네이버·구글 OAuth 계정 연결)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run을 실행하세요. 여러 번 실행해도 안전합니다.
--
-- · oauth_provider/oauth_id: 외부 로그인 계정의 식별자. 값은 'kakao' | 'google' | 'naver'.
--   아이디·비밀번호 가입자는 null.
-- · password_hash: 소셜 가입자는 비밀번호가 없으므로 null을 허용합니다.
--   (아이디 로그인은 password_hash가 있는 계정만 통과합니다 — bcrypt 비교가 실패하므로 그대로 안전)
--
-- ※ 카카오 전용으로 먼저 실행했어도 그대로 다시 실행하면 됩니다 (세 제공자 공통 구조라 추가 마이그레이션 없음).

ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id text;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 같은 소셜 계정이 두 번 가입되지 않도록 (provider, oauth_id) 유일 인덱스 — 카카오·네이버·구글 공통
CREATE UNIQUE INDEX IF NOT EXISTS users_oauth_idx ON users (oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;

-- 확인용: select oauth_provider, count(*) from users where oauth_provider is not null group by 1;
-- 확인용: select username, nickname, dept, oauth_provider, oauth_id from users where oauth_provider is not null order by created_at desc;
