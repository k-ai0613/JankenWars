import { create } from 'zustand';
import { Board, Cell, GamePhase, GameResult, PieceType, Player, Position, normalizePlayer } from '../types';
import { 
  checkDraw, 
  checkWin, 
  createEmptyBoard, 
  createInitialInventory, 
  getRandomPiece, 
  isValidMove 
} from '../gameUtils';
import { AIDifficulty, findBestMove, findBestPosition } from '../aiUtils';
import { useAudio } from './useAudio';
import { useLanguage } from './useLanguage';

interface JankenGameState {
  // Board state
  board: Board;
  
  // Current player
  currentPlayer: Player;
  
  // Game phase
  phase: GamePhase;
  
  // Game result
  result: GameResult;
  
  // Selected piece
  selectedPiece: PieceType | null;
  
  // Player inventories
  player1Inventory: ReturnType<typeof createInitialInventory>;
  player2Inventory: ReturnType<typeof createInitialInventory>;
  
  // Game message
  message: string;
  
  // Janken battle cells - track positions where battles occurred
  jankenBattleCells: Position[]; // Keeps track of cells where janken battles occurred
  
  // Animation states
  captureAnimation: Position | null; // Position where a capture happened
  winAnimation: boolean; // Whether to show the win animation
  loseAnimation: boolean; // Whether to show the lose animation
  drawAnimation: boolean; // Whether to show the draw animation
  
  // AI settings
  isAIEnabled: boolean;
  aiDifficulty: AIDifficulty;
  isAIThinking: boolean; // For showing AI "thinking" animation
  
  // Board utility functions
  applyJankenBattlePatternToBoard: (board: Board) => Board;
  
  // Actions
  startGame: () => void;
  selectCell: (position: Position) => void;
  selectSpecialPiece: () => void;
  getRandomPieceForCurrentPlayer: () => void;
  resetGame: () => void;
  clearCaptureAnimation: () => void;
  clearWinAnimation: () => void;
  clearLoseAnimation: () => void;
  clearDrawAnimation: () => void;
  
  // AI helper function for explicit piece placement
  selectCellForPlayer: (position: Position, player: Player, piece: PieceType) => void;
  
  // AI actions
  toggleAI: () => void;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  makeAIMove: () => void;
}

export const useJankenGame = create<JankenGameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: Player.PLAYER1, // Player 1 goes first
  phase: GamePhase.READY,
  result: GameResult.ONGOING,
  selectedPiece: null,
  player1Inventory: createInitialInventory(),
  player2Inventory: createInitialInventory(),
  message: 'message.welcome', // 翻訳用のキーに変更
  jankenBattleCells: [], // 初期値は空の配列
  captureAnimation: null,
  winAnimation: false,
  loseAnimation: false,
  drawAnimation: false,
  
  // AI settings
  isAIEnabled: false,
  aiDifficulty: AIDifficulty.NORMAL, // Default difficulty level is NORMAL
  isAIThinking: false,
  
  // ボード上にじゃんけんバトルパターンを適用する関数
  applyJankenBattlePatternToBoard: (board: Board): Board => {
    const { jankenBattleCells } = get();
    
    // Clone the board to avoid mutation
    const newBoard = board.map(row => [...row]);
    
    // Mark each cell that had a janken battle with hasBeenUsed=true
    jankenBattleCells.forEach(position => {
      if (position && position.row >= 0 && position.row < 6 && 
          position.col >= 0 && position.col < 6) {
        console.log(`[APPLY_PATTERN] marking cell ${position.row},${position.col} as used (janken battle)`);
        newBoard[position.row][position.col].hasBeenUsed = true;
      }
    });
    
    return newBoard;
  },
  
  startGame: () => {
    set({ 
      phase: GamePhase.SELECTING_CELL,
      message: "message.player1Turn",
      selectedPiece: null  // Clear any selected piece at the start
    });
    
    // Select random piece for first player
    get().getRandomPieceForCurrentPlayer();
    
    // If AI mode is enabled and AI is Player 1, make AI move immediately
    const { isAIEnabled } = get();
    if (isAIEnabled) {
      // Store the current setting to restore it later
      const currentAIEnabled = isAIEnabled;
      // Temporarily disable AI to prevent immediate AI move (Player 1 should go first)
      set({ isAIEnabled: false });
      // Re-enable AI after a short delay
      setTimeout(() => set({ isAIEnabled: currentAIEnabled }), 1000);
    }
  },
  
  selectCell: (position: Position) => {
    const { 
      board, 
      currentPlayer, 
      selectedPiece, 
      player1Inventory, 
      player2Inventory 
    } = get();
    
    // Debug logging for selection
    console.log('selectCell called:', { position, currentPlayer, selectedPiece });
    
    if (selectedPiece === null) {
      set({ message: 'message.selectPieceFirst' });
      return;
    }
    
    // Check if move is valid
    if (!isValidMove(board, position, selectedPiece, currentPlayer)) {
      set({ message: 'message.invalidMove' });
      return;
    }
    
    // Clone the board
    const newBoard = [...board.map(row => [...row])];
    
    // Create a new inventory based on current player
    const currentInventory = currentPlayer === Player.PLAYER1 
      ? { ...player1Inventory }
      : { ...player2Inventory };
    
    // Reduce the count of the selected piece
    if (selectedPiece && selectedPiece !== PieceType.EMPTY && 
        (selectedPiece === PieceType.ROCK || 
         selectedPiece === PieceType.PAPER || 
         selectedPiece === PieceType.SCISSORS || 
         selectedPiece === PieceType.SPECIAL)) {
      currentInventory[selectedPiece]--;
    }
    
    // Update the cell
    const targetCell = newBoard[position.row][position.col];
    
    // Play sound effect
    const audioStore = useAudio.getState();
    
    // プレイヤーを文字列で明確に判別
    const isPlayer1 = String(currentPlayer) === String(Player.PLAYER1);
    const isPlayer2 = String(currentPlayer) === String(Player.PLAYER2);
    const playerStr = isPlayer1 ? 'PLAYER1' : (isPlayer2 ? 'PLAYER2' : 'UNKNOWN');
    const actualOwner = isPlayer1 ? Player.PLAYER1 : (isPlayer2 ? Player.PLAYER2 : Player.NONE);
    
    console.log('Current player before cell update:', {
      currentPlayer,
      isPlayer1,
      isPlayer2,
      playerStr,
      actualOwner
    });
    
    // If the cell is empty
    if (targetCell.piece === PieceType.EMPTY) {
      // Place the piece on empty cell (not locked)
      console.log('Placing piece on empty cell for player:', playerStr);
      
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: actualOwner, // 厳密に構造化されたプレイヤー値を使用
        hasBeenUsed: false // Not locked yet, can be captured with janken rules
      };
      
      // Play success sound
      audioStore.playSuccess();
    } else {
      // Janken battle - replace opponent's piece and lock this cell
      const defendingPiece = targetCell.piece;
      console.log('Janken battle:', { attackingPiece: selectedPiece, defendingPiece, attacker: playerStr });
      
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: actualOwner, // 厳密に構造化されたプレイヤー値を使用
        hasBeenUsed: true // Lock this cell after janken battle
      };
      
      // Play hit sound
      audioStore.playHit();
      
      // Trigger capture animation
      set({ 
        captureAnimation: position,
        // じゃんけん勝負が行われたセルの位置を保存
        jankenBattleCells: [...get().jankenBattleCells, position]
      });
      
      // Display a message about the janken battle result
      let jankenResultMessage = '';

      // Create a specific message based on what pieces were involved
      // In Japanese Janken Rules:
      // - Rock (グー) beats Scissors (チョキ)
      // - Scissors (チョキ) beats Paper (パー)
      // - Paper (パー) beats Rock (グー)
      if (selectedPiece === PieceType.ROCK && defendingPiece === PieceType.SCISSORS) {
        jankenResultMessage = 'message.rockVsScissors';
      } else if (selectedPiece === PieceType.SCISSORS && defendingPiece === PieceType.PAPER) {
        jankenResultMessage = 'message.scissorsVsPaper';
      } else if (selectedPiece === PieceType.PAPER && defendingPiece === PieceType.ROCK) {
        jankenResultMessage = 'message.paperVsRock';
      }
      
      // Set the message key for translation
      set({ message: jankenResultMessage });
    }
    
    // Update inventories
    const newState = {
      board: newBoard,
      selectedPiece: null,
      ...(currentPlayer === Player.PLAYER1 
          ? { player1Inventory: currentInventory }
          : { player2Inventory: currentInventory })
    };
    
    // Check for win condition
    if (checkWin(newBoard, currentPlayer)) {
      const result = currentPlayer === Player.PLAYER1 
        ? GameResult.PLAYER1_WIN 
        : GameResult.PLAYER2_WIN;
        
      // The current player won!
      set({
        ...newState,
        result,
        phase: GamePhase.GAME_OVER,
        message: currentPlayer === Player.PLAYER1 ? 'message.player1Win' : 'message.player2Win',
        winAnimation: true
      });
      
      return;
    }
    
    // Check for draw condition
    if (checkDraw(newBoard, 
        currentPlayer === Player.PLAYER1 ? currentInventory : player1Inventory,
        currentPlayer === Player.PLAYER2 ? currentInventory : player2Inventory)) {
      set({
        ...newState,
        result: GameResult.DRAW,
        phase: GamePhase.GAME_OVER,
        message: 'message.draw',
        drawAnimation: true
      });
      
      return;
    }
    
    // Switch player
    const nextPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
    const { isAIEnabled } = get();
    
    set({
      ...newState,
      currentPlayer: nextPlayer,
      message: nextPlayer === Player.PLAYER1 ? 'message.player1Turn' : 'message.player2Turn'
    });
    
    // Handle next player's turn
    setTimeout(() => {
      // If next player is AI, let AI select the piece
      if (nextPlayer === Player.PLAYER2 && isAIEnabled) {
        // AI gets to choose its piece and position
        get().makeAIMove();
      } else {
        // For human player, get random piece
        get().getRandomPieceForCurrentPlayer();
      }
    }, 100);
  },
  
  selectSpecialPiece: () => {
    const { currentPlayer, player1Inventory, player2Inventory } = get();
    
    const currentInventory = currentPlayer === Player.PLAYER1 
      ? player1Inventory 
      : player2Inventory;
    
    // Check if the player has a special piece
    if (currentInventory[PieceType.SPECIAL] <= 0) {
      set({ message: 'message.specialPieceUsed' });
      return;
    }
    
    // Set the selected piece to special
    set({ 
      selectedPiece: PieceType.SPECIAL,
      message: currentPlayer === Player.PLAYER1 ? 'message.player1SelectedSpecial' : 'message.player2SelectedSpecial'
    });
  },
  
  getRandomPieceForCurrentPlayer: () => {
    const { currentPlayer, player1Inventory, player2Inventory } = get();
    
    const currentInventory = currentPlayer === Player.PLAYER1 
      ? player1Inventory 
      : player2Inventory;
    
    const randomPiece = getRandomPiece(currentInventory);
    
    if (randomPiece === null) {
      // If no pieces available, check if the player has a special piece
      if (currentInventory[PieceType.SPECIAL] > 0) {
        set({ 
          selectedPiece: null,
          message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} has no normal pieces left. Use your special piece.`
        });
      } else {
        // If no pieces left at all, switch to the other player or end the game
        const nextPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
        const nextInventory = currentPlayer === Player.PLAYER1 ? player2Inventory : player1Inventory;
        
        const hasNextPlayerPieces = Object.values(nextInventory).some(count => count > 0);
        
        if (hasNextPlayerPieces) {
          set({ 
            currentPlayer: nextPlayer,
            selectedPiece: null,
            message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} has no pieces left. ${nextPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'}'s turn.`,
            loseAnimation: true // The current player has no more pieces - they're losing!
          });
          
          // Select random piece for next player
          setTimeout(() => get().getRandomPieceForCurrentPlayer(), 100);
        } else {
          // If both players have no pieces, it's a draw
          set({
            result: GameResult.DRAW,
            phase: GamePhase.GAME_OVER,
            message: "It's a draw! Both players are out of pieces.",
            drawAnimation: true
          });
        }
      }
      return;
    }
    
    set({ 
      selectedPiece: randomPiece,
      message: currentPlayer === Player.PLAYER1 
        ? `message.player1ReceivedPiece.${randomPiece.toLowerCase()}` 
        : `message.player2ReceivedPiece.${randomPiece.toLowerCase()}`
    });
  },
  
  resetGame: () => {
    // 現在のjankenBattleCellsを保存
    const { jankenBattleCells, applyJankenBattlePatternToBoard } = get();

    // 新しい空のボードを作成
    let newBoard = createEmptyBoard();
    
    // 新しいボードにじゃんけんバトルパターンを適用
    newBoard = applyJankenBattlePatternToBoard(newBoard);
    
    console.log('[RESET] Created new board with janken battle pattern applied');
    
    // ボード内のすべてのセルをチェックしてデバッグログを出力
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (newBoard[i][j].hasBeenUsed) {
          console.log(`[RESET-CHECK] Cell at ${i},${j} is marked as used`);
        }
      }
    }
    
    set({
      board: newBoard,
      currentPlayer: Player.PLAYER1,
      phase: GamePhase.READY,
      result: GameResult.ONGOING,
      selectedPiece: null,
      player1Inventory: createInitialInventory(),
      player2Inventory: createInitialInventory(),
      message: 'message.welcome',
      captureAnimation: null,
      winAnimation: false,
      loseAnimation: false,
      drawAnimation: false,
      // jankenBattleCellsはリセットしない
    });
  },
  
  clearCaptureAnimation: () => {
    set({ captureAnimation: null });
  },
  
  clearWinAnimation: () => {
    set({ winAnimation: false });
  },
  
  clearLoseAnimation: () => {
    set({ loseAnimation: false });
  },
  
  clearDrawAnimation: () => {
    set({ drawAnimation: false });
  },
  
  // AIの駒配置用のヘルパー関数 - 完全に文字列ベースのアプローチに変更
  selectCellForPlayer: (position: Position, player: Player | string, piece: PieceType) => {
    const { 
      board, 
      player1Inventory, 
      player2Inventory 
    } = get();
    
    // プレイヤー値を文字列として直接扱う
    const playerString = String(player).toUpperCase();
    console.log('🔎 DIRECT STRING selectCellForPlayer:', { 
      position, 
      originalPlayer: player, 
      playerString, 
      piece,
      playerType: typeof player,
      stringType: typeof playerString,
      isPlayer2ByString: playerString === 'PLAYER2' || playerString.includes('PLAYER2')
    });
    
    // プレイヤー認識を文字列ベースで行う
    const isPlayer1 = playerString === 'PLAYER1' || playerString.includes('PLAYER1');
    const isPlayer2 = playerString === 'PLAYER2' || playerString.includes('PLAYER2');
    
    // Player型としてキャストするのはインターフェース上の邪魔なためのみ
    const playerForMove = isPlayer2 ? Player.PLAYER2 : (isPlayer1 ? Player.PLAYER1 : Player.NONE);
    
    // Check if move is valid - 文字列認識結果に基づく値を使用
    if (!isValidMove(board, position, piece, playerForMove)) {
      console.warn('Invalid AI move');
      set({ message: 'message.invalidMove', isAIThinking: false });
      return;
    }
    
    // Clone the board
    const newBoard = [...board.map(row => [...row])];
    
    // Create a new inventory - 文字列判定に基づく
    const currentInventory = isPlayer1 
      ? { ...player1Inventory }
      : { ...player2Inventory };
    
    // Reduce the count of the selected piece
    if (piece && piece !== PieceType.EMPTY && 
        (piece === PieceType.ROCK || 
         piece === PieceType.PAPER || 
         piece === PieceType.SCISSORS || 
         piece === PieceType.SPECIAL)) {
      currentInventory[piece]--;
    }
    
    // Update the cell
    const targetCell = newBoard[position.row][position.col];
    
    // Play sound effect
    const audioStore = useAudio.getState();
    
    // 文字列による所有者判定結果を使用
    console.log(`Using direct string player id: ${playerString} (original: ${player})`);
    
    // If the cell is empty
    if (targetCell.piece === PieceType.EMPTY) {
      // 文字列判定結果を基にプレイヤーを特定
      let ownerString: string;
      
      // 特に重要なのはPLAYER2のケース - 文字列で判断
      if (isPlayer2) {
        ownerString = 'PLAYER2'; // 完全に確実な文字列
        console.log('Direct PLAYER2 string assignment in cell update!');
      } else if (isPlayer1) {
        ownerString = 'PLAYER1'; // 完全に確実な文字列
      } else {
        ownerString = 'NONE'; // デフォルト値
      }
      
      // 新しいセルを作成 - 明示的に文字列を使用
      const newCell: Cell = {
        piece: piece,
        owner: ownerString as Player, // キャストして型を合わせる
        hasBeenUsed: false // Not locked yet, can be captured with janken rules
      };
      
      // 適切な色が適用されるよう詳細なデバッグ情報を出力
      console.log('📦 NEW CELL CREATION:', {
        position,
        originalPlayer: player,
        playerString,
        ownerString,
        cell: newCell,
        ownerType: typeof newCell.owner,
        ownerValue: String(newCell.owner),
        isPlayer2: ownerString === 'PLAYER2',
        // Debug ID for tracking the update
        updateId: Math.random().toString(36).substring(2, 9)
      });
      
      // 新しいセルをボードに配置
      newBoard[position.row][position.col] = newCell;
      
      // Play success sound
      audioStore.playSuccess();
    } else {
      // Janken battle - replace opponent's piece and lock this cell
      const defendingPiece = targetCell.piece;
      
      // ジャンケンバトルの場合も文字列を明示的に使用
      let battleOwnerString: string;
      
      // 文字列判定結果に基づいてオーナーを決定
      if (isPlayer2) {
        battleOwnerString = 'PLAYER2'; // 完全に確実な文字列
        console.log('Direct PLAYER2 string in Janken battle!');
      } else if (isPlayer1) {
        battleOwnerString = 'PLAYER1'; // 完全に確実な文字列
      } else {
        battleOwnerString = 'NONE'; // デフォルト値
      }
      
      // 新しいセルを作成 - 明示的に文字列を使用
      const battleCell: Cell = {
        piece: piece,
        owner: battleOwnerString as Player, // キャストして型を合わせる
        hasBeenUsed: true // Lock this cell after janken battle
      };
      
      console.log('⚔️ JANKEN_BATTLE_UPDATE:', {
        position,
        originalPlayer: player,
        playerString,
        battleOwnerString,
        cell: battleCell,
        ownerType: typeof battleCell.owner,
        ownerValue: String(battleCell.owner),
        isPlayer2: battleOwnerString === 'PLAYER2',
        battleId: Math.random().toString(36).substring(2, 9)
      });
      
      newBoard[position.row][position.col] = battleCell;
      
      // Play hit sound
      audioStore.playHit();
      
      // Trigger capture animation
      set({ 
        captureAnimation: position,
        // じゃんけん勝負が行われたセルの位置を保存
        jankenBattleCells: [...get().jankenBattleCells, position]
      });
      
      // Display a message about the janken battle result
      let jankenResultMessage = '';
      
      // Create a specific message based on what pieces were involved
      // In Japanese Janken Rules:
      // - Rock (グー) beats Scissors (チョキ)
      // - Scissors (チョキ) beats Paper (パー)
      // - Paper (パー) beats Rock (グー)
      if (piece === PieceType.ROCK && defendingPiece === PieceType.SCISSORS) {
        jankenResultMessage = 'message.rockVsScissors';
      } else if (piece === PieceType.SCISSORS && defendingPiece === PieceType.PAPER) {
        jankenResultMessage = 'message.scissorsVsPaper';
      } else if (piece === PieceType.PAPER && defendingPiece === PieceType.ROCK) {
        jankenResultMessage = 'message.paperVsRock';
      }
      
      // Set the message key for translation
      set({ message: jankenResultMessage });
    }
    
    // Update inventories
    const newState = {
      board: newBoard,
      selectedPiece: null,
      player2Inventory: currentInventory
    };
    
    // Check for win condition
    if (checkWin(newBoard, Player.PLAYER2)) {  // AI playerのwin条件
      // The AI won!
      set({
        ...newState,
        result: GameResult.PLAYER2_WIN,
        phase: GamePhase.GAME_OVER,
        message: 'message.player2Win',
        winAnimation: true
      });
      
      return;
    }
    
    // Check for draw condition
    if (checkDraw(newBoard, player1Inventory, currentInventory)) {
      set({
        ...newState,
        result: GameResult.DRAW,
        phase: GamePhase.GAME_OVER,
        message: 'message.draw',
        drawAnimation: true
      });
      
      return;
    }
    
    // Switch player to Player 1
    set({
      ...newState,
      currentPlayer: Player.PLAYER1,
      message: 'message.player1Turn'
    });
    
    // Get random piece for Player 1's next turn
    setTimeout(() => {
      get().getRandomPieceForCurrentPlayer();
    }, 100);
  },

  // AI actions
  toggleAI: () => {
    const { isAIEnabled } = get();
    set({ isAIEnabled: !isAIEnabled });
  },
  
  setAIDifficulty: (difficulty: AIDifficulty) => {
    set({ aiDifficulty: difficulty });
  },
  
  makeAIMove: () => {
    const { 
      board, 
      currentPlayer, 
      player2Inventory,
      phase,
      aiDifficulty,
      isAIEnabled,
      selectedPiece
    } = get();
    
    // Only run if AI is enabled, it's Player 2's turn, and game is in the correct phase
    if (!isAIEnabled || currentPlayer !== Player.PLAYER2 || phase !== GamePhase.SELECTING_CELL) {
      return;
    }
    
    // Set AI to "thinking" mode
    set({ isAIThinking: true });
    
    // First, if we don't have a selected piece yet, get a random piece like human players
    if (selectedPiece === null) {
      // Randomly select a piece just like human players
      get().getRandomPieceForCurrentPlayer();
      
      // We'll continue the AI move after a short thinking delay
      setTimeout(() => {
        // Now get the updated selected piece
        const updatedSelectedPiece = get().selectedPiece;
        
        if (updatedSelectedPiece !== null) {
          // Add a message that AI is deciding where to place the piece
          set({ message: 'message.aiDecidingPlacement' });
          
          // Continue with placement decision after a short delay
          setTimeout(() => get().makeAIMove(), 500);
        } else {
          // Something went wrong, end AI thinking
          set({ isAIThinking: false });
        }
      }, 800); // Thinking time for piece selection
      
      return;
    }
    
    // If we already have a selected piece, find the best position for it
    setTimeout(() => {
      const { board, selectedPiece, aiDifficulty } = get();
      
      // Add a message that AI is deciding where to place the piece
      set({ message: 'message.aiDecidingPlacement' });
      
      // Find best position for the already selected piece
      if (selectedPiece === null) {
        set({ isAIThinking: false });
        return;
      }
      
      // Different AI difficulty levels have different thinking times
      let thinkingTime = 1200; // Default
      
      if (aiDifficulty === AIDifficulty.BEGINNER) thinkingTime = 800;
      else if (aiDifficulty === AIDifficulty.EASY) thinkingTime = 1000;
      else if (aiDifficulty === AIDifficulty.NORMAL) thinkingTime = 1200;
      else if (aiDifficulty === AIDifficulty.MEDIUM) thinkingTime = 1500;
      else if (aiDifficulty === AIDifficulty.HARD) thinkingTime = 1800;
      else if (aiDifficulty === AIDifficulty.EXPERT) thinkingTime = 2200;
      
      // Add randomness to thinking time
      thinkingTime += Math.floor(Math.random() * 400);
      
      // Find the best position after thinking
      setTimeout(() => {
        const bestPosition = findBestPosition(board, selectedPiece, aiDifficulty);
        
        if (bestPosition) {
          set({ isAIThinking: false });
          
          // Add a short delay before placing the piece
          // ここがAIのプレイヤー2の動作の核心部分です
          setTimeout(() => {
            console.log('AI placing piece at:', bestPosition, 'USING DIRECT STRING VALUE');
            
            // AIの場合、プレイヤー2を明示的な文字列として指定
            // 列挙型としての参照ではなく、直接文字列「PLAYER2」を使用
            const PLAYER2_STRING = 'PLAYER2';
            
            console.log('AI using explicit string as player value:', {
              value: PLAYER2_STRING,
              type: typeof PLAYER2_STRING,
            });
            
            // 直接文字列を渡して、現在の比較ロジックで確実に一致させる
            // キャストを追加して型安全性を確保
            get().selectCellForPlayer(bestPosition, PLAYER2_STRING as Player, selectedPiece);
          }, 400);
          
          // 外部に定義したselectCellForPlayer関数を利用しています
        } else {
          // No valid moves, end AI thinking
          set({ isAIThinking: false });
        }
      }, thinkingTime);
    }, 1000);
  }
}));
