# Smart Bookmark App

A bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can sign in with Google, add bookmarks, and see them update in real-time across tabs.

**Live URL:** https://bookmark-one-sigma.vercel.app

---

## Features

- Google OAuth authentication (no email/password)
- Add bookmarks with a title and URL
- Bookmarks are private — each user only sees their own
- Real-time updates across browser tabs without page refresh
- Delete bookmarks instantly with optimistic UI updates
- Deployed on Vercel

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, PostgreSQL database, Realtime)
- **Tailwind CSS** with shadcn/ui components
- **TypeScript**

---

## Problems I Ran Into and How I Solved Them

### 1. Vercel build failing with "Invalid supabaseUrl"
**Problem:** The dashboard page was being statically pre-rendered at build time by Next.js. During the build, environment variables weren't available, so Supabase received an empty string instead of a valid URL and threw an error.
**Solution:** Added `export const dynamic = 'force-dynamic'` at the top of `app/dashboard/page.tsx` to tell Next.js to render it at request time instead of build time. Also made sure the correct environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) were added in Vercel's project settings.
---

### 2. Google OAuth Error 400: redirect_uri_mismatch

**Problem:** After clicking "Sign in with Google", Google returned an error saying the redirect URI didn't match. This happened because the authorized redirect URI registered in Google Cloud Console didn't exactly match the one Supabase was sending.
**Solution:**
- Added the exact Supabase callback URL to Google Cloud Console under **Authorized redirect URIs**:
  `https://<project-id>.supabase.co/auth/v1/callback`
- Added the app's origin under **Authorized JavaScript origins**:
  `https://bookmark-one-sigma.vercel.app`
- Added the app's callback URL in Supabase under **Authentication → URL Configuration → Redirect URLs**:
  `https://bookmark-one-sigma.vercel.app/auth/callback`

---

### 3. OAuth code not being exchanged — `?code=` staying in the URL

**Problem:** After Google redirected back to the app, the URL showed `/?code=some-code` and nothing happened. The session was never created.
**Solution:** Created `app/auth/callback/route.ts` — a Next.js route handler that picks up the `code` from the URL, exchanges it for a Supabase session using `supabase.auth.exchangeCodeForSession(code)`, then redirects the user to `/dashboard`.
---

### 4. "Failed to load bookmarks" — 404 on Supabase requests
**Problem:** After logging in, the dashboard showed a "Failed to load bookmarks" error. The browser console showed a 404 response from Supabase, meaning the `bookmarks` table didn't exist yet.
**Solution:** Created the table in Supabase SQL Editor:

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  description text,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table bookmarks enable row level security;

create policy "Users can manage their own bookmarks"
  on bookmarks for all
  using (auth.uid() = user_id);
```
Row Level Security (RLS) ensures users can only access their own bookmarks.
---

### 5. Real-time updates not working

**Problem:** Adding a bookmark in one tab didn't appear in another tab automatically.

**Solution:** Two things were needed:
1. Enabled Realtime on the `bookmarks` table in **Supabase → Database → Replication**
2. Set up separate `postgres_changes` listeners for INSERT, UPDATE, and DELETE events in the dashboard component, with duplicate prevention so optimistic updates and realtime events don't show the same bookmark twice

---
## Local Development
```bash
# Clone the repo
git clone https://github.com/your-username/smart-bookmark-app
cd smart-bookmark-app

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run locally
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key (JWT) |
