import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/stores/useLanguage';
import { Header } from '../components/Header';

export function TermsOfService() {
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-indigo-700 mb-2">
              {isJapanese ? '利用規約' : 'Terms of Service'}
            </h1>
            <p className="text-gray-600">
              {isJapanese ? '最終更新日: 2025年12月7日' : 'Last updated: December 7, 2025'}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-8 space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第1条（適用）' : 'Article 1 (Application)'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? '本利用規約（以下「本規約」）は、JankenWars（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。'
                  : 'These Terms of Service ("Terms") set forth the conditions for using JankenWars ("the Service"). All users shall use the Service in accordance with these Terms.'}
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第2条（サービス内容）' : 'Article 2 (Service Description)'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? '本サービスは、じゃんけんをベースにした戦略ボードゲームを提供するウェブアプリケーションです。ローカル対戦、AI対戦、オンライン対戦の各モードをご利用いただけます。'
                  : 'The Service is a web application that provides a strategic board game based on rock-paper-scissors. Users can enjoy local multiplayer, AI battles, and online multiplayer modes.'}
              </p>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第3条（禁止事項）' : 'Article 3 (Prohibited Activities)'}
              </h2>
              <p className="text-gray-700 mb-4">
                {isJapanese
                  ? 'ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。'
                  : 'Users shall not engage in the following activities when using the Service:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  {isJapanese
                    ? '法令または公序良俗に違反する行為'
                    : 'Activities that violate laws or public order and morals'}
                </li>
                <li>
                  {isJapanese
                    ? '本サービスの運営を妨害する行為'
                    : 'Activities that interfere with the operation of the Service'}
                </li>
                <li>
                  {isJapanese
                    ? '他のユーザーに迷惑をかける行為'
                    : 'Activities that cause inconvenience to other users'}
                </li>
                <li>
                  {isJapanese
                    ? '不正アクセス、チート、ハッキング等の行為'
                    : 'Unauthorized access, cheating, hacking, and similar activities'}
                </li>
                <li>
                  {isJapanese
                    ? '本サービスのサーバーやネットワークに過度の負荷をかける行為'
                    : 'Activities that place excessive load on the Service servers or network'}
                </li>
                <li>
                  {isJapanese
                    ? 'その他、運営者が不適切と判断する行為'
                    : 'Any other activities deemed inappropriate by the operator'}
                </li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第4条（免責事項）' : 'Article 4 (Disclaimer)'}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {isJapanese
                    ? '本サービスは現状有姿で提供され、特定目的への適合性、商品性、正確性、信頼性についていかなる保証も行いません。'
                    : 'The Service is provided "as is" without any warranties regarding fitness for a particular purpose, merchantability, accuracy, or reliability.'}
                </p>
                <p>
                  {isJapanese
                    ? '運営者は、本サービスの利用により生じたいかなる損害についても責任を負いません。'
                    : 'The operator shall not be liable for any damages arising from the use of the Service.'}
                </p>
                <p>
                  {isJapanese
                    ? '本サービスは、予告なく変更、中断、または終了する場合があります。'
                    : 'The Service may be modified, suspended, or terminated without prior notice.'}
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第5条（知的財産権）' : 'Article 5 (Intellectual Property)'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? '本サービスに関する著作権、商標権その他の知的財産権は、運営者または正当な権利者に帰属します。ユーザーは、私的使用の範囲を超えて、本サービスのコンテンツを複製、転載、改変、販売等することはできません。'
                  : 'All copyrights, trademarks, and other intellectual property rights related to the Service belong to the operator or their rightful owners. Users may not reproduce, redistribute, modify, or sell the content of the Service beyond the scope of private use.'}
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第6条（規約の変更）' : 'Article 6 (Changes to Terms)'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? '運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができます。変更後の利用規約は、本サービス上に表示した時点から効力を生じるものとします。'
                  : 'The operator may change these Terms at any time without notice when deemed necessary. The revised Terms shall take effect from the time they are displayed on the Service.'}
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                {isJapanese ? '第7条（準拠法・裁判管轄）' : 'Article 7 (Governing Law and Jurisdiction)'}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {isJapanese
                  ? '本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。'
                  : 'These Terms shall be governed by and construed in accordance with the laws of Japan. Any disputes arising from the Service shall be subject to the exclusive jurisdiction of the courts located in the operator\'s area.'}
              </p>
            </section>

          </div>

          {/* Footer Links */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/">
              <Button variant="outline">
                {isJapanese ? 'ホームに戻る' : 'Back to Home'}
              </Button>
            </Link>
            <Link to="/privacy">
              <Button variant="ghost">
                {isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TermsOfService;
