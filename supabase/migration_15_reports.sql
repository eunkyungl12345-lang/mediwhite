-- 신고·임시조치
alter table posts add column if not exists hidden boolean not null default false;
alter table posts add column if not exists hidden_at timestamptz;
alter table comments add column if not exists hidden boolean not null default false;
alter table comments add column if not exists hidden_at timestamptz;
create table if not exists reports (
  id bigint generated always as identity primary key,
  kind text not null,              -- post | comment
  target_id text not null,
  reporter_id uuid references users(id) on delete set null,
  reason text not null,
  detail text,
  status text not null default 'open',   -- open | restored | deleted
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists reports_status on reports(status, created_at);
alter table reports enable row level security;
