# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JankenWars is a strategic online multiplayer board game based on rock-paper-scissors. Two players compete on a 6x6 board, placing janken pieces (rock/paper/scissors) with real-time synchronization via Socket.IO.

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
- `aiUtils.ts` - AI opponent logic with difficulty levels

### Backend (`server/`)
- **Framework**: Express.js + Socket.IO
- **Entry**: `server/index.ts`

Key files:
- `routes.ts` - REST API endpoints and Socket.IO event handlers
- `gameUtils.ts` - Server-side game validation
- `security.ts` - Rate limiting and input validation
- `storage.ts` - In-memory game room storage

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
