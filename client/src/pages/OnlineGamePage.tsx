import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GameBoard } from '../components/game/OnlineGameBoard';
import { useOnlineGame } from '../lib/stores/useOnlineGame';
import { PieceType, Player, GamePhase, GameResult } from '../lib/types';
import { motion } from 'framer-motion';
import { FaHome, FaRedo, FaCopy, FaUser, FaUserFriends, FaStar, FaLanguage } from 'react-icons/fa';
import { useLanguage } from '../lib/stores/useLanguage';
import { AudioControl } from '../components/game/AudioControl';
import ErrorBoundary from '../components/ErrorBoundary';
import OnlinePlayerInfo from '../components/game/OnlinePlayerInfo';
import { cn } from '../lib/utils';
import { GamePiece } from '../components/game/GamePiece';
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import Confetti from 'react-confetti';

// 分離された CreateRoomButton コンポーネント - ShadCn Button ではなく標準 HTML ボタンを使用
interface CreateRoomButtonProps {
  onClick: () => void;
}

// メモ化してレンダリングを最適化
const CreateRoomButton = React.memo(({ onClick }: CreateRoomButtonProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    // 遅延を入れて状態更新の干渉を避ける
    setTimeout(() => {
      onClick();
      // ロード状態は外部コンポーネントで処理されるので、こちらではリセットしない
    }, 100);
  };
  
  // childrenを直接レンダリングせず、安定した要素構造を保つ
  // Textコンポーネントを避けて純粋なHTML要素のみを使用
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
        isLoading
          ? "bg-sky-800/70 cursor-not-allowed"
          : "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:ring-sky-500"
      )}
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full">
          <div className="w-5 h-5 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>処理中...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <FaUser className="mr-2" />
          <span>{t('online.createRoom')}</span>
        </div>
      )}
    </button>
  );
});

// JoinRoomButton コンポーネント - 同様に標準 HTML ボタンを使用
interface JoinRoomButtonProps {
  onClick: () => void;
  type: 'join' | 'matchmaking';
}

// メモ化してレンダリングを最適化
const JoinRoomButton = React.memo(({ onClick, type }: JoinRoomButtonProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    // 遅延を入れて状態更新の干渉を避ける
    setTimeout(() => {
      onClick();
      // ロード状態は外部コンポーネントで処理されるので、こちらではリセットしない
    }, 100);
  };
  
  // テキストをタイプに基づいて決定
  const buttonText = type === 'join' ? t('online.joinRoom') : t('online.quickMatch');
  // アイコンをタイプに基づいて決定
  const ButtonIcon = type === 'join' ? FaUserFriends : FaUserFriends;
  
  // childrenを完全に避けて、直接テキストをレンダリング
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
        isLoading
          ? "bg-slate-700/70 text-slate-400 cursor-not-allowed"
          : "bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 focus:ring-slate-500 border border-slate-600"
      )}
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full">
          <div className="w-5 h-5 mr-2 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></div>
          <span className="text-slate-400">処理中...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          {ButtonIcon && <ButtonIcon className="mr-2" />}
          <span>{buttonText}</span>
        </div>
      )}
    </button>
  );
});

// 接続ボタンコンポーネント
const ConnectButton = React.memo(({ username }: { username: string }) => {
  const { t } = useLanguage();
  const { connect } = useOnlineGame();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = () => {
    if (isLoading || !username.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      connect(username);
    }, 100);
  };
  
  return (
    <button
      className={cn(
        "w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
        !username.trim() || isLoading
          ? "bg-sky-800/70 cursor-not-allowed"
          : "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:ring-sky-500"
      )}
      onClick={handleClick}
      disabled={!username.trim() || isLoading}
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          <span>{t('loading')}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
           <FaUser className="mr-2" />
          <span>{t('online.connect')}</span>
        </div>
      )}
    </button>
  );
});

export function OnlineGamePage() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ★ セレクターを元に戻す: 個別の状態を取得
  const isOnline = useOnlineGame(state => state.isOnline);
  const isConnected = useOnlineGame(state => state.isConnected);
  const roomId = useOnlineGame(state => state.roomId);
  const players = useOnlineGame(state => state.players); // players 配列自体への参照が必要
  const isSpectator = useOnlineGame(state => state.isSpectator);
  const isInMatchmaking = useOnlineGame(state => state.isInMatchmaking);
  const gamePhase = useOnlineGame(state => state.gamePhase);
  const currentPlayer = useOnlineGame(state => state.currentPlayer);
  const selectedPiece = useOnlineGame(state => state.selectedPiece);
  const localPlayerNumber = useOnlineGame(state => state.localPlayerNumber);
  const gameResult = useOnlineGame(state => state.gameResult);
  const message = useOnlineGame(state => state.message);
  const aiSelectedPiece = useOnlineGame(state => state.aiSelectedPiece);
  const player1Inventory = useOnlineGame(state => state.player1Inventory);
  const player2Inventory = useOnlineGame(state => state.player2Inventory);
  const winAnimation = useOnlineGame(state => state.winAnimation);
  const loseAnimation = useOnlineGame(state => state.loseAnimation);
  const drawAnimation = useOnlineGame(state => state.drawAnimation);
  const clearWinAnimation = useOnlineGame(state => state.clearWinAnimation);
  const clearLoseAnimation = useOnlineGame(state => state.clearLoseAnimation);
  const clearDrawAnimation = useOnlineGame(state => state.clearDrawAnimation);

  // ★ アクション (関数) はストア全体から取得しても通常問題ない
  const {
    setSelectedPiece,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    toggleReady,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    resetGame,
    leaveRoom,
    _selectRandomPieceForTurn
  } = useOnlineGame.getState(); // アクションは getState() で取得するのが一般的
  
  // Local state
  const [username, setUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Handle cleanup on unmount
  useEffect(() => {
    // return () => {
    //   disconnect();
    // };
  }, []);

  // ★ 追加: roomId が null になったらローカルのローディング状態をリセット
  useEffect(() => {
    // roomId が null になったら (ロビーに戻ったら) ローカルのローディング状態をリセット
    if (roomId === null) {
      setIsJoining(false);
      setIsCreatingRoom(false);
    }
  }, [roomId]); // roomId の変化を監視
  
  // Get current player's room player object
  const myPlayer = localPlayerNumber 
    ? players.find(p => p.playerNumber === localPlayerNumber) 
    : null;
  
  // Handle a square click on the board
  const handleSquareClick = (row: number, col: number) => {
    if (!selectedPiece || gamePhase !== GamePhase.SELECTING_CELL || isSpectator) return;
    
    // Check if it's this player's turn
    const myPlayerEnum = localPlayerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2;
    if (currentPlayer !== myPlayerEnum) return;
    
    makeMove({ row, col });
  };
  
  // ★ ウィンドウサイズ取得用のuseEffectを追加 ★
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);
  
  // UI States
  const renderConnectionForm = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">サーバーに接続</h2>
            <p className="text-slate-400">オンライン対戦を始めるためにユーザー名を入力してください。</p>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                ユーザー名
              </label>
              <Input
                id="username"
                type="text"
                placeholder="例: JankenMaster777"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                // Shadcn UIのInputを使っている場合は、上記のclassNameは適宜調整
              />
            </div>
            <ConnectButton username={username} /> {/* ConnectButton は既存のものを流用 */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-sky-400 hover:text-sky-300 transition-colors duration-300"
              >
                <FaHome className="inline mr-1 mb-0.5" />
                トップページに戻る
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  // サーバーに送信するルーム作成関数を安全に実行するラッパー
  const safeCreateRoom = () => {
    try {
      // ルーム作成中の状態を設定
      setIsCreatingRoom(true);
      
      // 一旦遅延させてUIの更新を優先
      setTimeout(() => {
        try {
          createRoom();
          // NOTE: 実際にルームが作成されたかどうかは、サーバーからのコールバックで確認される
          // 成功した場合は handleRoomCreated が呼ばれる
        } catch (error) {
          console.error("Error creating room:", error);
          // エラー時の状態を設定
          setIsCreatingRoom(false);
          // エラーメッセージをアラートで表示
          alert(t('online.roomCreationError'));
          return false;
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error("Unexpected error in safeCreateRoom:", error);
      setIsCreatingRoom(false);
      return false;
    }
  };

  // サーバーに送信するルーム参加関数を安全に実行するラッパー
  const safeJoinRoom = (id: string) => {
    if (!id.trim()) {
      alert(t('online.enterValidRoomCode'));
      return false;
    }
    
    try {
      // ルーム参加中の状態を設定
      setIsJoining(true);
      
      // 一旦遅延させてUIの更新を優先
      setTimeout(() => {
        try {
          joinRoom(id);
          // NOTE: 実際にルームに参加できたかどうかは、サーバーからのコールバックで確認される
          // 成功した場合は handleRoomJoined が呼ばれる
        } catch (error) {
          console.error("Error joining room:", error);
          // エラー時の状態を設定
          setIsJoining(false);
          // エラーメッセージをアラートで表示
          alert(t('online.roomJoinError'));
          return false;
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error("Unexpected error in safeJoinRoom:", error);
      setIsJoining(false);
      return false;
    }
  };
  
  const renderLobby = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t('online.lobby')}</h2>
            <p className="text-slate-400">対戦相手を見つけるか、友達とルームを作成・参加しましょう。</p>
          </div>

          <div className="space-y-4">
            {isJoining ? (
              // ErrorBoundary はそのまま活用
              <ErrorBoundary fallback={
                <div className="p-4 bg-red-900/30 rounded-md border border-red-700">
                  <p className="text-red-400 mb-2">エラーが発生しました</p>
                  <button
                    className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md"
                    onClick={() => setIsJoining(false)}
                  >
                    {t('back')}
                  </button>
                </div>
              }>
                <div>
                  <label htmlFor="roomCode" className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t('online.roomCode')}
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="roomCode"
                      placeholder={t('online.enterRoomCode')}
                      value={joinRoomId}
                      onChange={e => setJoinRoomId(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-800/80 border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                    <button
                      className={cn(
                        "px-4 py-3 text-white font-semibold rounded-lg transition-all duration-300 ease-in-out",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
                        !joinRoomId.trim()
                          ? "bg-sky-800/70 cursor-not-allowed"
                          : "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:ring-sky-500"
                      )}
                      onClick={() => safeJoinRoom(joinRoomId)}
                      disabled={!joinRoomId.trim()}
                    >
                      {t('online.join')}
                    </button>
                  </div>
                </div>
                <button
                  className="w-full mt-4 py-2 px-4 border border-slate-600 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
                  onClick={() => setIsJoining(false)}
                >
                  {t('back')}
                </button>
              </ErrorBoundary>
            ) : isCreatingRoom ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mb-4"></div>
                <p className="text-slate-300">{t('online.creatingRoom')}</p>
              </div>
            ) : (
              <ErrorBoundary fallback={
                <div className="p-4 bg-red-900/30 rounded-md border border-red-700">
                  <p className="text-red-400 mb-2">エラーが発生しました</p>
                  <button
                    className="w-full py-2 border border-slate-600 rounded-lg hover:bg-slate-700 text-slate-300"
                    onClick={() => window.location.reload()}
                  >
                    再読み込み
                  </button>
                </div>
              }>
                <CreateRoomButton onClick={safeCreateRoom} />
                <JoinRoomButton onClick={() => setIsJoining(true)} type="join" />
                <JoinRoomButton onClick={joinMatchmaking} type="matchmaking" />
                <div className="text-center pt-4">
                  <Link
                    to="/"
                    className="text-sm text-sky-400 hover:text-sky-300 transition-colors duration-300"
                  >
                    <FaHome className="inline mr-1 mb-0.5" />
                    トップページに戻る
                  </Link>
                </div>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  const renderWaitingRoom = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg" // 少し幅を広げることも検討
      >
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8 border border-slate-700">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t('online.waitingRoom')}</h2>
          </div>

          {roomId && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-1.5 text-center">{t('online.shareCode')}</p>
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0 bg-slate-800/80 px-4 py-2.5 rounded-l-lg font-mono text-sky-300 text-lg tracking-wider border border-r-0 border-slate-700">
                  {roomId}
                </div>
                <button
                  className="px-3 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-r-lg border border-sky-500 transition-colors flex items-center"
                  onClick={() => navigator.clipboard.writeText(roomId)}
                  aria-label={t('online.copyRoomCode')}
                >
                  <FaCopy className="text-lg" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* プレイヤー情報を表示する部分は OnlinePlayerInfo の改修後に調整 */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-lg text-slate-200 mb-3">
                {t('online.players')}: {players.length} / 2
              </h3>
              <div className="space-y-3">
                {players.map((player, index) => {
                  const playerNumber = (index + 1) as 1 | 2;
                  const isLocal = localPlayerNumber === playerNumber;
                  const isCurrent = currentPlayer === (playerNumber === 1 ? Player.PLAYER1 : Player.PLAYER2);
                  const inventory = playerNumber === 1 ? player1Inventory : player2Inventory;

                  if (!inventory) {
                    // console.warn(`Inventory for player ${playerNumber} is undefined.`);
                    return ( // プレースホルダー表示
                      <div key={`player-placeholder-${player.id}`} className="p-3 bg-slate-700/50 rounded-md animate-pulse">
                          <p className="text-sm text-slate-400">{t('online.loadingPlayerInfo')}</p>
                      </div>
                    );
                  }
                  
                  // OnlinePlayerInfoコンポーネントのPropsに必要なものを渡す
                  // このコンポーネント自体のデザインも後ほど調整します
                  return (
                    <div className="order-2" key={player.id}>
                      <OnlinePlayerInfo
                        playerNumber={playerNumber}
                        username={player.username}
                        inventory={inventory}
                        isCurrentPlayer={isCurrent} // これは手番表示用なので注意
                        isLocalPlayer={isLocal}
                        isReady={player.ready} // 準備状態を渡す
                        aiSelectedPiece={aiSelectedPiece}
                        selectedPiece={selectedPiece}
                      />
                    </div>
                  );
                })}
                 {players.length < 2 && (
                  <div className="p-4 text-center text-slate-400 border-2 border-dashed border-slate-700 rounded-lg">
                    {t('online.waitingForAnotherPlayer')}
                  </div>
                )}
              </div>
            </div>

            {myPlayer && (
              <div className="mt-6">
                <div className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gray-600 text-center">
                  {myPlayer.ready
                    ? t('online.waitingForOpponent')
                    : t('online.autoReadying')}
                </div>
                <p className="text-xs text-center mt-3 text-slate-400">
                  {players.length === 2 && players.every(p => p.ready)
                    ? t('online.gameStartingSoon')
                    : (players.length === 2 ? t('online.waitingForAllReady') : '')
                  }
                </p>
              </div>
            )}
          </div>

          <div className="text-center pt-6 mt-4 border-t border-slate-700">
            <button
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors duration-300"
              onClick={() => setTimeout(() => leaveRoom(), 50)}
            >
              <FaHome className="inline mr-1 mb-0.5" />
              {t('backToLobby')} {/* または t('back') */}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  const renderMatchmaking = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-8 sm:p-10 border border-slate-700 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('online.findingOpponent')}</h2>
          
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent"></div>
          </div>
          
          <p className="text-slate-300 mb-8 text-lg">{t('online.searchingForPlayers')}</p>
          
          <button
            className={cn(
              "w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
              "bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 focus:ring-slate-500 border border-slate-600"
            )}
            onClick={() => setTimeout(() => cancelMatchmaking(), 50)}
            type="button"
          >
            <span>{t('online.cancel')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
  
  // ★ 紙吹雪の色を決定するヘルパー関数を追加 ★
  const getConfettiColors = () => {
    // localPlayerNumber が null でないことを確認
    if (localPlayerNumber === 1) {
      return ['#3B82F6', '#93C5FD', '#DBEAFE', '#FFFFFF']; // Player 1 (Blue)
    } else if (localPlayerNumber === 2) {
      return ['#EF4444', '#FCA5A5', '#FEE2E2', '#FFFFFF']; // Player 2 (Red)
    } else {
      return ['#10B981', '#A7F3D0', '#D1FAE5', '#FFFFFF']; // Default/Draw/Spectator (Greenish)
    }
  };

  const renderGame = () => {
    const player1 = players.find(p => p.playerNumber === 1);
    const player2 = players.find(p => p.playerNumber === 2);
    const myPlayerInfo = localPlayerNumber === 1 ? player1 : player2;
    const opponentPlayerInfo = localPlayerNumber === 1 ? player2 : player1;
    // ★ myInventory も個別に取得した player1Inventory/player2Inventory を使う
    const myInventory = localPlayerNumber === 1 ? player1Inventory : player2Inventory;
    // ★ isMyTurn の判定でも個別に取得した currentPlayer を使う
    const isMyTurn = !isSpectator && myPlayerInfo && myPlayerInfo.playerNumber === (currentPlayer === Player.PLAYER1 ? 1 : 2);
    
    // ★ 特殊駒が選択可能かどうかの状態
    const canSelectSpecial = isMyTurn && myInventory && myInventory[PieceType.SPECIAL] > 0;
    // ★ 特殊駒が現在選択されているか (個別に取得した selectedPiece を使う)
    const isSpecialSelected = selectedPiece === PieceType.SPECIAL;

    // ★ 勝者の名前を取得するヘルパーロジック ★
    const getWinnerUsername = () => {
      if (gameResult === GameResult.PLAYER1_WIN) {
        return players.find(p => p.playerNumber === 1)?.username || t('player1'); // 'Player 1' をフォールバック
      } else if (gameResult === GameResult.PLAYER2_WIN) {
        return players.find(p => p.playerNumber === 2)?.username || t('player2'); // 'Player 2' をフォールバック
      }
      return ''; // 引き分けや進行中は空文字
    };

    return (
      <div className="w-full max-w-7xl mx-auto px-2 md:px-4 relative">
        {/* トップバー: タイトルとボタン */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t('online.onlineMatch')}</h1>
          <div className="flex space-x-2 items-center">
            <button
              className="px-2 md:px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 flex items-center touch-manipulation shadow-sm"
              onClick={() => navigate('/')}
            >
              <FaHome className="mr-1" /> {t('home.title')}
            </button>
            {gamePhase === GamePhase.GAME_OVER && (
              <button
                className="px-2 md:px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 flex items-center touch-manipulation shadow-sm"
                onClick={resetGame}
              >
                <FaRedo className="mr-1" /> {t('playAgain')}
              </button>
            )}
            
            {/* ★ 言語切り替えボタンを Switch に変更 */}
            <div className="flex items-center space-x-2 bg-white/80 px-2 py-1 rounded-md border border-gray-300 shadow-sm">
              <Label htmlFor="language-toggle" className="text-sm font-medium text-gray-700">
                English
              </Label>
              <Switch
                id="language-toggle"
                checked={language === 'ja'} // 日本語の場合にチェック状態
                onCheckedChange={(checked) => setLanguage(checked ? 'ja' : 'en')}
                aria-label={t('toggleLanguage')}
              />
              <Label htmlFor="language-toggle" className="text-sm font-medium text-gray-700">
                日本語
              </Label>
            </div>
            
            {/* ★ 特殊駒選択ボタン (isMyTurn, canSelectSpecial, isSpecialSelected は個別の値ベース) */}
            {gamePhase === GamePhase.SELECTING_CELL && (
                <button
                  className={cn(
                    "px-2 md:px-3 py-1.5 text-sm border rounded-md flex items-center touch-manipulation shadow-sm transition-all",
                    !isMyTurn && "opacity-50 cursor-not-allowed",
                    isMyTurn && !canSelectSpecial && "opacity-50 cursor-not-allowed",
                    isMyTurn && canSelectSpecial && !isSpecialSelected && "bg-white border-gray-300 hover:bg-gray-100",
                    isMyTurn && canSelectSpecial && isSpecialSelected && "bg-yellow-300 border-yellow-500 ring-2 ring-yellow-500"
                  )}
                  onClick={() => {
                    if (isMyTurn && canSelectSpecial) {
                      if (isSpecialSelected) {
                        // 特殊駒が既に選択されていれば、選択を解除 (ストアが元の駒を復元)
                        setSelectedPiece(null);
                      } else {
                        // 特殊駒が選択されていなければ、特殊駒を選択状態にする
                        setSelectedPiece(PieceType.SPECIAL);
                      }
                    }
                  }}
                  disabled={!isMyTurn || !canSelectSpecial}
                  aria-label={t('useSpecialPiece')}
                >
                  <FaStar className={cn("mr-1", isSpecialSelected ? "text-yellow-700" : "text-yellow-500")} />
                  {t('useSpecialPiece')}
                  {myInventory && <span className="ml-1 text-xs">({myInventory[PieceType.SPECIAL]})</span>}
                </button>
            )}
            
            {/* ★ AudioControl をトップバーに移動 */}
            <AudioControl />
          </div>
        </div>
        
        {/* ゲームエリア: 左にコントロール/メッセージ、右にボード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* 左エリア: プレイヤー情報、メッセージ、AI選択駒表示 */}
          <div className="lg:col-span-1 order-2 lg:order-1 flex flex-col space-y-4">
            {/* メッセージ表示 */}
            <div className="w-full bg-white/80 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow text-center order-1">
              {/* ★ message も個別に取得したものを使う */}
              <p className="font-semibold text-sm md:text-base text-gray-700">{message}</p>
            </div>
            
            {/* Player Info を表示する部分 */}
            {player1 && (
              <div className="order-2">
                <OnlinePlayerInfo
                  key={`p1-${JSON.stringify(player1Inventory)}`}
                  playerNumber={1}
                  username={player1.username || t('player1')}
                  inventory={player1Inventory}
                  isCurrentPlayer={currentPlayer === Player.PLAYER1}
                  isLocalPlayer={localPlayerNumber === 1}
                  aiSelectedPiece={aiSelectedPiece}
                  selectedPiece={selectedPiece}
                />
              </div>
            )}

            {player2 && (
              <div className="order-3">
                 <OnlinePlayerInfo
                   key={`p2-${JSON.stringify(player2Inventory)}`}
                   playerNumber={2}
                   username={player2.username || t('player2')}
                   inventory={player2Inventory}
                   isCurrentPlayer={currentPlayer === Player.PLAYER2}
                   isLocalPlayer={localPlayerNumber === 2}
                   aiSelectedPiece={aiSelectedPiece}
                   selectedPiece={selectedPiece}
                 />
              </div>
            )}
            
            {/* 観戦者表示 (isSpectator は個別に取得したもの) */}
            {isSpectator && (
              <div className="w-full bg-yellow-100 p-3 md:p-4 rounded-lg shadow text-center mt-4">
                <p className="font-medium text-sm md:text-base">{t('online.spectating')}</p>
              </div>
            )}
          </div>
          
          {/* 右エリア: ボードのみ */}
          <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col items-center">
            {/* ゲームボード */}
            <div className="w-full">
              <GameBoard />
            </div>
          </div>
        </div>

        {/* ★ アニメーションオーバーレイ ★ */}
        {(winAnimation || loseAnimation || drawAnimation) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50 rounded-lg overflow-hidden"
          >
            {/* ★ 勝利時にConfettiを追加 ★ */}
            {winAnimation && (
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={true} // しばらく表示するのでリサイクル有効
                numberOfPieces={250} // 少し多めに
                gravity={0.15}
                colors={getConfettiColors()} // 勝者の色に
                style={{ zIndex: 51 }} // テキストより手前に
              />
            )}
            {loseAnimation && (
              <div className="text-center">
                <p className="text-6xl md:text-8xl font-bold text-red-500">{t('online.youLose')}</p>
              </div>
            )}
            {drawAnimation && (
              <div className="text-center">
                <p className="text-6xl md:text-8xl font-bold text-slate-400">{t('online.draw')}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };
  
  // renderContent関数をより堅牢にするために修正
  const renderContent = () => {
    // すべての状態に対して適用するエラーバウンダリ
    return (
      <ErrorBoundary name="MainContentBoundary">
        {!isOnline ? (
          <div className="online-content">
            <ErrorBoundary name="ConnectionFormBoundary">
              {renderConnectionForm()}
            </ErrorBoundary>
          </div>
        ) : isInMatchmaking ? (
          <div className="online-content">
            <ErrorBoundary name="MatchmakingBoundary">
              {renderMatchmaking()}
            </ErrorBoundary>
          </div>
        ) : !roomId ? (
          <div className="online-content">
            <ErrorBoundary name="LobbyBoundary">
              {renderLobby()}
            </ErrorBoundary>
          </div>
        ) : gamePhase === GamePhase.READY ? (
          <div className="online-content">
            <ErrorBoundary name="WaitingRoomBoundary">
              {renderWaitingRoom()}
            </ErrorBoundary>
          </div>
        ) : (
          <div className="online-content">
            <ErrorBoundary name="GameBoundary">
              {renderGame()}
            </ErrorBoundary>
          </div>
        )}
      </ErrorBoundary>
    );
  };
  
  // ★ アニメーションクリア用のuseEffectを追加 ★
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (winAnimation) {
      timer = setTimeout(() => clearWinAnimation(), 3000); // 3秒後にクリア
    } else if (loseAnimation) {
      timer = setTimeout(() => clearLoseAnimation(), 3000);
    } else if (drawAnimation) {
      timer = setTimeout(() => clearDrawAnimation(), 3000);
    }
    return () => clearTimeout(timer); // クリーンアップ関数
  }, [winAnimation, loseAnimation, drawAnimation, clearWinAnimation, clearLoseAnimation, clearDrawAnimation]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-2 md:p-4 touch-manipulation">
      {/* Audio Control は renderGame 内に移動 
      {gamePhase !== GamePhase.READY && <AudioControl />} 
      */}
      
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <ErrorBoundary name="RootBoundary">
          {renderContent()}
        </ErrorBoundary>
      </div>
    </div>
  );
}