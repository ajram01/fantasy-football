-- ============================================================
-- Seed data for League A: "Make Fantasy Great Again"
-- 10-team, half-PPR, H2H points, pick #4 -- matches the league
-- discussed throughout this project's earlier trade analysis.
-- Roster reflects the post-trade state (Waddle/Love/Price acquired
-- for Nacua/LaPorta; McLaughlin dropped).
-- ============================================================

insert into drafts (season_year, league_name, num_teams, my_position, scoring_format, roster_config)
values (2026, 'Make Fantasy Great Again', 10, 4, 'half_ppr',
        '{"QB":1,"RB":2,"WR":2,"TE":1,"FLEX":1,"K":1,"DEF":1,"BN":6}')
returning draft_id;

-- NOTE: sequential pick numbers below are placeholders -- this roster was
-- built via a mix of the original draft plus in-season trades, not a
-- literal pick-by-pick record, so exact historical round/slot isn't known
-- or needed. Only "who is on this roster" matters for the cross-league
-- exposure feature.
with target_draft as (
  select draft_id from drafts
  where league_name = 'Make Fantasy Great Again' and season_year = 2026
  order by created_at desc limit 1
),
roster (full_name, position, pick_no) as (
  values
  ('Dak Prescott','QB',1),
  ('David Montgomery','RB',2),
  ('Jeremiyah Love','RB',3),
  ('Amon-Ra St. Brown','WR',4),
  ('Jaylen Waddle','WR',5),
  ('Harold Fannin Jr.','TE',6),
  ('Jadarian Price','RB',7),
  ('Cameron Dicker','K',8),
  ('Seattle Seahawks','DEF',9),
  ('Rico Dowdle','RB',10),
  ('Aaron Jones Sr.','RB',11),
  ('Josh Jacobs','RB',12),
  ('Brian Thomas Jr.','WR',13),
  ('Brock Purdy','QB',14),
  ('Cooper Kupp','WR',15)
)
insert into draft_picks (draft_id, player_id, overall_pick_number, round, slot, drafted_by)
select td.draft_id, p.player_id, r.pick_no, 1, r.pick_no, 'me'
from roster r
join target_draft td on true
join players p on p.full_name = r.full_name and p.position = r.position;

-- Verification query (run after the above to confirm all 15 landed):
-- select p.full_name, p.position, p.team_id
-- from draft_picks dp
-- join players p on p.player_id = dp.player_id
-- join drafts d on d.draft_id = dp.draft_id
-- where d.league_name = 'Make Fantasy Great Again' and dp.drafted_by = 'me'
-- order by dp.overall_pick_number;
