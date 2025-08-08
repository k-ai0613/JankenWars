import { io, Socket } from 'socket.io-client';
import { Position, PieceType, Player, Board, GameResult, GamePhase, PlayerInventory } from './types';

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
  onGameStart?: (data: RoomData & { gameState?: GameState }) => void;
  onGameMove?: (data: GameMoveEvent) => void;
  onGameResult?: (result: any) => void;
  onMatchmakingWaiting?: () => void;
  onMatchmakingMatched?: (data: RoomData) => void;
  onMatchmakingCancelled?: () => void;
  onGameStateUpdate?: (data: { gameState: GameState, moveDetails: MoveDetails }) => void;
  onRoomLeftSuccess?: () => void;
  onGameRematchInitiated?: (data: RoomData & { gameState: GameState }) => void;
}

// ★ 追加: GameState 型 (サーバーから送られてくる完全な状態)
//    server/routes.ts の GameState と一致させる
export interface GameState {
  board: Board;
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  currentPlayer: Player;
  gamePhase: GamePhase;
  gameResult: GameResult;
  lastMove?: { player: Player; piece: PieceType; position: Position } | null;
}

// ★ 追加: MoveDetails 型 (サーバーから送られてくる手の詳細)
//    server/routes.ts の game:state:update イベントデータと一致させる
export interface MoveDetails {
  player: Player;
  piece: PieceType;
  position: Position;
  capturedPiece: PieceType | null;
  hasBeenUsed: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketHandlers = {};

  // Initialize the socket connection
  connect(): void {
    if (this.socket) {
      return;
    }

    // 環境変数またはデフォルト値を使用
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 
                     (import.meta.env.DEV ? 'http://localhost:5000' : 'https://jankenwars.onrender.com');

    // Connect to the server
    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      forceNew: false,
      upgrade: true
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Connected to server successfully');
      console.log('Socket ID:', this.socket?.id);
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server, reason:', reason);
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handlers.onError?.(error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handlers.onError?.(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection failed:', error);
    });

    // Room events
    this.socket.on('room:created', (data) => {
      console.log('Room created:', data);
      this.handlers.onRoomCreated?.(data);
    });

    this.socket.on('room:joined', (data) => {
      console.log('Joined room as player:', data);
      this.handlers.onRoomJoined?.(data);
    });

    this.socket.on('room:player:joined', (data) => {
      console.log('Player joined room notification:', data);
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

    // ★ 追加: ゲーム状態更新イベントリスナー
    this.socket.on('game:state:update', (data: { gameState: GameState, moveDetails: MoveDetails }) => {
      console.log('Game state update received:', data);
      this.handlers.onGameStateUpdate?.(data);
    });

    // ★ 追加: ルーム退出成功イベントリスナー
    this.socket.on('room:left:success', () => {
      console.log('Successfully left the room.');
      this.handlers.onRoomLeftSuccess?.();
    });

    this.socket.on('game:rematch:initiated', (data) => {
      console.log('[SocketService] game:rematch:initiated event received:', data);
      this.handlers.onGameRematchInitiated?.(data);
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
      console.error("Cannot toggle ready: Socket not connected");
      return;
    }
    console.log(`Sending player:ready event for room ${roomId}`);
    this.socket.emit('player:ready', roomId);
  }

  // ★ 追加: ルーム退出アクション
  leaveRoom(roomId: string): void {
    if (!this.socket) {
      console.error("Cannot leave room: Socket not connected");
      return;
    }
    console.log(`Sending room:leave event for room ${roomId}`);
    this.socket.emit('room:leave', roomId);
  }

  // Game actions
  sendGameMove(roomId: string, position: Position, piece: PieceType): void {
    if (!this.socket) {
      console.error("Cannot send game move: Socket not connected");
      return;
    }
    console.log(`Sending game:move event for room ${roomId}`, { position, piece });
    this.socket.emit('game:move', { roomId, position, piece });
  }

  sendGameResult(roomId: string, result: GameResult): void {
    if (!this.socket) {
      console.error("Cannot send game result: Socket not connected");
      return;
    }
    console.log(`Sending game:result event for room ${roomId}`, { result });
    this.socket.emit('game:result', roomId, result);
  }

  // ★★★ 追加: ゲームリセット/再戦要求を送信する関数 ★★★
  sendResetGameRequest(roomId: string): void {
    if (!this.socket) {
      console.error("Cannot send reset game request: Socket not connected");
      return;
    }
    console.log(`Sending game:request_rematch event for room ${roomId}`);
    // サーバー側で定義するイベント名に合わせてください (例: 'game:request_rematch')
    this.socket.emit('game:request_rematch', roomId);
  }
  // ★★★ ここまで追加 ★★★

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