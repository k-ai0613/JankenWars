import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';

export function PrivacyPolicy() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="outline" className="mb-4">
                {isJapanese ? '← ホームに戻る' : '← Back to Home'}
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-indigo-700 mb-2">
              {isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'}
            </h1>
            <p className="text-gray-600">
              {isJapanese ? '最終更新日: 2025年12月5日' : 'Last updated: December 5, 2025'}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? 'はじめに' : 'Introduction'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? 'JankenWars（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、本サービスがどのような情報を収集し、どのように使用するかについて説明します。'
                  : 'JankenWars ("the Service") respects user privacy and is committed to protecting personal information. This Privacy Policy explains what information we collect and how we use it.'}
              </p>
            </section>

            {/* Information Collection */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '収集する情報' : 'Information We Collect'}
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isJapanese ? '自動的に収集される情報' : 'Automatically Collected Information'}
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{isJapanese ? 'IPアドレス' : 'IP address'}</li>
                    <li>{isJapanese ? 'ブラウザの種類とバージョン' : 'Browser type and version'}</li>
                    <li>{isJapanese ? 'デバイス情報' : 'Device information'}</li>
                    <li>{isJapanese ? 'アクセス日時' : 'Access date and time'}</li>
                    <li>{isJapanese ? 'ゲームプレイデータ（勝敗記録など）' : 'Gameplay data (win/loss records, etc.)'}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isJapanese ? 'ローカルストレージ' : 'Local Storage'}
                  </h3>
                  <p>
                    {isJapanese
                      ? '本サービスは、ゲーム設定や進行状況を保存するためにブラウザのローカルストレージを使用します。この情報はお使いのデバイスにのみ保存され、サーバーには送信されません。'
                      : 'The Service uses browser local storage to save game settings and progress. This information is stored only on your device and is not sent to our servers.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies and Advertising */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? 'Cookieと広告' : 'Cookies and Advertising'}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {isJapanese
                    ? '本サービスは、Google AdSenseを使用して広告を表示する場合があります。Google AdSenseは、Cookieを使用してユーザーの興味に基づいた広告を表示することがあります。'
                    : 'The Service may display advertisements using Google AdSense. Google AdSense may use cookies to display ads based on user interests.'}
                </p>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isJapanese ? 'Google AdSenseについて' : 'About Google AdSense'}
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      {isJapanese
                        ? 'Googleは、ユーザーが本サービスや他のウェブサイトにアクセスした際の情報に基づいて広告を表示することがあります。'
                        : 'Google may display ads based on information from your visits to this and other websites.'}
                    </li>
                    <li>
                      {isJapanese
                        ? 'ユーザーは、Googleの広告設定ページでパーソナライズ広告を無効にすることができます。'
                        : 'Users can opt out of personalized advertising by visiting Google Ads Settings.'}
                    </li>
                    <li>
                      {isJapanese
                        ? '詳細については、Googleのプライバシーポリシーをご確認ください。'
                        : 'For more information, please review Google\'s Privacy Policy.'}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '情報の利用目的' : 'How We Use Information'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{isJapanese ? 'サービスの提供と改善' : 'To provide and improve the Service'}</li>
                <li>{isJapanese ? 'ゲーム体験のカスタマイズ' : 'To customize the gaming experience'}</li>
                <li>{isJapanese ? '技術的な問題の診断と解決' : 'To diagnose and resolve technical issues'}</li>
                <li>{isJapanese ? 'サービスの利用状況の分析' : 'To analyze Service usage'}</li>
              </ul>
            </section>

            {/* Third Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第三者サービス' : 'Third-Party Services'}
              </h2>
              <p className="text-gray-700 mb-4">
                {isJapanese
                  ? '本サービスは、以下の第三者サービスを利用する場合があります：'
                  : 'The Service may use the following third-party services:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Google AdSense ({isJapanese ? '広告配信' : 'Ad delivery'})</li>
                <li>Render ({isJapanese ? 'ホスティング' : 'Hosting'})</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? 'お子様のプライバシー' : "Children's Privacy"}
              </h2>
              <p className="text-gray-700">
                {isJapanese
                  ? '本サービスは、13歳未満のお子様から意図的に個人情報を収集することはありません。13歳未満のお子様がサービスを利用する場合は、保護者の監督のもとでご利用ください。'
                  : 'The Service does not intentionally collect personal information from children under 13. If children under 13 use the Service, please do so under parental supervision.'}
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? 'プライバシーポリシーの変更' : 'Changes to This Policy'}
              </h2>
              <p className="text-gray-700">
                {isJapanese
                  ? '本プライバシーポリシーは、必要に応じて更新されることがあります。重要な変更がある場合は、本ページにて通知します。'
                  : 'This Privacy Policy may be updated as needed. We will notify you of any significant changes on this page.'}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? 'お問い合わせ' : 'Contact Us'}
              </h2>
              <p className="text-gray-700">
                {isJapanese
                  ? 'プライバシーポリシーに関するご質問がある場合は、GitHubリポジトリのIssueからお問い合わせください。'
                  : 'If you have any questions about this Privacy Policy, please contact us through the GitHub repository Issues.'}
              </p>
            </section>

          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="outline">
                {isJapanese ? 'ホームに戻る' : 'Back to Home'}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
