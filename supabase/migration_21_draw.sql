create table if not exists draw_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host uuid references users(id) on delete set null,
  status text not null default 'waiting',   -- waiting | playing | done
  round int not null default 0, rounds_total int not null default 0,
  drawer uuid references users(id) on delete set null,
  word text, round_end timestamptz,
  scores jsonb not null default '{}'::jsonb,
  guessed jsonb not null default '[]'::jsonb,
  last_word text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists draw_players (
  room_id uuid references draw_rooms(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table draw_rooms enable row level security;
alter table draw_players enable row level security;
