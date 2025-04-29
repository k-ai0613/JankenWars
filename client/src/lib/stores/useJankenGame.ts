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
  aiDifficulty: AIDifficulty.NORMAL, // Default difficulty level is NORMAL
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
    
    // Ensure currentPlayer value is valid
    const safeCurrentPlayer = currentPlayer || Player.PLAYER1; // Fallback if undefined
    console.log('Current player before cell update:', safeCurrentPlayer);
    
    // If the cell is empty
    if (targetCell.piece === PieceType.EMPTY) {
      // Place the piece on empty cell (not locked)
      console.log('Placing piece on empty cell for player:', safeCurrentPlayer);
      
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: safeCurrentPlayer, // Use validated player
        hasBeenUsed: false // Not locked yet, can be captured with janken rules
      };
      
      // Play success sound
      audioStore.playSuccess();
    } else {
      // Janken battle - replace opponent's piece and lock this cell
      const defendingPiece = targetCell.piece;
      console.log('Janken battle:', { attackingPiece: selectedPiece, defendingPiece, attacker: safeCurrentPlayer });
      
      newBoard[position.row][position.col] = {
        piece: selectedPiece,
        owner: safeCurrentPlayer, // Use validated player
        hasBeenUsed: true // Lock this cell after janken battle
      };
      
      // Play hit sound
      audioStore.playHit();
      
      // Trigger capture animation
      set({ captureAnimation: position });
      
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
            console.log('AI placing piece at:', bestPosition, 'EXPLICIT PLAYER2');
            // AIの場合、プレイヤー2を明示的に強制します
            selectCellForPlayer(bestPosition, Player.PLAYER2, selectedPiece);
          }, 400);
          
          // この関数はプレイヤーを明示的に指定して駒を置きます
          function selectCellForPlayer(position: Position, player: Player, piece: PieceType) {
            const { 
              board, 
              player1Inventory, 
              player2Inventory 
            } = get();
            
            console.log('selectCellForPlayer called:', { position, player, piece });
            
            // Check if move is valid
            if (!isValidMove(board, position, piece, player)) {
              console.warn('Invalid AI move');
              set({ message: 'message.invalidMove', isAIThinking: false });
              return;
            }
            
            // Clone the board
            const newBoard = [...board.map(row => [...row])];
            
            // Create a new inventory - AIはプレイヤー2なので、player2Inventoryを使用
            const currentInventory = { ...player2Inventory };
            
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
            
            // Player2を強制
            console.log('Forcing AI owner to PLAYER2');
            
            // If the cell is empty
            if (targetCell.piece === PieceType.EMPTY) {
              // Place the piece on empty cell (not locked)
              newBoard[position.row][position.col] = {
                piece: piece,
                owner: Player.PLAYER2, // 明示的にPlayer.PLAYER2
                hasBeenUsed: false // Not locked yet, can be captured with janken rules
              };
              
              // Play success sound
              audioStore.playSuccess();
            } else {
              // Janken battle - replace opponent's piece and lock this cell
              const defendingPiece = targetCell.piece;
              
              newBoard[position.row][position.col] = {
                piece: piece,
                owner: Player.PLAYER2, // 明示的にPlayer.PLAYER2
                hasBeenUsed: true // Lock this cell after janken battle
              };
              
              // Play hit sound
              audioStore.playHit();
              
              // Trigger capture animation
              set({ captureAnimation: position });
              
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
          }
        } else {
          // No valid moves, end AI thinking
          set({ isAIThinking: false });
        }
      }, thinkingTime);
    }, 1000);
  }
}));
