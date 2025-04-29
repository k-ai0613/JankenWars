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
    en: 'Online Multiplayer (Coming Soon)',
    ja: 'オンライン対戦（近日公開）'
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
    ja: 'ホームに戻る'
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
    ja: '入門'
  },
  'game.aiEasy': {
    en: 'Easy',
    ja: '簡単'
  },
  'game.aiNormal': {
    en: 'Normal',
    ja: '通常'
  },
  'game.aiMedium': {
    en: 'Medium',
    ja: '中級'
  },
  'game.aiHard': {
    en: 'Hard',
    ja: '高級'
  },
  'game.aiExpert': {
    en: 'Expert',
    ja: '上級者'
  },
  'message.aiSelectedPiece': {
    en: 'AI has selected a piece',
    ja: 'AIが駒を選択しました'
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
