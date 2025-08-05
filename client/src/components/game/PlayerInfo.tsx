import React, { useMemo, useCallback } from 'react';
import { GamePiece } from './GamePiece';
import { PieceType, Player, PlayerInventory } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useJankenGame } from '../../lib/stores/useJankenGame';

// ★オフライン用のProps
export interface PlayerInfoProps {
  player: Player;
  inventory: PlayerInventory;
  isCurrentPlayer: boolean;
  selectedPiece: PieceType | null;
  onSelectPiece: (piece: PieceType | null) => void;
  isAI?: boolean;
}

// 駒タイプの固定配列（安定したマッピング用）
const PIECE_TYPES_ORDER = [PieceType.ROCK, PieceType.PAPER, PieceType.SCISSORS, PieceType.SPECIAL] as const;

// 日本語の駒名マッピング
const JP_PIECE_NAMES = {
  [PieceType.ROCK]: 'グー',
  [PieceType.PAPER]: 'パー',
  [PieceType.SCISSORS]: 'チョキ',
  [PieceType.SPECIAL]: '特殊駒'
};

// ★メモ化されたPlayerInfoコンポーネント
const PlayerInfo: React.FC<PlayerInfoProps> = React.memo(({
  player,
  inventory,
  isCurrentPlayer,
  selectedPiece,
  onSelectPiece,
  isAI = false
}) => {
  const { t, language } = useLanguage();
  const { isAIThinking } = useJankenGame();

  // 駒タイプの表示名を取得する関数
  const getPieceDisplayName = useCallback((pieceType: PieceType) => {
    if (language === 'ja') {
      return JP_PIECE_NAMES[pieceType] || pieceType;
    }
    return pieceType;
  }, [language]);

  // プレイヤースタイルをメモ化（安定化）
  const playerStyles = useMemo(() => {
    const isAIPlayer = player === Player.PLAYER2 && isAI;
    const playerName = player === Player.PLAYER1 ? t('player1') : (isAIPlayer ? t('aiPlayer') : t('player2'));
    const playerColor = player === Player.PLAYER1 ? 'text-blue-700' : 'text-red-700';
    const bgGradient = player === Player.PLAYER1 ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-gradient-to-r from-red-50 to-red-100';
    const borderColor = player === Player.PLAYER1 ? 'border-blue-400' : 'border-red-400';
    const glowColor = player === Player.PLAYER1 ? 'shadow-blue-400/50' : 'shadow-red-400/50';
    
    return { playerName, playerColor, bgGradient, borderColor, glowColor };
  }, [player, isAI, t]);

  // 状態メッセージをメモ化（簡素化）
  const statusMessage = useMemo(() => {
    if (!isCurrentPlayer) {
      return { text: '', className: 'opacity-0' };
    }

    if (isAI && player === Player.PLAYER1) {
      if (!selectedPiece) {
        return { 
          text: '⭐ 特殊駒を選択してください', 
          className: 'bg-blue-50 border-blue-300 text-blue-700' 
        };
      } else if (selectedPiece === PieceType.SPECIAL) {
        return { 
          text: `✅ ${getPieceDisplayName(selectedPiece)}選択済み`, 
          className: 'bg-green-50 border-green-300 text-green-700' 
        };
      } else {
        return { 
          text: `🎯 ${getPieceDisplayName(selectedPiece)}選択済み（配置場所をクリック）`, 
          className: 'bg-green-50 border-green-300 text-green-700' 
        };
      }
    } else if (isAI && player === Player.PLAYER2) {
      return { 
        text: '🤖 AI考慮中...', 
        className: 'bg-purple-50 border-purple-300 text-purple-700 animate-pulse' 
      };
    } else {
      // ローカルモードでは何も表示しない
      return { text: '', className: 'opacity-0' };
    }
  }, [isCurrentPlayer, isAI, player, selectedPiece, getPieceDisplayName]);

  // 駒選択ハンドラーをメモ化
  const handlePieceSelect = useCallback((pieceType: PieceType) => {
    // 現在のプレイヤーのターンでなければ選択不可
    if (!isCurrentPlayer) {
      return;
    }
    
    // AIモードでプレイヤー2（AI）の場合は選択不可
    if (isAI && player === Player.PLAYER2) {
      return;
    }
    
    // AIモードでは特殊駒以外は手動選択不可
    if (isAI && pieceType !== PieceType.SPECIAL) {
      console.log(`[PlayerInfo] Manual selection blocked for ${pieceType} in AI mode. Only SPECIAL piece can be manually selected.`);
      return;
    }
    
    // インベントリチェック
    const currentCount = inventory[pieceType];
    if (currentCount <= 0) {
      return;
    }

    onSelectPiece(selectedPiece === pieceType ? null : pieceType);
  }, [isCurrentPlayer, isAI, player, inventory, selectedPiece, onSelectPiece]);

  // 早期リターン：インベントリが無効
  if (!inventory) {
    return (
      <div className="p-2 rounded-xl bg-gray-100 border border-gray-300">
        <h3 className="text-sm font-semibold text-gray-600">
          {playerStyles.playerName}
        </h3>
        <p className="text-xs text-red-500">インベントリがありません</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-0.5 rounded-lg shadow-sm border transition-all duration-300 h-full',
        playerStyles.bgGradient,
        playerStyles.borderColor,
        isCurrentPlayer && `ring-1 ${player === Player.PLAYER1 ? 'ring-blue-500' : 'ring-red-500'} scale-101`
      )}
    >
      {/* プレイヤー名 - より目立つスタイルに */}
      <div className={cn(
        'rounded-t py-0.5 px-1 mb-0.5 text-center',
        player === Player.PLAYER1 ? 'bg-blue-200' : 'bg-red-200'
      )}>
        <h3 className={cn('text-xs font-bold', playerStyles.playerColor)}>
          {playerStyles.playerName}
          {isAI && player === Player.PLAYER2 && ' (AI)'}
        </h3>
      </div>

      {/* ステータスメッセージ - 高さを固定して安定させる */}
      <div className={cn(
        'mb-0.5 py-0.5 px-1 rounded border text-center h-4 flex items-center justify-center',
        statusMessage.className
      )}>
        <p className="text-[9px] font-bold">
          {statusMessage.text || '\u00A0'}
        </p>
      </div>

      {/* 駒一覧（簡素化） */}
      <div className="grid grid-cols-2 gap-0.5 px-0.5">
        {PIECE_TYPES_ORDER.map((pieceType) => {
          const count = inventory[pieceType];
          const isSelected = isCurrentPlayer && selectedPiece === pieceType;
          
          // 駒の選択可能条件
          // AIモード：プレイヤー1は特殊駒のみ選択可能、プレイヤー2（AI）は選択不可
          // ローカルモード：両プレイヤーとも全ての駒を選択可能
          const canSelect = isCurrentPlayer && count > 0 && 
                            ((!isAI) || (isAI && pieceType === PieceType.SPECIAL && player === Player.PLAYER1));
          
          // 基本駒（グー・チョキ・パー）は選択された駒として表示のみ
          const isAutoSelected = isCurrentPlayer && selectedPiece === pieceType && isAI && pieceType !== PieceType.SPECIAL;
          
          // 駒の表示名を取得
          const pieceDisplayName = getPieceDisplayName(pieceType);
          
          return (
            <button
              key={`${player}-${pieceType}`}
              disabled={!canSelect}
              className={cn(
                'flex items-center justify-between py-0.5 px-1 rounded border transition-all duration-200',
                'bg-white border-gray-300',
                // 特殊駒のみホバー効果を適用
                canSelect && 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
                // 手動選択された特殊駒 または 選択された基本駒のハイライト
                (isSelected || isAutoSelected) && 'border-blue-500 bg-blue-100 scale-105',
                // 基本駒は選択不可だが、選択時は視覚的に区別
                pieceType !== PieceType.SPECIAL && 'cursor-not-allowed',
                // 選択された基本駒は薄いグレーのボーダー
                isAutoSelected && 'border-green-400 bg-green-50',
                !canSelect && !isAutoSelected && 'opacity-60'
              )}
              onClick={() => handlePieceSelect(pieceType)}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center">
                  <GamePiece 
                    type={pieceType} 
                    owner={player} 
                    size="sm" 
                    selected={isSelected || isAutoSelected}
                  />
                </div>
                <div className="ml-1">
                  <div className="text-[10px] font-medium text-gray-700">
                    {language === 'ja' ? pieceDisplayName : t(`pieces.${pieceType.toLowerCase()}`)}
                    {pieceType === PieceType.SPECIAL && (
                      <span className="text-[8px] text-blue-500 ml-0.5">
                        {language === 'ja' ? '(手動)' : '(manual)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-gray-800">
                {count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

PlayerInfo.displayName = 'PlayerInfo';

export default PlayerInfo;

