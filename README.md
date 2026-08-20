# JankenWars - Strategic Rock-Paper-Scissors Battle Game

A strategic turn-based battle game combining the classic rock-paper-scissors mechanics with tactical board gameplay.

## Features

- **Strategic Gameplay**: Place and move your pieces on a 7x7 board to capture your opponent's flag
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

### Objective
Capture your opponent's flag or eliminate all their pieces to win.

### Piece Types
- **Rock**: Defeats Scissors
- **Paper**: Defeats Rock  
- **Scissors**: Defeats Paper
- **Flag**: Must be protected - if captured, you lose

### Gameplay
1. Each player starts with 8 pieces (2 of each type + 1 flag)
2. Take turns moving pieces one square at a time
3. When pieces meet on the same square, they battle using janken rules
4. The winner stays on the square, the loser is removed
5. First to capture the opponent's flag wins

## Development

### Project Structure
```
JankenWars/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── lib/         # Utilities and stores
│   │   ├── pages/       # Page components
│   │   └── locales/     # i18n translations
│   └── public/          # Static assets
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   └── routes.ts     # API routes
└── package.json      # Dependencies and scripts
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
| `npm run check` | TypeScript type check (server and shared only — see note) |
| `npm run db:push` | Apply the Drizzle schema |

> **`npm run lint` is currently not usable.** ESLint is neither installed nor
> configured, so the script fails on every platform. See `docs/BUG_ANALYSIS.md` (M-2).

> **`npm run check` does not cover the client.** `tsconfig.json` excludes
> `client/**/*`, so roughly 10,000 lines of React code are never type checked.
> See `docs/BUG_ANALYSIS.md` (M-1).

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
catches this for files covered by `tsconfig.json` — which currently means server code
only, until M-1 is addressed.

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