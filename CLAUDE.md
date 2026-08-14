# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JankenWars is a strategic online multiplayer board game based on rock-paper-scissors. Two players compete on a 6x6 board, placing janken pieces (rock/paper/scissors) with real-time synchronization via Socket.IO. Win by aligning 4 pieces in a row (vertical, horizontal, or diagonal) — see `WIN_LENGTH` in `server/gameUtils.ts` / `client/src/lib/gameUtils.ts`.

## Development Commands

```bash
# Start development (frontend only with Vite)
npm run dev

# Start development (frontend + backend concurrently)
npm run dev:full

# Start backend server only
npm run server-dev

# Build for production
npm run build

# Type check
npm run check

# Lint
npm run lint
```

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
- `routes.ts` - REST API endpoints and Socket.IO event handlers. Game room state itself lives here,
  in the in-memory `gameRooms` object (not in `storage.ts`).
- `gameUtils.ts` - Server-side game validation (mirrors client logic, including janken win/lose resolution)
- `security.ts` - Rate limiting and input validation
- `storage.ts` - In-memory user CRUD scaffold (`MemStorage`). Not wired to any route or game logic;
  currently unused. Do not confuse with game room storage, which is in `routes.ts`.

### Shared Types (`server/types.ts`)
Both client and server use these core types:
- `Player`: NONE(0), PLAYER1(1), PLAYER2(2)
- `PieceType`: EMPTY(0), ROCK(1), PAPER(2), SCISSORS(3), SPECIAL(4)
- `GamePhase`: NOT_CONNECTED, READY, SELECTING_CELL, GAME_OVER, SHOWDOWN, ENDED
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
```

Note: `SESSION_SECRET` and `ALLOWED_ORIGINS` are not currently read anywhere in the codebase
(no session middleware exists; allowed CORS origins are hardcoded in `server/index.ts` and
`server/routes.ts` based on `NODE_ENV`). Setting these env vars in Render has no effect today.

## Deployment

Deployed on Render with auto-deploy from main branch.
- Build: `npm install && npx vite build`
- Start: `npx tsx server/index.ts`
- Static files served from `dist/public`

## Key Patterns

- Player numbers are assigned by server (`playerNumber: 1 | 2`), not array index
- `localPlayerNumber` in online games must come from server response
- AI mode uses `isAIEnabled` flag in game store
- Janken battles lock cells permanently. Local/AI mode tracks this via the `jankenBattleCells`
  array in `useJankenGame.ts`; online mode uses `Cell.hasBeenUsed` instead (no `jankenBattleCells`
  on the server or in `useOnlineGame.ts`) — these are two separate mechanisms, not one
- Game rooms not in progress auto-delete after 30 minutes of inactivity. Rooms with a game in
  progress are never deleted on inactivity alone; a disconnected player instead gets a 60s
  reconnect grace period (`DISCONNECT_GRACE_PERIOD` in `server/routes.ts`) before being removed
  and the remaining player awarded the win
- Special piece (SPECIAL) cannot be captured and cannot capture others
