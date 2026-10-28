create table if not exists restaurants (
  id bigint generated always as identity primary key,
  author_id uuid references users(id) on delete cascade,
  region text not null, district text not null, station text,
  name text not null, menu text, price text, comment text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists restaurants_area on restaurants(region, district, created_at desc);
create table if not exists restaurant_likes (
  user_id uuid references users(id) on delete cascade,
  rest_id bigint references restaurants(id) on delete cascade,
  primary key (user_id, rest_id)
);
alter table restaurants enable row level security;
alter table restaurant_likes enable row level security;
