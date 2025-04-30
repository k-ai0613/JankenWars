import { io, Socket } from 'socket.io-client';
import { Position, PieceType, Player, Board, GameResult } from './types';

// Event handlers type definitions
export interface GameMoveData {
  position: Position;
  piece: PieceType;
}

export interface RoomPlayerData {
  id: string;
  username: string;
  playerNumber: number;
  ready?: boolean;
}

export interface RoomData {
  roomId: string;
  players: RoomPlayerData[];
}

export interface GameMoveEvent {
  playerId: string;
  playerNumber: number;
  position: Position;
  piece: PieceType;
}

export interface SocketHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onRoomCreated?: (data: RoomData) => void;
  onRoomJoined?: (data: RoomData) => void;
  onRoomJoinedAsSpectator?: (data: RoomData) => void;
  onPlayerJoined?: (data: RoomData) => void;
  onPlayerLeft?: (data: { playerId: string, players: RoomPlayerData[] }) => void;
  onPlayerReady?: (data: { playerId: string, ready: boolean, players: RoomPlayerData[] }) => void;
  onGameStart?: (data: RoomData) => void;
  onGameMove?: (data: GameMoveEvent) => void;
  onGameResult?: (result: any) => void;
  onMatchmakingWaiting?: () => void;
  onMatchmakingMatched?: (data: RoomData) => void;
  onMatchmakingCancelled?: () => void;
}

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketHandlers = {};

  // Initialize the socket connection
  connect(): void {
    if (this.socket) {
      return;
    }

    // Connect to the server
    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.handlers.onDisconnect?.();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handlers.onError?.(error);
    });

    // Room events
    this.socket.on('room:created', (data) => {
      console.log('Room created:', data);
      this.handlers.onRoomCreated?.(data);
    });

    this.socket.on('room:player:joined', (data) => {
      console.log('Player joined room:', data);
      this.handlers.onPlayerJoined?.(data);
    });

    this.socket.on('room:joined:spectator', (data) => {
      console.log('Joined room as spectator:', data);
      this.handlers.onRoomJoinedAsSpectator?.(data);
    });

    this.socket.on('player:left', (data) => {
      console.log('Player left:', data);
      this.handlers.onPlayerLeft?.(data);
    });

    this.socket.on('room:player:ready', (data) => {
      console.log('Player ready status changed:', data);
      this.handlers.onPlayerReady?.(data);
    });

    // Game events
    this.socket.on('game:start', (data) => {
      console.log('Game started:', data);
      this.handlers.onGameStart?.(data);
    });

    this.socket.on('game:move', (data) => {
      console.log('Game move received:', data);
      this.handlers.onGameMove?.(data);
    });

    this.socket.on('game:result', (data) => {
      console.log('Game result:', data);
      this.handlers.onGameResult?.(data);
    });

    // Matchmaking events
    this.socket.on('matchmaking:waiting', () => {
      console.log('Waiting for a match...');
      this.handlers.onMatchmakingWaiting?.();
    });

    this.socket.on('matchmaking:matched', (data) => {
      console.log('Matched with opponent:', data);
      this.handlers.onMatchmakingMatched?.(data);
    });

    this.socket.on('matchmaking:cancelled', () => {
      console.log('Matchmaking cancelled');
      this.handlers.onMatchmakingCancelled?.();
    });
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Register event handlers
  registerHandlers(handlers: SocketHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Clear all handlers
  clearHandlers(): void {
    this.handlers = {};
  }

  // User actions
  joinWithUsername(username: string): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('user:join', username);
  }

  // Room actions
  createRoom(): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('room:create');
  }

  joinRoom(roomId: string): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('room:join', roomId);
  }

  toggleReady(roomId: string): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('player:ready', roomId);
  }

  // Game actions
  sendGameMove(roomId: string, position: Position, piece: PieceType): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('game:move', roomId, { position, piece });
  }

  sendGameResult(roomId: string, result: GameResult): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('game:result', roomId, result);
  }

  // Matchmaking actions
  joinMatchmaking(): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('matchmaking:join');
  }

  cancelMatchmaking(): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit('matchmaking:cancel');
  }

  // Helper to check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Create a singleton instance
export const socketService = new SocketService();