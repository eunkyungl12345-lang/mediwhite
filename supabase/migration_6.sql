create table if not exists inquiries (
  id bigint generated always as identity primary key,
  kind text not null,              -- ad | partner | bug | other
  name text not null,
  contact text not null,
  body text not null,
  user_id uuid references users(id) on delete set null,
  status text not null default 'new',   -- new | done
  created_at timestamptz not null default now()
);
alter table inquiries enable row level security;
insert into settings(key,value) values ('contact_email','eunkyungl12345@gmail.com') on conflict (key) do update set value=excluded.value;
