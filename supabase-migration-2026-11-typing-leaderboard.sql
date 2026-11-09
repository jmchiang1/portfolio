-- Typing leaderboard (typing.html, leaderboard.js)
-- Run once in the Supabase SQL editor for the portfolio project.
--
-- Anyone can read the board and add a run; nobody can edit or delete one from
-- the site. The checks keep entries sane: a name of 1 to 20 characters, a WPM
-- no human beats (250), and only the four test lengths the page offers.
-- Remove an entry from the Supabase dashboard if one needs to go.

create table if not exists public.typing_scores (
    id          bigint generated always as identity primary key,
    name        text        not null check (char_length(btrim(name)) between 1 and 20),
    wpm         integer     not null check (wpm between 1 and 250),
    accuracy    integer     not null check (accuracy between 0 and 100),
    duration    integer     not null check (duration in (15, 30, 60, 120)),
    created_at  timestamptz not null default now()
);

-- The board reads the fastest runs for one length
create index if not exists typing_scores_board_idx
    on public.typing_scores (duration, wpm desc, created_at);

alter table public.typing_scores enable row level security;

drop policy if exists "anyone can read typing scores" on public.typing_scores;
create policy "anyone can read typing scores"
    on public.typing_scores for select
    to anon, authenticated
    using (true);

drop policy if exists "anyone can add a typing score" on public.typing_scores;
create policy "anyone can add a typing score"
    on public.typing_scores for insert
    to anon, authenticated
    with check (true);

grant select, insert on public.typing_scores to anon, authenticated;
