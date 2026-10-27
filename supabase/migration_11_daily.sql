-- 데일리 퀘스트/출석 활동 카운터
create table if not exists activity (
  user_id uuid references users(id) on delete cascade,
  day date not null,
  key text not null,
  n integer not null default 0,
  primary key (user_id, day, key)
);
alter table activity enable row level security;
create or replace function bump_activity(p_user uuid, p_day date, p_key text) returns integer
language plpgsql security definer as $$
declare v integer;
begin
  insert into activity(user_id, day, key, n) values (p_user, p_day, p_key, 1)
  on conflict (user_id, day, key) do update set n = activity.n + 1
  returning n into v;
  return v;
end $$;
