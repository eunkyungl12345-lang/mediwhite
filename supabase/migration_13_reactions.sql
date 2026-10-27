create table if not exists reactions (
  user_id uuid references users(id) on delete cascade,
  kind text not null,         -- 'post' | 'comment'
  target_id text not null,       -- posts.id(uuid) 또는 comments.id(bigint)
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, target_id)
);
create index if not exists reactions_target on reactions(kind, target_id);
alter table reactions enable row level security;
