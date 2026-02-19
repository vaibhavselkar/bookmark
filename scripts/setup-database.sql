-- Create the bookmarks table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  tags text[] default '{}',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, url)
);

-- Create index on user_id for faster queries
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Create RLS policy: Users can only read their own bookmarks
create policy "Users can read own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own bookmarks
create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to authenticated, anon;
grant all on public.bookmarks to authenticated;
grant select on public.bookmarks to anon;
