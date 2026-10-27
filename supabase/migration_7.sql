create table if not exists push_subs (
  endpoint text primary key,
  user_id uuid references users(id) on delete cascade,
  p256dh text not null, auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user on push_subs(user_id);
alter table push_subs enable row level security;
-- VAPID 키는 settings(vapid_public/vapid_private)에 저장됨
