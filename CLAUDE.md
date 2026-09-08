# CLAUDE.md

Project context for Claude Code. Keep this current as the project changes — it's read at the start of every session, so stale info here actively misleads future work.

## What this project is

A fantasy football draft-assistant web app: live snake-draft tracking, a recommendation engine, and a player database, for a 10-team Yahoo H2H points half-PPR league. Built as both a real draft-day tool and a portfolio piece.

## Stack

- Vite + React (plain JSX, not TypeScript in this app)
- Tailwind CSS (v3, via PostCSS — `tailwind.config.js` + `postcss.config.js`)
- `lucide-react` for icons
- Vercel for hosting; `api/check-updates.js` is a serverless function, not client code
- Supabase (Postgres) for the player database — schema managed via CLI migrations in `supabase/migrations/`, **not** the dashboard SQL editor

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build — run this before assuming a change works
supabase migration new <description>   # new schema change
supabase db push                       # apply pending migrations
```

## Key files

- `src/App.jsx` — the entire app: draft state, recommendation engine, all UI
- `src/main.jsx`, `src/index.css` — standard Vite/React entry, Tailwind directives
- `api/check-updates.js` — proxies the Anthropic API server-side so `ANTHROPIC_API_KEY` never reaches the browser. Do not move this logic to client-side code.
- `supabase/migrations/` — schema history. Every schema change gets a new migration file, never a manual dashboard edit.
- `draft_players_2026.csv` — the canonical player data export (419 players: rank, pos, pos_rank, name, team, proj_ppg, note)

## Things to know before touching the code

- **Storage is `localStorage`, not `window.storage`.** `window.storage` only exists inside Claude.ai artifacts — this is the standalone deployed version. Don't reintroduce it.
- **Never call `api.anthropic.com` directly from `src/`.** The key must stay server-side in `api/check-updates.js`. If you're adding a feature that needs the API, route it through a serverless function the same way.
- **Recommendation engine position-weighting is deliberate, not a bug to "simplify".** `NEED_WEIGHT` in the `recommendations` useMemo gives QB a much lower weight (35) than RB/WR/K/DEF (150) and TE (90), and excludes QB from the scarcity bonus entirely. This fixed a real bug where a correctly-ranked board's naturally-thin QB pool near the top got misread as an imminent "run," pushing QBs above true top-tier RB/WR in early-round recommendations. Don't flatten this back to a uniform weight without understanding why.
- **`overallPickFor` / `roundAndSlotFor` are the source of truth for snake draft order.** Both are verified round-trip consistent across all rounds/teams — if a bug ever seems to be here, check the caller's inputs before suspecting this math.
- **Supabase schema:** `player_rankings` and `player_updates` are intentionally separate from `players` — one holds time-varying rank/projection data, the other is an append-only news/severity log. Don't collapse these into columns on `players`; that was an explicit normalization decision, not oversight.
- **No RLS / `user_id` columns currently exist on purpose** — this is a single-user app; Supabase Auth gates API key usage, not multi-tenant data. If multi-user support is ever added, add `user_id uuid references auth.users(id)` to `drafts` and add RLS policies before exposing this beyond one person.

## Conventions

- Player data notes in the CSV/database follow an honesty convention: specific researched context for well-known players, and an explicitly-labeled data-only note (e.g. "not individually researched") for deep bench players, rather than invented-sounding detail. Preserve this distinction if you regenerate or extend the dataset.
- Commit schema changes as migrations, app changes as normal commits — don't let the two drift (e.g. a column referenced in `App.jsx` that doesn't exist in any migration).