-- 마이그레이션 22: 전체 공개 테이블 Row-Level Security(RLS) 일괄 활성화
-- Supabase 대시보드 SQL Editor에 붙여넣고 Run을 실행하세요.
-- 메디화이트 앱은 서버(service_role)로 통신하므로 기능 동작에 영향 없이 외부 익명 접근만 차단됩니다.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
