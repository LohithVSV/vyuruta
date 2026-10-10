# Vyuruta — Code to Conquer

Campus DSA-battle strategy game. Solo build. Target: prove it on home campus (~30 teams / 90-120 students out of ~400 second-years) before expanding.

**Stack:** React + Vite (frontend), Python + FastAPI + Supabase (backend)
**Repo:** `LohithVSV/vyuruta` — `backend` and `frontend` both pushed
**Success metric:** organic retention — people playing without being pushed to

---

## Game mechanics (locked)

- **Map:** 200 cities (100 Agni and 100 Jal), grouped by subject cluster, forest visual theme (unclaimed = overgrown, claimed = cleared + team banner).
- **City assignment:** no unclaimed-zone conquest in v1. New team joining = auto-assigned one unclaimed city as their home. After that, ownership only changes via battle.
- **Battle flow:** propose → accept/reject → both players check in. The challenger chooses Easy (default), Medium, or Difficult; the assigned question matches that tier. Easy questions focus on approachable fundamentals, Medium is around Two Sum/easy-medium, and Difficult stays medium to medium-hard. The coding timer starts when both players are present: 5 minutes for Easy, 10 for Medium, and 30 for Difficult. The first fully correct submission wins. If time expires before either solves it, the match is a draw with no reward, tribute, or city change. If one player checks in and the other misses the scheduled time plus a one-minute grace period, the present player wins by forfeit.
- **Conquest/tribute:** after a coding battle loss, treasure is transferred automatically to the winner based on difficulty (up to the loser's available balance); both players can leave the result animation without waiting for a decision. XP and passive tax mechanics are shelved.
- **Economy:** every player starts with 20,000 treasure and may claim 20,000 daily treasure once per UTC day. Battle rewards and leaderboard rankings use treasure; passive XP generation is shelved.
- **Daily question:** seed one stdin/stdout coding problem per UTC date in `backend/seed_daily_problems.py`. Solving all sample and hidden cases awards 5,000 treasure; forfeiting awards nothing. Either terminal result unlocks that day's leaderboard.
- **Battle history:** the dashboard lists recent battle treasure transfers won from or lost to other players. The map battle panel keeps active requests separate and limits its completed/closed history to the 10 most recent battles.
- **Game format v1:** DSA Sprint only (Debug Duel parked for post-pilot).
- **Team profile:** name + banner, bio, member list, no lead role, unified event/history feed (claims/losses/wins/hosting) that doubles as the global activity feed.
- **Leaderboard:** rankings show treasure earned during the selected week or season, with All World, Fire World, and Water World scopes.
- **Season length:** 4 weeks (28 days); when a season ends, every player's treasure balance resets to zero.
- **Weekly contest:** all teams compete together; winner gets 5% of campus-wide territory points for the week; 3-win streak → hosting rights (host sits out, curates from AI question pool).
- **Auth:** none for pilot — friends-only trust.
- **Question sourcing:** AI-generated + cached ahead of time, Codeforces metadata used only for calibration, classic CS problems rewritten, no LeetCode ever.
- **Launch plan:** seed 4-5 teams from close friends, get a few cities claimed and a battle or two fought before opening signup.

## Daily question authoring

Add a date-keyed entry to `backend/seed_daily_problems.py` with the title, slug, difficulty, prompt, topic names, and test cases. Each test case has stdin `input_data`, expected stdout `expected_output`, and `is_sample` to control whether players can see it. Run `python seed_daily_problems.py` from `backend/` to publish the question for that UTC date; rerunning skips dates that already have a published question.

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
Login/Signup, two-step signup (email/password/college → username + Fire/Water faction pick). Routed via `App.jsx` (`/auth` → AuthPage); successful login opens `/home`, and signup runs the onboarding reveal before opening `/home`.

**2. Landing page** — done at `/`; both calls to action open `/auth`.
TODO: add previews of the game map and code-battle mechanic (not done yet).

**3. Home/dashboard page** (`src/pages/HomePage.jsx` + `.css`), routed at `/home`
Current layout:
- Fixed top-left logo bar ("Vyuruta / Code to Conquer") + Map link, stays visible on scroll
- Main content: Active Battles section (cards per battle, "+ Propose" button, empty state) + Recent Realm Activity feed
- Right sidebar profile panel: faction avatar (`fire-character.png` / `water-character.png` from `src/assets/landing/` — one shared image per faction for now, per-user custom avatars planned later), username, college, faction badge, **stat grid (currency, cities held, win/loss record, streak) — this is the only place these stats are shown**, team-only history feed (separate from campus-wide feed), Sign Out button
- Background: custom generated image (`src/assets/home/dashboard-bg.png`) — dark ruins/forest, faint fire embers left / water sparkles right, with a dark gradient overlay so panels (semi-transparent + blurred) stay readable on top
- Connected to the FastAPI backend for the signed-in profile, cities, battles, sprint history, recent realm activity, and weekly leaderboard. Home data is loaded through `src/api.js`; profile wins/losses are derived from completed sprint records.

**Design system** (carries forward to future pages):
- Palette — bg `#12160F`, panels `#1B2118` (semi-transparent on Home), hairline `#2E3627`, parchment text `#E9E4D3`, muted text `#9CA38C`, gold accent `#C9A24B`, fire `#E1552E`, water `#2E8BC0`
- Fonts — `Spectral` (serif, headings/stat numbers) + `Inter` (body)

### Frontend — not built yet
- Backend endpoints are configurable with `VITE_API_URL` (defaults to `http://localhost:8000`).
- Territory map is available at `/map` and linked from the dashboard.
- Battle proposal flow page (`/battle/new` stub route referenced in HomePage nav)

---

## Next step

Pick up with either:
(a) wiring Home page to the local FastAPI backend, or
(b) building the Map page or Battle proposal page next

username tho kuda search chheyyachu cities ni