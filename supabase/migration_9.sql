alter table events add column if not exists user_id uuid references users(id) on delete cascade;
