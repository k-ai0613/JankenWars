import { create } from 'zustand';
import { Board, Cell, GamePhase, GameResult, PieceType, Player, Position } from '../types';
import { 
  checkDraw, 
  checkWin, 
  createEmptyBoard, 
  createInitialInventory, 
  getRandomPiece, 
  isValidMove 
} from '../gameUtils';
import { AIDifficulty, findBestMove } from '../aiUtils';
import { useAudio } from './useAudio';

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
  
  // Animation states
  captureAnimation: Position | null; // Position where a capture happened
  winAnimation: boolean; // Whether to show the win animation
  loseAnimation: boolean; // Whether to show the lose animation
  drawAnimation: boolean; // Whether to show the draw animation
  
  // AI settings
  isAIEnabled: boolean;
  aiDifficulty: AIDifficulty;
  isAIThinking: boolean; // For showing AI "thinking" animation
  
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
  captureAnimation: null,
  winAnimation: false,
  loseAnimation: false,
  drawAnimation: false,
  
  // AI settings
  isAIEnabled: false,
  aiDifficulty: AIDifficulty.MEDIUM,
  isAIThinking: false,
  
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
    
    // If the cell is empty
    if (targetCell.piece === PieceType.EMPTY) {
      // Place the piece
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: currentPlayer
      };
      
      // Play success sound
      audioStore.playSuccess();
    } else {
      // Janken battle - replace opponent's piece
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: currentPlayer
      };
      
      // Play hit sound
      audioStore.playHit();
      
      // Trigger capture animation
      set({ captureAnimation: position });
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
    set({
      board: createEmptyBoard(),
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
      drawAnimation: false
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
      isAIEnabled
    } = get();
    
    // Only run if AI is enabled, it's Player 2's turn, and game is in the correct phase
    if (!isAIEnabled || currentPlayer !== Player.PLAYER2 || phase !== GamePhase.SELECTING_CELL) {
      return;
    }
    
    // Set AI to "thinking" mode
    set({ isAIThinking: true });
    
    // Add a slight delay to make it feel like the AI is "thinking"
    setTimeout(() => {
      // Find the best move for the AI
      const bestMove = findBestMove(board, player2Inventory, aiDifficulty);
      
      if (bestMove) {
        // Set the selected piece
        set({ 
          selectedPiece: bestMove.piece,
          isAIThinking: false,
          message: 'message.aiSelectedPiece'
        });
        
        // Add a short delay before placing the piece
        setTimeout(() => {
          get().selectCell(bestMove.position);
        }, 500);
      } else {
        // No valid moves, end AI thinking
        set({ isAIThinking: false });
      }
    }, 1000); // 1 second thinking delay
  }
}));
