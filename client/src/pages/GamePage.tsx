'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerInfo from '../components/game/PlayerInfo';
import GameBoard from '../components/game/GameBoard';
import { Player, PieceType, GamePhase, type PlayerInventory, Position } from '../lib/types';
import { useJankenGame } from '../lib/stores/useJankenGame';
import ErrorBoundary from '../components/ErrorBoundary';
import { soundService } from '../lib/soundService';
import { findBestPosition } from "../lib/aiUtils";
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

// 公開コンポーネント - サーバーコンポーネントとクライアントコンポーネントの橋渡し
function GamePage() {
  // サーバーサイドレンダリング時は何も表示しない
  if (typeof window === 'undefined') {
    return <div className="p-4 text-center">読み込み中...</div>;
  }
  
  // クライアントサイドでのみ適切なコンポーネントをレンダリング
  return <ClientOnlyGamePage />;
}

// クライアントサイドでのみ使用する内部コンポーネント
function ClientOnlyGamePage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  
  const {
    player1Inventory,
    player2Inventory,
    selectedPiece,
    setSelectedPiece,
    currentPlayer,
    phase,
    isAIEnabled,
    setIsAIEnabled,
    resetGame,
    makeAIPieceSelection,
    isAIThinking,
    startGame,
    player1Score,
    player2Score,
    placePiece,
  } = useJankenGame();

  // AIモードを有効にする
  React.useEffect(() => {
    // ローカルストレージからAIモード設定を読み込む
    const savedAIMode = localStorage.getItem('ai_mode');
    
    // 明示的に'true'の場合のみAIモードを有効にする
    const shouldEnableAI = savedAIMode === 'true';
    
    console.log('[GamePage] AI Mode Initialization:', {
      savedAIMode,
      shouldEnableAI,
      currentAIEnabled: isAIEnabled
    });
    
    setIsAIEnabled(shouldEnableAI);
    
    // ローカルストレージに設定を保存
    localStorage.setItem('ai_mode', String(shouldEnableAI));
    
    // 状態確認のための追加ログ
    setTimeout(() => {
      const state = useJankenGame.getState();
      console.log('[GamePage] Game state after AI mode setup:', {
        isAIEnabled: state.isAIEnabled,
        currentPlayer: state.currentPlayer,
        phase: state.phase,
        selectedPiece: state.selectedPiece,
        player1Inventory: state.player1Inventory,
        player2Inventory: state.player2Inventory
      });
    }, 100);
  }, [setIsAIEnabled, isAIEnabled]);

  // 0. 最初のユーザーインタラクションでオーディオをアンロック
  React.useEffect(() => {
    const handleFirstInteraction = () => {
      // console.log('[GamePage] First user interaction detected. Unlocking audio.');
      soundService.userHasInteracted();
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('touchstart', handleFirstInteraction, { capture: true });
    };

    // capture: true で、他のイベントリスナーより先に実行されるようにする
    window.addEventListener('click', handleFirstInteraction, { capture: true });
    window.addEventListener('touchstart', handleFirstInteraction, { capture: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('touchstart', handleFirstInteraction, { capture: true });
    };
  }, []); // 空の依存配列でマウント時に一度だけ実行

  // 1. マウント時に一度だけゲームをリセットして開始
  React.useEffect(() => {
    try {
      console.log('[GamePage] Component did mount. Initializing game.');
      
      // まずゲームをリセット
      resetGame();
      
      // 遅延を長くしてゲームの状態が安定するのを待つ
      setTimeout(() => {
        try {
          console.log('[GamePage] Starting game after reset.');
          startGame();
        } catch (error) {
          console.error('[GamePage] Error starting game:', error);
        }
      }, 200); // 遅延を200msに延長
    } catch (error) {
      console.error('[GamePage] Error during game initialization:', error);
    }
  }, []); // 空の依存配列でマウント時に一度だけ実行

  // 3. AIのターン処理は useJankenGame.ts の switchTurn で処理されるため、ここでは何もしない
  React.useEffect(() => {
    try {
      if (isAIEnabled && currentPlayer === Player.PLAYER2 && phase === GamePhase.SELECTING_CELL) {
        console.log('[GamePage] AI turn detected. Processing is handled in useJankenGame.ts switchTurn function.');
      }
    } catch (error) {
      console.error('[GamePage] Error in AI turn monitoring:', error);
    }
  }, [currentPlayer, phase, isAIEnabled]);
  
  // 5. アンマウント時のクリーンアップ
  React.useEffect(() => {
    return () => {
      console.log('[GamePage] Component will unmount. Performing cleanup.');
      // 念のためローカルストレージをクリア
      localStorage.removeItem('janken-game-storage');
      localStorage.removeItem('ai_mode');
      // ストアの状態をリセット (これにより、他の場所で不整合な状態が読み込まれるのを防ぐ)
      // resetGame(); // アンマウント時にresetGameを呼ぶと、HMR時に無限ループになる可能性があるので注意。ストア側で初期化されることを期待。
      // useJankenGame.persist.clearStorage(); // これもHMRと相性が悪い場合がある
      console.log('[GamePage] Cleanup on unmount finished.');
    };
  }, []); // resetGameを依存配列から削除、マウント時に一度だけ登録

  // 駒の種類に応じた表示名を返すヘルパー関数
  const getPieceDisplayName = (pieceType: PieceType) => {
    if (language === 'ja') {
      // 日本語表示の場合
      switch (pieceType) {
        case PieceType.ROCK: return 'グー';
        case PieceType.PAPER: return 'パー';
        case PieceType.SCISSORS: return 'チョキ';
        case PieceType.SPECIAL: return '特殊駒';
        default: return pieceType;
      }
    } else {
      // 英語表示の場合はそのまま
      return pieceType;
    }
  };

  const getBoardStateText = () => {
    console.log('[GamePage] getBoardStateText called:', {
      isAIEnabled,
      currentPlayer,
      selectedPiece,
      phase
    });
    
    if (!selectedPiece) {
      if (isAIEnabled) {
        if (currentPlayer === Player.PLAYER1) {
          return t("⭐ 【AI対戦モード】特殊駒を選択してください（基本駒は自動選択されます）");
        } else {
          return t("🤖 【AI対戦モード】AIが考え中...");
        }
      } else {
        return t("駒を選択してください");
      }
    } else {
      // 選択された駒の表示名を取得
      const pieceDisplayName = getPieceDisplayName(selectedPiece);
      
      if (isAIEnabled) {
        if (selectedPiece === PieceType.SPECIAL) {
          if (language === 'ja') {
            return `⭐ 特殊駒が選択されました！配置場所をクリックしてください`;
          } else {
            return t("⭐ Special piece selected! Click where to place it");
          }
        } else {
          if (language === 'ja') {
            return `🎯 基本駒（${pieceDisplayName}）が選択されました！配置場所をクリックしてください`;
          } else {
            return `🎯 ${selectedPiece} piece selected! Click where to place it`;
          }
        }
      } else {
        if (language === 'ja') {
          return `✅ ${pieceDisplayName}が選択されました！配置場所をクリックしてください`;
        } else {
          return `✅ ${selectedPiece} selected! Click where to place it`;
        }
      }
    }
  };

  const handleSelectPiece = (piece: PieceType | null) => {
    console.log('[GamePage] handleSelectPiece:', piece);
    
    // 特殊駒以外の手動選択を無効化（AIモードのみ適用）
    if (isAIEnabled && piece !== null && piece !== PieceType.SPECIAL) {
      console.log('[GamePage] Manual selection blocked for basic pieces in AI mode. Only SPECIAL piece can be manually selected.');
      return;
    }
    
    // AIモードでのプレイヤー1（人間）の特殊駒選択処理
    if (isAIEnabled && currentPlayer === Player.PLAYER1) {
      // 現在の選択状態を確認
      if (selectedPiece === piece) {
        setSelectedPiece(null);
        return;
      }
      
      // 特殊駒のインベントリチェック
      if (player1Inventory && piece === PieceType.SPECIAL) {
        const availableCount = player1Inventory[PieceType.SPECIAL];
        if (availableCount <= 0) {
          console.log('[GamePage] No special pieces available');
          return;
        }
      }
      
      setSelectedPiece(piece);
      return;
    }
    
    // AIモードのプレイヤー2ターン中は選択不可
    if (isAIEnabled && currentPlayer === Player.PLAYER2) {
      console.log('[GamePage] Cannot select piece during AI turn');
      return;
    } 
    
    // ローカルモードの処理（通常駒と特殊駒両方の選択を許可）
    if (!isAIEnabled) {
      // 現在のプレイヤーのインベントリを取得
      const playerInventory = currentPlayer === Player.PLAYER1 ? player1Inventory : player2Inventory;
      
      // 駒のインベントリチェック（特殊駒も通常駒も共通処理）
      if (playerInventory && piece !== null) {
        const availableCount = playerInventory[piece];
        if (availableCount <= 0) {
          console.log(`[GamePage] No ${piece} pieces available`);
          return;
        }
        
        // 選択・選択解除の切り替え
        if (selectedPiece === piece) {
          setSelectedPiece(null);
        } else {
          setSelectedPiece(piece);
        }
        
        console.log(`[GamePage] Local mode - ${piece} piece ${selectedPiece === piece ? 'deselected' : 'selected'}`);
      }
    }
  };

  const handleResetGame = () => {
    console.log('[GamePage] User clicked reset game button.');
    soundService.play('success'); // リセットボタンクリック時に音声を再生
    resetGame();
    
    // リセット後にゲームを再開（遅延を延長してより安定にする）
    setTimeout(() => {
      console.log('[GamePage] Starting game after reset.');
      startGame();
    }, 200); // 遅延を200msに延長
  };
  
  const handleGoHome = () => {
    console.log('[GamePage] User clicked go home. Clearing storage and navigating.');
    localStorage.removeItem('janken-game-storage');
    localStorage.removeItem('ai_mode');
    // resetGame(); // navigate前にresetGameを呼ぶと遷移が遅れる可能性があるので、ストアは遷移先で初期化されることを期待
    navigate('/');
  };

  if (!player1Inventory || !player2Inventory) {
    // この状態は通常、最初のresetGameが完了するまでの短時間のみのはず
    return (
      <div className="p-4 text-center">
        <p>{t("ゲームデータを準備中です...")}</p>
      </div>
    );
  }

  console.log('[GamePage] Rendering with currentPlayer=' + currentPlayer);

  return (
    <ErrorBoundary key="game-page-error-boundary">
      <div className="flex flex-col h-full md:h-screen py-1 px-0.5 md:py-2 md:px-2">
        <div className="flex flex-col md:flex-row w-full h-full md:space-x-1">
          {/* 左側の情報パネル */}
          <div className="flex flex-col w-full md:w-1/6 space-y-1 p-1 bg-gray-100 rounded shadow-sm">
            <div className="text-center mb-1">
              <h1 className="text-lg font-bold mb-0.5">JankenWars</h1>
              <p className="text-[8px] text-gray-600">
                {isAIEnabled ? t('AIモード') : t('ローカルゲームモード')}
              </p>
              <div className={cn(
                "text-[8px] mt-0.5 p-0.5 rounded font-semibold",
                !selectedPiece ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-green-100 border-green-400 text-green-800"
              )}>
                {getBoardStateText()}
              </div>
            </div>
            
            {/* プレイヤー情報を横並びに */}
            <div className="flex flex-row space-x-1">
              {/* プレイヤー1情報 */}
              <div className="w-1/2">
                <PlayerInfo 
                  player={Player.PLAYER1} 
                  isCurrentPlayer={currentPlayer === Player.PLAYER1}
                  inventory={player1Inventory}
                  onSelectPiece={handleSelectPiece}
                  selectedPiece={currentPlayer === Player.PLAYER1 ? selectedPiece : null}
                  isAI={isAIEnabled}
                />
              </div>
              
              {/* プレイヤー2情報 */}
              <div className="w-1/2">
                <PlayerInfo 
                  player={Player.PLAYER2} 
                  isCurrentPlayer={currentPlayer === Player.PLAYER2}
                  inventory={player2Inventory}
                  onSelectPiece={handleSelectPiece}
                  selectedPiece={currentPlayer === Player.PLAYER2 ? selectedPiece : null}
                  isAI={isAIEnabled}
                />
              </div>
            </div>
            
            {/* ゲーム操作ボタン */}
            <div className="grid grid-cols-2 gap-0.5 mt-1">
              <button
                onClick={handleResetGame}
                className="px-1 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                {t('game.reset')}
              </button>
              <button
                onClick={handleGoHome}
                className="px-1 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                {t('game.backToHome')}
              </button>
            </div>
            
            {/* 言語切り替えスイッチ */}
            <div className="flex items-center justify-center space-x-2 mt-1 bg-white/80 px-2 py-1 rounded-md border border-gray-300 shadow-sm">
              <Label htmlFor="game-language-toggle" className="text-xs font-medium text-gray-700">
                English
              </Label>
              <Switch
                id="game-language-toggle"
                checked={language === 'ja'} // 日本語の場合にチェック状態
                onCheckedChange={(checked) => setLanguage(checked ? 'ja' : 'en')}
                aria-label="Toggle language"
              />
              <Label htmlFor="game-language-toggle" className="text-xs font-medium text-gray-700">
                日本語
              </Label>
            </div>
            
            {/* AIの思考中表示 */}
            {isAIThinking && (
              <div className="mt-1 p-0.5 bg-yellow-100 rounded text-center text-[8px] animate-pulse">
                {t('message.aiThinking')}
              </div>
            )}
          </div>
          
          {/* 右側のゲームボード */}
          <div className="flex-grow mt-1 md:mt-0">
            <GameBoard />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default GamePage;
