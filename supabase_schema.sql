-- ============================================================
-- CampusReclaim – Supabase SQL Schema
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Profiles Table ────────────────────────────────────────
-- Extends Supabase auth.users with username and points.

create table if not exists profiles (
  id          uuid        references auth.users(id) on delete cascade primary key,
  username    text        unique not null,
  avatar_url  text,
  points      int         not null default 0,
  created_at  timestamptz not null default now()
);

-- ── 2. Items Table ────────────────────────────────────────────

create table if not exists items (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references profiles(id) on delete cascade,
  type          text        not null check (type in ('lost', 'found')),
  name          text        not null,
  description   text,
  category      text        not null default 'Other',
  date_occurred date,
  location      text,
  image_url     text,
  status        text        not null default 'Open' check (status in ('Open', 'Pending', 'Returned')),
  created_at    timestamptz not null default now()
);

-- ── 3. Claims Table ───────────────────────────────────────────

create table if not exists claims (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        not null references items(id) on delete cascade,
  claimer_id  uuid        not null references profiles(id) on delete cascade,
  owner_id    uuid        not null references profiles(id) on delete cascade,
  status      text        not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at  timestamptz not null default now(),
  -- Prevent duplicate claims from the same user on the same item
  unique (item_id, claimer_id)
);

-- ── 4. Storage Bucket ─────────────────────────────────────────
-- Creates a public bucket for item images.

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- ── 5. Row Level Security (RLS) ───────────────────────────────

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table items    enable row level security;
alter table claims   enable row level security;

-- ── Profiles Policies ──────────────────────────────────────────

-- Anyone can view profiles (needed for leaderboard & item cards)
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

-- Only the owner can insert their profile (created at signup)
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Only the owner can update their profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ── Items Policies ─────────────────────────────────────────────

-- Anyone can view items (public board)
create policy "Items are publicly readable"
  on items for select
  using (true);

-- Only authenticated users can create items
create policy "Authenticated users can insert items"
  on items for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Only the item owner can update it
create policy "Only item owner can update"
  on items for update
  using (auth.uid() = user_id);

-- Only the item owner can delete it
create policy "Only item owner can delete"
  on items for delete
  using (auth.uid() = user_id);

-- ── Claims Policies ────────────────────────────────────────────

-- Claimer and item owner can view claims
create policy "Claims visible to involved parties"
  on claims for select
  using (auth.uid() = claimer_id or auth.uid() = owner_id);

-- Authenticated users can create claims (for themselves)
create policy "Authenticated users can insert claims"
  on claims for insert
  with check (auth.role() = 'authenticated' and auth.uid() = claimer_id);

-- Item owners can update claim status (approve / reject)
create policy "Item owners can update claims"
  on claims for update
  using (auth.uid() = owner_id);

-- ── Storage Policies ──────────────────────────────────────────

-- Authenticated users can upload images
create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

-- Anyone can view images (public bucket)
create policy "Anyone can view item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- Users can delete their own uploaded images
create policy "Users can delete own item images"
  on storage.objects for delete
  using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);
