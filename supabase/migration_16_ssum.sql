-- 썸 탭
create table if not exists confessions (
  id bigint generated always as identity primary key,
  from_id uuid references users(id) on delete cascade,
  to_id uuid references users(id) on delete cascade,
  text text not null,
  status text not null default 'pending',   -- pending | accepted | declined
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists confessions_to on confessions(to_id, status);
create table if not exists dating_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  age int not null, region text, height int, personality text, hobby text, style text, want text, intro text,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists intros (
  id bigint generated always as identity primary key,
  author_id uuid references users(id) on delete cascade,
  dept text, age int, region text, height int, personality text, hobby text, style text, want text, intro text,
  created_at timestamptz not null default now()
);
create table if not exists likes (
  from_id uuid references users(id) on delete cascade,
  kind text not null,          -- profile | intro
  target text not null,        -- user_id 또는 intros.id
  created_at timestamptz not null default now(),
  primary key (from_id, kind, target)
);
create table if not exists dms (
  id bigint generated always as identity primary key,
  a uuid references users(id) on delete cascade,
  b uuid references users(id) on delete cascade,
  sender uuid references users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists dms_pair on dms(a, b, created_at);
alter table confessions enable row level security;
alter table dating_profiles enable row level security;
alter table intros enable row level security;
alter table likes enable row level security;
alter table dms enable row level security;
