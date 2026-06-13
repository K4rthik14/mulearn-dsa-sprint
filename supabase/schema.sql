-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  isAdmin boolean not null default false,
  createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- 2. ChallengeDays Table
create table if not exists public.challengedays (
  id uuid default gen_random_uuid() primary key,
  dayNumber integer unique not null,
  topic text not null,
  description text not null,
  createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on challengedays
alter table public.challengedays enable row level security;

-- 3. Resources Table
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  challengeDayId uuid references public.challengedays(id) on delete cascade not null,
  title text not null,
  url text not null,
  createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on resources
alter table public.resources enable row level security;

-- 4. Problems Table
create table if not exists public.problems (
  id uuid default gen_random_uuid() primary key,
  challengeDayId uuid references public.challengedays(id) on delete cascade not null,
  title text not null,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')) not null,
  url text not null,
  createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on problems
alter table public.problems enable row level security;

-- 5. Submissions Table
create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  userId uuid references public.users(id) on delete cascade not null,
  challengeDayId uuid references public.challengedays(id) on delete cascade not null,
  screenshotUrl text,
  profileLink text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'approved' not null,
  submittedAt timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure a user can submit only once per challenge day
  unique (userId, challengeDayId)
);

-- Enable RLS on submissions
alter table public.submissions enable row level security;

-- 6. Leaderboard Table
create table if not exists public.leaderboard (
  userId uuid references public.users(id) on delete cascade primary key,
  score integer default 0 not null,
  streak integer default 0 not null,
  longestStreak integer default 0 not null,
  lastSubmittedAt timestamp with time zone
);

-- Enable RLS on leaderboard
alter table public.leaderboard enable row level security;


------------------
-- RLS POLICIES --
------------------

-- Users policies
create policy "Public users are readable by everyone" on public.users
  for select using (true);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- ChallengeDays policies
create policy "Challenge days are readable by everyone" on public.challengedays
  for select using (true);

create policy "Challenge days can be created/edited by admins" on public.challengedays
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.isAdmin = true
    )
  );

-- Resources policies
create policy "Resources are readable by everyone" on public.resources
  for select using (true);

create policy "Resources can be managed by admins" on public.resources
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.isAdmin = true
    )
  );

-- Problems policies
create policy "Problems are readable by everyone" on public.problems
  for select using (true);

create policy "Problems can be managed by admins" on public.problems
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.isAdmin = true
    )
  );

-- Submissions policies
create policy "Submissions are readable by admins or the owner" on public.submissions
  for select using (
    auth.uid() = userId or
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.isAdmin = true
    )
  );

create policy "Users can insert their own submissions" on public.submissions
  for insert with check (auth.uid() = userId);

create policy "Admins can update submissions (for reviews)" on public.submissions
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.isAdmin = true
    )
  );

-- Leaderboard policies
create policy "Leaderboard is readable by everyone" on public.leaderboard
  for select using (true);

create policy "Leaderboard is managed by system triggers/service role" on public.leaderboard
  for all using (true);


----------------------------
-- TRIGGERS & FUNCTIONS  --
----------------------------

-- Trigger to automatically create a user profile and leaderboard entry in public on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, isAdmin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    -- Make the first user an admin for easy testing
    not exists (select 1 from public.users)
  );
  
  insert into public.leaderboard (userId, score, streak, longestStreak)
  values (new.id, 0, 0, 0);
  
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to update leaderboard score and streaks on new approved submission
create or replace function public.handle_new_submission()
returns trigger as $$
declare
  prev_last_submitted timestamp with time zone;
  days_diff integer;
  current_streak integer;
  current_longest_streak integer;
  new_score integer;
begin
  -- Get current leaderboard stats for this user
  select streak, longestStreak, lastSubmittedAt, score
  into current_streak, current_longest_streak, prev_last_submitted, new_score
  from public.leaderboard
  where userId = new.userId;

  -- Default values if leaderboard entry is missing
  if not found then
    current_streak := 0;
    current_longest_streak := 0;
    prev_last_submitted := null;
    new_score := 0;
  end if;

  -- Only calculate streak if the submission is approved
  if new.status = 'approved' then
    if prev_last_submitted is null then
      current_streak := 1;
    else
      -- Calculate difference in days (UTC) between now and last submission
      days_diff := date_part('day', now() - prev_last_submitted);
      
      if days_diff = 0 then
        -- Already submitted today, streak doesn't change
        null;
      elsif days_diff = 1 then
        -- Submitted yesterday, increment streak
        current_streak := current_streak + 1;
      else
        -- Broke the streak, reset to 1
        current_streak := 1;
      end if;
    end if;

    -- Update longest streak
    if current_streak > current_longest_streak then
      current_longest_streak := current_streak;
    end if;

    -- Add points for challenge completion (+10 points per challenge)
    new_score := new_score + 10;

    -- Insert or update leaderboard
    insert into public.leaderboard (userId, score, streak, longestStreak, lastSubmittedAt)
    values (new.userId, new_score, current_streak, current_longest_streak, now())
    on conflict (userId) do update
    set score = excluded.score,
        streak = excluded.streak,
        longestStreak = excluded.longestStreak,
        lastSubmittedAt = excluded.lastSubmittedAt;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on submission insertion/update
drop trigger if exists on_submission_approved on public.submissions;
create trigger on_submission_approved
  after insert or update of status on public.submissions
  for each row execute procedure public.handle_new_submission();
