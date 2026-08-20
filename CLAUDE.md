# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JankenWars is a strategic online multiplayer board game based on rock-paper-scissors. Two players compete on a 6x6 board, placing janken pieces (rock/paper/scissors) with real-time synchronization via Socket.IO. Win by aligning `WIN_LENGTH` pieces in a row (vertical, horizontal, or diagonal).
`WIN_LENGTH` is 4 and is defined once in `shared/gameRules.ts`; the UI copy reads
from it, so never write the number into prose or a component.

## Development Commands

All scripts are shell-portable and run identically on macOS, Linux and Windows
(PowerShell or `cmd`). Node is pinned to 20.11.1 via `.nvmrc`, matching `render.yaml`.

```bash
# Start development (frontend + backend concurrently) - open http://localhost:5001
npm run dev:full

# Start development (frontend only with Vite, port 5001)
# Online multiplayer will NOT connect - nothing listens on 5000
npm run dev

# Start backend server only (Express + Socket.IO, port 5000)
npm run server-dev

# Build for production (vite build -> dist/public, then tsc -> dist/server)
npm run build

# Type check - tsconfig.json (server + shared) and tsconfig.client.json (client)
npm run check

# Lint (ESLint 9 flat config in eslint.config.js)
npm run lint

# Regression tests: shared rules, i18n coverage, live Socket.IO server
npm test
```

When adding a script, keep it shell-portable: no `ls`, `rm`, `cls`, subshell
`( ... || ... )` grouping, or `VAR=value` command prefixes. Those fail or behave
differently in `cmd.exe`. Use `path.resolve` / `fileURLToPath` for paths, never
string concatenation with `/`.

## Tests

```bash
npm test   # shared rules, i18n coverage, and the live Socket.IO server
```

`tests/` holds regression tests for every finding in `docs/BUG_ANALYSIS.md`.
`tests/server.test.ts` boots the real `registerRoutes` and drives it with
`socket.io-client`, so server behaviour is checked end to end rather than mocked.
Add a test there before fixing anything in `server/routes.ts`.

## Architecture

### Shared (`shared/`) - the single source of truth

Anything both sides must agree on lives here and is re-exported by the client and
the server. Never redeclare these; a client/server copy that drifted apart is the
bug commit ddda9a2 had to repair.

- `gameTypes.ts` - `Player`, `PieceType`, `GamePhase`, `GameResult`, `Cell`,
  `Board`, `Position`, `WinningLine`, `PlayerInventory` (all string enums)
- `gameRules.ts` - `BOARD_SIZE` (6), `WIN_LENGTH` (4), the starting inventory, and
  every rule decision: `isValidMove`, `applyMove`, `attackerWins`,
  `findWinningLine`, `checkDraw`
- `events.ts` - every Socket.IO event name and payload type
- `schema.ts` - Drizzle table definitions (not wired to a database yet)

### Frontend (`client/`)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (persistence is deliberately disabled - restoring a
  board from localStorage conflicted with live state and caused reset loops)
- **Routing**: react-router-dom

Key stores in `client/src/lib/stores/`:
- `useJankenGame.ts` - Local/AI game state (board, pieces, turns, win detection)
- `useOnlineGame.ts` - Online multiplayer state (Socket.IO, rooms, sync)
- `useAudio.ts` - Sound management
- `useLanguage.tsx` - i18n (English/Japanese)

Game logic in `client/src/lib/`:
- `gameUtils.ts` - re-exports `shared/gameRules.ts` plus client-only helpers
- `types.ts` - re-exports `shared/gameTypes.ts` plus `normalizePlayer`
- `aiUtils.ts` - AI opponent logic with 6 difficulty levels (BEGINNER to EXPERT)
- `socketService.ts` - Socket.IO client, typed against `shared/events.ts`

### Backend (`server/`)
- **Framework**: Express.js + Socket.IO
- **Entry**: `server/index.ts`

Key files:
- `routes.ts` - REST endpoints and Socket.IO handlers. Every handler is registered
  through the local `on()` wrapper, which rate-limits, type-guards the payload and
  catches anything thrown. Register new handlers the same way - a raw `socket.on`
  can take the process down.
- `gameUtils.ts` / `types.ts` - thin re-exports of `shared/`
- `security.ts` - origin allowlist, HTTP and per-socket rate limiting, validation
- `storage.ts` - in-memory user store (unused by the game)

### Socket.IO Events Flow
1. Room creation/joining with player number assignment
2. Matchmaking with automatic ready state
3. Real-time game state synchronization
4. Turn-based piece placement with battle resolution

## Environment Variables

```bash
# Client (prefix with VITE_)
VITE_ADSENSE_CLIENT=ca-pub-xxx          # Google AdSense client ID
VITE_ADSENSE_SLOT=xxx                   # Banner ad slot
VITE_ADSENSE_INTERSTITIAL_SLOT=xxx      # Interstitial ad slot

# Server
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://jankenwars.onrender.com   # comma separated; applies to
                                                  # both HTTP and Socket.IO CORS
```

There is no session middleware, so `SESSION_SECRET` is not read by anything.

## Deployment

Deployed on Render with auto-deploy from main branch.
- Build: `npm install && npx vite build`
- Start: `npx tsx server/index.ts`
- Static files served from `dist/public`

## Key Patterns

- The server is authoritative. It validates every move with the same
  `shared/gameRules.ts` code the client uses, including the janken outcome, the
  turn owner, the inventory and the game phase. Never trust a client payload.
- Player numbers are assigned by server (`playerNumber: 1 | 2`), not array index
- `localPlayerNumber` in online games must come from server response
- AI mode uses `isAIEnabled` flag in game store
- Janken battles lock a cell permanently via `Cell.hasBeenUsed`
- Leaving a room goes through one routine shared by `room:leave` and `disconnect`,
  so a disconnect always clears `inProgress` and emits `game:force:end`
- Game rooms auto-cleanup after 30 minutes of inactivity
- The special piece cannot be captured and cannot capture others
- `t()` returns the key itself when a translation is missing, so a missing key
  renders as raw text. `npm test` fails if any key is unresolved.
