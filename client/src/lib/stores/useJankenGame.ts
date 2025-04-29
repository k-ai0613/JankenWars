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
  
  // Actions
  startGame: () => void;
  selectCell: (position: Position) => void;
  selectSpecialPiece: () => void;
  getRandomPieceForCurrentPlayer: () => void;
  resetGame: () => void;
}

export const useJankenGame = create<JankenGameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: Player.PLAYER1, // Player 1 goes first
  phase: GamePhase.READY,
  result: GameResult.ONGOING,
  selectedPiece: null,
  player1Inventory: createInitialInventory(),
  player2Inventory: createInitialInventory(),
  message: 'Welcome to Janken Wars! Press Start to begin.',
  
  startGame: () => {
    set({ 
      phase: GamePhase.SELECTING_CELL,
      message: "Player 1's turn. Choose a piece or use your special piece."
    });
    
    // Select random piece for first player
    get().getRandomPieceForCurrentPlayer();
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
      set({ message: `Please select a piece first.` });
      return;
    }
    
    // Check if move is valid
    if (!isValidMove(board, position, selectedPiece, currentPlayer)) {
      set({ message: `Invalid move. Try another position.` });
      return;
    }
    
    // Clone the board
    const newBoard = [...board.map(row => [...row])];
    
    // Create a new inventory based on current player
    const currentInventory = currentPlayer === Player.PLAYER1 
      ? { ...player1Inventory }
      : { ...player2Inventory };
    
    // Reduce the count of the selected piece
    currentInventory[selectedPiece]--;
    
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
        
      set({
        ...newState,
        result,
        phase: GamePhase.GAME_OVER,
        message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} wins!`
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
        message: "It's a draw!"
      });
      
      return;
    }
    
    // Switch player
    const nextPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
    
    set({
      ...newState,
      currentPlayer: nextPlayer,
      message: `${nextPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'}'s turn. Choose a piece or use your special piece.`
    });
    
    // Select random piece for next player
    setTimeout(() => get().getRandomPieceForCurrentPlayer(), 100);
  },
  
  selectSpecialPiece: () => {
    const { currentPlayer, player1Inventory, player2Inventory } = get();
    
    const currentInventory = currentPlayer === Player.PLAYER1 
      ? player1Inventory 
      : player2Inventory;
    
    // Check if the player has a special piece
    if (currentInventory[PieceType.SPECIAL] <= 0) {
      set({ message: "You've already used your special piece." });
      return;
    }
    
    // Set the selected piece to special
    set({ 
      selectedPiece: PieceType.SPECIAL,
      message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} selected Special piece. Place it on an empty square.`
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
            message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} has no pieces left. ${nextPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'}'s turn.`
          });
          
          // Select random piece for next player
          setTimeout(() => get().getRandomPieceForCurrentPlayer(), 100);
        } else {
          // If both players have no pieces, it's a draw
          set({
            result: GameResult.DRAW,
            phase: GamePhase.GAME_OVER,
            message: "It's a draw! Both players are out of pieces."
          });
        }
      }
      return;
    }
    
    set({ 
      selectedPiece: randomPiece,
      message: `${currentPlayer === Player.PLAYER1 ? 'Player 1' : 'Player 2'} received ${randomPiece.toLowerCase()}. Select a position to place it.`
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
      message: 'Welcome to Janken Wars! Press Start to begin.'
    });
  }
}));
