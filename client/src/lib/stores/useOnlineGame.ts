import { create, StateCreator } from 'zustand';
import { startTransition } from 'react';
import { socketService, RoomData, RoomPlayerData, GameState as ServerGameState, MoveDetails } from '../socketService';
import { Board, Player, PieceType, Position, GameResult, GamePhase, PlayerInventory, WinningLine } from '../types';
import { createEmptyBoard, selectCellForPlayer, createInitialInventory, checkWin, checkDraw, isValidMove } from '../gameUtils';
import { useAudio } from './useAudio';
import { useLanguage } from './useLanguage';

interface PlayerInfo {
  id: string;
  username: string;
  playerNumber: 1 | 2;
  ready: boolean;
}

interface OnlineGameState {
  isOnline: boolean;
  isConnected: boolean;
  socketId: string | null;
  roomId: string | null;
  players: PlayerInfo[];
  isSpectator: boolean;
  isInMatchmaking: boolean;
  gamePhase: GamePhase;
  board: Board;
  currentPlayer: Player;
  selectedPiece: PieceType | null;
  aiSelectedPiece: PieceType | null;
  previousAiSelectedPiece: PieceType | null;
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  localPlayerNumber: 1 | 2 | null;
  gameResult: GameResult;
  message: string;
  isConnecting: boolean;
  pendingUsername: string | null;
  
  // ★ アニメーション状態を追加 ★
  winAnimation: boolean;
  loseAnimation: boolean;
  drawAnimation: boolean;
  
  // ★ 勝利ライン情報を追加 ★
  winningLine: WinningLine | null;
  
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
  makeMove: (position: Position) => void;
  endGame: (result: GameResult) => void;
  
  // Reset methods
  resetGame: () => void;
  
  // Socket handlers (these are internal)
  handleConnect: () => void;
  handleDisconnect: () => void;
  handleError: (error: any) => void;
  handleRoomCreated: (data: RoomData) => void;
  handleRoomJoined: (data: RoomData) => void;
  handleRoomJoinedAsSpectator: (data: RoomData) => void;
  handlePlayerJoined: (data: RoomData) => void;
  handlePlayerLeft: (data: { playerId: string, players: RoomPlayerData[] }) => void;
  handlePlayerReady: (data: { playerId: string, ready: boolean, players: RoomPlayerData[] }) => void;
  handleGameStart: (data: RoomData) => void;
  handleGameStateUpdate: (data: { gameState: ServerGameState, moveDetails: MoveDetails }) => void;
  handleGameResult: (result: any) => void;
  handleMatchmakingWaiting: () => void;
  handleMatchmakingMatched: (data: RoomData) => void;
  handleMatchmakingCancelled: () => void;
  handleRoomLeftSuccess: () => void;
  handleGameRematchInitiated: (data: RoomData & { gameState: ServerGameState }) => void;
  
  // Internal helper functions
  _selectRandomPieceForTurn: () => void;

  // New actions
  setSelectedPiece: (piece: PieceType | null) => void;

  // ★ 追加: ルーム退出アクションとハンドラ
  leaveRoom: () => void;

  // ★ アニメーションクリアアクションを追加 ★
  clearWinAnimation: () => void;
  clearLoseAnimation: () => void;
  clearDrawAnimation: () => void;
}

const onlineGameSlice: StateCreator<OnlineGameState> = (set, get) => {
  const audioStore = useAudio.getState();
  const { t } = useLanguage.getState();

  const resetBoardAndInventories = () => ({
    board: createEmptyBoard(),
    player1Inventory: createInitialInventory(),
    player2Inventory: createInitialInventory(),
    selectedPiece: null,
    aiSelectedPiece: null,
    currentPlayer: Player.PLAYER1,
    gameResult: GameResult.ONGOING,
    winningLine: null
  });

  const _selectRandomPieceForTurn = () => {
    console.log('[_selectRandomPieceForTurn] Function called.');
    const { currentPlayer, localPlayerNumber, player1Inventory, player2Inventory } = get();
    const isMyTurn = localPlayerNumber === (currentPlayer === Player.PLAYER1 ? 1 : 2);

    console.log(`[_selectRandomPieceForTurn] Is it my turn? ${isMyTurn} (local: ${localPlayerNumber}, current: ${currentPlayer})`);

    if (!isMyTurn) {
      console.log('[_selectRandomPieceForTurn] Not my turn, resetting selections.');
      set({ aiSelectedPiece: null, selectedPiece: null }); // リセット
      return;
    }

    const currentInventory = currentPlayer === Player.PLAYER1 ? player1Inventory : player2Inventory;
    console.log('[_selectRandomPieceForTurn] Current inventory:', JSON.stringify(currentInventory));

    const playablePieces = [PieceType.ROCK, PieceType.PAPER, PieceType.SCISSORS] as const;
    const availablePieces = playablePieces.filter(piece => currentInventory[piece as keyof PlayerInventory] > 0);

    console.log('[_selectRandomPieceForTurn] Available standard pieces:', availablePieces);

    if (availablePieces.length === 0) {
      console.warn("[_selectRandomPieceForTurn] No available standard pieces!");
      if (currentInventory[PieceType.SPECIAL] > 0) {
         console.log('[_selectRandomPieceForTurn] Only special piece left.');
        set({ 
            aiSelectedPiece: null, 
            selectedPiece: null, 
            message: t('online.onlySpecialLeft') 
        });
      } else {
         console.log('[_selectRandomPieceForTurn] No pieces left at all.');
         set({ 
            aiSelectedPiece: null, 
            selectedPiece: null, 
            message: t('online.noPiecesError') 
        });
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePieces.length);
    const chosenPiece = availablePieces[randomIndex];

    console.log(`[_selectRandomPieceForTurn] Randomly chose: ${chosenPiece}. Preparing to set state...`);

    startTransition(() => {
        console.log(`[_selectRandomPieceForTurn] Setting aiSelectedPiece to: ${chosenPiece}`);
        set({ 
            aiSelectedPiece: chosenPiece, 
            selectedPiece: chosenPiece, // 自動的に選択した駒をselectedPieceにもセット
        });
    });
  };

  // Socket handlers (these are internal)
  const handleConnect = () => {
    console.log("handleConnect called");
    const pendingUsername = get().pendingUsername;
    console.log("Pending username in handleConnect:", pendingUsername);
    
    if (!pendingUsername) {
      console.error("Connected but no pending username found.");
      socketService.disconnect(); 
      startTransition(() => {
        set({ isConnected: false, pendingUsername: null, isConnecting: false, message: t('online.connectionError') }); 
      });
      return;
    }

    startTransition(() => {
      set({ 
        isConnected: true, 
        socketId: socketService.getSocketId(),
        isOnline: true,
        message: t('online.connected'),
        pendingUsername: null,
        aiSelectedPiece: null, 
        selectedPiece: null,
        isConnecting: false
      });
    });
    
    console.log("Calling joinWithUsername with:", pendingUsername);
    socketService.joinWithUsername(pendingUsername); 
  };
  const handleDisconnect = () => {
    set(state => ({
      isConnected: false,
      isOnline: false,
      roomId: null,
      players: [],
      localPlayerNumber: null,
      isSpectator: false,
      isInMatchmaking: false,
      gamePhase: GamePhase.NOT_CONNECTED,
      message: t('online.disconnected'),
      ...resetBoardAndInventories(),
      aiSelectedPiece: null,
      selectedPiece: null,
      isConnecting: false,
      pendingUsername: null
    }));
  };
  const handleError = (error: any) => {
    console.error('Socket error:', error);
    startTransition(() => {
        set({ 
            message: t('online.connectionError'),
            isConnecting: false,
            pendingUsername: null
        });
     });
  };
  const handleRoomCreated = (data: RoomData) => {
    console.log('handleRoomCreated called with data:', data);
    startTransition(() => {
      set({
        roomId: data.roomId,
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        localPlayerNumber:
          (data.players.find((p) => p.id === get().socketId)?.playerNumber as 1 | 2) ??
          null,
        gamePhase: GamePhase.READY,
        message: t('online.roomCreated'),
        ...resetBoardAndInventories()
      });
      
      // 部屋が作成されたら、自動的に準備完了状態に設定
      setTimeout(() => {
        const { roomId } = get();
        if (roomId) {
          console.log('Auto setting player ready after room creation');
          socketService.toggleReady(roomId);
        }
      }, 500);
    });
    console.log('Set phase to READY in handleRoomCreated');
  };
  const handleRoomJoined = (data: RoomData) => {
    console.log('handleRoomJoined called with data:', data);
    const myId = socketService.getSocketId();
    const me = data.players.find(p => p.id === myId);

    startTransition(() => {
      set({
        roomId: data.roomId,
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        localPlayerNumber:
          (me?.playerNumber as 1 | 2) ??
          null,
        isSpectator: false,
        gamePhase: GamePhase.READY,
        message: t('online.joinedRoom'),
        ...resetBoardAndInventories()
      });

      // 自分がまだ準備未完了の場合のみ自動で準備完了に設定
      if (me && !me.ready) {
        // すでに2人揃っていて、相手が準備完了している場合は即座にready
        if (data.players.length === 2) {
          const opponent = data.players.find(p => p.id !== myId);
          if (opponent?.ready) {
            console.log('Opponent is already ready, setting self ready immediately');
            setTimeout(() => {
              const { roomId } = get();
              if (roomId) {
                socketService.toggleReady(roomId);
              }
            }, 100);
          }
        } else {
          // 1人だけの場合は少し遅延してから準備完了に
          setTimeout(() => {
            const { roomId } = get();
            if (roomId) {
              console.log('Auto setting player ready after joining room');
              socketService.toggleReady(roomId);
            }
          }, 500);
        }
      } else if (me?.ready) {
        console.log('Player is already ready - skipping auto-ready logic');
      }
    });
    console.log('Set phase to READY in handleRoomJoined');
    
    // 参加時に全プレイヤーの準備状況を確認
    if (data.players.length >= 2) {
      const allReady = data.players.every(p => p.ready);
      console.log('Joined room with multiple players. All players ready?', allReady);
      if (allReady) {
        console.log('All players are ready in this room! Game should start soon.');
      }
    }
  };
  const handleRoomJoinedAsSpectator = (data: RoomData) => {
    console.log('handleRoomJoinedAsSpectator called with data:', data);
    startTransition(() => {
      set({
        roomId: data.roomId,
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        isSpectator: true,
        localPlayerNumber: null,
        gamePhase: GamePhase.READY,
        message: t('online.joinedAsSpectator'),
        ...resetBoardAndInventories()
      });
    });
    console.log('Set phase to READY in handleRoomJoinedAsSpectator');
  };
  const handlePlayerJoined = (data: RoomData) => {
    console.log('handlePlayerJoined called with data:', data);
    startTransition(() => {
      set({
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        message: `${data.players.find((p) => p.id !== get().socketId)?.username ??
          t('online.anotherPlayer')} ${t('online.playerJoined')}`
      });
    });
    console.log('Set players and message in handlePlayerJoined');
  };
  const handlePlayerLeft = (data: { playerId: string, players: RoomPlayerData[] }) => {
    console.log('handlePlayerLeft called with data:', data);
    startTransition(() => {
      const leftPlayer = get().players.find((p) => p.id === data.playerId);
      const players = data.players.map(p => ({
         id: p.id,
         username: p.username,
         playerNumber: p.playerNumber as 1 | 2,
         ready: Boolean(p.ready)
       }));
      let nextPhase = get().gamePhase;
      let nextResult = get().gameResult;
      let nextMessage = `${leftPlayer?.username ?? t('online.aPlayer')} ${t('online.playerLeft')}`;

      if (
        get().gamePhase !== GamePhase.READY &&
        get().gamePhase !== GamePhase.GAME_OVER &&
        !get().isSpectator
      ) {
        nextPhase = GamePhase.GAME_OVER;
        nextResult =
          get().localPlayerNumber === 1
            ? GameResult.PLAYER1_WIN // Opponent left
            : GameResult.PLAYER2_WIN;
        nextMessage = t('online.opponentLeft');
      }
      if (players.length < 2) {
        nextPhase = GamePhase.READY;
        players.forEach((p) => (p.ready = false)); // Ensure ready state is reset
      }

      set({
        players,
        message: nextMessage,
        gamePhase: nextPhase,
        gameResult: nextResult
      });
    });
    console.log('Set players and message in handlePlayerLeft');
  };
  const handlePlayerReady = (data: { playerId: string, ready: boolean, players: RoomPlayerData[] }) => {
    console.log('handlePlayerReady called with data:', data);
    startTransition(() => {
      set({
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
      });
    });
    console.log('Set players in handlePlayerReady');
    
    // プレイヤーの準備状況変更時にゲーム開始条件を確認
    if (data.players.length >= 2) {
      const allReady = data.players.every(p => p.ready);
      console.log('Player ready status changed. Players count:', data.players.length);
      console.log('All players ready?', allReady);
      console.log('Player ready status:', data.players.map(p => `${p.username}: ${p.ready}`));
      if (allReady) {
        console.log('All players are now ready! Game should start soon.');
      }
    }
  };
  const handleGameStart = (data: RoomData) => {
    console.log('handleGameStart called with data:', data);
    console.log('Current game phase before start:', get().gamePhase);
    console.log('Players ready status:', get().players.map(p => `${p.username}: ${p.ready}`));
    
    startTransition(() => {
      try {
        set({
          gamePhase: GamePhase.SELECTING_CELL,
          message: t('online.gameStarted'),
          ...resetBoardAndInventories(),
          currentPlayer: Player.PLAYER1, 
          aiSelectedPiece: null, 
          selectedPiece: null 
        });
        
        console.log('Game started successfully! New game phase:', GamePhase.SELECTING_CELL);
        console.log(`[handleGameStart] Checking if it's local player ${get().localPlayerNumber}'s turn (Player 1 starts).`);
        
        // どちらのプレイヤーでも自動選択を行う
        // プレイヤー1の場合は初回ターンですぐに選択し、プレイヤー2は次のターン開始時に選択される
        if (get().localPlayerNumber === 1) { 
          console.log('[handleGameStart] Calling _selectRandomPieceForTurn for Player 1.');
          get()._selectRandomPieceForTurn();
        } else {
           console.log('[handleGameStart] Not Player 1 turn yet, but we will select a piece when it becomes Player 2 turn.');
           // プレイヤー2の場合はhandleGameStateUpdateで自動選択される
        }
      } catch (error) {
        console.error('Error in handleGameStart:', error);
      }
    });
    
    audioStore.playBattle();
    console.log('Set phase to SELECTING_CELL in handleGameStart');
  };
  const handleGameStateUpdate = (data: { gameState: ServerGameState, moveDetails: MoveDetails }) => {
    console.log('handleGameStateUpdate called with data:', data);
    
    startTransition(() => {
      const { gameState, moveDetails } = data;
      const state = get();
      
      const newState: Partial<OnlineGameState> = {
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
        player1Inventory: gameState.player1Inventory,
        player2Inventory: gameState.player2Inventory,
        gamePhase: gameState.gamePhase,
        gameResult: gameState.gameResult,
        message: gameState.currentPlayer === (get().localPlayerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2)
                  ? t('yourTurn')
                  : t('online.waitingForOpponent'),
        selectedPiece: null,
        aiSelectedPiece: null,
        winAnimation: false,
        loseAnimation: false,
        drawAnimation: false,
        winningLine: gameState.winningLine || null,
      };
      
      console.log('[handleGameStateUpdate] State BEFORE set:', {
          p1Inv: state.player1Inventory,
          p2Inv: state.player2Inventory
      });
      console.log('[handleGameStateUpdate] State TO BE set:', {
          p1Inv: newState.player1Inventory,
          p2Inv: newState.player2Inventory,
          winningLine: newState.winningLine
      });
      
      set(newState as OnlineGameState);
      
      setTimeout(() => {
          const currentState = get();
          console.log('[handleGameStateUpdate] State AFTER set (delayed check):', {
              p1Inv: currentState.player1Inventory,
              p2Inv: currentState.player2Inventory,
              winningLine: currentState.winningLine
          });
      }, 0);

      if (moveDetails.capturedPiece) {
        audioStore.playHit();
      } else {
        audioStore.playPlace();
      }

      const localNum = get().localPlayerNumber;
      const isMyNewTurn = gameState.currentPlayer === (localNum === 1 ? Player.PLAYER1 : Player.PLAYER2);
      console.log(`[handleGameStateUpdate] Checking if it's my turn now (Local: ${localNum}, Current: ${gameState.currentPlayer}, isMyNewTurn: ${isMyNewTurn}). Game phase: ${gameState.gamePhase}`);
      if (gameState.gamePhase !== GamePhase.GAME_OVER && isMyNewTurn) {
          console.log('[handleGameStateUpdate] It is my turn now. Calling _selectRandomPieceForTurn.');
          get()._selectRandomPieceForTurn();
      } else {
          console.log('[handleGameStateUpdate] Not my turn or game is over, skipping piece selection.');
      }

      if (gameState.gamePhase === GamePhase.GAME_OVER) {
        let winAnim = false;
        let loseAnim = false;
        let drawAnim = false;
        let finalMessage = get().message;

        if (gameState.gameResult === GameResult.PLAYER1_WIN) {
          if (get().localPlayerNumber === 1) {
            winAnim = true;
            finalMessage = t('online.youWin');
            audioStore.playVictory();
          } else if (get().localPlayerNumber === 2) {
            loseAnim = true;
            finalMessage = t('online.youLose');
          } else {
            finalMessage = `${get().players.find(p => p.playerNumber === 1)?.username ?? t('player1')} ${t('online.wins')}`;
          }
        } else if (gameState.gameResult === GameResult.PLAYER2_WIN) {
          if (get().localPlayerNumber === 2) {
            winAnim = true;
            finalMessage = t('online.youWin');
            audioStore.playVictory();
          } else if (get().localPlayerNumber === 1) {
            loseAnim = true;
            finalMessage = t('online.youLose');
          } else {
            finalMessage = `${get().players.find(p => p.playerNumber === 2)?.username ?? t('player2')} ${t('online.wins')}`;
          }
        } else if (gameState.gameResult === GameResult.DRAW) {
          drawAnim = true;
          finalMessage = t('online.draw');
        }

        set({
           winAnimation: winAnim,
           loseAnimation: loseAnim,
           drawAnimation: drawAnim,
           message: finalMessage,
           winningLine: gameState.winningLine || null
        });
      }
    });
  };
  const handleGameResult = (result: any) => {
    console.log('handleGameResult called with result (potentially redundant):', result);
  };
  const handleMatchmakingWaiting = () => {
    console.log('handleMatchmakingWaiting called');
    startTransition(() => {
      set({ isInMatchmaking: true, message: t('online.waitingForMatch') });
    });
  };
  const handleMatchmakingMatched = (data: RoomData) => {
    console.log('handleMatchmakingMatched called with data:', data);
    startTransition(() => {
      set({
        isInMatchmaking: false,
        roomId: data.roomId,
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        localPlayerNumber:
          (data.players.find((p) => p.id === get().socketId)?.playerNumber as 1 | 2) ??
          null,
        gamePhase: GamePhase.READY,
        message: t('online.matchFound'),
        ...resetBoardAndInventories()
      });
    });
  };
  const handleMatchmakingCancelled = () => {
    console.log('handleMatchmakingCancelled called');
    startTransition(() => {
      set({ isInMatchmaking: false, message: t('online.matchmakingCancelled') });
    });
  };

  const handleRoomLeftSuccess = () => {
    console.log('handleRoomLeftSuccess called');
    startTransition(() => {
      set({
        roomId: null,
        players: [],
        localPlayerNumber: null,
        isSpectator: false,
        gamePhase: GamePhase.NOT_CONNECTED,
        message: t('online.leftRoom'),
        ...resetBoardAndInventories(),
        aiSelectedPiece: null,
        selectedPiece: null,
      });
    });
  };

  const handleGameRematchInitiated = (data: RoomData & { gameState: ServerGameState }) => {
    console.log('[useOnlineGame] handleGameRematchInitiated called with data:', data);
    startTransition(() => {
      set({
        roomId: data.roomId,
        players: data.players.map(p => ({
          id: p.id,
          username: p.username,
          playerNumber: p.playerNumber as 1 | 2,
          ready: Boolean(p.ready)
        })),
        board: data.gameState.board,
        player1Inventory: data.gameState.player1Inventory,
        player2Inventory: data.gameState.player2Inventory,
        currentPlayer: data.gameState.currentPlayer,
        gamePhase: GamePhase.SELECTING_CELL, // READY から SELECTING_CELL に変更
        gameResult: GameResult.ONGOING,
        message: t('online.gameStarted'), // メッセージも更新
        selectedPiece: null,
        aiSelectedPiece: null,
      });

      // ゲームリセット後に適切なプレイヤーの駒を自動選択
      setTimeout(() => {
        // ローカルプレイヤーがどちらなのかを確認
        const localNum = get().localPlayerNumber;
        const currentPlayerEnum = get().currentPlayer;
        // 自分のターンかどうかを判定
        const isMyTurn = localNum === (currentPlayerEnum === Player.PLAYER1 ? 1 : 2);
        
        console.log(`[handleGameRematchInitiated] Checking if it's my turn: local=${localNum}, current=${currentPlayerEnum}, isMyTurn=${isMyTurn}`);
        
        if (isMyTurn) {
          console.log('[handleGameRematchInitiated] It is my turn, selecting random piece.');
          get()._selectRandomPieceForTurn();
        } else {
          console.log('[handleGameRematchInitiated] Not my turn, waiting for opponent.');
        }
      }, 300); // ステート更新後に実行するために少し遅延
    });
  };

  const endGame = (result: GameResult) => {
    console.log('endGame action called with result:', result);
    startTransition(() => {
      set({ gamePhase: GamePhase.GAME_OVER, gameResult: result });
    });
  };

  const initialState = {
    isOnline: false,
    isConnected: false,
    socketId: null,
    roomId: null,
    players: [],
    localPlayerNumber: null,
    isSpectator: false,
    isInMatchmaking: false,
    gamePhase: GamePhase.NOT_CONNECTED,
    board: createEmptyBoard(),
    currentPlayer: Player.PLAYER1,
    selectedPiece: null,
    aiSelectedPiece: null,
    previousAiSelectedPiece: null,
    player1Inventory: createInitialInventory(),
    player2Inventory: createInitialInventory(),
    gameResult: GameResult.ONGOING,
    message: t('online.connectPrompt'),
    pendingUsername: null,
    isConnecting: false,
    winAnimation: false,
    loseAnimation: false,
    drawAnimation: false,
    winningLine: null,
  };

  const setSelectedPiece = (piece: PieceType | null) => {
    const { aiSelectedPiece: currentAiSelectedPiece, selectedPiece: currentSelectedPiece, previousAiSelectedPiece: currentPreviousAiSelectedPiece } = get();
    console.log(`[setSelectedPiece] Called with: ${piece}. Current aiSelected: ${currentAiSelectedPiece}, current selected: ${currentSelectedPiece}, current previousAiSelected: ${currentPreviousAiSelectedPiece}`);

    if (piece === PieceType.SPECIAL) {
      console.log(`[setSelectedPiece] Special piece selected. Storing current AI piece (${currentAiSelectedPiece}) into previousAiSelectedPiece.`);
      set({
        selectedPiece: PieceType.SPECIAL,
        previousAiSelectedPiece: currentAiSelectedPiece,
        aiSelectedPiece: null,
      });
    } else if (piece === null && currentSelectedPiece === PieceType.SPECIAL) {
      console.log(`[setSelectedPiece] Special piece cancelled. Restoring previous AI piece: ${currentPreviousAiSelectedPiece}`);
      set({
        selectedPiece: null,
        aiSelectedPiece: currentPreviousAiSelectedPiece,
        previousAiSelectedPiece: null,
      });
    } else if (piece === null) {
        console.log(`[setSelectedPiece] Non-special selection cancelled or no special was active. Resetting selectedPiece. aiSelectedPiece remains: ${currentAiSelectedPiece}`);
        set({ selectedPiece: null });
    } else if (piece !== null) {
        // AI選択またはプレイヤーが直接通常駒を選択した場合
        // PieceType.SPECIALの場合は上の条件分岐で処理されているため、ここではそれ以外の駒（グー、チョキ、パー）が対象
        console.log(`[setSelectedPiece] Normal piece selected: ${piece}, updating both aiSelectedPiece and selectedPiece`);
        set({ 
            aiSelectedPiece: piece,
            selectedPiece: piece,
            previousAiSelectedPiece: null
        });
    }
  };

  return {
    ...initialState,
    aiSelectedPiece: null,
    selectedPiece: null,
    previousAiSelectedPiece: null,

    connect: (username: string) => {
      if (get().isConnected || get().isConnecting || get().pendingUsername) {
         console.log("Connection attempt ignored: Already connected, connecting, or pending username exists.");
         return;
      }

      set({ pendingUsername: username, isConnecting: true, message: t('online.connecting') }); 
      
      socketService.registerHandlers({
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onRoomCreated: handleRoomCreated,
        onRoomJoined: handleRoomJoined,
        onRoomJoinedAsSpectator: handleRoomJoinedAsSpectator,
        onPlayerJoined: handlePlayerJoined,
        onPlayerLeft: handlePlayerLeft,
        onPlayerReady: handlePlayerReady,
        onGameStart: handleGameStart,
        onGameStateUpdate: handleGameStateUpdate,
        onGameResult: handleGameResult,
        onMatchmakingWaiting: handleMatchmakingWaiting,
        onMatchmakingMatched: handleMatchmakingMatched,
        onMatchmakingCancelled: handleMatchmakingCancelled,
        onRoomLeftSuccess: handleRoomLeftSuccess,
        onGameRematchInitiated: handleGameRematchInitiated,
      });
      socketService.connect(); 
    },
    disconnect: () => {
      socketService.disconnect();
    },
    createRoom: () => {
      if (!get().isConnected) return;
      
      startTransition(() => {
        setTimeout(() => {
          try {
            socketService.createRoom();
          } catch (error) {
            console.error("Error in createRoom:", error);
            set({ message: t('online.connectionError') });
          }
        }, 50);
      });
    },
    joinRoom: (roomId: string) => {
      if (!get().isConnected) return;
      
      startTransition(() => {
        setTimeout(() => {
          try {
            socketService.joinRoom(roomId);
          } catch (error) {
            console.error("Error in joinRoom:", error);
            set({ message: t('online.connectionError') });
          }
        }, 50);
      });
    },
    toggleReady: () => {
      const { roomId, socketId } = get();
      if (roomId && socketId) {
        startTransition(() => {
          try {
            set((state) => {
               const playerIndex = state.players.findIndex(p => p.id === socketId);
               if (playerIndex !== -1) {
                 const newPlayers = [...state.players];
                 newPlayers[playerIndex] = { ...newPlayers[playerIndex], ready: !newPlayers[playerIndex].ready };
                 return { players: newPlayers };
               }
               return {};
            });
            
            socketService.toggleReady(roomId);
          } catch (error) {
            console.error("Error in toggleReady:", error);
            set({ message: t('online.connectionError') });
          }
        });
      }
    },
    joinMatchmaking: () => {
      if (!get().isConnected) return;
      
      startTransition(() => {
        try {
          socketService.joinMatchmaking();
        } catch (error) {
          console.error("Error in joinMatchmaking:", error);
          set({ message: t('online.connectionError') });
        }
      });
    },
    cancelMatchmaking: () => {
      if (!get().isConnected || !get().isInMatchmaking) return;
      
      startTransition(() => {
        try {
          socketService.cancelMatchmaking();
        } catch (error) {
          console.error("Error in cancelMatchmaking:", error);
          set({ message: t('online.connectionError') });
        }
      });
    },
    makeMove: (position: Position) => {
      const {
        roomId,
        localPlayerNumber,
        board,
        currentPlayer,
        player1Inventory,
        player2Inventory,
        isSpectator,
        gamePhase,
        aiSelectedPiece,
        selectedPiece
      } = get();

      const pieceToMove = selectedPiece === PieceType.SPECIAL ? PieceType.SPECIAL : aiSelectedPiece;

      if (!pieceToMove) {
        console.error("makeMove called but no piece is selected (neither AI nor player special)!");
        set({ message: t('online.errorPieceNotSelected') });
        return;
      }

      if (
        !roomId ||
        isSpectator ||
        gamePhase !== GamePhase.SELECTING_CELL ||
        currentPlayer !== (localPlayerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2)
      ) return;

      const currentInventory = localPlayerNumber === 1 ? player1Inventory : player2Inventory;
      if (currentInventory[pieceToMove as keyof PlayerInventory] <= 0) {
         set({ message: t('online.noPieceLeft') });
         return;
      }

      if (!isValidMove(board, position, pieceToMove, currentPlayer)) {
        set({ message: t('online.invalidMove') });
        return;
      }

      set((state) => {
        const nextBoard = [...state.board.map(row => [...row])];
        const owner = state.currentPlayer;
        const inventoryKey = owner === Player.PLAYER1 ? 'player1Inventory' : 'player2Inventory';
        const nextInventory = { ...state[inventoryKey] };

        nextInventory[pieceToMove as keyof PlayerInventory]--;

        const targetCell = nextBoard[position.row][position.col];
        if (targetCell.piece === PieceType.EMPTY) {
          nextBoard[position.row][position.col] = { piece: pieceToMove, owner, hasBeenUsed: false };
          audioStore.playPlace();
        } else {
          nextBoard[position.row][position.col] = { piece: pieceToMove, owner, hasBeenUsed: true };
          audioStore.playHit();
        }

        socketService.sendGameMove(roomId, position, pieceToMove);

        let nextPhase = GamePhase.SELECTING_CELL;
        let nextResult = GameResult.ONGOING;
        let nextMessage = t('online.waitingForOpponent');
        const nextCurrentPlayer = owner === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;

        if (checkWin(nextBoard, owner)) {
            nextResult = owner === Player.PLAYER1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
            nextPhase = GamePhase.GAME_OVER;
            nextMessage = t('online.youWin');
            audioStore.playVictory();
            socketService.sendGameResult(roomId, nextResult);
        } else if (checkDraw(nextBoard, state.player1Inventory, state.player2Inventory)) {
            nextResult = GameResult.DRAW;
            nextPhase = GamePhase.GAME_OVER;
            nextMessage = t('online.draw');
            socketService.sendGameResult(roomId, nextResult);
        }
        
        return {
          board: nextBoard,
          currentPlayer: nextCurrentPlayer,
          message: nextMessage,
          gamePhase: nextPhase,
          gameResult: nextResult,
          selectedPiece: null,
          aiSelectedPiece: null,
          [inventoryKey]: nextInventory
        };
      });
    },
    resetGame: () => {
      const { gamePhase, roomId } = get();
      if (gamePhase === GamePhase.GAME_OVER) {
        if (roomId) {
          socketService.sendResetGameRequest(roomId);
          console.log(`[resetGame] Sent reset request for room ${roomId}`);
        } else {
          console.error("[resetGame] Cannot send reset request: roomId is null");
        }
      } else {
        console.warn("[resetGame] Attempted to reset game when not in GAME_OVER phase.");
      }
    },
    handleConnect,
    handleDisconnect,
    handleError,
    handleRoomCreated,
    handleRoomJoined,
    handleRoomJoinedAsSpectator,
    handlePlayerJoined,
    handlePlayerLeft,
    handlePlayerReady,
    handleGameStart,
    handleGameStateUpdate,
    handleGameResult,
    handleMatchmakingWaiting,
    handleMatchmakingMatched,
    handleMatchmakingCancelled,
    handleRoomLeftSuccess,
    handleGameRematchInitiated,
    endGame,
    _selectRandomPieceForTurn,
    setSelectedPiece,
    leaveRoom: () => {
      const roomId = get().roomId;
      if (roomId) {
        socketService.leaveRoom(roomId);
      } else {
        console.warn('Attempted to leave room, but no roomId found in state.');
      }
    },
    clearWinAnimation: () => set({ winAnimation: false }),
    clearLoseAnimation: () => set({ loseAnimation: false }),
    clearDrawAnimation: () => set({ drawAnimation: false }),
  };
};

export const useOnlineGame = create<OnlineGameState>(onlineGameSlice);