import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GameBoard } from '../components/game/OnlineGameBoard';
import { useOnlineGame } from '../lib/stores/useOnlineGame';
import { PieceType, Player, GamePhase, GameResult } from '../lib/types';
import { motion } from 'framer-motion';
import { FaHome, FaRedo, FaCopy, FaUser, FaUserFriends } from 'react-icons/fa';
import { useLanguage } from '../lib/stores/useLanguage';

export function OnlineGamePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Game state from store
  const {
    isOnline,
    isConnected,
    roomId,
    players,
    isSpectator,
    isInMatchmaking,
    gamePhase,
    board,
    currentPlayer,
    selectedPiece,
    localPlayerNumber,
    gameResult,
    message,
    
    connect,
    disconnect,
    createRoom,
    joinRoom,
    toggleReady,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    setSelectedPiece,
    resetGame
  } = useOnlineGame();
  
  // Local state
  const [username, setUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
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
    
    makeMove({ row, col }, selectedPiece);
  };
  
  // UI States
  const renderConnectionForm = () => (
    <motion.div 
      className="max-w-md w-full p-6 bg-white/90 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">{t('online.connect')}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('online.username')}</label>
          <Input
            placeholder={t('online.enterUsername')}
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <Button 
          className="w-full" 
          onClick={() => connect(username)}
          disabled={!username.trim()}
        >
          {t('online.connect')}
        </Button>
        <div className="text-center">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
            {t('back')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
  
  const renderLobby = () => (
    <motion.div 
      className="max-w-md w-full p-6 bg-white/90 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">{t('online.lobby')}</h2>
      <div className="space-y-4">
        {isJoining ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('online.roomCode')}</label>
              <div className="flex">
                <Input
                  placeholder={t('online.enterRoomCode')}
                  value={joinRoomId}
                  onChange={e => setJoinRoomId(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button onClick={() => joinRoom(joinRoomId)} disabled={!joinRoomId.trim()}>
                  {t('online.join')}
                </Button>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setIsJoining(false)}>
              {t('back')}
            </Button>
          </>
        ) : (
          <>
            <Button className="w-full flex items-center justify-center" onClick={createRoom}>
              <FaUser className="mr-2" /> {t('online.createRoom')}
            </Button>
            <Button className="w-full flex items-center justify-center" onClick={() => setIsJoining(true)}>
              <FaUserFriends className="mr-2" /> {t('online.joinRoom')}
            </Button>
            <Button className="w-full flex items-center justify-center" onClick={joinMatchmaking}>
              {t('online.quickMatch')}
            </Button>
            <div className="text-center pt-2">
              <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
                {t('back')}
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
  
  const renderWaitingRoom = () => (
    <motion.div 
      className="max-w-md w-full p-6 bg-white/90 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">{t('online.waitingRoom')}</h2>
      
      {roomId && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">{t('online.shareCode')}</p>
          <div className="flex">
            <div className="flex-1 bg-gray-100 px-3 py-2 rounded-l-md font-mono">
              {roomId}
            </div>
            <Button 
              variant="outline" 
              className="rounded-l-none"
              onClick={() => navigator.clipboard.writeText(roomId)}
            >
              <FaCopy />
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-medium mb-2">{t('online.players')}</h3>
          <ul className="space-y-2">
            {players.map(player => (
              <li key={player.id} className="flex justify-between items-center">
                <span>
                  {player.username} 
                  {myPlayer?.id === player.id && ` (${t('online.you')})`}
                  {` - ${t('online.player')} ${player.playerNumber}`}
                </span>
                <span className={`px-2 py-1 text-xs rounded-md ${player.ready ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                  {player.ready ? t('online.ready') : t('online.notReady')}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {!isSpectator && (
          <Button className="w-full" onClick={toggleReady}>
            {myPlayer?.ready ? t('online.notReady') : t('online.ready')}
          </Button>
        )}
        
        {isSpectator && (
          <div className="text-center text-sm text-gray-600">
            {t('online.spectating')}
          </div>
        )}
        
        <div className="text-center pt-2">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
            {t('back')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
  
  const renderMatchmaking = () => (
    <motion.div 
      className="max-w-md w-full p-6 bg-white/90 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">{t('online.findingOpponent')}</h2>
      
      <div className="flex justify-center mb-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
      
      <p className="text-center mb-6">{t('online.searchingForPlayers')}</p>
      
      <Button className="w-full" variant="outline" onClick={cancelMatchmaking}>
        {t('online.cancel')}
      </Button>
    </motion.div>
  );
  
  const renderGame = () => (
    <div className="w-full max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{t('online.onlineMatch')}</h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <FaHome className="mr-1" /> {t('home.title')}
              </Button>
              {gamePhase === GamePhase.GAME_OVER && (
                <Button variant="outline" size="sm" onClick={resetGame}>
                  <FaRedo className="mr-1" /> {t('playAgain')}
                </Button>
              )}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow mb-4">
            <p className="font-medium">{message}</p>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white/90 p-4 rounded-lg shadow">
          <GameBoard 
            board={board}
            onSquareClick={handleSquareClick}
            highlightedCells={[]}
            currentPlayer={currentPlayer}
          />
        </div>
        
        <div className="space-y-4">
          {players.map(player => {
            const isCurrentPlayersTurn = 
              (player.playerNumber === 1 && currentPlayer === Player.PLAYER1) ||
              (player.playerNumber === 2 && currentPlayer === Player.PLAYER2);
              
            const isLocalPlayer = player.playerNumber === localPlayerNumber;
            
            return (
              <div key={player.id} className="bg-white/90 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-lg">
                    {player.username} 
                    {isLocalPlayer && ` (${t('online.you')})`}
                  </h2>
                  <span className={`text-sm px-2 py-1 rounded-full ${isCurrentPlayersTurn ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                    {isCurrentPlayersTurn ? t('yourTurn') : t('waiting')}
                  </span>
                </div>
                
                {isLocalPlayer && gamePhase === GamePhase.SELECTING_CELL && isCurrentPlayersTurn && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">{t('selectPiece')}</h3>
                    <div className="flex space-x-2 justify-center">
                      {[PieceType.ROCK, PieceType.PAPER, PieceType.SCISSORS].map(pieceType => (
                        <button
                          key={pieceType}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl 
                            ${selectedPiece === pieceType ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                          onClick={() => setSelectedPiece(pieceType)}
                        >
                          {pieceType === PieceType.ROCK ? '✊' : 
                           pieceType === PieceType.PAPER ? '✋' : '✌️'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {isSpectator && (
            <div className="bg-yellow-100 p-4 rounded-lg shadow">
              <p className="text-center font-medium">{t('online.spectating')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Determine which component to render based on state
  const renderContent = () => {
    if (!isOnline) {
      return renderConnectionForm();
    }
    
    if (isInMatchmaking) {
      return renderMatchmaking();
    }
    
    if (!roomId) {
      return renderLobby();
    }
    
    if (gamePhase === GamePhase.READY) {
      return renderWaitingRoom();
    }
    
    return renderGame();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        {renderContent()}
      </div>
    </div>
  );
}