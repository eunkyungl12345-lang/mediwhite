create table if not exists game_state (
  user_id uuid references users(id) on delete cascade,
  game text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);
alter table game_state enable row level security;
