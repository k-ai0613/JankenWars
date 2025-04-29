// テスト用の新しい関数定義 - 後でメインファイルに統合

// selectCellForPlayer関数の修正版 - おーなー文字列ベースの実装

export const selectCellForPlayer = (position: Position, player: Player | string, piece: PieceType) => {
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
};