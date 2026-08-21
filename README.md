# Fantasy Draft Assistant

A live draft-tracking and recommendation tool for in-person fantasy football drafts. Set your league size, position, scoring, and roster once, then mark players as drafted (by you or someone else) as the draft happens — recommendations update live off the real board.

## What's in here

```
├── src/
│   ├── App.jsx       
│   ├── main.jsx        
│   └── index.css        
├── api/
│   └── check-updates.js 
│                         
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
## Iterating for next year

- **Player data / rankings:** edit the `PLAYER_DATA` array near the top of `src/App.jsx`. Each entry is `P('Name', 'POS', 'TEAM', 'note')` — order determines rank.
- **Roster / scoring defaults:** see `DEFAULT_ROSTER` and the `draft` initial state, both in `src/App.jsx`.
- **Recommendation weighting:** see the `NEED_WEIGHT` and `SCARCITY_ELIGIBLE` constants inside the `recommendations` useMemo — these control how much each position's "need" and "scarcity" count toward a pick's score.
- Storage is browser `localStorage`, scoped per-device — clearing browser data wipes saved drafts.
