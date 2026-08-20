import { io, Socket } from 'socket.io-client';
import { ClientEvent, ServerEvent } from '@shared/events';
import type {
  ForceEndPayload,
  GameErrorPayload,
  GameStartPayload,
  GameStateUpdatePayload,
  MoveDetails,
  PlayerLeftPayload,
  PlayerReadyPayload,
  RematchPayload,
  RoomPayload,
  RoomPlayer,
  SharedGameState,
} from '@shared/events';
import type { PieceType, Position } from '@shared/gameTypes';

// Event names and payload shapes come from shared/events.ts, so an event the
// server emits and the client ignores — or the other way round — is a type
// error rather than a packet that silently disappears.

export type RoomPlayerData = RoomPlayer;
export type RoomData = RoomPayload;
export type GameState = SharedGameState;
export type { MoveDetails };

export interface SocketHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
  onRoomCreated?: (data: RoomPayload) => void;
  onRoomJoined?: (data: RoomPayload) => void;
  onRoomJoinedAsSpectator?: (data: RoomPayload) => void;
  onPlayerJoined?: (data: RoomPayload) => void;
  onPlayerLeft?: (data: PlayerLeftPayload) => void;
  onPlayerReady?: (data: PlayerReadyPayload) => void;
  onGameStart?: (data: GameStartPayload) => void;
  onGameStateUpdate?: (data: GameStateUpdatePayload) => void;
  onGameForceEnd?: (data: ForceEndPayload) => void;
  onMatchmakingWaiting?: () => void;
  onMatchmakingMatched?: (data: RoomPayload) => void;
  onMatchmakingCancelled?: () => void;
  onRoomLeftSuccess?: () => void;
  onGameRematchInitiated?: (data: RematchPayload) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketHandlers = {};

  connect(): void {
    if (this.socket) {
      return;
    }

    const serverUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.DEV ? 'http://localhost:5000' : 'https://jankenwars.onrender.com');

    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      autoConnect: true,
      forceNew: false,
      upgrade: true,
      closeOnBeforeunload: false,
    });

    // --- Connection lifecycle -------------------------------------------

    this.socket.on('connect', () => {
      console.log('Connected to server. Socket ID:', this.socket?.id);
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

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection failed:', error);
    });

    // --- Server events ----------------------------------------------------

    this.socket.on(ServerEvent.GAME_ERROR, (data: GameErrorPayload) => {
      console.error('Game error:', data?.message);
      this.handlers.onError?.(new Error(data?.message ?? 'Unknown game error'));
    });

    this.socket.on(ServerEvent.ROOM_CREATED, (data: RoomPayload) => {
      this.handlers.onRoomCreated?.(data);
    });

    this.socket.on(ServerEvent.ROOM_JOINED, (data: RoomPayload) => {
      this.handlers.onRoomJoined?.(data);
    });

    this.socket.on(ServerEvent.ROOM_PLAYER_JOINED, (data: RoomPayload) => {
      this.handlers.onPlayerJoined?.(data);
    });

    this.socket.on(ServerEvent.ROOM_JOINED_SPECTATOR, (data: RoomPayload) => {
      this.handlers.onRoomJoinedAsSpectator?.(data);
    });

    this.socket.on(ServerEvent.PLAYER_LEFT, (data: PlayerLeftPayload) => {
      this.handlers.onPlayerLeft?.(data);
    });

    this.socket.on(ServerEvent.ROOM_PLAYER_READY, (data: PlayerReadyPayload) => {
      this.handlers.onPlayerReady?.(data);
    });

    this.socket.on(ServerEvent.ROOM_LEFT_SUCCESS, () => {
      this.handlers.onRoomLeftSuccess?.();
    });

    this.socket.on(ServerEvent.GAME_START, (data: GameStartPayload) => {
      this.handlers.onGameStart?.(data);
    });

    this.socket.on(ServerEvent.GAME_STATE_UPDATE, (data: GameStateUpdatePayload) => {
      this.handlers.onGameStateUpdate?.(data);
    });

    this.socket.on(ServerEvent.GAME_REMATCH_INITIATED, (data: RematchPayload) => {
      this.handlers.onGameRematchInitiated?.(data);
    });

    // The server emits this when an opponent leaves mid-game. Nothing was
    // listening for it before, so the remaining player was never told.
    this.socket.on(ServerEvent.GAME_FORCE_END, (data: ForceEndPayload) => {
      console.log('Game force-ended:', data?.message);
      this.handlers.onGameForceEnd?.(data ?? { message: 'The game ended.' });
    });

    this.socket.on(ServerEvent.MATCHMAKING_WAITING, () => {
      this.handlers.onMatchmakingWaiting?.();
    });

    this.socket.on(ServerEvent.MATCHMAKING_MATCHED, (data: RoomPayload) => {
      this.handlers.onMatchmakingMatched?.(data);
    });

    this.socket.on(ServerEvent.MATCHMAKING_CANCELLED, () => {
      this.handlers.onMatchmakingCancelled?.();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  registerHandlers(handlers: SocketHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  clearHandlers(): void {
    this.handlers = {};
  }

  // --- Client actions -----------------------------------------------------

  private emit(event: string, ...args: unknown[]): boolean {
    if (!this.socket) {
      console.error(`Cannot send ${event}: socket not connected`);
      return false;
    }
    this.socket.emit(event, ...args);
    return true;
  }

  joinWithUsername(username: string): void {
    this.emit(ClientEvent.USER_JOIN, username);
  }

  createRoom(): void {
    this.emit(ClientEvent.ROOM_CREATE);
  }

  joinRoom(roomId: string): void {
    this.emit(ClientEvent.ROOM_JOIN, roomId);
  }

  toggleReady(roomId: string): void {
    this.emit(ClientEvent.PLAYER_READY, roomId);
  }

  leaveRoom(roomId: string): void {
    this.emit(ClientEvent.ROOM_LEAVE, roomId);
  }

  sendGameMove(roomId: string, position: Position, piece: PieceType): void {
    this.emit(ClientEvent.GAME_MOVE, { roomId, position, piece });
  }

  sendResetGameRequest(roomId: string): void {
    this.emit(ClientEvent.GAME_REQUEST_REMATCH, roomId);
  }

  joinMatchmaking(): void {
    this.emit(ClientEvent.MATCHMAKING_JOIN);
  }

  cancelMatchmaking(): void {
    this.emit(ClientEvent.MATCHMAKING_CANCEL);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketService();
