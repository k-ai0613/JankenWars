# JankenWars - Strategic Rock-Paper-Scissors Battle Game

A strategic turn-based battle game combining the classic rock-paper-scissors mechanics with tactical board gameplay.

## Features

- **Strategic Gameplay**: Place pieces on a 6x6 board and be the first to line up 4
- **Rock-Paper-Scissors Captures**: Capture an opponent's piece by placing a piece that beats it
- **Multiple Game Modes**: 
  - Local 2-player on one device
  - vs AI with 6 difficulty levels
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

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/JankenWars.git
cd JankenWars
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The game will be available at `http://localhost:5000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Game Rules

### Objective
Be the first to line up 4 of your pieces in a row (horizontally, vertically, or diagonally) on the 6x6 board.

### Pieces
- Each player has 7 Rock, 7 Paper, 7 Scissors and 1 Special piece
- **Rock** beats Scissors, **Scissors** beats Paper, **Paper** beats Rock
- **Special**: can only be placed on an empty square; it cannot capture and cannot be captured. It counts toward your line

### Gameplay
1. Player 1 moves first; players then alternate, placing one piece per turn (pieces never move)
2. Online and against the AI, your piece (Rock/Paper/Scissors) is dealt at random each turn; you may place your Special piece instead. In local 2-player games, you choose your piece
3. Place the piece on an empty square, or on an opponent's piece that it beats in janken to capture it. A piece that would lose or tie cannot be placed there
4. A square where a capture happened is locked: no one can place a piece there again
5. The game is a draw if the board fills up, or both players run out of pieces, without a line of 4

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

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