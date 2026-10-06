# Grok Score: notes for Claude

Vite + React 19 PWA (vite-plugin-pwa). No backend. Deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `main`.

## Commands
- `npm install`, `npm run dev`, `npm test`, `npm run build`
- Run `npm test` and `npm run build` before every commit.

## Rules that must not change without the owner asking
- 3-player round is 6 turns in this exact order (indexes into seat order A,B,C): A→B, B→C, C→A (clockwise), then B→A, C→B, A→C (counterclockwise). Judge is the third player. Defined in `THREE_ORDER` in `src/game.js` and locked by tests.
- Scoring: +3 hard, +1 easy, −1 miss. In 3-player mode the poet and guesser both get the points.
- Default timer 90 seconds.

## Architecture
- `src/game.js` is pure logic. Scores are an append-only event log `{ t, pts, keys }`; totals and per-round tables are derived. Keep new logic here and add tests in `tests/game.test.js`.
- Persistence: `usePersisted` in `src/storage.js`, keys prefixed `grok.` (`settings`, `players`, `games`, `current`, `lastSetup`). The in-progress game is saved on every change so a closed app resumes.
- Players are referenced by id; finished games also snapshot names so history survives deleted players. Removing a player who appears in history archives them instead.
- Theming via CSS variables in `src/styles.css` (`:root[data-theme='light']`). Player and team colors come from `src/colors.js` (two tones per color).

## Style
- No em dashes in UI copy.
