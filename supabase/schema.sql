-- =============================================
-- FITLOVE - Complete Database Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null default '',
  avatar_url text,
  weight_current numeric(5,2),
  weight_goal numeric(5,2),
  objective text,
  calories_goal integer default 2000,
  protein_goal integer default 150,
  carbs_goal integer default 300,
  fat_goal integer default 60,
  water_goal integer default 3000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- DAILY HABITS
-- =============================================
create table if not exists public.daily_habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  water_consumed integer default 0,
  calories_consumed integer default 0,
  protein_consumed integer default 0,
  carbs_consumed integer default 0,
  fat_consumed integer default 0,
  trained boolean default false,
  checkin_done boolean default false,
  fitlove_score integer default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- =============================================
-- WATER LOGS
-- =============================================
create table if not exists public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null,
  logged_at timestamptz default now()
);

-- =============================================
-- WORKOUTS
-- =============================================
create table if not exists public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  duration_minutes integer default 0,
  notes text,
  logged_at timestamptz default now()
);

-- =============================================
-- NUTRITION LOGS
-- =============================================
create table if not exists public.nutrition_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_name text not null,
  calories integer default 0,
  protein integer default 0,
  carbs integer default 0,
  fat integer default 0,
  logged_at timestamptz default now()
);

-- =============================================
-- POSTS (Feed)
-- =============================================
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- LIKES
-- =============================================
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- =============================================
-- COMMENTS
-- =============================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- =============================================
-- BODY PROGRESS
-- =============================================
create table if not exists public.body_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  weight numeric(5,2),
  chest numeric(5,2),
  waist numeric(5,2),
  hips numeric(5,2),
  arm numeric(5,2),
  thigh numeric(5,2),
  photo_url text,
  notes text,
  recorded_at timestamptz default now()
);

-- =============================================
-- MOTIVATION MESSAGES (Mural)
-- =============================================
create table if not exists public.motivation_messages (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  message text default '',
  image_url text,
  created_at timestamptz default now()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.profiles enable row level security;
alter table public.daily_habits enable row level security;
alter table public.water_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.body_progress enable row level security;
alter table public.motivation_messages enable row level security;
alter table public.notifications enable row level security;

-- Profiles: all authenticated users can read, only owner can write
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- Daily habits: owner read/write only
create policy "Users manage own daily habits" on public.daily_habits
  for all using (auth.uid() = user_id);

-- Water logs: owner read/write only
create policy "Users manage own water logs" on public.water_logs
  for all using (auth.uid() = user_id);

-- Workouts: owner read/write only
create policy "Users manage own workouts" on public.workouts
  for all using (auth.uid() = user_id);

-- Nutrition: owner read/write only
create policy "Users manage own nutrition" on public.nutrition_logs
  for all using (auth.uid() = user_id);

-- Posts: authenticated can read all, owner writes
create policy "Posts are viewable by authenticated" on public.posts
  for select using (auth.role() = 'authenticated');
create policy "Users insert own posts" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on public.posts
  for update using (auth.uid() = user_id);
create policy "Users delete own posts" on public.posts
  for delete using (auth.uid() = user_id);

-- Likes: authenticated can read, owner writes
create policy "Likes viewable by authenticated" on public.likes
  for select using (auth.role() = 'authenticated');
create policy "Users manage own likes" on public.likes
  for all using (auth.uid() = user_id);

-- Comments: authenticated can read, owner writes
create policy "Comments viewable by authenticated" on public.comments
  for select using (auth.role() = 'authenticated');
create policy "Users insert own comments" on public.comments
  for insert with check (auth.uid() = user_id);

-- Body progress: owner only
create policy "Users manage own body progress" on public.body_progress
  for all using (auth.uid() = user_id);

-- Motivation messages: sender/receiver can read
create policy "Users can read own motivation messages" on public.motivation_messages
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users can send motivation messages" on public.motivation_messages
  for insert with check (auth.uid() = from_user_id);

-- Notifications: owner only
create policy "Users manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET
-- =============================================
insert into storage.buckets (id, name, public) values ('fitlove', 'fitlove', true)
on conflict (id) do nothing;

create policy "Anyone can view fitlove files" on storage.objects
  for select using (bucket_id = 'fitlove');
create policy "Authenticated users can upload fitlove files" on storage.objects
  for insert with check (bucket_id = 'fitlove' and auth.role() = 'authenticated');
create policy "Users can update own fitlove files" on storage.objects
  for update using (bucket_id = 'fitlove' and auth.uid()::text = (storage.foldername(name))[2]);

-- =============================================
-- SEED DATA (run after creating users via Auth)
-- =============================================
-- Replace the UUIDs below with actual user IDs from auth.users after signup

-- INSERT INTO public.profiles (user_id, name, objective, calories_goal, protein_goal, carbs_goal, fat_goal, water_goal, weight_current, weight_goal)
-- VALUES
--   ('HYGOR_USER_ID', 'Hygor', 'Ganhar massa muscular', 2750, 150, 400, 60, 3000, 75, 80),
--   ('JULIA_USER_ID', 'Júlia', 'Perder gordura e definir', 1650, 140, 145, 55, 3000, 65, 58);
