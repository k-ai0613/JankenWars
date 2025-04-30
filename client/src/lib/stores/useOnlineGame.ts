import { create } from 'zustand';
import { socketService, RoomData, RoomPlayerData, GameMoveEvent } from '../socketService';
import { Board, Player, PieceType, Position, GameResult, GamePhase } from '../types';
import { createEmptyBoard, selectCellForPlayer } from '../gameUtils';

interface PlayerInfo {
  id: string;
  username: string;
  playerNumber: 1 | 2;
  ready: boolean;
}

interface OnlineGameState {
  isOnline: boolean;
  isConnected: boolean;
  roomId: string | null;
  players: PlayerInfo[];
  isSpectator: boolean;
  isInMatchmaking: boolean;
  gamePhase: GamePhase;
  board: Board;
  currentPlayer: Player;
  selectedPiece: PieceType | null;
  localPlayerNumber: 1 | 2 | null;
  gameResult: GameResult;
  message: string;
  
  // Connection methods
  connect: (username: string) => void;
  disconnect: () => void;
  
  // Room methods
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  toggleReady: () => void;
  
  // Matchmaking methods
  joinMatchmaking: () => void;
  cancelMatchmaking: () => void;
  
  // Game methods
  makeMove: (position: Position, piece: PieceType) => void;
  setSelectedPiece: (piece: PieceType | null) => void;
  endGame: (result: GameResult) => void;
  
  // Reset methods
  resetGame: () => void;
}

export const useOnlineGame = create<OnlineGameState>((set, get) => ({
  isOnline: false,
  isConnected: false,
  roomId: null,
  players: [],
  isSpectator: false,
  isInMatchmaking: false,
  gamePhase: GamePhase.READY,
  board: createEmptyBoard(),
  currentPlayer: Player.PLAYER1,
  selectedPiece: null,
  localPlayerNumber: null,
  gameResult: GameResult.ONGOING,
  message: "",
  
  connect: (username: string) => {
    // Setup socket handlers
    socketService.registerHandlers({
      onConnect: () => {
        set({ isConnected: true });
        socketService.joinWithUsername(username);
      },
      onDisconnect: () => {
        set({ 
          isConnected: false,
          isInMatchmaking: false,
          roomId: null,
          message: "Disconnected from server"
        });
      },
      onError: (error) => {
        set({ message: `Error: ${error.message || "Unknown error"}` });
      },
      onRoomCreated: (data: RoomData) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        set({
          roomId: data.roomId,
          players,
          isSpectator: false,
          localPlayerNumber: 1, // Creator is always player 1
          gamePhase: GamePhase.READY,
          message: "Room created. Waiting for opponent..."
        });
      },
      onPlayerJoined: (data: RoomData) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        set({
          players,
          message: `Player ${players.find(p => p.playerNumber === 2)?.username} joined the game`
        });
      },
      onRoomJoinedAsSpectator: (data: RoomData) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        set({
          roomId: data.roomId,
          players,
          isSpectator: true,
          localPlayerNumber: null,
          message: "Joined as spectator"
        });
      },
      onPlayerLeft: (data) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        set({
          players,
          message: "Opponent left the game",
          gamePhase: players.length < 2 ? GamePhase.READY : get().gamePhase
        });
      },
      onPlayerReady: (data) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        set({
          players,
          message: `Player ${players.find(p => p.id === data.playerId)?.username} is ${data.ready ? 'ready' : 'not ready'}`
        });
      },
      onGameStart: (data: RoomData) => {
        set({
          gamePhase: GamePhase.SELECTING_CELL,
          board: createEmptyBoard(),
          currentPlayer: Player.PLAYER1,
          message: "Game started! Player 1's turn"
        });
      },
      onGameMove: (data: GameMoveEvent) => {
        const { board } = get();
        const playerEnum = data.playerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2;
        
        // Apply the move
        const newBoard = JSON.parse(JSON.stringify(board)) as Board;
        const updatedBoard = selectCellForPlayer(data.position, playerEnum, data.piece, newBoard);
        
        // Switch current player
        const newCurrentPlayer = get().currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
        
        set({
          board: updatedBoard,
          currentPlayer: newCurrentPlayer,
          message: `Player ${newCurrentPlayer === Player.PLAYER1 ? '1' : '2'}'s turn`
        });
      },
      onGameResult: (result) => {
        set({
          gamePhase: GamePhase.GAME_OVER,
          gameResult: result.result,
          message: result.message || `Game over: ${result.result}`
        });
      },
      onMatchmakingWaiting: () => {
        set({
          isInMatchmaking: true,
          message: "Waiting for opponent..."
        });
      },
      onMatchmakingMatched: (data: RoomData) => {
        const players = data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        }));
        
        // Find my player number
        const mySocketId = socketService.getSocketId();
        const myPlayer = players.find(p => p.id === mySocketId);
        
        set({
          roomId: data.roomId,
          players,
          isSpectator: false,
          localPlayerNumber: myPlayer ? myPlayer.playerNumber : null,
          isInMatchmaking: false,
          gamePhase: GamePhase.READY,
          message: "Matched with opponent! Get ready to play."
        });
      },
      onMatchmakingCancelled: () => {
        set({
          isInMatchmaking: false,
          message: "Matchmaking cancelled"
        });
      },
    });
    
    // Connect to the server
    socketService.connect();
    
    set({
      isOnline: true,
      message: "Connecting to server..."
    });
  },
  
  disconnect: () => {
    socketService.disconnect();
    set({
      isOnline: false,
      isConnected: false,
      roomId: null,
      players: [],
      isSpectator: false,
      isInMatchmaking: false,
      gamePhase: GamePhase.READY,
      message: ""
    });
  },
  
  createRoom: () => {
    if (!get().isConnected) return;
    socketService.createRoom();
  },
  
  joinRoom: (roomId: string) => {
    if (!get().isConnected) return;
    socketService.joinRoom(roomId);
  },
  
  toggleReady: () => {
    const { roomId } = get();
    if (!roomId || !get().isConnected) return;
    socketService.toggleReady(roomId);
  },
  
  joinMatchmaking: () => {
    if (!get().isConnected) return;
    socketService.joinMatchmaking();
    set({ message: "Finding opponent..." });
  },
  
  cancelMatchmaking: () => {
    if (!get().isConnected || !get().isInMatchmaking) return;
    socketService.cancelMatchmaking();
  },
  
  makeMove: (position: Position, piece: PieceType) => {
    const { roomId, gamePhase, board, currentPlayer, localPlayerNumber } = get();
    
    if (!roomId || gamePhase !== GamePhase.SELECTING_CELL) return;
    
    // Check if it's this player's turn
    const myPlayer = localPlayerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2;
    if (currentPlayer !== myPlayer) return;
    
    // Process the move locally first
    const newBoard = JSON.parse(JSON.stringify(board)) as Board;
    const updatedBoard = selectCellForPlayer(position, myPlayer, piece, newBoard);
    
    // Switch current player locally
    const newCurrentPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
    
    // Send the move to the server
    socketService.sendGameMove(roomId, position, piece);
    
    set({
      board: updatedBoard,
      currentPlayer: newCurrentPlayer,
      selectedPiece: null,
      message: `Player ${newCurrentPlayer === Player.PLAYER1 ? '1' : '2'}'s turn`
    });
  },
  
  setSelectedPiece: (piece: PieceType | null) => {
    set({ selectedPiece: piece });
  },
  
  endGame: (result: GameResult) => {
    const { roomId } = get();
    if (!roomId) return;
    
    let messageText = "";
    switch (result) {
      case GameResult.PLAYER1_WIN:
        messageText = "Player 1 wins!";
        break;
      case GameResult.PLAYER2_WIN:
        messageText = "Player 2 wins!";
        break;
      case GameResult.DRAW:
        messageText = "The game is a draw!";
        break;
    }
    
    // Send the game result to the server
    socketService.sendGameResult(roomId, result);
    
    set({
      gamePhase: GamePhase.GAME_OVER,
      gameResult: result,
      message: messageText
    });
  },
  
  resetGame: () => {
    set({
      gamePhase: GamePhase.READY,
      board: createEmptyBoard(),
      currentPlayer: Player.PLAYER1,
      selectedPiece: null,
      gameResult: GameResult.ONGOING,
      message: ""
    });
  }
}));