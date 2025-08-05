import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Board, Cell, GamePhase, GameResult, PieceType, Player, Position, normalizePlayer, PlayerInventory, WinningLine } from '../types';
import { 
  checkDraw, 
  checkWin, 
  createEmptyBoard, 
  createInitialInventory, 
  getRandomPiece, 
  isValidMove,
  selectCellForPlayer as selectCellForPlayerUtil,
  findWinningLine
} from '../gameUtils';
import { AIDifficulty, findBestMove, findBestPosition } from '../aiUtils';
import { useAudio } from './useAudio';
import { useLanguage } from './useLanguage';
import { pieces } from '../../config/jankenPieces';
import { StateCreator } from 'zustand';
import { soundService } from '../soundService';

interface JankenGameState {
  board: Board;
  currentPlayer: Player;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  result: GameResult;
  player1JankenChoice: PieceType | null;
  player2JankenChoice: PieceType | null;
  player1Score: number;
  setPlayer1Score: (score: number) => void;
  player2Score: number;
  setPlayer2Score: (score: number) => void;
  currentRound: number;
  setCurrentRound: (round: number) => void;
  selectedPiece: PieceType | null;
  previousSelectedPiece: PieceType | null;
  setSelectedPiece: (piece: PieceType | null) => void;
  player1Inventory: ReturnType<typeof createInitialInventory>;
  player2Inventory: ReturnType<typeof createInitialInventory>;
  message: string;
  jankenBattleCells: Position[];
  captureAnimation: Position | null;
  winAnimation: boolean;
  loseAnimation: boolean;
  drawAnimation: boolean;
  isAIEnabled: boolean;
  setIsAIEnabled: (value: boolean) => void;
  aiDifficulty: AIDifficulty;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  initialAIDifficulty: AIDifficulty;
  isAIThinking: boolean;
  winningLine: WinningLine | null;
  applyJankenBattlePatternToBoard: (board: Board) => Board;
  startGame: () => void;
  resetGame: () => void;
  resetBoardOnly: () => void;
  resetInventory: () => void;
  resetScoresOnly: () => void;
  clearCaptureAnimation: () => void;
  clearWinAnimation: () => void;
  clearLoseAnimation: () => void;
  clearDrawAnimation: () => void;
  setInitialAIDifficulty: (difficulty: AIDifficulty) => void;
  setPlayer1JankenChoice: (choice: PieceType | null) => void;
  setPlayer2JankenChoice: (choice: PieceType | null) => void;
  incrementPlayer1Score: () => void;
  incrementPlayer2Score: () => void;
  incrementRound: () => void;
  resetScoresAndRound: () => void;
  makeChoice: (playerChoice: PieceType) => void;
  makeAIPieceSelection: () => void;
  getRandomPieceForCurrentPlayer: () => void;
  switchTurn: () => void;
  placePiece: (row: number, col: number) => void;
  selectCell: (position: Position) => void;
}

// persist で保存する状態の型を定義
interface PersistedGameState {
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  player1Score: number;
  player2Score: number;
  currentRound: number;
  board: Board;
  isAIEnabled: boolean;
  initialAIDifficulty: AIDifficulty;
}

// 型定義を避けて通常の関数として定義
const createState = (set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: Player.PLAYER1,
  phase: GamePhase.READY,
  setPhase: (newPhase: GamePhase) => set({ phase: newPhase }),
  result: GameResult.ONGOING,
  player1JankenChoice: null,
  player2JankenChoice: null,
  player1Score: 0,
  setPlayer1Score: (score: number) => set({ player1Score: score }),
  player2Score: 0,
  setPlayer2Score: (score: number) => set({ player2Score: score }),
  currentRound: 1,
  setCurrentRound: (round: number) => set({ currentRound: round }),
  selectedPiece: null,
  previousSelectedPiece: null,
  setSelectedPiece: (piece) => {
    const currentPhase = get().phase;
    // DEBUG_GAME_FLOW: setSelectedPiece が呼ばれた時のログ（本番では削除）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG_GAME_FLOW] setSelectedPiece called. Target piece: ${piece}, Current phase: ${currentPhase}, Current selectedPiece: ${get().selectedPiece}`);
    }

    // 特殊駒以外の手動選択をブロック（AIモード時のみ）
    if (piece !== null && piece !== PieceType.SPECIAL && get().isAIEnabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG_GAME_FLOW] Manual selection blocked for ${piece}. Only SPECIAL pieces can be manually selected in AI mode.`);
      }
      return;
    }

    // ユーザーが駒を選択解除する場合（nullを設定）
    if (piece === null) {
      // DEBUG_GAME_FLOW: 駒の選択解除
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG_GAME_FLOW] Deselecting piece.');
      }
      set((state) => ({
        ...state,
        selectedPiece: null,
      }));
      return;
    }

    // ゲームの準備フェーズまたはセル選択フェーズのみ駒を選択可能
    if (currentPhase === GamePhase.READY || currentPhase === GamePhase.SELECTING_CELL) {
      // DEBUG_GAME_FLOW: 駒選択が許可されたフェーズ
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG_GAME_FLOW] Phase allows piece selection (${currentPhase}). Attempting to select: ${piece}`);
      }

      // 現在のプレイヤーのインベントリをチェック
      const currentPlayer = get().currentPlayer;
      const inventory = currentPlayer === Player.PLAYER1
        ? get().player1Inventory
        : get().player2Inventory;

      // 選択した駒がインベントリにあるか確認（EMPTYは選択できない）
      if (inventory && piece !== PieceType.EMPTY) {
        // キーとして有効な駒タイプのみをチェック
        if (piece === PieceType.ROCK || piece === PieceType.PAPER ||
            piece === PieceType.SCISSORS || piece === PieceType.SPECIAL) {

          // インベントリに駒があるか確認
          if (inventory[piece] > 0) {
            // 駒を選択し、フェーズを SELECTING_CELL に変更
            set((state) => ({
              ...state,
              selectedPiece: piece,
              phase: GamePhase.SELECTING_CELL, // 駒選択後はセル選択フェーズに
            }));

          } else {
            // インベントリに駒がない場合
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[DEBUG_GAME_FLOW] Cannot select piece ${piece}: not available in inventory`);
            }
          }
        } else {
          // 無効な駒タイプが渡された場合
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[DEBUG_GAME_FLOW] Invalid piece type: ${piece}`);
          }
        }
      } else {
        // インベントリがundefinedまたはEMPTYが選択された場合
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[DEBUG_GAME_FLOW] Cannot select piece ${piece}: inventory is undefined or piece is EMPTY`);
        }
      }
    } else {
      // 駒選択が許可されないフェーズの場合
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[DEBUG_GAME_FLOW] Cannot select piece. Phase does not allow selection: ${currentPhase}, Attempted piece: ${piece}`
        );
      }
    }
  },
  player1Inventory: createInitialInventory(),
  player2Inventory: createInitialInventory(),
  message: 'message.welcome',
  jankenBattleCells: [],
  captureAnimation: null,
  winAnimation: false,
  loseAnimation: false,
  drawAnimation: false,
  isAIEnabled: false,
  setIsAIEnabled: (value: boolean) => set({ isAIEnabled: value }),
  aiDifficulty: AIDifficulty.NORMAL,
  initialAIDifficulty: AIDifficulty.NORMAL,
  isAIThinking: false,
  winningLine: null,
  applyJankenBattlePatternToBoard: (board: Board): Board => board,
  startGame: () => {
    const initialDifficulty = get().initialAIDifficulty;
    const isAIMode = get().isAIEnabled;
    
    console.log('[DEBUG] startGame called with AI enabled:', isAIMode, 'Current phase:', get().phase);
    
    // 現在のフェーズを確認して、すでにゲームが開始している場合は何もしない
    if (get().phase !== GamePhase.READY) {
      console.log('[DEBUG] Game already started. Skipping startGame call.');
      return;
    }
    
    // インベントリの初期化
    const player1Inventory = get().player1Inventory || createInitialInventory();
    const player2Inventory = get().player2Inventory || createInitialInventory();
    
    console.log('[DEBUG] Setting initial game state...');
    
    // AIモードと通常モードで異なる初期化
    if (isAIMode) {
      // AIモード：プレイヤー1は手動選択、プレイヤー2はAI自動選択
      set({
        phase: GamePhase.SELECTING_CELL,
        message: "特殊駒を選択してください",
        selectedPiece: null, 
        player1JankenChoice: null,
        player2JankenChoice: null,
        player1Score: 0,
        player2Score: 0,
        currentRound: 1,
        aiDifficulty: initialDifficulty,
        currentPlayer: Player.PLAYER1,
        result: GameResult.ONGOING,
        isAIThinking: false,
        player1Inventory,
        player2Inventory
      });
      
      console.log('[DEBUG] AI mode initialized. Player1 can manually select SPECIAL pieces, basic pieces auto-selected.');
      
      // AIモードでも基本駒の自動選択を開始（遅延なし）
      setTimeout(() => {
        try {
          const currentState = get();
          if (currentState.phase === GamePhase.SELECTING_CELL && 
              currentState.currentPlayer === Player.PLAYER1 &&
              currentState.isAIEnabled &&
              !currentState.selectedPiece) {
            console.log('[DEBUG] Auto-selecting basic piece for Player 1 in AI mode');
            get().getRandomPieceForCurrentPlayer();
          }
        } catch (error) {
          console.error('[DEBUG] Error in AI mode auto-selection:', error);
        }
      }, 0);
      
    } else {
      // 通常モード：自動選択
      set({
        phase: GamePhase.SELECTING_CELL,
        message: "message.player1Turn",
        selectedPiece: null, 
        player1JankenChoice: null,
        player2JankenChoice: null,
        player1Score: 0,
        player2Score: 0,
        currentRound: 1,
        aiDifficulty: initialDifficulty,
        currentPlayer: Player.PLAYER1,
        result: GameResult.ONGOING,
        isAIThinking: false,
        player1Inventory,
        player2Inventory
      });
      
      console.log('[DEBUG] Local mode initialized. Starting auto-selection for PLAYER1.');
      
      // 通常モードでは自動選択を開始（遅延なし）
      setTimeout(() => {
        try {
          const currentState = get();
          if (currentState.phase === GamePhase.SELECTING_CELL && 
              currentState.currentPlayer === Player.PLAYER1 &&
              !currentState.isAIEnabled) {
            get().getRandomPieceForCurrentPlayer();
          }
        } catch (error) {
          console.error('[DEBUG] Error in auto-selection:', error);
        }
      }, 0);
    }
  },
  resetGame: () => {
    const wasAIEnabled = get().isAIEnabled;
    const previousInitialDifficulty = get().initialAIDifficulty;
    
    console.log('[useJankenGame] resetGame called with AIモード状態:', wasAIEnabled);
    
    // パフォーマンス向上のため、状態リセット前に操作をブロック
    set(state => ({
      ...state,
      isAIThinking: true, // 操作を一時的にブロック
      message: 'message.resetting'
    }));
    
    // リセットループを防ぐためにローカルストレージの操作を削除
    console.log('[useJankenGame] Skipping localStorage operations to prevent reset loops');

    // 重要な状態のみリセット
    set({
      board: createEmptyBoard(),
      currentPlayer: Player.PLAYER1,
      phase: GamePhase.READY, // READYに戻す
      result: GameResult.ONGOING,
      player1JankenChoice: null,
      player2JankenChoice: null,
      player1Score: 0,
      player2Score: 0,
      currentRound: 1,
      selectedPiece: null,
      previousSelectedPiece: null,
      player1Inventory: createInitialInventory(),
      player2Inventory: createInitialInventory(),
      message: 'message.welcome', // 初期メッセージに戻す
      jankenBattleCells: [],
      captureAnimation: null,
      winAnimation: false,
      loseAnimation: false,
      drawAnimation: false,
      isAIEnabled: wasAIEnabled, // AIモード設定を維持
      initialAIDifficulty: previousInitialDifficulty, // 初期難易度を維持
      aiDifficulty: previousInitialDifficulty, // 現在の難易度も初期値に戻す
      isAIThinking: false, // 思考状態を解除
      winningLine: null, // 勝利ラインのリセット
    });
    
    console.log('[useJankenGame] resetGame completed. Game state has been reset.');
  },
  resetBoardOnly: () => {
    const audioStore = useAudio.getState();
    audioStore.playClick();
    
    set({
      board: createEmptyBoard(),
      selectedPiece: null,
      previousSelectedPiece: null,
      currentPlayer: Player.PLAYER1,
      phase: GamePhase.SELECTING_CELL,
      message: 'message.boardReset',
      captureAnimation: null,
      winningLine: null, // 勝利ラインのリセット
    });
    
    // 少し遅延してプレイヤー1のターンメッセージに変更
    setTimeout(() => {
      set({ message: 'message.player1Turn' });
    }, 1500);
  },
  resetInventory: () => {
    const audioStore = useAudio.getState();
    audioStore.playClick();
    
    // 完全に新しいインベントリを作成
    const newPlayer1Inventory = createInitialInventory();
    const newPlayer2Inventory = createInitialInventory();
    
    console.log('[useJankenGame] New inventories created:', 
      { player1: newPlayer1Inventory, player2: newPlayer2Inventory });
    
    // 状態を更新
    set({
      player1Inventory: newPlayer1Inventory,
      player2Inventory: newPlayer2Inventory,
      selectedPiece: null,
      message: 'message.inventoryReset',
    });
    
    // 少し遅延して通常のメッセージに戻す
    setTimeout(() => {
      const currentPlayer = get().currentPlayer;
      set({ 
        message: currentPlayer === Player.PLAYER1 
          ? 'message.player1Turn' 
          : 'message.player2Turn' 
      });
    }, 1500);
  },
  resetScoresOnly: () => {
    const audioStore = useAudio.getState();
    audioStore.playClick();
    
    set({
      player1Score: 0,
      player2Score: 0,
      currentRound: 1,
      message: 'message.scoresReset',
    });
    
    // 少し遅延して通常のメッセージに戻す
    setTimeout(() => {
      const currentPlayer = get().currentPlayer;
      set({ 
        message: currentPlayer === Player.PLAYER1 
          ? 'message.player1Turn' 
          : 'message.player2Turn' 
      });
    }, 1500);
  },
  setPlayer1JankenChoice: (choice: PieceType | null) => set({ player1JankenChoice: choice }),
  setPlayer2JankenChoice: (choice: PieceType | null) => set({ player2JankenChoice: choice }),
  incrementPlayer1Score: () => set((state: JankenGameState) => ({ player1Score: state.player1Score + 1 })),
  incrementPlayer2Score: () => set((state: JankenGameState) => ({ player2Score: state.player2Score + 1 })),
  incrementRound: () => set((state: JankenGameState) => ({ currentRound: state.currentRound + 1 })),
  resetScoresAndRound: () => set({ player1Score: 0, player2Score: 0, currentRound: 1 }),
  makeChoice: (playerChoice: PieceType) => {
    const { currentPlayer, isAIEnabled, player1JankenChoice, aiDifficulty, currentRound, player1Score, player2Score } = get();
    const audioStore = useAudio.getState();

    if (currentPlayer === Player.PLAYER1) {
      set({ player1JankenChoice: playerChoice, message: 'message.player1Selected' });
      if (isAIEnabled) {
        set({ isAIThinking: true, message: 'message.aiThinking' });
        setTimeout(() => {
          const aiChoice = pieces[Math.floor(Math.random() * pieces.length)].id;
          set({ player2JankenChoice: aiChoice, isAIThinking: false, message: 'message.aiSelected' });
          
          const p1 = playerChoice;
          const p2 = aiChoice;
          let roundWinner: Player | 'DRAW' = 'DRAW';

          if (p1 === p2) {
            set({ message: 'message.drawRound' });
            audioStore.playDraw();
          } else if (
            (p1 === PieceType.ROCK && p2 === PieceType.SCISSORS) ||
            (p1 === PieceType.SCISSORS && p2 === PieceType.PAPER) ||
            (p1 === PieceType.PAPER && p2 === PieceType.ROCK)
          ) {
            get().incrementPlayer1Score();
            roundWinner = Player.PLAYER1;
            set({ message: 'message.player1WinRound' });
            audioStore.playWin();
          } else {
            get().incrementPlayer2Score();
            roundWinner = Player.PLAYER2;
            set({ message: 'message.player2WinRound' });
            audioStore.playLose();
          }

          if (get().currentRound >= 3) {
            set({ phase: GamePhase.GAME_OVER, message: 'message.gameOver' });
          } else {
            get().incrementRound();
            set({ 
              phase: GamePhase.SHOWDOWN,
              currentPlayer: Player.PLAYER1,
              message: roundWinner === Player.PLAYER1 ? 'message.player1WinRound' : roundWinner === Player.PLAYER2 ? 'message.player2WinRound' : 'message.drawRound'
            });
          }
        }, 1000);
      } else {
        set({ currentPlayer: Player.PLAYER2, message: 'message.player2Turn' }); 
      }
    } else { 
      set({ player2JankenChoice: playerChoice, message: 'message.player2Selected' });
      const p1 = player1JankenChoice;
      const p2 = playerChoice;
      if (!p1) {
        set({message: "message.player1NotSelectedYet"});
        return; 
      }
      let roundWinner: Player | 'DRAW' = 'DRAW';

      if (p1 === p2) {
        set({ message: 'message.drawRound' });
        audioStore.playDraw();
      } else if (
        (p1 === PieceType.ROCK && p2 === PieceType.SCISSORS) ||
        (p1 === PieceType.SCISSORS && p2 === PieceType.PAPER) ||
        (p1 === PieceType.PAPER && p2 === PieceType.ROCK)
      ) {
        get().incrementPlayer1Score();
        roundWinner = Player.PLAYER1;
        set({ message: 'message.player1WinRound' });
        audioStore.playWin();
      } else {
        get().incrementPlayer2Score();
        roundWinner = Player.PLAYER2;
        set({ message: 'message.player2WinRound' });
        audioStore.playLose();
      }
      
      if (get().currentRound >= 3) {
        set({ phase: GamePhase.GAME_OVER, message: 'message.gameOver' });
      } else {
        get().incrementRound();
        set({ 
          phase: GamePhase.SHOWDOWN, 
          currentPlayer: Player.PLAYER1,
          message: roundWinner === Player.PLAYER1 ? 'message.player1WinRound' : roundWinner === Player.PLAYER2 ? 'message.player2WinRound' : 'message.drawRound'
        });
      }
    }
  },
  clearCaptureAnimation: () => set({ captureAnimation: null }),
  clearWinAnimation: () => set({ winAnimation: false }),
  clearLoseAnimation: () => set({ loseAnimation: false }),
  clearDrawAnimation: () => set({ drawAnimation: false }),
  setInitialAIDifficulty: (difficulty: AIDifficulty) => set({ initialAIDifficulty: difficulty, aiDifficulty: difficulty }),
  setAIDifficulty: (difficulty: AIDifficulty) => set({ aiDifficulty: difficulty }),
  selectCell: (position: Position) => {
    const { board, currentPlayer, selectedPiece, phase } = get();
    // DEBUG_GAME_FLOW: selectCell が呼ばれた時のログ
    console.log(`[DEBUG_GAME_FLOW] selectCell called. Position: (${position.row}, ${position.col}), Current phase: ${phase}, Selected piece: ${selectedPiece}, Current player: ${currentPlayer}`);

    // フェーズが SELECTING_CELL 以外なら何もしない
    if (phase !== GamePhase.SELECTING_CELL) {
      console.log(`[DEBUG_GAME_FLOW] selectCell ignored: Phase is not SELECTING_CELL (${phase}).`);
      return;
    }

    // selectedPiece が null の場合（駒が選択されていない場合）
    if (selectedPiece === null) {
      console.log(`[DEBUG_GAME_FLOW] selectCell: No piece selected. Current phase: ${phase}.`);
      // より分かりやすいメッセージを表示
      set({ 
        message: currentPlayer === Player.PLAYER1 
          ? 'まず駒を選択してください（左パネルから）' 
          : 'message.player2SelectPiece' 
      });
      
      // 一定時間後に元のメッセージに戻す
      setTimeout(() => {
        const currentState = get();
        if (currentState.phase === GamePhase.SELECTING_CELL) {
          set({ 
            message: currentState.currentPlayer === Player.PLAYER1 
              ? 'message.player1Turn' 
              : 'message.player2Turn' 
          });
        }
      }, 2000);
      return;
    }

    // 盤面データが不正な場合
    if (!board || !Array.isArray(board) || !board[position.row] || !board[position.row][position.col]) {
      console.error(`[DEBUG_GAME_FLOW] selectCell error: Invalid board data or position. Board valid: ${!!board}, Row exists: ${!!board[position.row]}, Cell exists: ${!!(board[position.row]?.[position.col])}`);
      return;
    }

    const targetCell = board[position.row][position.col];
    // DEBUG_GAME_FLOW: クリックされたセルの情報
    console.log(`[DEBUG_GAME_FLOW] selectCell: Target cell info - piece: ${targetCell.piece}, owner: ${targetCell.owner}, hasBeenUsed: ${targetCell.hasBeenUsed}`);

    // 有効な移動先かチェック
    // isValidMove 関数に渡す board の型に注意 (Cell[][])
    const boardAsCells = board as Cell[][]; // 型アサーション
    const canPlace = isValidMove(boardAsCells, position, selectedPiece, currentPlayer);
    // DEBUG_GAME_FLOW: isValidMove の結果
    console.log(`[DEBUG_GAME_FLOW] selectCell: isValidMove result = ${canPlace}`);

    if (canPlace) {
      console.log(`[DEBUG_GAME_FLOW] selectCell: Valid move! Calling placePiece for position: (${position.row}, ${position.col}).`);
      // 有効な場所であれば駒を配置
      // placePiece 関数に渡す引数に注意
      get().placePiece(position.row, position.col); // row, col のみ渡す
      // placePiece の中で selectedPiece は null に設定されるはず
      // DEBUG_GAME_FLOW: placePiece 呼び出し後、selectedPiece の状態を確認 (非同期かもしれないのであくまで参考)
      setTimeout(() => {
        console.log('[DEBUG_GAME_FLOW] selectCell: After placePiece call (with slight delay), selectedPiece is:', get().selectedPiece);
      }, 0);

    } else {
      // 有効な移動先でない場合
      console.log(`[DEBUG_GAME_FLOW] selectCell: Invalid move for piece ${selectedPiece} at position (${position.row}, ${position.col}).`);
      // 無効な移動メッセージを表示
      set({ message: 'その場所には駒を配置できません' });
      
      // 一定時間後に元のメッセージに戻す
      setTimeout(() => {
        const currentState = get();
        if (currentState.phase === GamePhase.SELECTING_CELL) {
          set({ 
            message: currentState.currentPlayer === Player.PLAYER1 
              ? 'message.player1Turn' 
              : 'message.player2Turn' 
          });
        }
      }, 2000);
    }
  },
  placePiece: (row: number, col: number) => {
    try {
      const { board, selectedPiece, currentPlayer, phase, isAIThinking } = get();
      
      console.log(`[useJankenGame] placePiece called: row=${row}, col=${col}, player=${currentPlayer}, selectedPiece=${selectedPiece}`);
      
      // 基本的な検証
      if (phase !== GamePhase.SELECTING_CELL) {
        console.warn(`[useJankenGame] Cannot place piece, wrong phase: ${phase}`);
        return;
      }
      
      if (selectedPiece === null) {
        console.warn(`[useJankenGame] Cannot place piece, no piece selected`);
        return;
      }
      
      // AI思考中の重複実行を防ぐ
      if (isAIThinking && currentPlayer === Player.PLAYER2) {
        console.warn('[useJankenGame] AI is thinking, ignoring duplicate placement');
        return;
      }
      
      // 位置の検証
      if (row < 0 || row >= 6 || col < 0 || col >= 6) {
        console.warn(`[useJankenGame] Invalid position: (${row}, ${col})`);
        return;
      }
      
      // 盤面の安全性チェック
      if (!board || !Array.isArray(board) || !board[row] || !board[row][col]) {
        console.error(`[useJankenGame] Invalid board state at position (${row}, ${col})`);
        return;
      }
      
      const position: Position = { row, col };
      
      // 有効な手かどうかを検証
      if (!isValidMove(board, position, selectedPiece, currentPlayer)) {
        console.warn(`[useJankenGame] Invalid move for ${selectedPiece} at (${row}, ${col})`);
        soundService.play('hit');
        return;
      }
      
      console.log(`[useJankenGame] Valid move confirmed: placing ${selectedPiece} at (${row}, ${col})`);
      
      // インベントリから駒を消費
      const currentInventory = currentPlayer === Player.PLAYER1 
        ? { ...get().player1Inventory } 
        : { ...get().player2Inventory };
      
      if (!currentInventory || currentInventory[selectedPiece] <= 0) {
        console.warn(`[useJankenGame] No ${selectedPiece} pieces left for player ${currentPlayer}`);
        return;
      }
      
      currentInventory[selectedPiece]--;
      console.log(`[useJankenGame] Consumed 1 ${selectedPiece} from player ${currentPlayer}`);
      
      // 新しい盤面を作成
      const newBoard = selectCellForPlayerUtil(position, currentPlayer, selectedPiece, board);
      
      // 効果音を再生
      soundService.play('place');
      
      // 状態を更新（一括更新）
      const stateUpdate = currentPlayer === Player.PLAYER1
        ? { 
            player1Inventory: currentInventory,
            board: newBoard,
            selectedPiece: null,
          }
        : { 
            player2Inventory: currentInventory,
            board: newBoard,
            selectedPiece: null,
          };
      
      set(stateUpdate);
      
      // ゲーム終了判定を遅延実行
      setTimeout(() => {
        try {
          const currentState = get();
          
          // 勝利判定
          const winLine = findWinningLine(currentState.board, currentPlayer);
          if (winLine) {
            set({
              phase: GamePhase.GAME_OVER,
              result: currentPlayer === Player.PLAYER1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN,
              message: `message.${normalizePlayer(currentPlayer)}Win`,
              winningLine: winLine
            });
            soundService.play('victory');
            return;
          }
          
          // 引き分け判定
          if (checkDraw(currentState.board, currentState.player1Inventory, currentState.player2Inventory)) {
            set({
              phase: GamePhase.GAME_OVER,
              result: GameResult.DRAW,
              message: 'message.gameDraw',
              winningLine: null
            });
            soundService.play('battle');
            return;
          }
          
          // ゲームが続行する場合、ターンを切り替え
          console.log('[useJankenGame] No win or draw. Switching turn.');
          setTimeout(() => {
            get().switchTurn();
          }, 200); // より短い遅延でターン切り替え
          
        } catch (error) {
          console.error('[DEBUG] Error in post-placement processing:', error);
          set({ 
            message: 'message.gameError',
            isAIThinking: false
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('[DEBUG] Critical error in placePiece:', error);
      set({ 
        selectedPiece: null,
        isAIThinking: false,
        message: 'message.placementError' 
      });
    }
  },
  makeAIPieceSelection: async () => {
    try {
      const { board, player2Inventory, aiDifficulty, currentPlayer, phase, isAIThinking } = get();
      
      // 基本的な前提条件チェック
      if (currentPlayer !== Player.PLAYER2) {
        console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection ignored: Not AI player turn');
        return;
      }

      if (phase !== GamePhase.SELECTING_CELL) {
        console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection ignored: Not in SELECTING_CELL phase');
        return;
      }

      if (isAIThinking) {
        console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection ignored: AI already thinking');
        return;
      }

      if (!board || !player2Inventory) {
        console.error('[DEBUG_GAME_FLOW] makeAIPieceSelection error: Board or inventory not ready.');
        return;
      }
      
      console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection: Starting AI decision process.');
      
      // AI思考状態をセット
      set({ isAIThinking: true, message: 'message.aiThinking' });

      // AI決定を取得（同期的に処理）
      const decision = findBestMove(board, player2Inventory, aiDifficulty);
      
      if (!decision) {
        console.warn('[DEBUG_GAME_FLOW] makeAIPieceSelection: AI could not find a valid move.');
        set({ 
          isAIThinking: false,
          message: 'message.aiNoMove'
        });
        return;
      }

      console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection: AI decision:', decision);

      // 思考時間のシミュレーション後に実行（遅延を最小化）
      setTimeout(() => {
        // 再度状態をチェック（思考時間中に状況が変わった可能性）
        const currentState = get();
        if (currentState.currentPlayer !== Player.PLAYER2 || 
            currentState.phase !== GamePhase.SELECTING_CELL ||
            !currentState.isAIThinking) {
          console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection: Conditions changed during thinking, aborting');
          set({ isAIThinking: false });
          return;
        }

        // 駒を選択して配置を実行（バッチ化）
        set({ 
          selectedPiece: decision.piece,
          isAIThinking: false // 思考終了
        });

        console.log('[DEBUG_GAME_FLOW] makeAIPieceSelection: Placing AI piece at position:', decision.position);
        
        // DOM更新完了後に駒配置を実行
        setTimeout(() => {
          get().placePiece(decision.position.row, decision.position.col);
        }, 0);
      }, 50);

    } catch (error) {
      console.error('[DEBUG] Critical error in makeAIPieceSelection:', error);
      set({ 
        isAIThinking: false, 
        selectedPiece: null,
        message: 'message.aiError' 
      });
    }
  },
  getRandomPieceForCurrentPlayer: () => {
    try {
      const { currentPlayer, player1Inventory, player2Inventory, phase, isAIEnabled } = get();
      
      console.log('[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer called.', { currentPlayer, phase });

      // 駒選択フェーズでなければ何もしない
      if (phase !== GamePhase.SELECTING_CELL) {
        console.log('[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer ignored: Not in SELECTING_CELL phase.');
        return;
      }

      const inventory = currentPlayer === Player.PLAYER1 ? player1Inventory : player2Inventory;

      if (!inventory) {
        console.error('[DEBUG] getRandomPieceForCurrentPlayer: Inventory is null or undefined');
        return;
      }

      console.log(`[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer: Inventory for ${currentPlayer}:`, inventory);

      const randomPiece = getRandomPiece(inventory);

      if (randomPiece) {
        console.log(`[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer: Randomly selected piece: ${randomPiece}`);
        
        // 駒を選択
        set({ selectedPiece: randomPiece });
        
        console.log('[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer: Piece selected successfully');
      } else {
        console.warn('[DEBUG_GAME_FLOW] getRandomPieceForCurrentPlayer: Could not get a random piece. Inventory might be empty.');
        console.warn('[DEBUG] Inventory contents:', inventory);
      }
    } catch (error) {
      console.error('[DEBUG] Error in getRandomPieceForCurrentPlayer:', error);
      set({ 
        selectedPiece: null,
        message: 'message.selectionError' 
      });
    }
  },
  switchTurn: () => {
    try {
      const { currentPlayer, isAIEnabled, phase, isAIThinking } = get();
      
      console.log(`[DEBUG] switchTurn: ${currentPlayer} → ${currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1}`);

      // 基本チェック
      if (phase !== GamePhase.SELECTING_CELL) {
        console.log(`[DEBUG] switchTurn ignored: Not in SELECTING_CELL phase (${phase})`);
        return;
      }

      if (isAIThinking) {
        console.log(`[DEBUG] switchTurn ignored: AI is already thinking`);
        return;
      }

      // 次のプレイヤーを決定
      const nextPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
      const nextMessage = `message.${normalizePlayer(nextPlayer)}Turn`;
      
      // 状態を一括更新（バッチ化）
      set({
        currentPlayer: nextPlayer,
        message: nextMessage,
        selectedPiece: null, // 駒の選択をリセット
      });
      
      // React DOM更新完了を待ってから次の処理
      if (isAIEnabled && nextPlayer === Player.PLAYER2) {
        // AI（プレイヤー2）のターン - 遅延なし
        setTimeout(() => {
          const currentState = get();
          if (currentState.currentPlayer === Player.PLAYER2 && 
              currentState.phase === GamePhase.SELECTING_CELL &&
              currentState.isAIEnabled &&
              !currentState.isAIThinking) {
            console.log('[DEBUG] switchTurn: Executing AI move');
            get().makeAIPieceSelection();
          }
        }, 0);
      } else if (isAIEnabled && nextPlayer === Player.PLAYER1) {
        // AIモードのプレイヤー1のターン - 基本駒の自動選択を実行（遅延なし）
        setTimeout(() => {
          const currentState = get();
          if (currentState.currentPlayer === Player.PLAYER1 && 
              currentState.phase === GamePhase.SELECTING_CELL &&
              currentState.isAIEnabled &&
              !currentState.selectedPiece) {
            console.log('[DEBUG] switchTurn: Auto-selecting basic piece for Player 1 in AI mode');
            get().getRandomPieceForCurrentPlayer();
          }
        }, 0);
      } else if (!isAIEnabled) {
        // ローカルモード（人間 vs 人間）- 自動選択を実行（遅延なし）
        setTimeout(() => {
          get().getRandomPieceForCurrentPlayer();
        }, 0);
      }
      
    } catch (error) {
      console.error('[ERROR] switchTurn failed:', error);
      set({ isAIThinking: false }); // エラー時はAI思考状態をリセット
    }
  },
});

export { createState };

// Zustandのバージョン間の型互換性問題を解決するために型アサーションを使用
// リセットループを防ぐためにpersistをいったん無効化
const useJankenGame = create<JankenGameState>()(
  (createState as any)
  // 以下のpersistミドルウェアをコメントアウトしてローカルストレージの問題を解決
  /*
  persist(
    (createState as any),
    {
      name: 'janken-game-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
      partialize: (state) => ({
        player1Inventory: state.player1Inventory,
        player2Inventory: state.player2Inventory,
        player1Score: state.player1Score,
        player2Score: state.player2Score,
        currentRound: state.currentRound,
        board: state.board,
        isAIEnabled: state.isAIEnabled,
        initialAIDifficulty: state.initialAIDifficulty,
      }),
      version: 0,
    }
  )
  */
);

export default useJankenGame;
// 名前付きエクスポートも追加
export { useJankenGame };

const TOTAL_ROUNDS = 20; // 20ラウンド制
// AIの思考時間（ミリ秒）
const AI_THINKING_TIME = 1200;