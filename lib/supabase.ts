import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 (service role). 클라이언트 컴포넌트에서 import 금지.
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 설정되지 않았어요 (.env.example 참고)");
  return createClient(url, key, { auth: { persistSession: false } });
}
