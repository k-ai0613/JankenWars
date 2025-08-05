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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Sound effects and music assets
- The classic game of Rock-Paper-Scissors for inspiration