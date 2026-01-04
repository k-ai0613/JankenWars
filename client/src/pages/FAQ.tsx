import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { AdBanner } from '../components/ads';
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaGamepad, FaUsers, FaBrain, FaShieldAlt, FaMobile } from 'react-icons/fa';

interface FAQItem {
  questionEn: string;
  questionJa: string;
  answerEn: string;
  answerJa: string;
  category: 'gameplay' | 'online' | 'ai' | 'technical' | 'general';
}

const faqData: FAQItem[] = [
  // Gameplay Questions
  {
    category: 'gameplay',
    questionEn: 'What is the goal of JankenWars?',
    questionJa: 'JankenWarsのゴールは何ですか？',
    answerEn: 'The goal is to be the first player to align 5 of your pieces in a row - vertically, horizontally, or diagonally - on the 6x6 game board. You place rock, paper, and scissors pieces strategically while using Janken (rock-paper-scissors) rules to capture opponent pieces.',
    answerJa: '6x6のゲームボード上で、縦・横・斜めのいずれかの方向に自分の駒を5つ並べることが目標です。グー・チョキ・パーの駒を戦略的に配置し、じゃんけんのルールで相手の駒を取りながら勝利を目指します。',
  },
  {
    category: 'gameplay',
    questionEn: 'How do Janken battles work?',
    questionJa: 'じゃんけんバトルはどのように行われますか？',
    answerEn: 'When you place a piece on a square occupied by an opponent\'s piece, a Janken battle occurs. Rock beats Scissors, Scissors beats Paper, and Paper beats Rock. If you win, your piece replaces the opponent\'s. If you lose, your piece is not placed. The square becomes "locked" after a battle and cannot be used for future battles.',
    answerJa: '相手の駒がある場所に自分の駒を置くと、じゃんけんバトルが発生します。グーはチョキに勝ち、チョキはパーに勝ち、パーはグーに勝ちます。勝てば相手の駒を自分の駒に置き換えられます。負けると駒は配置されません。バトルが行われたマスは「ロック」され、以降のバトルには使用できなくなります。',
  },
  {
    category: 'gameplay',
    questionEn: 'What is the Special Piece and how do I use it?',
    questionJa: '特殊駒とは何ですか？どのように使いますか？',
    answerEn: 'Each player has one Special Piece (marked with a star). It can only be placed on empty squares, cannot capture opponent pieces, and cannot be captured by opponents. It counts as part of your 5-in-a-row. Use it strategically to secure important positions that cannot be taken away.',
    answerJa: '各プレイヤーは1つの特殊駒（星マーク）を持っています。空いているマスにのみ配置でき、相手の駒を取ることも、相手に取られることもできません。5つ並べる列の一部としてカウントされます。奪われない重要な位置を確保するために戦略的に使いましょう。',
  },
  {
    category: 'gameplay',
    questionEn: 'What happens when a square is "locked"?',
    questionJa: 'マスが「ロック」されるとどうなりますか？',
    answerEn: 'When a Janken battle occurs on a square, that square becomes locked. You can still place pieces on locked squares, but no further Janken battles can occur there. This adds a strategic layer - you can use battles to lock important positions.',
    answerJa: 'じゃんけんバトルが行われたマスはロックされます。ロックされたマスにも駒を置くことはできますが、そこでじゃんけんバトルを行うことはできなくなります。これは戦略的な要素を追加します。重要な位置をロックするためにバトルを仕掛けることができます。',
  },
  {
    category: 'gameplay',
    questionEn: 'How is my piece determined each turn?',
    questionJa: '毎ターンの駒はどのように決まりますか？',
    answerEn: 'At the start of each turn, you receive a random piece - Rock, Paper, or Scissors. You must place this piece during your turn. This randomness adds excitement and requires you to adapt your strategy based on what piece you receive.',
    answerJa: '各ターンの開始時に、グー・チョキ・パーのいずれかの駒がランダムに与えられます。そのターン中にこの駒を配置する必要があります。このランダム性がゲームに興奮を加え、受け取った駒に応じて戦略を適応させる必要があります。',
  },
  {
    category: 'gameplay',
    questionEn: 'What are the draw conditions?',
    questionJa: '引き分けの条件は何ですか？',
    answerEn: 'The game ends in a draw if: (1) The board is completely filled without either player achieving 5 in a row, or (2) Both players run out of pieces without achieving 5 in a row.',
    answerJa: '以下の場合、ゲームは引き分けとなります：(1) どちらのプレイヤーも5つ並べられないままボードが全て埋まった場合、(2) 5つ並べられないまま両プレイヤーが駒を使い切った場合。',
  },
  // Online Questions
  {
    category: 'online',
    questionEn: 'How do I play online with other players?',
    questionJa: '他のプレイヤーとオンラインで対戦するにはどうすればいいですか？',
    answerEn: 'Click "Play Online" from the home page. You can either create a new room and share the room code with a friend, or use matchmaking to be paired with a random opponent. The game uses real-time synchronization for smooth gameplay.',
    answerJa: 'ホームページから「オンライン対戦」をクリックします。新しい部屋を作成して友達にルームコードを共有するか、マッチメイキングを使用してランダムな相手とペアリングされます。ゲームはスムーズなプレイのためにリアルタイム同期を使用しています。',
  },
  {
    category: 'online',
    questionEn: 'Is there a time limit for moves in online games?',
    questionJa: 'オンラインゲームの手番に時間制限はありますか？',
    answerEn: 'Currently, there is no strict time limit for moves. However, if a player disconnects or is inactive for too long, the game may be forfeited. We recommend completing your moves within a reasonable time to ensure a good experience for both players.',
    answerJa: '現在、手番に厳格な時間制限はありません。ただし、プレイヤーが切断されたり、長時間操作がない場合、ゲームが没収される可能性があります。両プレイヤーにとって良い体験を確保するため、適切な時間内に手を完了することをお勧めします。',
  },
  {
    category: 'online',
    questionEn: 'Can I play with friends in a private room?',
    questionJa: '友達とプライベートルームで対戦できますか？',
    answerEn: 'Yes! When you create a room, you will receive a unique room code. Share this code with your friend, and they can join your room by entering the code. This ensures only invited players can join your game.',
    answerJa: 'はい！部屋を作成すると、ユニークなルームコードが発行されます。このコードを友達に共有すると、友達はコードを入力して部屋に参加できます。これにより、招待されたプレイヤーだけがゲームに参加できます。',
  },
  // AI Questions
  {
    category: 'ai',
    questionEn: 'What AI difficulty levels are available?',
    questionJa: 'どのようなAI難易度レベルがありますか？',
    answerEn: 'JankenWars offers 6 AI difficulty levels: Beginner, Easy, Normal, Medium, Hard, and Expert. Beginner is perfect for learning the game, while Expert provides a challenging experience even for skilled players.',
    answerJa: 'JankenWarsには6段階のAI難易度があります：ビギナー、イージー、ノーマル、ミディアム、ハード、エキスパート。ビギナーはゲームを学ぶのに最適で、エキスパートは熟練プレイヤーにも挑戦的な体験を提供します。',
  },
  {
    category: 'ai',
    questionEn: 'How does the AI decide its moves?',
    questionJa: 'AIはどのように手を決めますか？',
    answerEn: 'The AI analyzes the board state and evaluates potential moves based on factors like: controlling the center, creating winning threats, blocking opponent\'s winning moves, and strategic piece placement. Higher difficulty levels consider more factors and look further ahead.',
    answerJa: 'AIはボードの状態を分析し、中央の制御、勝利の脅威の作成、相手の勝利手のブロック、戦略的な駒配置などの要素に基づいて潜在的な手を評価します。難易度が高いほど、より多くの要素を考慮し、先を読みます。',
  },
  {
    category: 'ai',
    questionEn: 'Can I practice specific strategies against AI?',
    questionJa: 'AIに対して特定の戦略を練習できますか？',
    answerEn: 'Absolutely! Playing against AI is the perfect way to practice. Start with lower difficulties to learn basic strategies, then progress to higher levels. You can experiment with different opening moves, Special Piece timing, and battle strategies without pressure.',
    answerJa: 'もちろんです！AI対戦は練習に最適な方法です。基本的な戦略を学ぶために低い難易度から始め、その後より高いレベルに進みましょう。プレッシャーなく、様々なオープニング、特殊駒のタイミング、バトル戦略を試すことができます。',
  },
  // Technical Questions
  {
    category: 'technical',
    questionEn: 'What devices and browsers are supported?',
    questionJa: '対応しているデバイスとブラウザは何ですか？',
    answerEn: 'JankenWars works on all modern browsers including Chrome, Firefox, Safari, and Edge. It is fully responsive and works on desktop computers, tablets, and smartphones. For the best experience, we recommend using the latest version of your browser.',
    answerJa: 'JankenWarsはChrome、Firefox、Safari、Edgeなどの全てのモダンブラウザで動作します。完全にレスポンシブで、デスクトップコンピューター、タブレット、スマートフォンで動作します。最高の体験のために、ブラウザの最新バージョンを使用することをお勧めします。',
  },
  {
    category: 'technical',
    questionEn: 'Is my game progress saved?',
    questionJa: 'ゲームの進行状況は保存されますか？',
    answerEn: 'Local and AI game settings (like difficulty level and language preference) are saved in your browser\'s local storage. However, individual game states are not persisted - if you close the browser during a game, that game will be lost.',
    answerJa: 'ローカルおよびAIゲームの設定（難易度や言語設定など）はブラウザのローカルストレージに保存されます。ただし、個々のゲーム状態は保持されません。ゲーム中にブラウザを閉じると、そのゲームは失われます。',
  },
  {
    category: 'technical',
    questionEn: 'Why is my online game lagging?',
    questionJa: 'オンラインゲームが遅延するのはなぜですか？',
    answerEn: 'Online game performance depends on your internet connection. For the best experience: (1) Use a stable WiFi or wired connection, (2) Close other bandwidth-heavy applications, (3) Ensure you have a strong signal if on mobile data.',
    answerJa: 'オンラインゲームのパフォーマンスはインターネット接続に依存します。最高の体験のために：(1) 安定したWiFiまたは有線接続を使用、(2) 帯域幅を多く使用する他のアプリケーションを閉じる、(3) モバイルデータの場合は強い電波を確保してください。',
  },
  // General Questions
  {
    category: 'general',
    questionEn: 'Is JankenWars free to play?',
    questionJa: 'JankenWarsは無料でプレイできますか？',
    answerEn: 'Yes! JankenWars is completely free to play. All game modes - local multiplayer, AI battles, and online multiplayer - are available at no cost. The game is supported by occasional advertisements.',
    answerJa: 'はい！JankenWarsは完全に無料でプレイできます。ローカル対戦、AI対戦、オンライン対戦のすべてのゲームモードが無料で利用できます。ゲームは広告によってサポートされています。',
  },
  {
    category: 'general',
    questionEn: 'Is JankenWars available as a mobile app?',
    questionJa: 'JankenWarsはモバイルアプリとして利用できますか？',
    answerEn: 'JankenWars is currently a web application that works great on mobile browsers. You can add it to your home screen for an app-like experience. Native mobile apps may be considered for future development.',
    answerJa: 'JankenWarsは現在、モバイルブラウザでも快適に動作するWebアプリケーションです。ホーム画面に追加することで、アプリのような体験ができます。ネイティブモバイルアプリは将来の開発で検討される可能性があります。',
  },
  {
    category: 'general',
    questionEn: 'How can I report a bug or suggest a feature?',
    questionJa: 'バグの報告や機能の提案はどうすればいいですか？',
    answerEn: 'We welcome your feedback! Please visit our Contact page to send us a message about bugs, suggestions, or any other inquiries. Your input helps us improve JankenWars for everyone.',
    answerJa: 'フィードバックを歓迎します！バグ、提案、その他のお問い合わせについては、お問い合わせページからメッセージをお送りください。皆様のご意見がJankenWarsの改善に役立ちます。',
  },
  {
    category: 'general',
    questionEn: 'What is the origin of Janken?',
    questionJa: 'じゃんけんの起源は何ですか？',
    answerEn: 'Janken (rock-paper-scissors) has ancient origins, with similar games found in China dating back to the Han Dynasty (206 BC - 220 AD). The modern Japanese version became popular in the 17th century and spread worldwide. JankenWars combines this timeless game with strategic board game elements.',
    answerJa: 'じゃんけん（グー・チョキ・パー）の起源は古く、中国では漢王朝（紀元前206年〜紀元220年）まで遡る類似のゲームが見られます。現代の日本版は17世紀に普及し、世界中に広まりました。JankenWarsはこの不朽のゲームと戦略的なボードゲーム要素を組み合わせています。',
  },
];

const categoryIcons = {
  gameplay: FaGamepad,
  online: FaUsers,
  ai: FaBrain,
  technical: FaMobile,
  general: FaShieldAlt,
};

const categoryNames = {
  gameplay: { en: 'Gameplay', ja: 'ゲームプレイ' },
  online: { en: 'Online Play', ja: 'オンライン対戦' },
  ai: { en: 'AI Battle', ja: 'AI対戦' },
  technical: { en: 'Technical', ja: '技術的な質問' },
  general: { en: 'General', ja: '一般' },
};

export function FAQ() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = selectedCategory
    ? faqData.filter(faq => faq.category === selectedCategory)
    : faqData;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            <div className="flex justify-center mb-4">
              <FaQuestionCircle className="text-5xl text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'よくある質問' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {isJapanese
                ? 'JankenWarsについてのよくある質問と回答をまとめました。お探しの情報が見つからない場合は、お問い合わせページからご連絡ください。'
                : 'Find answers to common questions about JankenWars. If you can\'t find what you\'re looking for, please contact us through our Contact page.'}
            </p>
          </div>

          {/* Ad Banner - Top */}
          <div className="mb-8">
            <AdBanner position="top" />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-indigo-100'
              }`}
            >
              {isJapanese ? 'すべて' : 'All'}
            </button>
            {Object.entries(categoryNames).map(([key, names]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/80 text-gray-600 hover:bg-indigo-100'
                  }`}
                >
                  <Icon size={14} />
                  {isJapanese ? names.ja : names.en}
                </button>
              );
            })}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => {
              const Icon = categoryIcons[faq.category];
              const isOpen = openIndex === index;

              return (
                <motion.div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <Icon size={18} />
                      </div>
                      <span className="font-medium text-gray-800">
                        {isJapanese ? faq.questionJa : faq.questionEn}
                      </span>
                    </div>
                    <div className="text-indigo-600">
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed pl-11">
                            {isJapanese ? faq.answerJa : faq.answerEn}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Still have questions */}
          <motion.div
            className="mt-12 text-center bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'まだ質問がありますか？' : 'Still Have Questions?'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isJapanese
                ? 'お探しの回答が見つからない場合は、お気軽にお問い合わせください。'
                : 'If you couldn\'t find the answer you were looking for, feel free to contact us.'}
            </p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {isJapanese ? 'お問い合わせ' : 'Contact Us'}
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
            <Link to="/how-to-play" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? '遊び方' : 'How to Play'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/strategy" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? '戦略ガイド' : 'Strategy Guide'}
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">
              {isJapanese ? 'このゲームについて' : 'About'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default FAQ;
