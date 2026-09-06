# Fantasy Draft Assistant — Project Knowledge

Comprehensive record of everything built and decided in this project's build-out. Meant to be portable — drop it into any future Claude conversation (chat, Project, or Claude Code) for full context without re-explaining from scratch.

---

## 1. What this is

A live draft-tracking and recommendation tool for a 10-team, half-PPR, H2H points, in-person snake-draft fantasy football league (Yahoo). Dual purpose: a real tool used on actual draft day, and a portfolio piece demonstrating full-stack competence (the person's explicit goal is hireability as a developer).

---

## 2. App architecture

- **Stack:** Vite + React (JSX, not TypeScript in this build) + Tailwind CSS + `lucide-react` icons. No backend framework needed beyond Vercel serverless functions.
- **Single-file component:** `fantasy_draft_assistant.jsx` — draft setup screen, live turn banner, recommendation engine, searchable player board, roster tracker, undo, settings/reset.
- **Snake draft math:** `overallPickFor(round, slot, numTeams)` and `roundAndSlotFor(overall, numTeams)`. Verified by round-tripping every pick 1–150 for a 10-team, 15-round league with zero mismatches — not just read-through-verified, actually executed and checked.
- **Recommendation engine:** scores available players by inverse rank, a **position-weighted "need" bonus** (`NEED_WEIGHT`: RB/WR/K/DEF = 150, TE = 90, QB = 35), and a scarcity bonus restricted to `SCARCITY_ELIGIBLE = ['RB','WR','TE']` (QB/K/DEF excluded).
  - **Bug found and fixed:** originally every position got the same flat +150 need bonus and was eligible for the scarcity bonus. Because a correctly-ranked 1-QB-league board naturally has very few QBs near the top, the scarcity heuristic misread that as an imminent "QB run" and could rank a QB above the true best players available in round 1 (verified: Josh Allen scored 1185 vs. Bijan Robinson's 1149 pre-fix, at pick 4 with nobody drafted). Fixed by discounting QB's need-weight and excluding QB from the scarcity bonus entirely, since QB is streamable all season in a 1-QB format.
- **Live news-check feature:** a manual refresh button calls the Anthropic API (with web search enabled) directly from the artifact — no key needed in the Claude-artifact version, since Anthropic injects it server-side. Classifies findings into severity (`season_ending`, `significant`, `minor`, `off_field`, `positive`) and feeds that into recommendation scoring.
- **Two diverged versions exist:**
  1. **Claude-artifact version** (`window.storage` for persistence, direct `fetch` to `api.anthropic.com` — only works inside Claude.ai).
  2. **Standalone Vercel-deployable version** (`localStorage` instead of `window.storage`; the Anthropic call goes through `/api/check-updates.js`, a serverless function holding `ANTHROPIC_API_KEY` server-side so the key never reaches the browser).
  - Decide which is the source of truth going forward rather than maintaining both.

---

## 3. Player database

- **419 players** across QB/RB/WR/TE/K/DEF — a full expansion from an initial 174-player hand-blended list.
- **Sourced from Pro Football Network** (complete structured rank/team/PPG tables per position), cross-validated against ESPN's Mike Clay rankings and Yahoo/FanDuel at the top of each list (strong agreement: Josh Allen QB1, Gibbs/Robinson RB1/2, Chase/Nacua atop WR).
- **CSV columns:** `rank, pos, pos_rank, name, team, proj_ppg, note`.
- **Honesty-tiered notes** — a deliberate choice: the ~150 players with real specific research (trades, injuries, camp battles) get a genuine researched note; deep bench/streaming players get an explicitly-labeled data-only note ("not individually researched") rather than a fabricated-sounding scouting blurb. Fabricating plausible detail for 250+ backup players would look more complete but be less trustworthy.
- Reflects real roster churn from the actual Aug 30, 2026 53-man cutdown (e.g., Titans released Will Levis, Cowboys cut Jaydon Blue, Cardinals cut Trey Benson).

---

## 4. Supabase schema

Designed, and **actually tested against a real local Postgres instance** (installed Postgres in the build sandbox, ran the schema, inserted sample data, confirmed the view and foreign key constraints work — including deliberately testing that a bad FK reference gets rejected).

**Tables:**
- `teams` — static reference data (NFL teams, bye weeks)
- `players` — slow-changing identity (name, position, team)
- `player_rankings` — time-stamped, separate from `players`, so re-ranking or adding scoring formats never touches player identity; supports multiple snapshots over time
- `player_updates` — append-only news/context log, same severity taxonomy as the app's live news-check feature; this is a history the app itself doesn't currently keep (browser storage only holds the latest state)
- `drafts` — one row per draft instance, supports reusing the same player data across seasons/leagues
- `draft_picks` — one row per pick, FK to both `drafts` and `players`
- `current_draft_board` — a view joining latest ranking + latest update per player via `left join lateral`

**Decisions made:**
- **Migrations over the SQL editor**, specifically because this is a real, evolving, git-tracked repo project — not because migrations are always right for every use case. Verified the actual Supabase CLI workflow (`supabase init` → `supabase migration new <name>` → creates `supabase/migrations/<timestamp>_<name>.sql` → paste schema in → `supabase db push`) by running the CLI directly rather than describing it from memory.
- **No `user_id`/RLS by design (for now)** — the app is single-user; Supabase Auth exists to gate the Anthropic API key, not to segment multi-user data. Documented the extension path (`user_id uuid references auth.users`, RLS policies keyed on `auth.uid()`) for if that ever changes.
- **Auth approach: use Supabase's built-in signup toggle + manually add self as a user via the dashboard** — not a custom invite-code system. The custom version would be legitimate engineering practice as a deliberate learning exercise, but is the wrong-sized solution for an app with exactly one real user; right-sizing the solution to the actual problem was the explicit reasoning.

---

## 5. League settings (confirmed against real Yahoo defaults, not assumed)

- Yahoo Fantasy, Head-to-Head Points, 10 teams
- **Half-PPR** (0.5 pts/reception) — verified as Yahoo's actual default; the "1 point per reception" assumption floated earlier in the project was incorrect
- 4 pt passing TD, 6 pt rush/rec TD, 1 pt/25 passing yds, 1 pt/10 rush-rec yds, -2 INT/lost fumble
- Roster: QB, RB, RB, WR, WR, TE, FLEX (W/R/T), K, DEF + 6 bench = 15 total
- Redraft, not keeper/dynasty

---

## 6. Real-world trade case study (Week 1, 2026)

A live example of exactly the kind of decision this tool exists to support:

- **The trigger:** Josh Jacobs (owned, bench RB) was placed on the NFL's Commissioner Exempt List following misdemeanor charges from a May arrest — confirmed via fresh search, not assumed. Most likely absence window: around 6 games, with his court date not until Nov 17, so this wasn't a short-term problem.
- **A second live risk surfaced during research:** Puka Nacua (started, WR) is under personal-conduct-policy review for a separate civil lawsuit (alleged biting incident + remark, filed March 2026). He avoided the exempt list (unlike Jacobs), and professional consensus (DraftSharks) expected at most a game or two if disciplined at all — a real but modest risk, already being priced into the trade market.
- **The deciding analysis:** checked real 2026 bye weeks for the three currently-usable RBs and found they were fully staggered — Jones Sr. (MIN) Week 6, Montgomery (HOU) Week 8, Dowdle (PIT) Week 9 — meaning three separate guaranteed weeks of zero RB bench cushion regardless of injury luck, not just a hypothetical risk.
- **Trades evaluated (using the 419-player database's proj_ppg for a consistent value read):**
  - Nacua + LaPorta + Thomas Jr. → Waddle + Jeremiyah Love + Jadarian Price (net −2.2 proj PPG, later resweetened by the other manager to just Nacua + LaPorta for the same return, net **+9.5** once Thomas Jr. was excluded — the improved version)
  - Montgomery + Nacua + LaPorta → Chase Brown + AJ Brown + Dobbins (net −3.7; rejected — J.K. Dobbins turned out to be stuck in a real three-way Denver committee, not a safe add, and the trade removed a currently-usable RB without a reliable replacement body)
  - Nacua + Thomas Jr. → Derrick Henry + Mike Evans (net −5.0; Henry's bye week (13) would have perfectly complemented the other three RBs' staggered byes, but the WR downgrade and lack of known counterparty context made it a weaker overall pick than the improved first offer)
- **Final decision:** accepted the resweetened Nacua + LaPorta → Waddle + Love + Price trade, and dropped a redundant second kicker to get back under the roster limit.
- **Process lesson demonstrated mid-analysis:** an early recommendation (drop LaPorta from the trade for a "fairer" trim) was corrected after actually asking why the other manager wanted LaPorta specifically — he has zero tight ends on his roster, so LaPorta was solving a real positional hole for him, not a throw-in. The fix was to gather the other side's motivation before optimizing point totals, not just compare aggregate value.

---

## 7. Roster-construction lesson (confirmed, worth encoding into next year's draft logic)

The team that triggered this whole trade saga carried **two quarterbacks, two tight ends, and two kickers** on a 15-man roster — leaving only 4 RB and 4 WR bodies total. Self-diagnosed correctly mid-conversation: QB and TE (and especially K) are positions where a bench copy generates close to zero value, because streaming replacements are always available and weekly separation between a rostered backup and a waiver pickup is small. RB and WR are where real, hard-to-replace weekly value actually lives. The app's recommendation engine already discounts QB need/scarcity for this reason (see Section 2); extending the same logic to flag redundant TE/K picks during a draft is a natural next enhancement.

---

## 8. General working principles established in this project

- **Verify, don't assume, for anything time-sensitive or checkable** — Yahoo's actual default scoring, real 2026 roster cuts, real bye weeks, and the actual Supabase CLI migration file format were all confirmed by searching or running the real tool, not recited from memory.
- **Test infrastructure choices for real before handing them off** — the Vercel scaffold was `npm install`'d and built; the Supabase schema was run against a real local Postgres and exercised with sample data and a deliberate constraint-violation test.
- **Right-size the solution** — invite-only auth, Supabase migrations vs. the SQL editor, and single-file vs. split data architecture were all decided by matching the solution to the actual scale of the problem (one user, one weekend draft, one evolving hobby-to-portfolio project), not by defaulting to the most "impressive"-looking option.
- **On using AI to write boilerplate (SQL, config files):** pasting generated SQL isn't a shortcut around the real skill being tested. The real test is whether the design choices can be defended and extended without help — why tables are split the way they are, why a constraint exists, what a query is doing. Knowing "a DB needs relations" and being able to sketch the outline is most of the actual skill.
