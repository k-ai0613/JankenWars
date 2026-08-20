# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JankenWars is a strategic online multiplayer board game based on rock-paper-scissors. Two players compete on a 6x6 board, placing janken pieces (rock/paper/scissors) with real-time synchronization via Socket.IO. Win by aligning 5 pieces in a row (vertical, horizontal, or diagonal).

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

# Type check - covers server/ and shared/ only, NOT client/ (see docs/BUG_ANALYSIS.md M-1)
npm run check

# Lint - currently fails: ESLint is not installed or configured (see docs/BUG_ANALYSIS.md M-2)
npm run lint
```

When adding a script, keep it shell-portable: no `ls`, `rm`, `cls`, subshell
`( ... || ... )` grouping, or `VAR=value` command prefixes. Those fail or behave
differently in `cmd.exe`. Use `path.resolve` / `fileURLToPath` for paths, never
string concatenation with `/`.

## Known Issues

`docs/BUG_ANALYSIS.md` catalogues 28 open findings from an audit of recurring bug
patterns, including two critical server-side issues (missing janken resolution and a
crash-on-malformed-payload). Consult it before touching `server/routes.ts`.

## Architecture

### Frontend (`client/`)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **Routing**: react-router-dom

Key stores in `client/src/lib/stores/`:
- `useJankenGame.ts` - Local/AI game state (board, pieces, turns, win detection)
- `useOnlineGame.ts` - Online multiplayer state (Socket.IO, rooms, sync)
- `useAudio.ts` - Sound management
- `useLanguage.ts` - i18n (English/Japanese)

Game logic in `client/src/lib/`:
- `gameUtils.ts` - Core game mechanics (win check, valid moves, board operations)
- `aiUtils.ts` - AI opponent logic with 6 difficulty levels (BEGINNER to EXPERT)

### Backend (`server/`)
- **Framework**: Express.js + Socket.IO
- **Entry**: `server/index.ts`
- **Types**: `server/types.ts` defines shared enums (Player, PieceType, GamePhase, GameResult)

Key files:
- `routes.ts` - REST API endpoints and Socket.IO event handlers
- `gameUtils.ts` - Server-side game validation (mirrors client logic)
- `security.ts` - Rate limiting and input validation
- `storage.ts` - In-memory game room storage

### Shared Types (`server/types.ts`)
Both client and server use these core types:
- `Player`: NONE(0), PLAYER1(1), PLAYER2(2)
- `PieceType`: EMPTY(0), ROCK(1), PAPER(2), SCISSORS(3), FLAG(4)
- `GamePhase`: ready, playing, selecting_cell, placing_piece, game_over
- `Board`: 2D array of `Cell` objects

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
SESSION_SECRET=xxx
ALLOWED_ORIGINS=https://jankenwars.onrender.com
```

## Deployment

Deployed on Render with auto-deploy from main branch.
- Build: `npm install && npx vite build`
- Start: `npx tsx server/index.ts`
- Static files served from `dist/public`

## Key Patterns

- Player numbers are assigned by server (`playerNumber: 1 | 2`), not array index
- `localPlayerNumber` in online games must come from server response
- AI mode uses `isAIEnabled` flag in game store
- Janken battles lock cells permanently (`jankenBattleCells` array)
- Game rooms auto-cleanup after 30 minutes of inactivity
- Special piece (FLAG) cannot be captured and cannot capture others
