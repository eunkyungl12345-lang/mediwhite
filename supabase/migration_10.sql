create table if not exists daily_runs (day date not null, slot text not null, primary key (day, slot));
alter table daily_runs enable row level security;
create table if not exists daily_posts (
  id serial primary key, category text not null, title text not null, body text not null, used_at date
);
alter table daily_posts enable row level security;
insert into users(username, password_hash, nickname, dept, role, stealth, xp, join_order)
select 'mw_team', '$2a$10$LOCKEDLOCKEDLOCKEDLOCKEDuLOCKEDLOCKEDLOCKEDLOCKEDLOCKED', '메디화이트 운영팀', '총괄', 'member', true, 11000, null
where not exists (select 1 from users where username='mw_team');
insert into users(username, password_hash, nickname, dept, role, stealth, xp, join_order)
select 'mw_bot', '$2a$10$LOCKEDLOCKEDLOCKEDLOCKEDuLOCKEDLOCKEDLOCKEDLOCKEDLOCKED', '라운지봇', '총괄', 'member', true, 1030, null
where not exists (select 1 from users where username='mw_bot');
select username,nickname,stealth from users where username in ('mw_team','mw_bot');
