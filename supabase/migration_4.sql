-- 4차: 파트 응원(공동 경험치) + 수동 입금 확인
create table if not exists dept_pool (
  dept text primary key,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists contributions (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  dept text not null,
  amount integer not null,          -- 원
  points integer not null,          -- 공동 경험치
  status text not null default 'pending',  -- pending | confirmed | rejected
  depositor text,                   -- 입금자명
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists contributions_status_idx on contributions(status, created_at desc);
create table if not exists settings (key text primary key, value text not null default '');
insert into settings(key,value) values ('bank','') on conflict do nothing;
alter table dept_pool enable row level security; alter table contributions enable row level security; alter table settings enable row level security;
