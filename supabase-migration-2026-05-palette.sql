-- ============================================
-- Idempotent setup + migration for the visitor-card gallery.
--
-- Safe to run on:
--   - a brand-new Supabase project (will create everything)
--   - a project that already has the table with old-palette policies
--     (recreates policies, migrates legacy rows)
--   - a project that's already on the new palette (no-op-ish)
--
-- Paste the whole thing into Supabase → SQL Editor → Run.
-- ============================================

-- 1) Ensure the table + supporting index exist.
create extension if not exists "pgcrypto";

create table if not exists public.visitors (
    id            uuid primary key default gen_random_uuid(),
    name          text        not null,
    layout        text        not null,
    case_color    text        not null,
    switch_type   text        not null,
    keycaps       text        not null,
    serial        integer,
    created_at    timestamptz not null default now()
);

-- Name-length sanity (no-op if already added).
alter table public.visitors
    drop constraint if exists visitors_name_len;
alter table public.visitors
    add constraint visitors_name_len check (char_length(name) between 1 and 48);

create index if not exists visitors_created_at_idx
    on public.visitors (created_at desc);

-- 2) Enable RLS (idempotent — Supabase allows re-enabling).
alter table public.visitors enable row level security;

-- 3) Recreate every policy with the new palette allow-lists.

drop policy if exists "anon can read visitors" on public.visitors;
create policy "anon can read visitors"
    on public.visitors
    for select
    to anon
    using (true);

drop policy if exists "anon can insert visitor" on public.visitors;
create policy "anon can insert visitor"
    on public.visitors
    for insert
    to anon
    with check (
        char_length(name) between 1 and 48 and
        layout in ('60%','75%','TKL') and
        case_color in ('White','Charcoal Grey','Navy Blue','Crimson Red','Matcha Green') and
        switch_type in ('Linear','Tactile','Clicky') and
        keycaps in ('Black','White','Violet','Electric Yellow','Cream')
    );

drop policy if exists "anon can update visitor" on public.visitors;
create policy "anon can update visitor"
    on public.visitors
    for update
    to anon
    using (true)
    with check (
        char_length(name) between 1 and 48 and
        layout in ('60%','75%','TKL') and
        case_color in ('White','Charcoal Grey','Navy Blue','Crimson Red','Matcha Green') and
        switch_type in ('Linear','Tactile','Clicky') and
        keycaps in ('Black','White','Violet','Electric Yellow','Cream')
    );

-- 4) Map any legacy rows that were saved under the old palette to the
-- closest equivalent in the new one. The visual mapping below is a
-- judgement call — tweak before running if you'd prefer different
-- substitutions. Each statement is a no-op if no matching rows exist.
update public.visitors set case_color = 'Charcoal Grey' where case_color = 'Graphite';
update public.visitors set case_color = 'Navy Blue'     where case_color = 'Midnight';
update public.visitors set case_color = 'Crimson Red'   where case_color = 'Ember';
update public.visitors set case_color = 'Matcha Green'  where case_color = 'Moss';
update public.visitors set case_color = 'White'         where case_color = 'Bone';

-- `Cream` keycap exists in both palettes, so no remap needed. The rest
-- collapse: BoW/Botanical/Dolch → Black, Olivia → White.
update public.visitors set keycaps = 'Black' where keycaps in ('BoW','Botanical','Dolch');
update public.visitors set keycaps = 'White' where keycaps = 'Olivia';
