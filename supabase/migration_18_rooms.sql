alter table messages add column if not exists room text not null default 'all';
create index if not exists messages_room_idx on messages(room, created_at desc);
create table if not exists online_peaks (day date primary key, peak int not null default 0, at timestamptz not null default now());
alter table online_peaks enable row level security;
insert into settings(key, value) values ('chat_rooms', 'off') on conflict (key) do nothing;
