# Smart Bookmark App - Setup Guide

## Prerequisites
- Supabase account
- Node.js 18+ and pnpm

## 1. Set up Supabase Project

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### Step 2: Create the Bookmarks Table
1. Go to the Supabase Dashboard
2. Click on SQL Editor in the left sidebar
3. Create a new query and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the query

### Step 3: Enable Google OAuth (Optional)
1. Go to Authentication → Providers in Supabase Dashboard
2. Click on Google
3. Enable it and follow the setup instructions
4. Add `http://localhost:3000/auth/callback` as a redirect URL (or your production domain)

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Set Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- ✅ User Authentication (Email/Password and Google OAuth)
- ✅ Add, view, and delete bookmarks
- ✅ Organize bookmarks with tags
- ✅ Add descriptions to bookmarks
- ✅ Real-time synchronization
- ✅ Row Level Security (RLS) for data privacy
- ✅ Responsive design

## Project Structure

```
app/
  ├── page.tsx                 # Root redirect page
  ├── login/page.tsx          # Login page
  ├── dashboard/page.tsx      # Bookmark manager
  ├── auth/callback/route.ts  # OAuth callback handler
  └── globals.css             # Global styles

components/
  ├── navbar.tsx              # Navigation header
  ├── bookmark-form.tsx       # Add bookmark form
  ├── bookmark-list.tsx       # Display bookmarks
  ├── bookmark-card.tsx       # Individual bookmark card
  └── ui/                      # shadcn/ui components

lib/
  ├── supabase/
  │   ├── client.ts          # Browser client
  │   ├── server.ts          # Server client
  │   └── middleware.ts      # Auth middleware
  └── types.ts               # TypeScript types
```

## Troubleshooting

### "Module not found" errors
- Make sure all dependencies are installed: `pnpm install`
- Restart the development server

### Authentication not working
- Check that environment variables are set correctly
- Verify Google OAuth is enabled in Supabase (if using Google login)
- Check browser console for error messages

### Bookmarks not syncing
- Make sure RLS policies are enabled on the bookmarks table
- Check that you're logged in with the correct user account
- Look at Supabase logs for any database errors

## Deployment

The app is ready to deploy to Vercel:

1. Push to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

For more information, see [Vercel Deployment Documentation](https://vercel.com/docs)
