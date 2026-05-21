-- ============================================
-- Visitor card storage — Supabase schema
-- Run this once in the SQL Editor after creating
-- your Supabase project.
-- ============================================

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

-- A simple length sanity check so nothing wild lands in the gallery.
alter table public.visitors
    add constraint visitors_name_len check (char_length(name) between 1 and 48);

-- Index for the gallery's "most recent first" query.
create index if not exists visitors_created_at_idx
    on public.visitors (created_at desc);

-- ============================================
-- Row-level security
-- We want anonymous visitors to:
--   - INSERT their own card
--   - SELECT all cards (so the gallery loads)
-- But never UPDATE or DELETE.
-- ============================================
alter table public.visitors enable row level security;

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
        layout in ('60%','75%','TKL','100%') and
        case_color in ('Graphite','Midnight','Ember','Moss','Bone') and
        switch_type in ('Linear','Tactile','Clicky') and
        keycaps in ('Cream','BoW','Olivia','Botanical','Dolch')
    );
