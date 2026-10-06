# Grok Score

Installable, offline scoreboard for the party game **Poetry for Neanderthals**.

- 3-player mode: 1 round = 6 turns. Clockwise pass (A→B, B→C, C→A), then counterclockwise (B→A, C→B, A→C). The judge changes every turn. Poet and guesser share the points.
- Teams mode: 2 to 6 teams, poets rotate in list order, uneven teams handled by a permanent judge or by everyone poeting twice.
- 90 second hourglass on every turn (adjustable), with beep, vibration and keep-awake.
- Seat order set before the game; rounds added or removed during the game.
- Saved players you can rename in Settings (names update in past games too).
- History of finished games plus a leaderboard. Back up and restore as JSON.
- Light and dark mode.

All data lives in the browser's localStorage on each device. No account, no server.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # game logic tests (node:test)
npm run build    # production build into dist/
```

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds with the repo name as base path, and publishes to Pages.

One-time setup: in the repo on GitHub, go to **Settings → Pages → Source** and pick **GitHub Actions**.

The app is then at `https://<user>.github.io/<repo>/`. Open it on your phone and use **Add to Home Screen**.

## Structure

```
src/game.js            pure game logic (turn order, scoring, rounds, stats)
src/storage.js         localStorage helpers and backup export
src/useTimer.js        hourglass countdown, beep, vibration, wake lock
src/components/        Hourglass SVG, TimerPanel, bottom sheets
src/screens/           Home, Setup, Game, Results, History, Settings
tests/game.test.js     logic tests
```
