-- 2차 업데이트: Supabase SQL Editor에 붙여넣고 Run
alter table users add column if not exists bio text not null default '';
alter table users add column if not exists referred_by text;
alter table users add column if not exists stealth boolean not null default false;  -- 계급표·접속자에 안 보임(관리자 분신용)
alter table xp_log add column if not exists kind text;                               -- chat/post/comment/referral/quest/admin
create index if not exists xp_log_user_day on xp_log(user_id, created_at desc);

-- 파트별 게시판 탭 (파트 리더가 신설)
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  dept text not null,
  name text not null check (char_length(name) <= 20),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dept, name)
);
alter table boards enable row level security;
alter table posts add column if not exists board_id uuid references boards(id) on delete set null;
create index if not exists posts_board_idx on posts(board_id);
