import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { AdBanner } from '../components/ads';
import {
  FaChess, FaBrain, FaHandRock, FaHandPaper, FaHandScissors,
  FaStar, FaLightbulb, FaShieldAlt, FaCrosshairs, FaTrophy,
  FaExclamationTriangle, FaArrowRight
} from 'react-icons/fa';

export function Strategy() {
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
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FaChess className="text-5xl text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '戦略ガイド' : 'Strategy Guide'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {isJapanese
                ? 'JankenWarsで勝つための戦略とテクニックをマスターしましょう。初心者からエキスパートまで、あらゆるレベルのプレイヤーに役立つヒントを紹介します。'
                : 'Master the strategies and techniques to win at JankenWars. From beginners to experts, these tips will help players at every level.'}
            </p>
          </div>

          {/* Ad Banner - Top */}
          <div className="mb-8">
            <AdBanner position="top" />
          </div>

          {/* Beginner Strategies */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <FaLightbulb size={24} />
                </div>
                {isJapanese ? '初心者向け基本戦略' : 'Beginner Strategies'}
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '1. 中央を制する者がゲームを制する' : '1. Control the Center'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? 'ボードの中央付近（特に中央4マス）は、縦・横・斜めのすべての方向で有利に働きます。ゲーム序盤では積極的に中央を狙いましょう。'
                      : 'The center of the board (especially the 4 central squares) provides advantages in all directions - vertical, horizontal, and diagonal. Aim for the center early in the game.'}
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                    <strong>{isJapanese ? 'ヒント：' : 'Tip:'}</strong>{' '}
                    {isJapanese
                      ? '最初の数手で中央付近に駒を配置することで、後のゲーム展開が有利になります。'
                      : 'Placing pieces near the center in your first few moves gives you an advantage in later game development.'}
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '2. 相手の動きを観察する' : '2. Watch Your Opponent'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '相手がどの方向で並べようとしているかを常に意識しましょう。4つ並んでいる場合は、次のターンで5つ目を置かれる前にブロックする必要があります。'
                      : 'Always pay attention to which direction your opponent is trying to align pieces. If they have 4 in a row, you must block before they place the 5th piece.'}
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '3. じゃんけんの確率を理解する' : '3. Understand Janken Probabilities'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? 'じゃんけんバトルは本質的に33%の勝率です。重要な場面でリスクを取るかどうかを慎重に判断しましょう。'
                      : 'Janken battles inherently have a 33% win rate. Carefully decide when to take risks in critical situations.'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <FaHandRock className="text-2xl text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">{isJapanese ? 'グー' : 'Rock'}</div>
                      <div className="text-xs text-gray-500">{isJapanese ? 'チョキに勝つ' : 'beats Scissors'}</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <FaHandPaper className="text-2xl text-red-500 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">{isJapanese ? 'パー' : 'Paper'}</div>
                      <div className="text-xs text-gray-500">{isJapanese ? 'グーに勝つ' : 'beats Rock'}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <FaHandScissors className="text-2xl text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">{isJapanese ? 'チョキ' : 'Scissors'}</div>
                      <div className="text-xs text-gray-500">{isJapanese ? 'パーに勝つ' : 'beats Paper'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Intermediate Strategies */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FaCrosshairs size={24} />
                </div>
                {isJapanese ? '中級者向け戦略' : 'Intermediate Strategies'}
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '1. 複数の勝ち筋を作る（フォーク戦略）' : '1. Create Multiple Winning Lines (Fork Strategy)'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '同時に複数の方向で4つ並べる状況を作ることで、相手は全てをブロックできなくなります。これは「フォーク」と呼ばれる強力な戦略です。'
                      : 'By creating situations where you have 4 pieces aligned in multiple directions simultaneously, your opponent cannot block everything. This powerful strategy is called a "fork".'}
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>{isJapanese ? '例：' : 'Example:'}</strong>
                      <div className="mt-2 font-mono text-xs">
                        {isJapanese
                          ? '縦に3つ + 斜めに3つ = 次のターンで2方向から攻めらる'
                          : '3 vertical + 3 diagonal = threatening 2 directions next turn'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '2. ロックマスを戦略的に利用する' : '2. Use Locked Squares Strategically'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? 'じゃんけんバトル後にロックされるマスは、相手も利用できなくなります。重要な位置をロックすることで、相手の選択肢を制限できます。'
                      : 'Squares locked after Janken battles cannot be used by your opponent either. By locking important positions, you limit your opponent\'s options.'}
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '3. 端と辺を活用する' : '3. Utilize Edges and Corners'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? 'ボードの端や辺は攻撃方向が限られますが、防御しやすいという利点があります。相手の邪魔をしながら安全に列を作れます。'
                      : 'Edges and corners have limited attack directions but are easier to defend. You can safely build lines while blocking your opponent.'}
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '4. 駒の種類を記憶する' : '4. Remember Piece Types'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '相手がどの駒を多く持っているかを覚えておくと、じゃんけんバトルでの勝率予測に役立ちます。グーが多い相手にはパーで攻撃するなど。'
                      : 'Remembering which pieces your opponent has helps predict Janken battle outcomes. For example, attack with Paper against an opponent who has many Rocks.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Advanced Strategies */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <FaTrophy size={24} />
                </div>
                {isJapanese ? '上級者向け戦略' : 'Advanced Strategies'}
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '1. テンポとイニシアチブ' : '1. Tempo and Initiative'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '相手に「反応」させ続けることで、イニシアチブを握ります。常に攻撃的な手を打ち、相手を防御に回らせましょう。'
                      : 'Keep the initiative by forcing your opponent to react. Play aggressively to keep your opponent on the defensive.'}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '2. 犠牲戦略' : '2. Sacrifice Strategy'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '時には意図的にじゃんけんバトルに負けることで、より良い位置を確保できることがあります。マスをロックすることで相手の計画を妨害できます。'
                      : 'Sometimes intentionally losing a Janken battle can secure a better position. Locking a square can disrupt your opponent\'s plans.'}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '3. 読みの深さ' : '3. Depth of Analysis'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? '次の手だけでなく、3手先、5手先まで読むことで、より効果的な配置ができます。相手の可能な応答をすべて考慮しましょう。'
                      : 'Think not just one move ahead, but 3-5 moves ahead for more effective placement. Consider all possible opponent responses.'}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? '4. 心理戦' : '4. Psychological Warfare'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {isJapanese
                      ? 'オンライン対戦では、予測不能な動きで相手を混乱させることも戦略の一つです。パターンを作らないようにしましょう。'
                      : 'In online matches, unpredictable moves can confuse your opponent. Avoid creating patterns that can be exploited.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Special Piece Strategy */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                  <FaStar size={24} />
                </div>
                {isJapanese ? '特殊駒の使い方' : 'Special Piece Usage'}
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600">
                  {isJapanese
                    ? '特殊駒は1回しか使えない強力な切り札です。以下のタイミングで使うと効果的です：'
                    : 'The Special Piece is a powerful trump card that can only be used once. Use it effectively in these situations:'}
                </p>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaArrowRight />
                      {isJapanese ? '勝利を確定させる' : 'Secure Victory'}
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {isJapanese
                        ? '4つ並んでいる状態で、5つ目として配置して確実に勝利'
                        : 'Place as the 5th piece when you have 4 aligned for certain victory'}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaShieldAlt />
                      {isJapanese ? '重要位置を確保' : 'Secure Key Position'}
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {isJapanese
                        ? '中央など戦略的に重要な位置に配置し、絶対に取られない駒として活用'
                        : 'Place on strategic positions like the center where it cannot be captured'}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaCrosshairs />
                      {isJapanese ? 'フォークの要' : 'Fork Anchor'}
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {isJapanese
                        ? '複数の勝ち筋の交点に配置し、奪われない脅威を作る'
                        : 'Place at intersection of multiple winning lines for an uncapturable threat'}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaExclamationTriangle />
                      {isJapanese ? '終盤まで温存' : 'Save for Endgame'}
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {isJapanese
                        ? '序盤で使わず、終盤の決定的な場面まで温存する'
                        : 'Don\'t use early; save for decisive moments in the endgame'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">
                    {isJapanese ? '注意：特殊駒を使うべきでない場面' : 'Warning: When NOT to Use Special Piece'}
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                    <li>
                      {isJapanese
                        ? 'ゲーム序盤（まだ形勢が不明確なとき）'
                        : 'Early game (when the situation is still unclear)'}
                    </li>
                    <li>
                      {isJapanese
                        ? '相手の勝利を防ぐためだけの消極的な使用'
                        : 'Passive use just to block opponent\'s victory'}
                    </li>
                    <li>
                      {isJapanese
                        ? '他に良い手がある場合'
                        : 'When there are other good moves available'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* AI Difficulty Strategies */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
                  <FaBrain size={24} />
                </div>
                {isJapanese ? 'AI難易度別攻略法' : 'AI Difficulty Strategies'}
              </h2>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {isJapanese ? 'ビギナー / イージー' : 'Beginner / Easy'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {isJapanese
                        ? 'AIはほぼランダムに動きます。基本を学ぶのに最適。'
                        : 'AI moves almost randomly. Perfect for learning basics.'}
                    </p>
                    <ul className="text-xs text-gray-500 list-disc pl-4">
                      <li>{isJapanese ? '中央を取る練習' : 'Practice taking the center'}</li>
                      <li>{isJapanese ? '5つ並べる感覚を掴む' : 'Get a feel for aligning 5'}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {isJapanese ? 'ノーマル / ミディアム' : 'Normal / Medium'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {isJapanese
                        ? 'AIは基本的な脅威をブロックします。'
                        : 'AI blocks basic threats.'}
                    </p>
                    <ul className="text-xs text-gray-500 list-disc pl-4">
                      <li>{isJapanese ? 'フォーク戦略を練習' : 'Practice fork strategies'}</li>
                      <li>{isJapanese ? '複数方向から攻める' : 'Attack from multiple directions'}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {isJapanese ? 'ハード' : 'Hard'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {isJapanese
                        ? 'AIは積極的に攻撃してきます。'
                        : 'AI plays aggressively.'}
                    </p>
                    <ul className="text-xs text-gray-500 list-disc pl-4">
                      <li>{isJapanese ? '防御も重要' : 'Defense is also important'}</li>
                      <li>{isJapanese ? 'テンポを意識する' : 'Be aware of tempo'}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {isJapanese ? 'エキスパート' : 'Expert'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {isJapanese
                        ? 'AIは高度な戦略を使います。'
                        : 'AI uses advanced strategies.'}
                    </p>
                    <ul className="text-xs text-gray-500 list-disc pl-4">
                      <li>{isJapanese ? '完璧なプレイが必要' : 'Perfect play required'}</li>
                      <li>{isJapanese ? 'ミスを許さない' : 'No room for mistakes'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '学んだ戦略を試そう！' : 'Put Your Strategies to the Test!'}
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                {isJapanese ? 'ゲームを始める' : 'Start Playing'}
              </Link>
              <Link
                to="/how-to-play"
                className="inline-block px-8 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all"
              >
                {isJapanese ? 'ルールを確認' : 'Review Rules'}
              </Link>
            </div>
          </motion.div>

          {/* Ad Banner - Bottom */}
          <div className="mt-8">
            <AdBanner position="bottom" />
          </div>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-300 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'ホーム' : 'Home'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/faq" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'よくある質問' : 'FAQ'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'このゲームについて' : 'About'}
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

export default Strategy;
