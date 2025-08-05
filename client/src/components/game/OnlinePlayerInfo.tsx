import React from 'react';
import { GamePiece } from './GamePiece';
import { PieceType, Player, PlayerInventory } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useOnlineGame } from '../../lib/stores/useOnlineGame';

// オンライン対戦用にPropsを更新
interface OnlinePlayerInfoProps {
  playerNumber: 1 | 2; // プレイヤー番号 (1 or 2)
  username: string;      // プレイヤーのユーザー名
  inventory: PlayerInventory; // プレイヤーの駒インベントリ
  isCurrentPlayer: boolean;   // このプレイヤーが現在のターンか
  isLocalPlayer: boolean;     // このプレイヤーがローカルプレイヤーか
  aiSelectedPiece?: PieceType | null; // Optional, as it might not always be relevant
  selectedPiece?: PieceType | null;  // Optional
  isReady?: boolean; // ★ isReady プロパティを追加 (オプショナル)
  gamePhase?: string; // ★ gamePhase プロパティを追加 (オプショナル)
}

const OnlinePlayerInfo: React.FC<OnlinePlayerInfoProps> = ({
  playerNumber,
  username,
  inventory,
  isCurrentPlayer,
  isLocalPlayer,
  aiSelectedPiece,
  selectedPiece,
  isReady,
  gamePhase,
}) => {
  const { t } = useLanguage();
  const playerEnum = playerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2;
  const playerColor = playerNumber === 1 ? 'text-blue-700' : 'text-red-700';

  // ローカル画面に合わせた背景・ボーダースタイル
  const bgGradient = playerNumber === 1
    ? 'bg-gradient-to-br from-blue-100 to-blue-200'
    : 'bg-gradient-to-br from-red-100 to-red-200';

  const borderColor = playerNumber === 1
    ? 'border-blue-400'
    : 'border-red-400';

  const glowColor = playerNumber === 1
    ? 'shadow-blue-400/50'
    : 'shadow-red-400/50';

  // ★ 現在選択されている駒を決定
  const currentlySelectedPiece = isCurrentPlayer && isLocalPlayer
    ? (selectedPiece === PieceType.SPECIAL ? PieceType.SPECIAL : aiSelectedPiece)
    : null;

  // ★ ダークテーマに合わせたスタイル調整
  const baseBgColor = isLocalPlayer ? "bg-slate-700/70" : "bg-slate-800/80";
  const currentTurnRing = playerNumber === 1 ? "ring-blue-500" : "ring-red-500"; // ゲーム中の手番リング
  const textColor = isLocalPlayer ? "text-sky-300" : "text-slate-200";
  const pieceCountColor = "text-slate-300";
  const pieceNameColor = "text-slate-400 text-xs";

  // 駒の表示順序を定義 (例)
  const pieceOrder: PieceType[] = [PieceType.ROCK, PieceType.PAPER, PieceType.SCISSORS, PieceType.SPECIAL];

  // ★★★ デバッグログ追加 (Props確認) ★★★
  console.log(`[OnlinePlayerInfo P${playerNumber}] Rendering. Props received:`, { username, isCurrentPlayer, isLocalPlayer, aiSelectedPiece, selectedPiece });

  return (
    <div className={cn(
      `p-3 md:p-4 rounded-xl shadow-lg border-2`,
      baseBgColor,
      borderColor,
      "transition-all duration-300",
      // ゲーム中で、かつ自分のターンの場合にリングを表示 (待合室ではisReadyで状態表示)
      isCurrentPlayer && gamePhase !== 'READY' && `ring-4 ${currentTurnRing} scale-105` 
    )}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={cn(
          "text-lg font-semibold flex items-center gap-2",
          textColor
        )}>
          {username} {isLocalPlayer && <span className="text-xs font-normal text-slate-400">({t('online.you')})</span>}
        </h3>
        {/* isReady が undefined でない場合 (待合室など) に準備状態を表示 */} 
        {isReady !== undefined && (
          <span className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full shadow",
            isReady ? "bg-green-500/80 text-green-100" : "bg-slate-600 text-slate-300"
          )}>
            {isReady ? t('online.ready') : t('online.notReady')}
          </span>
        )}
        {/* ゲーム中の手番表示 (isReadyがない場合、つまりゲーム画面での呼び出しを想定) */} 
        {isCurrentPlayer && isReady === undefined && gamePhase !== 'READY' && (
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full shadow",
            playerNumber === 1 ? "bg-blue-600 text-white" : "bg-red-600 text-white",
          )}>
            {t('yourTurn')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 md:gap-2 justify-items-center">
        {pieceOrder
          .filter(p => p !== PieceType.EMPTY)
          .map((piece) => {
            const count = inventory[piece as Exclude<PieceType, PieceType.EMPTY>];
            const isDisabled = count <= 0;
            
            // ★ ハイライト条件を判定（ローカルとリモートで統一）
            let isSelectedForHighlight = false;
            
            // 現在のターンのプレイヤーの場合
            if (isCurrentPlayer) {
              // 特殊駒が選択されている場合
              if (selectedPiece === PieceType.SPECIAL) {
                isSelectedForHighlight = piece === PieceType.SPECIAL;
              } 
              // AI選択の通常駒の場合（selectedPieceとaiSelectedPieceは同期される）
              else if (aiSelectedPiece !== null) {
                isSelectedForHighlight = piece === aiSelectedPiece;
              }
            }

            // ★★★ デバッグログ追加 (ハイライト判定結果) ★★★
            console.log(`[OnlinePlayerInfo P${playerNumber}] Checking piece ${piece}: isSelectedForHighlight = ${isSelectedForHighlight} (Current: ${isCurrentPlayer}, Local: ${isLocalPlayer}, aiSelected: ${aiSelectedPiece}, selected: ${selectedPiece})`);

            return (
              <div
                key={piece}
                className={cn(
                  'flex flex-col items-center p-1 rounded-md transition-all w-full',
                  isDisabled ? 'opacity-40' : 'opacity-100',
                  isSelectedForHighlight && 'border-4 border-yellow-500 bg-yellow-500/30 shadow-lg'
                )}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12">
                  <GamePiece type={piece as Exclude<PieceType, PieceType.EMPTY>} owner={playerEnum} size="auto" />
                </div>
                <span className={cn("text-xs mt-0.5", pieceNameColor)}>{t(`pieces.${piece.toLowerCase()}`)}</span>
                <span className={cn("text-sm font-semibold", pieceCountColor, isDisabled && "line-through")}>
                  × {count}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ★ コンポーネントを React.memo でラップ
export default React.memo(OnlinePlayerInfo); 