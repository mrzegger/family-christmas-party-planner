-- ============================================================================
-- FAMILY CHRISTMAS PARTY PLANNER — SUPABASE POSTGRESQL SCHEMA
-- ============================================================================
-- Run this script in your Supabase SQL Editor to enable real-time multi-device
-- sync across all cousins and family members!
--
-- The app includes a seamless JSON document table (`party_planner_state`) for
-- atomic instant sync AND normalized tables (`event_config`, `cousins`,
-- `family_units`, `guests`, `tasks`, `fund_contributions`, `expenses`,
-- `menu_items`, `program_items`, `games`, `checklist_items`) for SQL queries.
-- ============================================================================

-- 1. Unified state table used by the Dual-Mode Storage Adapter for atomic sync
create table if not exists public.party_planner_state (
  id text primary key default 'default_party',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.party_planner_state enable row level security;

drop policy if exists "Allow public read/write to party_planner_state" on public.party_planner_state;
create policy "Allow public read/write to party_planner_state"
  on public.party_planner_state
  for all
  using (true)
  with check (true);

-- Enable Realtime on party_planner_state
alter publication supabase_realtime add table public.party_planner_state;

-- ============================================================================
-- 2. Relational tables (Normalized Reference Schema)
-- ============================================================================

create table if not exists public.event_config (
  id text primary key default 'main',
  title text not null default 'The Grand Family Christmas Reunion 2026',
  subtitle text not null default 'Organized by the Cousins Committee',
  event_date timestamptz not null default '2026-12-24T18:00:00+08:00',
  venue_name text not null default 'Lolo & Lola''s Garden Pavilion, Quezon City',
  venue_address text not null default '24 Pinecrest Ave, New Manila, Quezon City',
  map_url text not null default 'https://maps.google.com',
  dress_code text not null default 'Festive Smart Casual — Pine Green, Cranberry Red, Cream & Gold',
  announcement text not null default 'Parents & Titos/Titas: Please RSVP for your household below by Dec 10! Food, games, and program are all taken care of by the cousins.',
  currency_symbol text not null default '₱',
  currency_code text not null default 'PHP',
  hq_pin text not null default '1225',
  target_budget numeric not null default 45000,
  updated_at timestamptz not null default now()
);

create table if not exists public.cousins (
  id text primary key,
  name text not null,
  role text not null,
  committee text not null,
  avatar_color text not null default '#1B4332',
  phone text
);

create table if not exists public.family_units (
  id text primary key,
  name text not null,
  branch_head text not null,
  notes text
);

create table if not exists public.guests (
  id text primary key,
  family_unit_id text not null references public.family_units(id) on delete cascade,
  name text not null,
  age_group text not null check (age_group in ('Adult', 'Kid', 'Senior')),
  rsvp_status text not null default 'Pending' check (rsvp_status in ('Going', 'Maybe', 'Not Going', 'Pending')),
  dietary_notes text default '',
  is_plus_one boolean default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  committee text not null,
  assignee_id text references public.cousins(id) on delete set null,
  status text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  due_date text not null,
  notes text default ''
);

create table if not exists public.fund_contributions (
  id text primary key,
  contributor_name text not null,
  family_unit_id text references public.family_units(id) on delete set null,
  pledged_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  status text not null default 'Pledged' check (status in ('Pledged', 'Partial', 'Collected')),
  payment_method text default 'GCash / Bank',
  held_by_cousin_id text references public.cousins(id) on delete set null,
  notes text default ''
);

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null,
  estimated_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  paid_source text not null default 'Pooled Fund' check (paid_source in ('Pooled Fund', 'Cousin Out-of-Pocket')),
  paid_by_cousin_id text references public.cousins(id) on delete set null,
  reimbursement_status text not null default 'N/A' check (reimbursement_status in ('N/A', 'Needs Reimbursement', 'Reimbursed')),
  vendor text default '',
  notes text default ''
);

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  course text not null,
  fulfillment_type text not null,
  assigned_to text not null,
  servings integer not null default 20,
  estimated_cost numeric not null default 0,
  status text not null default 'Planned' check (status in ('Planned', 'Ordered', 'Confirmed', 'Delivered')),
  dietary_tags text default '',
  notes text default ''
);

create table if not exists public.program_items (
  id text primary key,
  start_time text not null,
  duration_mins integer not null default 30,
  title text not null,
  category text not null,
  mc_cousin_id text references public.cousins(id) on delete set null,
  linked_game_id text,
  notes text default '',
  sort_order integer not null default 0
);

create table if not exists public.games (
  id text primary key,
  title text not null,
  audience text not null check (audience in ('Everyone', 'Adults', 'Kids', 'Seniors / Titos & Titas')),
  mc_cousin_id text references public.cousins(id) on delete set null,
  duration_mins integer not null default 20,
  rules text not null,
  materials text not null,
  prizes text not null,
  prize_budget numeric not null default 0,
  status text not null default 'Planning' check (status in ('Planning', 'Props Ready', 'Ready to Play'))
);

create table if not exists public.checklist_items (
  id text primary key,
  title text not null,
  category text not null,
  assigned_cousin_id text references public.cousins(id) on delete set null,
  quantity text default '1',
  is_bought boolean not null default false,
  is_packed boolean not null default false,
  notes text default ''
);
