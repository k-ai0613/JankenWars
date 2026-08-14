import { create } from 'zustand';

type Language = 'en' | 'ja';

interface LanguageState {
  language: Language;
  translations: Record<string, Record<Language, string>>;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// 翻訳データ
const defaultTranslations: Record<string, Record<Language, string>> = {
  // ホーム画面
  'home.title': {
    en: 'Janken Wars',
    ja: 'じゃんけんウォーズ'
  },
  'home.description': {
    en: 'A strategic Rock-Paper-Scissors board game where players battle on a 6x6 grid. Place your pieces to create a line of 5 and claim victory!',
    ja: '6x6のグリッドで対戦する戦略的じゃんけんボードゲーム。駒を配置して5つ並べて勝利を収めましょう！'
  },
  'home.playLocal': {
    en: 'Play Local Game',
    ja: 'ローカルゲームをプレイ'
  },
  'home.playAI': {
    en: 'Play vs AI',
    ja: 'AIと対戦'
  },
  'home.playOnline': {
    en: 'Online Multiplayer',
    ja: 'オンライン対戦'
  },
  'home.rules': {
    en: 'Game Rules',
    ja: 'ゲームルール'
  },
  'home.objective': {
    en: 'Objective',
    ja: '目的'
  },
  'home.objective.description': {
    en: 'Be the first to place 5 of your pieces in a row (horizontally, vertically, or diagonally) on the 6x6 grid.',
    ja: '6x6のグリッドで自分の駒を5つ一列に並べる（横、縦、斜め）最初のプレイヤーになりましょう。'
  },
  'home.gameplay': {
    en: 'Gameplay',
    ja: 'ゲームプレイ'
  },
  'home.jankenRules': {
    en: 'Janken Rules',
    ja: 'じゃんけんルール'
  },
  'home.specialPiece': {
    en: 'Special Piece',
    ja: '特殊駒'
  },
  'home.drawCondition': {
    en: 'Draw Condition',
    ja: '引き分け条件'
  },
  
  // ゲーム画面
  'game.title': {
    en: 'Janken Wars',
    ja: 'じゃんけんウォーズ'
  },
  'game.startGame': {
    en: 'Start Game',
    ja: 'ゲーム開始'
  },
  'game.useSpecialPiece': {
    en: 'Use Special Piece',
    ja: '特殊駒を使用'
  },
  // Removed 'Get Random Piece' button
  /* 'game.getRandomPiece': {
    en: 'Get Random Piece',
    ja: 'ランダムな駒を取得'
  }, */
  'game.playAgain': {
    en: 'Play Again',
    ja: 'もう一度プレイ'
  },
  'game.reset': {
    en: 'Reset Game',
    ja: 'リセット'
  },
  'game.mute': {
    en: 'Mute 🔊',
    ja: 'ミュート 🔊'
  },
  'game.unmute': {
    en: 'Unmute 🔇',
    ja: 'ミュート解除 🔇'
  },
  'game.backToHome': {
    en: 'Back to Home',
    ja: 'ホームへ'
  },
  
  // AI関連
  'game.aiControls': {
    en: 'AI Controls',
    ja: 'AI設定'
  },
  'game.aiEnabled': {
    en: 'AI Enabled',
    ja: 'AI有効'
  },
  'game.aiDisabled': {
    en: 'AI Disabled',
    ja: 'AI無効'
  },
  'game.aiThinking': {
    en: 'Thinking...',
    ja: '考え中...'
  },
  'game.aiDifficulty': {
    en: 'AI Difficulty',
    ja: 'AI難易度'
  },
  'game.aiBeginner': {
    en: 'Beginner',
    ja: '初心者'
  },
  'game.aiEasy': {
    en: 'Normal',
    ja: '普通'
  },
  'game.aiNormal': {
    en: 'Hard',
    ja: '難しい'
  },
  'game.aiMedium': {
    en: 'Advanced',
    ja: '上級'
  },
  'game.aiHard': {
    en: 'Ultimate',
    ja: '最強'
  },
  'game.aiExpert': {
    en: 'Godlike',
    ja: '神'
  },
  'message.aiSelectedPiece': {
    en: 'AI has selected a piece',
    ja: 'AIが駒を選択しました'
  },
  'message.aiDecidingPlacement': {
    en: 'AI is deciding where to place the piece...',
    ja: 'AIが駒の配置場所を考えています...'
  },
  'game.player1': {
    en: 'Player 1',
    ja: 'プレイヤー1'
  },
  'game.player2': {
    en: 'Player 2',
    ja: 'プレイヤー2'
  },
  'game.currentTurn': {
    en: '(Current Turn)',
    ja: '（現在のターン）'
  },
  'game.player1Turn': {
    en: 'Player 1 Turn',
    ja: 'プレイヤー1のターン'
  },
  'game.player2Turn': {
    en: 'Player 2 Turn',
    ja: 'プレイヤー2のターン'
  },
  
  // プレイヤーインベントリ
  'pieces.rock': {
    en: 'Rock',
    ja: 'グー'
  },
  'pieces.paper': {
    en: 'Paper',
    ja: 'パー'
  },
  'pieces.scissors': {
    en: 'Scissors',
    ja: 'チョキ'
  },
  'pieces.special': {
    en: 'Special',
    ja: '特殊'
  },
  
  // ゲームメッセージ
  'message.welcome': {
    en: 'Welcome to Janken Wars! Press Start to begin.',
    ja: 'じゃんけんウォーズへようこそ！スタートを押して始めましょう。'
  },
  'message.player1Turn': {
    en: "Player 1's turn. Choose a piece or use your special piece.",
    ja: 'プレイヤー1のターンです。駒を選ぶか、特殊駒を使ってください。'
  },
  'message.player2Turn': {
    en: "Player 2's turn. Choose a piece or use your special piece.",
    ja: 'プレイヤー2のターンです。駒を選ぶか、特殊駒を使ってください。'
  },
  'message.player1Win': {
    en: 'Player 1 wins!',
    ja: 'プレイヤー1の勝利です！'
  },
  'message.player2Win': {
    en: 'Player 2 wins!',
    ja: 'プレイヤー2の勝利です！'
  },
  'message.draw': {
    en: "It's a draw!",
    ja: '引き分けです！'
  },
  'message.selectPieceFirst': {
    en: 'Please tap on any square.',
    ja: '任意のマスの箇所をタップしてください'
  },
  'message.invalidMove': {
    en: 'Invalid move. Try another position.',
    ja: '無効な移動です。別の位置を試してください。'
  },
  'message.rockVsScissors': {
    en: 'Rock crushes Scissors! You captured the square.',
    ja: 'グーはチョキに勝ちました！マスを獲得しました。'
  },
  'message.scissorsVsPaper': {
    en: 'Scissors cut Paper! You captured the square.',
    ja: 'チョキはパーに勝ちました！マスを獲得しました。'
  },
  'message.paperVsRock': {
    en: 'Paper covers Rock! You captured the square.',
    ja: 'パーはグーに勝ちました！マスを獲得しました。'
  },
  'message.specialPieceUsed': {
    en: "You've already used your special piece.",
    ja: '特殊駒はすでに使用済みです。'
  },
  'message.player1SelectedSpecial': {
    en: 'Player 1 selected Special piece. Place it on an empty square.',
    ja: 'プレイヤー1が特殊駒を選択しました。空いているマスに配置してください。'
  },
  'message.player2SelectedSpecial': {
    en: 'Player 2 selected Special piece. Place it on an empty square.',
    ja: 'プレイヤー2が特殊駒を選択しました。空いているマスに配置してください。'
  },
  'message.player1ReceivedPiece.rock': {
    en: 'Player 1 received rock. Select a position to place it.',
    ja: 'プレイヤー1がグーを受け取りました。配置する位置を選んでください。'
  },
  'message.player1ReceivedPiece.paper': {
    en: 'Player 1 received paper. Select a position to place it.',
    ja: 'プレイヤー1がパーを受け取りました。配置する位置を選んでください。'
  },
  'message.player1ReceivedPiece.scissors': {
    en: 'Player 1 received scissors. Select a position to place it.',
    ja: 'プレイヤー1がチョキを受け取りました。配置する位置を選んでください。'
  },
  'message.player2ReceivedPiece.rock': {
    en: 'Player 2 received rock. Select a position to place it.',
    ja: 'プレイヤー2がグーを受け取りました。配置する位置を選んでください。'
  },
  'message.player2ReceivedPiece.paper': {
    en: 'Player 2 received paper. Select a position to place it.',
    ja: 'プレイヤー2がパーを受け取りました。配置する位置を選んでください。'
  },
  'message.player2ReceivedPiece.scissors': {
    en: 'Player 2 received scissors. Select a position to place it.',
    ja: 'プレイヤー2がチョキを受け取りました。配置する位置を選んでください。'
  },
  
  // オンライン対戦
  'online.connect': {
    en: 'Connect to Server',
    ja: 'サーバーに接続'
  },
  'online.username': {
    en: 'Username',
    ja: 'ユーザー名'
  },
  'online.enterUsername': {
    en: 'Enter your username',
    ja: 'ユーザー名を入力してください'
  },
  'online.lobby': {
    en: 'Game Lobby',
    ja: 'ゲームロビー'
  },
  'online.roomCode': {
    en: 'Room Code',
    ja: 'ルームコード'
  },
  'online.enterRoomCode': {
    en: 'Enter room code',
    ja: 'ルームコードを入力'
  },
  'online.join': {
    en: 'Join',
    ja: '参加'
  },
  'online.createRoom': {
    en: 'Create Room',
    ja: 'ルーム作成'
  },
  'online.joinRoom': {
    en: 'Join Room',
    ja: 'ルームに参加'
  },
  'online.quickMatch': {
    en: 'Quick Match',
    ja: 'クイックマッチ'
  },
  'online.waitingRoom': {
    en: 'Waiting Room',
    ja: '待機ルーム'
  },
  'online.shareCode': {
    en: 'Share this code with a friend to join:',
    ja: '友達と共有するコード:'
  },
  'online.players': {
    en: 'Players',
    ja: 'プレイヤー'
  },
  'online.you': {
    en: 'You',
    ja: 'あなた'
  },
  'online.player': {
    en: 'Player',
    ja: 'プレイヤー'
  },
  'online.ready': {
    en: 'Ready',
    ja: '準備完了'
  },
  'online.notReady': {
    en: 'Not Ready',
    ja: '準備中'
  },
  'online.spectating': {
    en: 'You are spectating this game',
    ja: 'あなたは観戦者です'
  },
  'online.playerDisconnectedWaiting': {
    en: 'disconnected. Waiting for reconnection...',
    ja: 'が切断しました。再接続を待っています...'
  },
  'online.findingOpponent': {
    en: 'Finding Opponent',
    ja: '対戦相手を探しています'
  },
  'online.searchingForPlayers': {
    en: 'Searching for players...',
    ja: 'プレイヤーを探しています...'
  },
  'online.cancel': {
    en: 'Cancel',
    ja: 'キャンセル'
  },
  'online.onlineMatch': {
    en: 'Online Match',
    ja: 'オンライン対戦'
  },
  'back': {
    en: 'Back',
    ja: '戻る'
  },
  'yourTurn': {
    en: 'Your Turn',
    ja: 'あなたの番です'
  },
  'message.currentTurn': {
    en: 'Current Turn',
    ja: '現在の番です'
  },
  'waiting': {
    en: 'Waiting',
    ja: '待機中'
  },
  'selectPiece': {
    en: 'Select a piece',
    ja: '駒を選択'
  },
  'playAgain': {
    en: 'Play Again',
    ja: 'もう一度プレイ'
  },
  'online.waitingForAnotherPlayer': {
    en: 'Waiting for another player...',
    ja: '対戦相手をオンラインで待機中'
  },
  'online.gameStartingSoon': {
    en: 'Game starting soon...',
    ja: 'ゲームがすぐに始まります...'
  },
  'message.aiThinking': {
    en: 'AI is thinking...',
    ja: 'AIが考え中...'
  },
  'message.aiSelecting': {
    en: 'AI is selecting a piece...',
    ja: 'AIが駒を選択中...'
  },
  'message.aiPlacing': {
    en: 'AI is placing a piece...',
    ja: 'AIが駒を配置中...'
  },
  'message.cannotCapture': {
    en: 'Cannot capture! Your piece does not beat the opponent piece.',
    ja: '駒を取れません！あなたの駒は相手の駒に勝てません。'
  },
  
  // GamePage用の追加翻訳
  'AIモード': {
    en: 'AI Mode',
    ja: 'AIモード'
  },
  'ローカルゲームモード': {
    en: 'Local Game Mode',
    ja: 'ローカルゲームモード'
  },
  '⭐ 【AI対戦モード】特殊駒を選択してください（基本駒は自動選択されます）': {
    en: '⭐ [AI Mode] Select a special piece (basic pieces are auto-selected)',
    ja: '⭐ 【AI対戦モード】特殊駒を選択してください（基本駒は自動選択されます）'
  },
  '🤖 【AI対戦モード】AIが考え中...': {
    en: '🤖 [AI Mode] AI is thinking...',
    ja: '🤖 【AI対戦モード】AIが考え中...'
  },
  '駒を選択してください': {
    en: 'Please select a piece',
    ja: '駒を選択してください'
  },
  '⭐ 特殊駒（SPECIAL）が選択されました！配置場所をクリックしてください': {
    en: '⭐ Special piece selected! Click where to place it',
    ja: '⭐ 特殊駒（SPECIAL）が選択されました！配置場所をクリックしてください'
  },
  '🎯 基本駒（ROCK）が選択されました！配置場所をクリックしてください': {
    en: '🎯 Rock piece selected! Click where to place it',
    ja: '🎯 基本駒（ROCK）が選択されました！配置場所をクリックしてください'
  },
  '🎯 基本駒（PAPER）が選択されました！配置場所をクリックしてください': {
    en: '🎯 Paper piece selected! Click where to place it',
    ja: '🎯 基本駒（PAPER）が選択されました！配置場所をクリックしてください'
  },
  '🎯 基本駒（SCISSORS）が選択されました！配置場所をクリックしてください': {
    en: '🎯 Scissors piece selected! Click where to place it',
    ja: '🎯 基本駒（SCISSORS）が選択されました！配置場所をクリックしてください'
  },
  '✅ ROCKが選択されました！配置場所をクリックしてください': {
    en: '✅ Rock selected! Click where to place it',
    ja: '✅ ROCKが選択されました！配置場所をクリックしてください'
  },
  '✅ PAPERが選択されました！配置場所をクリックしてください': {
    en: '✅ Paper selected! Click where to place it',
    ja: '✅ PAPERが選択されました！配置場所をクリックしてください'
  },
  '✅ SCISSORSが選択されました！配置場所をクリックしてください': {
    en: '✅ Scissors selected! Click where to place it',
    ja: '✅ SCISSORSが選択されました！配置場所をクリックしてください'
  },
  '✅ SPECIALが選択されました！配置場所をクリックしてください': {
    en: '✅ Special piece selected! Click where to place it',
    ja: '✅ SPECIALが選択されました！配置場所をクリックしてください'
  },
  'ゲームデータを準備中です...': {
    en: 'Preparing game data...',
    ja: 'ゲームデータを準備中です...'
  },
  
  // 難易度関連
  'difficulty.beginner': {
    en: 'Beginner',
    ja: '初心者'
  },
  'difficulty.easy': {
    en: 'Easy',
    ja: '簡単'
  },
  'difficulty.normal': {
    en: 'Normal',
    ja: '普通'
  },
  'difficulty.medium': {
    en: 'Medium',
    ja: '中級'
  },
  'difficulty.hard': {
    en: 'Hard',
    ja: '難しい'
  },
  'difficulty.expert': {
    en: 'Expert',
    ja: '達人'
  },
  
  // 言語切り替え
  'toggleLanguage': {
    en: 'Switch to Japanese',
    ja: '英語に切り替え'
  }
};

export const useLanguage = create<LanguageState>((set, get) => ({
  language: 'en', // デフォルト言語
  translations: defaultTranslations,

  setLanguage: (language: Language) => {
    set({ language });
  },

  t: (key: string) => {
    const { language, translations } = get();
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key; // フォールバック: キーが見つからない場合はキー自体を返す
  }
}));
