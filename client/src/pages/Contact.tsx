import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';
import { FaGithub, FaEnvelope, FaBug, FaLightbulb, FaQuestionCircle } from 'react-icons/fa';

export function Contact() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';

  const contactMethods = [
    {
      icon: FaGithub,
      titleEn: 'GitHub Issues',
      titleJa: 'GitHub Issues',
      descriptionEn: 'Report bugs, request features, or ask questions on our GitHub repository.',
      descriptionJa: 'バグ報告、機能リクエスト、質問はGitHubリポジトリのIssueからお願いします。',
      linkText: 'GitHub Issues',
      href: 'https://github.com',
      color: 'from-gray-700 to-gray-900',
    },
  ];

  const faqItems = [
    {
      icon: FaBug,
      questionEn: 'I found a bug. How do I report it?',
      questionJa: 'バグを見つけました。どのように報告すればよいですか？',
      answerEn: 'Please create an issue on our GitHub repository with a detailed description of the bug, including steps to reproduce it.',
      answerJa: 'GitHubリポジトリでIssueを作成し、バグの詳細な説明と再現手順をお書きください。',
    },
    {
      icon: FaLightbulb,
      questionEn: 'I have a feature suggestion. Where can I submit it?',
      questionJa: '機能の提案があります。どこに提出すればよいですか？',
      answerEn: 'We welcome feature suggestions! Please submit them as GitHub Issues with the "feature request" label.',
      answerJa: '機能のご提案を歓迎します！GitHubのIssueに「feature request」ラベルをつけてご提出ください。',
    },
    {
      icon: FaQuestionCircle,
      questionEn: 'How do I play JankenWars?',
      questionJa: 'JankenWarsの遊び方を教えてください。',
      answerEn: 'Check out our How to Play page for detailed game rules and strategies.',
      answerJa: '遊び方ページで詳しいルールと戦略をご確認ください。',
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
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              {isJapanese ? 'お問い合わせ' : 'Contact Us'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isJapanese
                ? 'ご質問やフィードバックをお待ちしております。'
                : 'We\'d love to hear from you. Questions, feedback, and suggestions are welcome!'}
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-1 gap-6 mb-12">
            {contactMethods.map(({ icon: Icon, titleEn, titleJa, descriptionEn, descriptionJa, linkText, href, color }) => (
              <motion.div
                key={titleEn}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {isJapanese ? titleJa : titleEn}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {isJapanese ? descriptionJa : descriptionEn}
                    </p>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Icon size={16} />
                      {linkText}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
              <FaQuestionCircle />
              {isJapanese ? 'よくある質問' : 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-6">
              {faqItems.map(({ icon: Icon, questionEn, questionJa, answerEn, answerJa }, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {isJapanese ? questionJa : questionEn}
                      </h3>
                      <p className="text-gray-600">
                        {isJapanese ? answerJa : answerEn}
                      </p>
                      {index === 2 && (
                        <Link
                          to="/how-to-play"
                          className="inline-block mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {isJapanese ? '遊び方ページへ →' : 'Go to How to Play →'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time Notice */}
          <motion.div
            className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-yellow-800">
              {isJapanese
                ? '※ お問い合わせへの返答には数日かかる場合があります。予めご了承ください。'
                : 'Note: Responses may take a few days. Thank you for your patience.'}
            </p>
          </motion.div>

          {/* Footer Links */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/">
              <Button variant="outline">
                {isJapanese ? 'ホームに戻る' : 'Back to Home'}
              </Button>
            </Link>
            <Link to="/how-to-play">
              <Button variant="ghost">
                {isJapanese ? '遊び方' : 'How to Play'}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;
