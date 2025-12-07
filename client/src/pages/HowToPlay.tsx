import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar, FaLightbulb, FaTrophy, FaExclamationTriangle } from 'react-icons/fa';

export function HowToPlay() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '遊び方ガイド' : 'How to Play'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isJapanese
                ? 'JankenWarsのルールと戦略を学ぼう！'
                : 'Learn the rules and strategies of JankenWars!'}
            </p>
          </div>

          {/* Basic Rules */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              {isJapanese ? '基本ルール' : 'Basic Rules'}
            </h2>

            {/* Objective */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                {isJapanese ? '勝利条件' : 'Objective'}
              </h3>
              <p className="text-gray-700 text-lg">
                {isJapanese
                  ? '6x6のボード上で、自分の駒を縦・横・斜めに5つ並べたプレイヤーが勝利！'
                  : 'Be the first to align 5 of your pieces vertically, horizontally, or diagonally on the 6x6 board!'}
              </p>
            </div>

            {/* Turn Flow */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                {isJapanese ? 'ターンの流れ' : 'Turn Flow'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {isJapanese ? '駒を受け取る' : 'Receive a Piece'}
                    </p>
                    <p className="text-gray-600">
                      {isJapanese
                        ? 'ターン開始時に、グー・チョキ・パーのいずれかの駒がランダムに与えられます。'
                        : 'At the start of your turn, you receive a random piece: Rock, Paper, or Scissors.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {isJapanese ? '駒を配置する' : 'Place the Piece'}
                    </p>
                    <p className="text-gray-600">
                      {isJapanese
                        ? '空いているマス、または相手の駒があるマスに配置できます。'
                        : 'Place it on an empty square or on a square with an opponent\'s piece.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {isJapanese ? 'じゃんけんバトル（該当時）' : 'Janken Battle (if applicable)'}
                    </p>
                    <p className="text-gray-600">
                      {isJapanese
                        ? '相手の駒があるマスに置いた場合、じゃんけんの勝敗が決まります。'
                        : 'If placing on an opponent\'s piece, the winner is determined by rock-paper-scissors rules.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Janken Rules */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6">
              {isJapanese ? 'じゃんけんルール' : 'Janken Rules'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                className="text-center p-6 bg-blue-50 rounded-xl"
                whileHover={{ scale: 1.05 }}
              >
                <FaHandRock className="text-5xl text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {isJapanese ? 'グー' : 'Rock'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese ? 'チョキに勝つ' : 'Beats Scissors'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {isJapanese ? 'パーに負ける' : 'Loses to Paper'}
                </p>
              </motion.div>
              <motion.div
                className="text-center p-6 bg-red-50 rounded-xl"
                whileHover={{ scale: 1.05 }}
              >
                <FaHandPaper className="text-5xl text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {isJapanese ? 'パー' : 'Paper'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese ? 'グーに勝つ' : 'Beats Rock'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {isJapanese ? 'チョキに負ける' : 'Loses to Scissors'}
                </p>
              </motion.div>
              <motion.div
                className="text-center p-6 bg-green-50 rounded-xl"
                whileHover={{ scale: 1.05 }}
              >
                <FaHandScissors className="text-5xl text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {isJapanese ? 'チョキ' : 'Scissors'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese ? 'パーに勝つ' : 'Beats Paper'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {isJapanese ? 'グーに負ける' : 'Loses to Rock'}
                </p>
              </motion.div>
            </div>

            {/* Battle Outcome */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <FaExclamationTriangle />
                {isJapanese ? 'バトル後の重要ルール' : 'Important Rule After Battle'}
              </h4>
              <p className="text-yellow-800">
                {isJapanese
                  ? 'じゃんけんバトルが行われたマスは「ロック」され、以降そのマスでバトルを行うことはできません。'
                  : 'Squares where a Janken battle occurred become "locked" and cannot be used for future battles.'}
              </p>
            </div>
          </div>

          {/* Special Piece */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              {isJapanese ? '特殊駒' : 'Special Piece'}
            </h2>
            <div className="flex items-start gap-4">
              <div className="p-4 bg-yellow-100 rounded-xl">
                <FaStar className="text-4xl text-yellow-500" />
              </div>
              <div className="space-y-3 text-gray-700">
                <p>
                  {isJapanese
                    ? '各プレイヤーは1つだけ「特殊駒」を持っています。'
                    : 'Each player has one "Special Piece."'}
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    {isJapanese
                      ? '空いているマスにのみ配置可能'
                      : 'Can only be placed on empty squares'}
                  </li>
                  <li>
                    {isJapanese
                      ? '相手の駒を取ることはできない'
                      : 'Cannot capture opponent\'s pieces'}
                  </li>
                  <li>
                    {isJapanese
                      ? '相手に取られることもない'
                      : 'Cannot be captured by opponents'}
                  </li>
                  <li>
                    {isJapanese
                      ? '5つ並べる列の一部として使える'
                      : 'Counts as part of your 5-in-a-row'}
                  </li>
                </ul>
                <p className="text-indigo-600 font-medium">
                  {isJapanese
                    ? '戦略的に重要な位置を確保するために使いましょう！'
                    : 'Use it strategically to secure important positions!'}
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Tips */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              {isJapanese ? '戦略のヒント' : 'Strategy Tips'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-700 mb-2">
                  {isJapanese ? '中央を制する' : 'Control the Center'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese
                    ? 'ボードの中央付近は、縦・横・斜めの全方向で有利に働きます。'
                    : 'The center of the board provides advantages in all directions.'}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-700 mb-2">
                  {isJapanese ? '複数の列を狙う' : 'Create Multiple Threats'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese
                    ? '同時に複数の方向で4つ並べると、相手は防ぎきれません。'
                    : 'Setting up multiple lines of 4 makes it impossible for your opponent to block all.'}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-700 mb-2">
                  {isJapanese ? '特殊駒を温存' : 'Save Your Special Piece'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese
                    ? '特殊駒は終盤の決め手になることが多いです。早めに使わないようにしましょう。'
                    : 'The Special Piece often becomes crucial in the endgame. Don\'t use it too early.'}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-700 mb-2">
                  {isJapanese ? 'バトルマスを活用' : 'Use Battle Locks'}
                </h3>
                <p className="text-gray-600">
                  {isJapanese
                    ? 'ロックされたマスは相手も使えません。戦略的にバトルを仕掛けましょう。'
                    : 'Locked squares can\'t be used by opponents either. Use battles strategically.'}
                </p>
              </div>
            </div>
          </div>

          {/* Draw Conditions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '引き分け条件' : 'Draw Conditions'}
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                {isJapanese
                  ? 'ボードがすべて埋まっても、どちらも5つ並べられなかった場合'
                  : 'The board is full but neither player has 5 in a row'}
              </li>
              <li>
                {isJapanese
                  ? '両プレイヤーが全ての駒を使い切っても、5つ並べられなかった場合'
                  : 'Both players run out of pieces without achieving 5 in a row'}
              </li>
            </ul>
          </div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'さあ、始めよう！' : 'Ready to Play?'}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
                  {isJapanese ? 'ゲームを始める' : 'Start Playing'}
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline">
                  {isJapanese ? 'JankenWarsについて' : 'About JankenWars'}
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default HowToPlay;
