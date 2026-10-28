create table if not exists omok_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  bet text,
  per_team int not null default 1,          -- 1 = 1:1, 최대 5
  status text not null default 'waiting',   -- waiting | playing | done
  board text not null default repeat('.', 225),
  turn text not null default 'b',
  idx_b int not null default 0, idx_w int not null default 0,
  deadline timestamptz,
  last_move int,
  winner text,
  host uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists omok_players (
  room_id uuid references omok_rooms(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  team text not null,                        -- b | w
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists omok_rooms_status on omok_rooms(status, updated_at desc);
alter table omok_rooms enable row level security;
alter table omok_players enable row level security;
