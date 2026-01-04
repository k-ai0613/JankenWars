import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { AdBanner } from '../components/ads';
import {
  FaNewspaper, FaRocket, FaBug, FaStar, FaGamepad,
  FaCalendarAlt, FaArrowRight, FaBrain, FaGlobe, FaMobile
} from 'react-icons/fa';

interface UpdateItem {
  date: string;
  version?: string;
  titleEn: string;
  titleJa: string;
  descriptionEn: string;
  descriptionJa: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'announcement';
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const updates: UpdateItem[] = [
  {
    date: '2025-01-04',
    version: '1.5.0',
    titleEn: 'Strategy Guide & FAQ Pages Added',
    titleJa: '戦略ガイドとFAQページを追加',
    descriptionEn: 'We\'ve added comprehensive strategy guides for all skill levels, from beginner to expert. The new FAQ page answers common questions about gameplay, online features, and more.',
    descriptionJa: '初心者からエキスパートまで、すべてのスキルレベル向けの包括的な戦略ガイドを追加しました。新しいFAQページでは、ゲームプレイ、オンライン機能などに関するよくある質問に回答しています。',
    type: 'feature',
    icon: FaNewspaper,
  },
  {
    date: '2025-01-03',
    version: '1.4.0',
    titleEn: 'PWA Support for Mobile Devices',
    titleJa: 'モバイルデバイス向けPWAサポート',
    descriptionEn: 'JankenWars can now be installed as a Progressive Web App on your mobile device. Add it to your home screen for an app-like experience with offline support.',
    descriptionJa: 'JankenWarsがモバイルデバイスにプログレッシブウェブアプリとしてインストールできるようになりました。ホーム画面に追加して、オフラインサポート付きのアプリのような体験をお楽しみください。',
    type: 'feature',
    icon: FaMobile,
  },
  {
    date: '2024-12-28',
    version: '1.3.0',
    titleEn: '6 AI Difficulty Levels Now Available',
    titleJa: '6段階のAI難易度が利用可能に',
    descriptionEn: 'Challenge yourself with our expanded AI system! From Beginner to Expert, find the perfect difficulty level for your skill. Each level offers unique playing styles and strategies.',
    descriptionJa: '拡張されたAIシステムに挑戦しましょう！ビギナーからエキスパートまで、あなたのスキルに合った難易度を見つけてください。各レベルはユニークなプレイスタイルと戦略を提供します。',
    type: 'feature',
    icon: FaBrain,
  },
  {
    date: '2024-12-20',
    version: '1.2.0',
    titleEn: 'Online Multiplayer Improvements',
    titleJa: 'オンラインマルチプレイヤーの改善',
    descriptionEn: 'We\'ve significantly improved the online multiplayer experience with better connection stability, faster matchmaking, and reduced lag. Private rooms now support room codes for easy friend invites.',
    descriptionJa: '接続の安定性向上、マッチメイキングの高速化、遅延の削減により、オンラインマルチプレイヤー体験を大幅に改善しました。プライベートルームでは、友達を簡単に招待できるルームコードをサポートするようになりました。',
    type: 'improvement',
    icon: FaGlobe,
  },
  {
    date: '2024-12-15',
    titleEn: 'Special Piece Balance Adjustment',
    titleJa: '特殊駒のバランス調整',
    descriptionEn: 'Based on player feedback, we\'ve refined the Special Piece mechanics. It now provides clearer visual feedback and the tooltip better explains its unique properties.',
    descriptionJa: 'プレイヤーのフィードバックに基づき、特殊駒のメカニクスを改良しました。より明確な視覚的フィードバックを提供し、ツールチップでそのユニークな特性をより分かりやすく説明しています。',
    type: 'improvement',
    icon: FaStar,
  },
  {
    date: '2024-12-10',
    version: '1.1.0',
    titleEn: 'Bilingual Support (English/Japanese)',
    titleJa: '二か国語対応（英語/日本語）',
    descriptionEn: 'JankenWars now fully supports both English and Japanese languages. Switch between languages at any time using the toggle in the top-right corner.',
    descriptionJa: 'JankenWarsが英語と日本語の両方を完全にサポートするようになりました。右上のトグルを使用して、いつでも言語を切り替えることができます。',
    type: 'feature',
    icon: FaGlobe,
  },
  {
    date: '2024-12-05',
    titleEn: 'Fixed: Janken Battle Display Bug',
    titleJa: '修正：じゃんけんバトル表示のバグ',
    descriptionEn: 'Fixed an issue where the Janken battle animation would sometimes not display correctly on mobile devices. The battle results now show properly on all screen sizes.',
    descriptionJa: 'モバイルデバイスでじゃんけんバトルのアニメーションが正しく表示されないことがある問題を修正しました。バトル結果がすべての画面サイズで正しく表示されるようになりました。',
    type: 'bugfix',
    icon: FaBug,
  },
  {
    date: '2024-12-01',
    version: '1.0.0',
    titleEn: 'JankenWars Official Launch!',
    titleJa: 'JankenWars正式リリース！',
    descriptionEn: 'We\'re excited to announce the official launch of JankenWars! Experience the unique blend of rock-paper-scissors strategy and board game tactics. Play locally with friends, challenge our AI, or compete online with players worldwide.',
    descriptionJa: 'JankenWarsの正式リリースを発表できることを嬉しく思います！じゃんけん戦略とボードゲーム戦術のユニークな融合を体験してください。友達とのローカル対戦、AI対戦、または世界中のプレイヤーとのオンライン対戦をお楽しみください。',
    type: 'announcement',
    icon: FaRocket,
  },
];

const articles = [
  {
    titleEn: 'Mastering the Center: Why Position Matters in JankenWars',
    titleJa: '中央をマスターする：JankenWarsでポジションが重要な理由',
    excerptEn: 'Learn why controlling the center of the board gives you a strategic advantage and how to leverage this in your games.',
    excerptJa: 'ボードの中央を制することが戦略的優位性をもたらす理由と、それをゲームで活用する方法を学びましょう。',
    date: '2025-01-02',
    category: 'Strategy',
    categoryJa: '戦略',
    link: '/strategy',
  },
  {
    titleEn: 'The Art of the Fork: Creating Unstoppable Threats',
    titleJa: 'フォークの技術：止められない脅威を作る',
    excerptEn: 'Discover how to set up multiple winning threats simultaneously and force your opponent into impossible decisions.',
    excerptJa: '複数の勝ち筋を同時に作り、相手を不可能な決断に追い込む方法を発見しましょう。',
    date: '2024-12-28',
    category: 'Strategy',
    categoryJa: '戦略',
    link: '/strategy',
  },
  {
    titleEn: 'Special Piece Strategies: When to Play Your Trump Card',
    titleJa: '特殊駒戦略：切り札をいつ使うか',
    excerptEn: 'The Special Piece can make or break your game. Learn the optimal timing and positioning for this unique piece.',
    excerptJa: '特殊駒はゲームの勝敗を左右します。このユニークな駒の最適なタイミングと配置を学びましょう。',
    date: '2024-12-20',
    category: 'Tips',
    categoryJa: 'ヒント',
    link: '/strategy',
  },
  {
    titleEn: 'Beating Expert AI: Advanced Techniques',
    titleJa: 'エキスパートAIを倒す：上級テクニック',
    excerptEn: 'Ready to take on the toughest AI? These advanced techniques will help you compete at the highest level.',
    excerptJa: '最強のAIに挑戦する準備はできましたか？これらの上級テクニックで最高レベルで戦いましょう。',
    date: '2024-12-15',
    category: 'Guide',
    categoryJa: 'ガイド',
    link: '/strategy',
  },
];

const typeColors = {
  feature: 'bg-green-100 text-green-800 border-green-200',
  improvement: 'bg-blue-100 text-blue-800 border-blue-200',
  bugfix: 'bg-orange-100 text-orange-800 border-orange-200',
  announcement: 'bg-purple-100 text-purple-800 border-purple-200',
};

const typeLabels = {
  feature: { en: 'New Feature', ja: '新機能' },
  improvement: { en: 'Improvement', ja: '改善' },
  bugfix: { en: 'Bug Fix', ja: 'バグ修正' },
  announcement: { en: 'Announcement', ja: 'お知らせ' },
};

export function Blog() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FaNewspaper className="text-5xl text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'ニュース & 更新履歴' : 'News & Updates'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {isJapanese
                ? 'JankenWarsの最新ニュース、アップデート、攻略記事をチェックしましょう。'
                : 'Stay up to date with the latest JankenWars news, updates, and strategy articles.'}
            </p>
          </div>

          {/* Ad Banner - Top */}
          <div className="mb-8">
            <AdBanner position="top" />
          </div>

          {/* Featured Articles */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaGamepad />
              {isJapanese ? '攻略記事' : 'Strategy Articles'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((article, index) => (
                <motion.div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      {isJapanese ? article.categoryJa : article.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FaCalendarAlt size={10} />
                      {article.date}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isJapanese ? article.titleJa : article.titleEn}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {isJapanese ? article.excerptJa : article.excerptEn}
                  </p>
                  <Link
                    to={article.link}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-800 flex items-center gap-1"
                  >
                    {isJapanese ? '続きを読む' : 'Read more'}
                    <FaArrowRight size={12} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Update History */}
          <section>
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaRocket />
              {isJapanese ? '更新履歴' : 'Update History'}
            </h2>
            <div className="space-y-4">
              {updates.map((update, index) => {
                const Icon = update.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Icon */}
                      <div className="shrink-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors[update.type].split(' ')[0]}`}>
                          <Icon className={typeColors[update.type].split(' ')[1]} size={24} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${typeColors[update.type]}`}>
                            {isJapanese ? typeLabels[update.type].ja : typeLabels[update.type].en}
                          </span>
                          {update.version && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                              v{update.version}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaCalendarAlt size={10} />
                            {update.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {isJapanese ? update.titleJa : update.titleEn}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {isJapanese ? update.descriptionJa : update.descriptionEn}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <motion.div
            className="mt-16 text-center bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? '最新版をプレイしよう！' : 'Play the Latest Version!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isJapanese
                ? '新機能と改善を体験してください。'
                : 'Experience all the new features and improvements.'}
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {isJapanese ? 'ゲームを始める' : 'Start Playing'}
            </Link>
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
            <Link to="/strategy" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? '戦略ガイド' : 'Strategy Guide'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/faq" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'よくある質問' : 'FAQ'}
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

export default Blog;
