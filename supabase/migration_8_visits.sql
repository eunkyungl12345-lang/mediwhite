create table if not exists visits (
  day date not null,
  user_id uuid references users(id) on delete cascade,
  hits integer not null default 1,
  primary key (day, user_id)
);
alter table visits enable row level security;
create or replace function touch_visit(p_user uuid) returns void language sql security definer as $$
  insert into visits(day, user_id) values ((now() at time zone 'Asia/Seoul')::date, p_user)
  on conflict (day, user_id) do update set hits = visits.hits + 1;
$$;
