-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  role text default 'user',
  subscription_tier text default 'free', -- 'free', 'pro'
  usage_docs_this_month int default 0,
  created_at timestamptz default now(),
  primary key (id)
);

-- RLS for Profiles
alter table public.profiles enable row level security;

-- Policies (Drop first to avoid conflicts on re-run)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger for New User
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- PROJECTS TABLE
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  location text,
  description text,
  status text default 'planning', -- 'planning', 'active', 'completed'
  due_date timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- RLS for Projects
alter table public.projects enable row level security;

drop policy if exists "Users can CRUD own projects" on public.projects;
create policy "Users can CRUD own projects"
  on public.projects for all
  using ( auth.uid() = user_id );


-- DOCUMENTS TABLE
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  type text not null, -- 'permit', 'contract', 'bid'
  title text not null,
  content_json jsonb,
  pdf_url text,
  created_at timestamptz default now()
);

-- RLS for Documents
alter table public.documents enable row level security;

drop policy if exists "Users can CRUD own documents" on public.documents;
create policy "Users can CRUD own documents"
  on public.documents for all
  using ( auth.uid() = user_id ); 

-- Add columns if they don't exist (Idempotent approach for Documents)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'documents' and column_name = 'status') then
        alter table public.documents add column status text default 'draft';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'documents' and column_name = 'version') then
        alter table public.documents add column version int default 1;
    end if;
end $$;


-- PROJECT NOTES TABLE
create table if not exists public.project_notes (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_notes enable row level security;

drop policy if exists "Users can CRUD own notes" on public.project_notes;
create policy "Users can CRUD own notes"
  on public.project_notes for all
  using ( auth.uid() = user_id );


-- PROJECT MILESTONES TABLE
create table if not exists public.project_milestones (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  start_date date,
  end_date date,
  status text default 'pending', -- 'pending', 'in_progress', 'completed'
  created_at timestamptz default now()
);

alter table public.project_milestones enable row level security;

drop policy if exists "Users can CRUD own milestones" on public.project_milestones;
create policy "Users can CRUD own milestones"
  on public.project_milestones for all
  using ( auth.uid() = project_id in (select id from public.projects where user_id = auth.uid()) );
-- Note: Simplified RLS for milestones assuming project ownership implies milestone ownership
 
