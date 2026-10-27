-- 메디화이트웹 DB 스키마. Supabase SQL Editor에 통째로 붙여넣고 실행하세요.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  nickname text not null,
  dept text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  nickname text not null,
  dept text not null,
  text text not null check (char_length(text) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists messages_created_idx on messages(created_at desc);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  category text not null,
  dept text not null,
  title text not null check (char_length(title) <= 80),
  body text not null check (char_length(body) <= 4000),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_order_idx on posts(pinned desc, created_at desc);

create table if not exists comments (
  id bigint generated always as identity primary key,
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  dept text not null,
  text text not null check (char_length(text) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on comments(post_id, created_at);

create table if not exists scores (
  user_id uuid references users(id) on delete cascade,
  game text not null,          -- 'dodge' | 'sword'
  value numeric not null,      -- dodge: 초, sword: 최고 단계
  mode text,                   -- sword: easy/hard
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

-- 모든 접근은 서버(service role)만 수행. 브라우저 anon 키로는 아무것도 못 읽게 RLS 켜두기.
alter table users enable row level security;
alter table messages enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table scores enable row level security;

-- 계급/경험치
alter table users add column if not exists xp integer not null default 0;
alter table users add column if not exists seq serial;   -- 가입 순번 (빠를수록 보너스)
alter table messages add column if not exists rank text;

create table if not exists xp_log (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  key text,                 -- 1회성 퀘스트 키 (반복 보상은 null)
  amount integer not null,
  created_at timestamptz not null default now()
);
create unique index if not exists xp_log_once on xp_log(user_id, key) where key is not null;
alter table xp_log enable row level security;

-- 영관 이상 '밀어올리기'
alter table posts add column if not exists boosted boolean not null default false;
drop index if exists posts_order_idx;
create index if not exists posts_order_idx on posts(pinned desc, boosted desc, created_at desc);

-- 진급 알림 등 이벤트 띠
create table if not exists events (
  id bigint generated always as identity primary key,
  kind text not null,          -- 'promotion'
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on events(created_at desc);
alter table events enable row level security;
