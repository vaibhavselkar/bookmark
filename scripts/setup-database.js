import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const setupDatabase = async () => {
  try {
    console.log('Setting up database schema...');

    // Create the bookmarks table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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

        create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);

        alter table public.bookmarks enable row level security;

        create policy if not exists "Users can read own bookmarks"
          on public.bookmarks
          for select
          using (auth.uid() = user_id);

        create policy if not exists "Users can insert own bookmarks"
          on public.bookmarks
          for insert
          with check (auth.uid() = user_id);

        create policy if not exists "Users can delete own bookmarks"
          on public.bookmarks
          for delete
          using (auth.uid() = user_id);

        grant usage on schema public to authenticated, anon;
        grant all on public.bookmarks to authenticated;
        grant select on public.bookmarks to anon;
      `,
    });

    if (createError) {
      console.error('Error creating table:', createError);
      process.exit(1);
    }

    console.log('Database schema setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
