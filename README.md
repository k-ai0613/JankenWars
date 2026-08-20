# JankenWars - Strategic Rock-Paper-Scissors Battle Game

A strategic turn-based battle game combining the classic rock-paper-scissors mechanics with tactical board gameplay.

## Features

- **Strategic Gameplay**: Place pieces on a 6x6 board and line up four in a row
- **Rock-Paper-Scissors Battles**: Engage in battles using classic janken rules when pieces meet
- **Multiple Game Modes**: 
  - Local vs AI with adjustable difficulty
  - Online multiplayer battles
- **Multi-language Support**: Available in English and Japanese
- **Immersive Audio**: Background music and sound effects enhance the gaming experience
- **Progressive Web App**: Install and play offline on any device

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Express.js + Socket.io (for online multiplayer)
- **PWA**: Service Worker for offline capability

## Getting Started

### Prerequisites

- **Node.js 20.11.1** — pinned in `.nvmrc` and matched to the production runtime in `render.yaml`
- **npm 10+** (bundled with Node 20.11.1)

The project is developed on both macOS and Windows. All npm scripts are shell-portable,
so the commands below are identical on either platform.

<details>
<summary><b>macOS / Linux</b> — installing the pinned Node version</summary>

```bash
# nvm
nvm install && nvm use          # reads .nvmrc

# or fnm
fnm use --install-if-missing    # reads .nvmrc
```
</details>

<details>
<summary><b>Windows</b> — installing the pinned Node version</summary>

```powershell
# fnm (recommended — reads .nvmrc like it does on macOS)
fnm use --install-if-missing

# nvm-windows does not read .nvmrc, so pass the version explicitly
nvm install 20.11.1
nvm use 20.11.1
```

Use PowerShell or Windows Terminal. No script in this repo requires Git Bash or WSL.
</details>

### Installation

1. Clone the repository:
```bash
git clone https://github.com/k-ai0613/JankenWars.git
cd JankenWars
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
npm run dev:full
```

Then open **`http://localhost:5001`**.

`dev:full` runs two processes together:

| Process | Port | Purpose |
|---------|------|---------|
| Vite dev server | **5001** | The UI you open in the browser |
| Express + Socket.IO | **5000** | REST API and online multiplayer |

Vite proxies `/api`, `/socket.io` and `/ws` through to port 5000, so you only ever
visit 5001. Both ports use `strictPort`, so startup fails loudly if either is taken
rather than silently moving to another port.

`npm run dev` starts **only** the Vite server. Local and AI matches work, but online
multiplayer will not connect because nothing is listening on port 5000. Use
`dev:full` unless you are deliberately working on the frontend alone.

### Building for Production

```bash
npm run build
```

This runs `vite build` (client bundle → `dist/public`) followed by `tsc`
(server type check and emit → `dist/server`). The built files are in `dist`.

## Game Rules

Board size and win length are defined once in `shared/gameRules.ts`
(`BOARD_SIZE = 6`, `WIN_LENGTH = 4`) and every UI string reads from them.

### Objective
Be the first to line up **4** of your pieces in a row — horizontally, vertically
or diagonally — on the **6x6** board.

### Pieces
Each player starts with 7 rock, 7 paper, 7 scissors and 1 special piece.

- **Rock** beats Scissors
- **Scissors** beats Paper
- **Paper** beats Rock
- **Special**: can only be placed on an empty cell, cannot capture, and cannot be
  captured. It still counts toward a line.

### Gameplay
1. On your turn you place one piece from your inventory.
2. Any piece may go on an empty cell.
3. To take an opponent's cell you must **win the janken battle** against the piece
   already there. An equal piece counts as a loss for the attacker.
4. A cell that has been through a janken battle is locked — no one can play it again.
5. The game is a draw when the board fills up, or when both players run out of
   pieces, without either reaching 4 in a row.

The server validates all of the above with the same `shared/gameRules.ts` code the
client uses, so a modified client cannot make an illegal move.

## Development

### Project Structure
```
JankenWars/
├── shared/           # Single source of truth for both sides
│   ├── gameTypes.ts  # Enums, Cell, Board, Position, ...
│   ├── gameRules.ts  # BOARD_SIZE, WIN_LENGTH, isValidMove, applyMove, ...
│   └── events.ts     # Socket.IO event names and payload types
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── lib/         # Stores, socket client, AI
│       └── pages/       # Page components
├── server/           # Express + Socket.IO backend
│   ├── index.ts      # Entry point, CORS, security headers
│   ├── routes.ts     # REST endpoints and Socket.IO handlers
│   └── security.ts   # Origin allowlist, rate limiting, validation
├── tests/            # Regression tests (npm test)
└── docs/             # BUG_ANALYSIS.md
```

### Available Scripts

Every script below runs identically on macOS, Linux and Windows (PowerShell or `cmd`).

| Script | What it does |
|--------|--------------|
| `npm run dev:full` | Vite (5001) + Express/Socket.IO (5000) — **use this for online multiplayer** |
| `npm run dev` | Vite only (5001) — frontend work, no backend |
| `npm run server-dev` | Express/Socket.IO only (5000) |
| `npm run build` | `vite build` → `dist/public`, then `tsc` → `dist/server` |
| `npm run preview` | Serve the production client bundle |
| `npm run check` | TypeScript type check — server, shared **and** client |
| `npm run lint` | ESLint (flat config in `eslint.config.js`) |
| `npm test` | Regression tests: shared rules, i18n coverage, live Socket.IO server |
| `npm run db:push` | Apply the Drizzle schema |

`npm test` boots the real server from `server/routes.ts` and drives it with
`socket.io-client`, so it checks actual behaviour rather than mocks. It covers
every finding in `docs/BUG_ANALYSIS.md` that had a reproducible failure.

### Cross-platform notes

The repository is set up so a checkout behaves the same on macOS and Windows:

- **`.nvmrc`** pins Node to `20.11.1`, the same version `render.yaml` uses in production.
- **`.gitattributes`** normalises every text file to LF in the repository *and* in the
  working tree, so switching machines never produces whitespace-only diffs.
  `*.bat` and `*.cmd` stay CRLF because Windows requires it; binary assets
  (audio, images, fonts, `gradle-wrapper.jar`) are excluded from conversion.
- **`.editorconfig`** keeps indentation, charset and final newlines consistent across editors.
- **npm scripts avoid shell built-ins.** Nothing calls `ls`, `rm`, `cls`, subshell
  `( … || … )` grouping, or `VAR=value` command prefixes — all of which behave
  differently or fail outright in `cmd.exe`.
- **Paths are resolved with `path.resolve` and `fileURLToPath`** throughout
  `vite.config.ts` and `server/vite.ts`, never by string concatenation.

One caveat worth knowing: macOS and Windows both use case-insensitive filesystems by
default, while the Render deployment runs on case-sensitive Linux. An import written as
`./Types` instead of `./types` will work on both of your machines and fail only in
production. TypeScript's `forceConsistentCasingInFileNames` (on by default in TS 5.x)
catches this, and `npm run check` now covers the client as well as the server, so
a casing mistake fails locally instead of only in production.

## Deployment

### Option 1: Deploy with Backend (Full Online Multiplayer)

To enable online multiplayer, you need to deploy both the backend server and frontend:

#### Backend Deployment Options:
- **Render**: Free tier available, supports Node.js
- **Railway**: Simple deployment with GitHub integration
- **Heroku**: Reliable but requires paid plan
- **AWS/GCP/Azure**: For production-scale deployment

#### Steps:
1. Set the `VITE_SOCKET_URL` environment variable to your backend URL
2. Deploy the backend (Express + Socket.io server)
3. Build and deploy the frontend with: `npm run build`

### Option 2: Static Deployment (Local Play Only)

For local play only (vs AI), you can deploy as a static site:

- **GitHub Pages**: Free hosting for static sites
- **Netlify**: Auto-deploy from GitHub
- **Vercel**: Excellent for React apps

Note: Online multiplayer will NOT work without a backend server.

## Environment Variables

Create a `.env` file for local development:

```bash
# Socket.io server URL (for online multiplayer)
VITE_SOCKET_URL=http://localhost:5000  # Development
# VITE_SOCKET_URL=https://your-backend-url.com  # Production
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Sound effects and music assets
- The classic game of Rock-Paper-Scissors for inspiration