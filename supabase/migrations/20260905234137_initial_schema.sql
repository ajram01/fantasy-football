-- ============================================================
-- Fantasy Draft Assistant — Supabase schema
-- Run this in Supabase's SQL Editor (Project -> SQL Editor -> New query)
-- ============================================================

-- ---------- Reference data: NFL teams (rarely changes) ----------
create table teams (
  team_id     text primary key,        -- e.g. 'DET', 'KC'
  team_name   text not null,           -- e.g. 'Detroit Lions'
  conference  text,                    -- 'AFC' | 'NFC'
  division    text,                    -- 'North' | 'South' | 'East' | 'West'
  bye_week    smallint
);

-- ---------- Core player identity (slow-changing) ----------
create table players (
  player_id   bigint generated always as identity primary key,
  full_name   text not null,
  position    text not null check (position in ('QB','RB','WR','TE','K','DEF')),
  team_id     text references teams(team_id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_players_position on players(position);
create index idx_players_team     on players(team_id);
create unique index idx_players_name_pos on players(full_name, position); -- avoid accidental dupes

-- ---------- Time-varying rankings / projections ----------
-- Keeping this separate from `players` means re-ranking or adding a new
-- scoring format never touches player identity rows, and you can keep
-- old snapshots (e.g. preseason vs. Week 8 rankings) side by side.
create table player_rankings (
  ranking_id      bigint generated always as identity primary key,
  player_id       bigint not null references players(player_id) on delete cascade,
  season_year     smallint not null,
  scoring_format  text not null check (scoring_format in ('standard','half_ppr','full_ppr')),
  overall_rank    integer,
  position_rank   integer,
  proj_ppg        numeric(5,2),
  source          text,                 -- e.g. 'PFN Katz/Soppe consensus'
  as_of_date      date not null default current_date,
  unique (player_id, season_year, scoring_format, as_of_date)
);
create index idx_rankings_lookup on player_rankings(season_year, scoring_format, overall_rank);

-- ---------- Append-only news / context log ----------
-- This is the same shape your app's "check for updates" feature already
-- classifies into (severity levels) -- persisting it here instead of only
-- in browser storage means you get real history over a season, not just
-- "whatever the last check found."
create table player_updates (
  update_id   bigint generated always as identity primary key,
  player_id   bigint not null references players(player_id) on delete cascade,
  note_type   text not null check (note_type in ('context','trade','injury','depth_chart','legal','other')),
  severity    text check (severity in ('season_ending','significant','minor','off_field','positive')),
  note_text   text not null,
  source      text,
  created_at  timestamptz not null default now()
);
create index idx_updates_player on player_updates(player_id, created_at desc);

-- ---------- One row per draft instance ----------
-- Lets the same schema serve this year, next year, or a friend's league
-- without ever duplicating player data.
create table drafts (
  draft_id        bigint generated always as identity primary key,
  season_year     smallint not null,
  league_name     text,
  num_teams       smallint not null default 10,
  my_position     smallint,
  scoring_format  text not null default 'half_ppr',
  roster_config   jsonb not null default '{"QB":1,"RB":2,"WR":2,"TE":1,"FLEX":1,"K":1,"DEF":1,"BN":6}',
  created_at      timestamptz not null default now()
);

-- ---------- One row per pick made during a specific draft ----------
create table draft_picks (
  pick_id             bigint generated always as identity primary key,
  draft_id            bigint not null references drafts(draft_id) on delete cascade,
  player_id           bigint not null references players(player_id),
  overall_pick_number integer not null,
  round               smallint not null,
  slot                smallint not null,
  drafted_by          text not null check (drafted_by in ('me','opponent')),
  picked_at           timestamptz not null default now(),
  unique (draft_id, overall_pick_number),
  unique (draft_id, player_id)
);
create index idx_picks_draft on draft_picks(draft_id);

-- ============================================================
-- Convenience view: exactly the shape the app's draft board needs --
-- current rank/projection plus the most recent news update, per player,
-- in one query instead of three joins every time the UI renders.
-- ============================================================
create view current_draft_board as
select
  p.player_id,
  p.full_name,
  p.position,
  p.team_id,
  r.overall_rank,
  r.position_rank,
  r.proj_ppg,
  u.severity   as latest_severity,
  u.note_text  as latest_note,
  u.created_at as latest_update_at
from players p
left join lateral (
  select * from player_rankings pr
  where pr.player_id = p.player_id
  order by pr.as_of_date desc
  limit 1
) r on true
left join lateral (
  select * from player_updates pu
  where pu.player_id = p.player_id
  order by pu.created_at desc
  limit 1
) u on true;

-- ============================================================
-- Notes on scope and future extension
-- ============================================================
-- This schema is single-user shaped (no user_id anywhere), matching how
-- the app is actually used today. Your existing Supabase Auth is there to
-- gate the Anthropic API key, not to segment data per user -- so RLS
-- policies keyed on auth.uid() aren't included here on purpose.
--
-- If you ever add real multi-user support (friends logging in to track
-- their own team), the natural extension is: add
--   user_id uuid references auth.users(id)
-- to `drafts`, then RLS policies like:
--   create policy "own drafts" on drafts
--     for all using (auth.uid() = user_id);
-- `draft_picks` inherits the same protection by joining through `drafts`.
-- Not needed today -- just the shape to reach for later.
