# Fantasy Draft Assistant

A live draft-tracking and recommendation tool for in-person fantasy football drafts. Set your league size, position, scoring, and roster once, then mark players as drafted (by you or someone else) as the draft happens — recommendations update live off the real board.

Originally built as a single-file Claude artifact; this is the standalone version for permanent hosting and year-over-year iteration.

## What's in here

```
├── src/
│   ├── App.jsx        # the whole app — draft logic, UI, recommendation engine
│   ├── main.jsx        # React entry point
│   └── index.css        # Tailwind directives
├── api/
│   └── check-updates.js # Vercel serverless function — proxies the Anthropic API
│                         # so your key never reaches the browser
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. The "check for updates" button won't work locally unless you also run it through Vercel's dev server with an API key set (see below) — everything else works fine without one.

## Deploy to Vercel

1. **Push this to GitHub.** From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
   (Create the empty repo on GitHub first, or use `gh repo create` if you have the GitHub CLI.)

2. **Import into Vercel.** Go to [vercel.com/new](https://vercel.com/new), select the repo, and click Deploy. Vercel auto-detects Vite — no config changes needed.

3. **(Optional) Enable live news updates.** If you want the "check for updates" button to work:
   - Get an API key from [console.anthropic.com](https://console.anthropic.com) — this is a separate, pay-per-use API account, not your Claude.ai login.
   - In your Vercel project: Settings → Environment Variables → add `ANTHROPIC_API_KEY` with that key. Redeploy.
   - Skipping this is completely fine — the rest of the app (rankings, recommendations, roster tracking, undo, persistence) works with zero setup either way. The button will just show an error if tapped without a key configured.

4. You'll get a permanent URL (`your-project.vercel.app`) you can open on draft day, and every future push to `main` auto-redeploys.

## Iterating for next year

- **Player data / rankings:** edit the `PLAYER_DATA` array near the top of `src/App.jsx`. Each entry is `P('Name', 'POS', 'TEAM', 'note')` — order determines rank.
- **Roster / scoring defaults:** see `DEFAULT_ROSTER` and the `draft` initial state, both in `src/App.jsx`.
- **Recommendation weighting:** see the `NEED_WEIGHT` and `SCARCITY_ELIGIBLE` constants inside the `recommendations` useMemo — these control how much each position's "need" and "scarcity" count toward a pick's score.
- Storage is browser `localStorage`, scoped per-device — clearing browser data wipes saved drafts.

This repo has no automated tests. If you're comfortable asking Claude Code or another coding assistant to work directly in this repo next season, that'll likely be faster than pasting file contents back and forth in chat.
