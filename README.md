# Vyuruta — Code to Conquer

Campus DSA-battle strategy game. Solo build. Target: prove it on home campus (~30 teams / 90-120 students out of ~400 second-years) before expanding.

**Stack:** React + Vite (frontend), Python + FastAPI + Supabase (backend)
**Repo:** `LohithVSV/vyuruta` — `backend` and `frontend` both pushed
**Success metric:** organic retention — people playing without being pushed to

---

## Game mechanics (locked)

- **Map:** 100 cities, grouped by subject cluster, forest visual theme (unclaimed = overgrown, claimed = cleared + team banner).
- **City assignment:** no unclaimed-zone conquest in v1. New team joining = auto-assigned one unclaimed city as their home. After that, ownership only changes via battle.
- **Battle flow:** propose → accept/reject terms → accept/reject time slot (no counters). Any team member can accept/reject. 3 rejections between a pair = 48hr cooldown, resets after a confirmed battle.
- **Conquest/tribute:** win a battle over an occupied city → loser picks (a) one-time 2000 currency payment, or (b) ongoing 1% passive-income tax until they win a rematch and reclaim the city.
- **Currency:** earned via winning games + daily challenges.
- **Game format v1:** DSA Sprint only (Debug Duel parked for post-pilot).
- **Team profile:** name + banner, bio, member list, no lead role, unified event/history feed (claims/losses/wins/hosting) that doubles as the global activity feed.
- **Weekly contest:** all teams compete together; winner gets 5% of campus-wide territory points for the week; 3-win streak → hosting rights (host sits out, curates from AI question pool).
- **Season length:** 6-8 weeks.
- **Auth:** none for pilot — friends-only trust.
- **Question sourcing:** AI-generated + cached ahead of time, Codeforces metadata used only for calibration, classic CS problems rewritten, no LeetCode ever.
- **Launch plan:** seed 4-5 teams from close friends, get a few cities claimed and a battle or two fought before opening signup.

## Still open / parked

1. City-tier generation rates (actual numbers)
2. City naming scheme
3. Generation engine — parked, "think it later"
4. Outreach one-pager
5. Deployment host for FastAPI (Render/Railway/Fly.io — Vercel won't run FastAPI natively)

---

## Build status

### Backend
- FastAPI backend is code-complete, runs locally (`uvicorn` + `/docs` work)
- No real data yet, not deployed

### Frontend — pages built

**1. AuthPage** (`src/pages/AuthPage.jsx` + `.css`)
Login/Signup, two-step signup (email/password/college → username + Fire/Water faction pick). Routed via `App.jsx` (`/` → Landing, `/auth` → AuthPage).

**2. Landing page** — done.
TODO: add previews of the game map and code-battle mechanic (not done yet).

**3. Home/dashboard page** (`src/pages/HomePage.jsx` + `.css`)
Current layout:
- Fixed top-left logo bar ("Vyuruta / Code to Conquer") + Map link, stays visible on scroll
- Main content: Active Battles section (cards per battle, "+ Propose" button, empty state) + Campus-wide activity feed (scrollable)
- Right sidebar profile panel: faction avatar (`fire-character.png` / `water-character.png` from `src/assets/landing/` — one shared image per faction for now, per-user custom avatars planned later), username, college, faction badge, **stat grid (currency, cities held, win/loss record, streak) — this is the only place these stats are shown**, team-only history feed (separate from campus-wide feed), Sign Out button
- Background: custom generated image (`src/assets/home/dashboard-bg.png`) — dark ruins/forest, faint fire embers left / water sparkles right, with a dark gradient overlay so panels (semi-transparent + blurred) stay readable on top
- Built against `src/data/mockData.js` (mock team/battles/history/feed, shaped like the real API response). Two `TODO` comments mark where to swap in real fetches: the `useState` initial values (→ `useEffect` + fetch) and the sign-out handler (→ real Supabase sign-out)

**Design system** (carries forward to future pages):
- Palette — bg `#12160F`, panels `#1B2118` (semi-transparent on Home), hairline `#2E3627`, parchment text `#E9E4D3`, muted text `#9CA38C`, gold accent `#C9A24B`, fire `#E1552E`, water `#2E8BC0`
- Fonts — `Spectral` (serif, headings/stat numbers) + `Inter` (body)

### Frontend — not built yet
- Wire HomePage to real FastAPI endpoints once backend is deployed (or point at `localhost:8000` directly — faster than deploying first)
- Full Map page (`/map` stub route referenced in HomePage nav)
- Battle proposal flow page (`/battle/new` stub route referenced in HomePage nav)
- Daily challenge feature

---

## Next step

Pick up with either:
(a) wiring Home page to the local FastAPI backend, or
(b) building the Map page or Battle proposal page next
