import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { FaHandRock, FaHandPaper, FaHandScissors, FaGamepad, FaBrain, FaGlobe, FaUsers, FaRocket } from 'react-icons/fa';

export function About() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';

  const features = [
    {
      icon: FaGamepad,
      titleEn: 'Strategic Gameplay',
      titleJa: '戦略的なゲームプレイ',
      descriptionEn: 'Combine the simplicity of rock-paper-scissors with deep board game strategy.',
      descriptionJa: 'じゃんけんのシンプルさと奥深いボードゲーム戦略を組み合わせています。',
    },
    {
      icon: FaBrain,
      titleEn: 'AI Opponents',
      titleJa: 'AI対戦',
      descriptionEn: 'Practice against AI with 6 difficulty levels, from beginner to expert.',
      descriptionJa: '初心者からエキスパートまで、6段階の難易度でAIと対戦できます。',
    },
    {
      icon: FaGlobe,
      titleEn: 'Online Multiplayer',
      titleJa: 'オンライン対戦',
      descriptionEn: 'Challenge players from around the world in real-time matches.',
      descriptionJa: '世界中のプレイヤーとリアルタイムで対戦できます。',
    },
    {
      icon: FaUsers,
      titleEn: 'Local Multiplayer',
      titleJa: 'ローカル対戦',
      descriptionEn: 'Play against friends on the same device.',
      descriptionJa: '同じデバイスで友達と対戦できます。',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              className="flex justify-center items-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FaHandRock className="text-4xl text-blue-500" />
              <FaHandPaper className="text-4xl text-red-500" />
              <FaHandScissors className="text-4xl text-green-500" />
            </motion.div>
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'JankenWarsについて' : 'About JankenWars'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isJapanese
                ? '戦略とじゃんけんが融合した、新感覚のオンラインボードゲーム'
                : 'A unique online board game where strategy meets rock-paper-scissors'}
            </p>
          </div>

          {/* What is JankenWars */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'JankenWarsとは' : 'What is JankenWars?'}
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                {isJapanese
                  ? 'JankenWarsは、日本の伝統的な遊び「じゃんけん」をベースにした戦略ボードゲームです。6x6のボード上で2人のプレイヤーが対戦し、グー・チョキ・パーの駒を配置していきます。'
                  : 'JankenWars is a strategic board game based on the traditional Japanese game "Janken" (rock-paper-scissors). Two players compete on a 6x6 board, placing rock, paper, and scissors pieces.'}
              </p>
              <p>
                {isJapanese
                  ? '単純なじゃんけんのルールに、ボードゲームの戦略性を加えることで、誰でも楽しめる奥深いゲーム体験を提供します。先に5つの駒を縦・横・斜めに並べたプレイヤーが勝利します。'
                  : 'By adding board game strategy to simple rock-paper-scissors rules, we provide a deep gaming experience that anyone can enjoy. The first player to align 5 pieces vertically, horizontally, or diagonally wins.'}
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {features.map(({ icon: Icon, titleEn, titleJa, descriptionEn, descriptionJa }, index) => (
              <motion.div
                key={titleEn}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {isJapanese ? titleJa : titleEn}
                    </h3>
                    <p className="text-gray-600">
                      {isJapanese ? descriptionJa : descriptionEn}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How It Works */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <FaRocket />
              {isJapanese ? 'ゲームの流れ' : 'How It Works'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isJapanese ? 'ゲームモードを選択' : 'Choose Your Game Mode'}
                  </h3>
                  <p className="text-gray-600">
                    {isJapanese
                      ? 'ローカル対戦、AI対戦、オンライン対戦から選べます。'
                      : 'Choose from local multiplayer, AI battle, or online multiplayer.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isJapanese ? '駒を配置' : 'Place Your Pieces'}
                  </h3>
                  <p className="text-gray-600">
                    {isJapanese
                      ? '毎ターン、ランダムに与えられる駒をボードに配置します。'
                      : 'Each turn, place the randomly given piece on the board.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isJapanese ? 'じゃんけんバトル' : 'Janken Battle'}
                  </h3>
                  <p className="text-gray-600">
                    {isJapanese
                      ? '相手の駒があるマスに置くと、じゃんけんの勝敗で決まります。'
                      : 'When placing on a square with an opponent\'s piece, the outcome is determined by rock-paper-scissors rules.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isJapanese ? '5つ並べて勝利！' : 'Align 5 to Win!'}
                  </h3>
                  <p className="text-gray-600">
                    {isJapanese
                      ? '先に5つの駒を一列に並べたプレイヤーの勝利です。'
                      : 'The first player to align 5 pieces in a row wins the game.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '使用技術' : 'Technology'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind CSS', 'Socket.IO', 'Node.js', 'Express', 'Zustand', 'Framer Motion'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '今すぐプレイ！' : 'Play Now!'}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
                  {isJapanese ? 'ゲームを始める' : 'Start Playing'}
                </Button>
              </Link>
              <Link to="/how-to-play">
                <Button variant="outline">
                  {isJapanese ? '遊び方を見る' : 'Learn How to Play'}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-300 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? '利用規約' : 'Terms of Service'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/contact" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'お問い合わせ' : 'Contact'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default About;
